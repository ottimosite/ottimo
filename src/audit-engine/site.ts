import { assertPublicTarget } from './security'
import type { AuditReport, AuditRequest } from './types'
import { AUDIT_ENGINE_VERSION, AuditEngine } from './engine'

export interface SiteAuditRequest extends AuditRequest {
  maxPages?: number
  concurrency?: number
}

export interface SitePageResult {
  url: string
  report: AuditReport
}

export interface SiteAuditReport {
  engineVersion: string
  run: AuditReport['run']
  requestedUrl: string
  finalUrl: string
  pages: SitePageResult[]
  discoveredUrls: string[]
  truncated: boolean
  error?: AuditReport['error']
}

const DEFAULT_MAX_PAGES = 10
const MAX_ALLOWED_PAGES = 25
const DEFAULT_CONCURRENCY = 2

const sameOrigin = (candidate: string, origin: string) => {
  try { return new URL(candidate).origin === new URL(origin).origin } catch { return false }
}

const normalise = (value: string) => {
  const url = new URL(value)
  url.hash = ''
  return url.href
}

const extractInternalLinks = (html: string, finalUrl: string) => {
  const links = new Set<string>()
  const pattern = /<a\b[^>]*href=["']([^"'#]+)["']/gi
  for (const match of html.matchAll(pattern)) {
    try {
      const candidate = normalise(new URL(match[1], finalUrl).href)
      if (sameOrigin(candidate, finalUrl)) links.add(candidate)
    } catch {
      // Ignore malformed links.
    }
  }
  return [...links]
}

const failedSiteReport = (requestedUrl: string, startedAt: string, started: number, error: unknown): SiteAuditReport => ({
  engineVersion: AUDIT_ENGINE_VERSION,
  run: {
    id: crypto.randomUUID(),
    status: 'failed',
    startedAt,
    completedAt: new Date().toISOString(),
    durationMs: Math.round(performance.now() - started),
  },
  requestedUrl,
  finalUrl: requestedUrl,
  pages: [],
  discoveredUrls: [],
  truncated: false,
  error: {
    code: 'audit_failed',
    message: error instanceof Error ? error.message : 'Site audit failed.',
    recoverable: true,
  },
})

export class SiteAuditEngine {
  constructor(private readonly pageEngine = new AuditEngine()) {}

  async audit(request: SiteAuditRequest): Promise<SiteAuditReport> {
    const started = performance.now()
    const startedAt = new Date().toISOString()

    try {
      const maxPages = Math.min(Math.max(request.maxPages ?? DEFAULT_MAX_PAGES, 1), MAX_ALLOWED_PAGES)
      const concurrency = Math.min(Math.max(request.concurrency ?? DEFAULT_CONCURRENCY, 1), 3)
      const target = await assertPublicTarget(request.url)
      const firstUrl = target.href
      const timeoutMs = Math.min(request.timeoutMs ?? 10_000, 15_000)

      const first = await this.pageEngine.audit({ ...request, url: firstUrl, timeoutMs })
      if (first.run.status === 'failed' || !first.page) {
        return {
          engineVersion: first.engineVersion,
          run: { ...first.run, startedAt, completedAt: new Date().toISOString(), durationMs: Math.round(performance.now() - started) },
          requestedUrl: firstUrl,
          finalUrl: first.page?.finalUrl ?? firstUrl,
          pages: [{ url: firstUrl, report: first }],
          discoveredUrls: [firstUrl],
          truncated: false,
          error: first.error,
        }
      }

      const queue = extractInternalLinks(first.page.html, first.page.finalUrl)
        .filter(url => url !== first.page!.finalUrl)
        .slice(0, maxPages - 1)
      const discoveredUrls = [first.page.finalUrl, ...queue]
      const pages: SitePageResult[] = [{ url: first.page.finalUrl, report: first }]
      let cursor = 0

      const worker = async () => {
        while (true) {
          const index = cursor++
          if (index >= queue.length || pages.length >= maxPages) return

          const url = queue[index]
          try {
            const safe = await assertPublicTarget(url)
            const report = await this.pageEngine.audit({
              ...request,
              url: safe.href,
              timeoutMs,
            })
            pages.push({ url: safe.href, report })
          } catch (error) {
            pages.push({
              url,
              report: {
                engineVersion: first.engineVersion,
                run: {
                  id: crypto.randomUUID(),
                  status: 'failed',
                  startedAt: new Date().toISOString(),
                  completedAt: new Date().toISOString(),
                  durationMs: 0,
                },
                evidence: [],
                measurements: [],
                checks: [],
                findings: [],
                error: {
                  code: 'navigation_failed',
                  message: error instanceof Error ? error.message : 'Page audit failed.',
                  recoverable: true,
                },
              },
            })
          }
        }
      }

      await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker))
      const completedAt = new Date().toISOString()

      return {
        engineVersion: first.engineVersion,
        run: {
          id: crypto.randomUUID(),
          status: 'completed',
          startedAt,
          completedAt,
          durationMs: Math.round(performance.now() - started),
        },
        requestedUrl: firstUrl,
        finalUrl: first.page.finalUrl,
        pages,
        discoveredUrls,
        truncated: discoveredUrls.length > pages.length || queue.length >= maxPages - 1,
      }
    } catch (error) {
      return failedSiteReport(request.url, startedAt, started, error)
    }
  }
}
