import chromium from '@sparticuz/chromium'
import { chromium as playwrightChromium } from 'playwright'
import { AuditEngine, PlaywrightPageCollector, SiteAuditEngine } from '../audit-engine'
import type { AuditCategory } from '../audit-engine'
import { clampAuditLimits } from './audit-safety'
import type { AuditReport } from '../audit-engine/types'

export interface ServerSiteAuditReport {
  run: AuditReport['run']
  requestedUrl: string
  finalUrl: string
  pages: Array<{ url: string; report: AuditReport }>
  discoveredUrls: string[]
  truncated: boolean
  discovery: {
    robotsFound: boolean
    sitemapFound: boolean
    sitemapPageCount: number
    sitemapDocuments: string[]
    sitemapUrls: string[]
    robots: { found: boolean; sitemaps: string[]; disallow: string[]; allow: string[] }
  }
  error?: AuditReport['error']
}

export async function runSiteAudit(
  url: string,
  categories: AuditCategory[],
  options: { timeoutMs?: number; maxPages?: number } = {},
): Promise<ServerSiteAuditReport> {
  const limits = clampAuditLimits({ maxPages: options.maxPages, timeoutMs: options.timeoutMs, maxConcurrency: 2 })
  const pageEngine = new AuditEngine(
    new PlaywrightPageCollector(async () => {
      if (process.env.NETLIFY_DEV || process.env.OTTIMO_LOCAL_AUDIT === 'true') {
        return playwrightChromium.launch({ headless: true })
      }

      return playwrightChromium.launch({
        executablePath: await chromium.executablePath(),
        args: chromium.args,
        headless: true,
      })
    }),
  )

  return new SiteAuditEngine(pageEngine).audit({
    url,
    categories,
    timeoutMs: limits.timeoutMs,
    maxPages: limits.maxPages,
    concurrency: limits.maxConcurrency,
  })
}
