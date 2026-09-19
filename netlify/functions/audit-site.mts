import chromium from '@sparticuz/chromium'
import { chromium as playwrightChromium } from 'playwright'
import { AuditEngine, PlaywrightPageCollector } from '../../src/audit-engine'
import type { AuditCategory } from '../../src/audit-engine'

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
})

export default async (request: Request) => {
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed.' })

  let input: { url?: string; categories?: AuditCategory[]; timeoutMs?: number }
  try {
    input = await request.json() as typeof input
  } catch {
    return json(400, { error: 'Request body must be valid JSON.' })
  }

  if (typeof input.url !== 'string') return json(400, { error: 'A URL is required.' })

  const engine = new AuditEngine(
    new PlaywrightPageCollector(async () => playwrightChromium.launch({
      executablePath: await chromium.executablePath(),
      args: chromium.args,
      headless: chromium.headless,
    })),
  )

  const report = await engine.audit({
    url: input.url,
    categories: input.categories,
    timeoutMs: Math.min(input.timeoutMs ?? 45_000, 50_000),
  })

  return json(report.run.status === 'completed' ? 200 : 422, report)
}
