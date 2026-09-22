import chromium from '@sparticuz/chromium'
import { chromium as playwrightChromium } from 'playwright'
import { AuditEngine, PlaywrightPageCollector, SiteAuditEngine } from '../../src/audit-engine'
import type { AuditCategory } from '../../src/audit-engine'
import { SlidingWindowRateLimiter, rateLimitKey, clampAuditLimits } from '../../src/services/audit-safety'
import { createTelemetry, MemoryTelemetrySink } from '../../src/services/audit-telemetry'

const rateLimiter = new SlidingWindowRateLimiter(10, 60_000)
const telemetry = new MemoryTelemetrySink()

const json = (status: number, body: unknown, headers: Record<string, string> = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
})

export default async (request: Request) => {
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed.' })

  const rate = rateLimiter.check(rateLimitKey(request))
  if (!rate.allowed) {
    telemetry.record(createTelemetry('audit.rejected', { reason: 'rate_limited' }))
    return json(429, { error: { code: 'rate_limited', message: 'Audit rate limit exceeded. Try again later.', retryAfterSeconds: rate.retryAfterSeconds } }, { 'retry-after': String(rate.retryAfterSeconds), 'x-ratelimit-remaining': '0' })
  }

  try {
    let input: { url?: string; categories?: AuditCategory[]; timeoutMs?: number; maxPages?: number }
    try {
      input = await request.json() as typeof input
    } catch {
      return json(400, { error: 'Request body must be valid JSON.' })
    }

    if (typeof input.url !== 'string' || !input.url.trim()) {
      return json(400, { error: 'A URL is required.' })
    }

    const limits = clampAuditLimits({ maxPages: input.maxPages, timeoutMs: input.timeoutMs, maxConcurrency: 2 })
    const started = Date.now()
    telemetry.record(createTelemetry('audit.requested', { targetHost: (() => { try { return new URL(input.url!).hostname } catch { return undefined } })() }))

    const pageEngine = new AuditEngine(
      new PlaywrightPageCollector(async () => {
        // Netlify production uses the serverless Chromium binary. Netlify Dev on
        // Windows/Linux/macOS should use Playwright's locally installed browser
        // instead; the Sparticuz Lambda binary is not a local-development browser.
        if (process.env.NETLIFY_DEV) {
          return playwrightChromium.launch({ headless: true })
        }

        return playwrightChromium.launch({
          executablePath: await chromium.executablePath(),
          args: chromium.args,
          headless: chromium.headless,
        })
      }),
    )

    const report = await new SiteAuditEngine(pageEngine).audit({
      url: input.url,
      categories: input.categories,
      timeoutMs: limits.timeoutMs,
      maxPages: limits.maxPages,
      concurrency: limits.maxConcurrency,
    })

    telemetry.record(createTelemetry(report.run.status === 'completed' ? 'audit.completed' : 'audit.failed', { auditId: report.run.id, durationMs: Date.now() - started, pageCount: report.pages.length, errorCode: report.error?.code }))
    return json(report.run.status === 'completed' ? 200 : 422, report, { 'x-ratelimit-remaining': String(rate.remaining) })
  } catch (error) {
    return json(500, {
      error: {
        code: 'audit_service_failed',
        message: error instanceof Error ? error.message : 'The audit service failed unexpectedly.',
        recoverable: true,
      },
    })
  }
}
