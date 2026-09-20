import { assertPublicTarget } from './security'
import { discoverRobots, discoverSitemaps, isAllowedByRobots, type RobotsPolicy, type SitemapDiscovery } from './discovery'
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

export interface SiteAuditDiscovery {
  robotsFound: boolean
  robots: RobotsPolicy
  sitemapFound: boolean
  sitemapDocuments: string[]
  sitemapUrls: string[]
  sitemapPageCount: number
}

export interface SiteAuditReport {
  engineVersion: string
  run: AuditReport['run']
  requestedUrl: string
  finalUrl: string
  pages: SitePageResult[]
  discoveredUrls: string[]
  truncated: boolean
  discovery: SiteAuditDiscovery
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

const extractInternalLinks = (html: string, finalUrl: string, robots: RobotsPolicy) => {
  const links = new Set<string>()
  const pattern = /<a\b[^>]*href=["']([^"'#]+)["']/gi
  for (const match of html.matchAll(pattern)) {
    try {
      const candidate = normalise(new URL(match[1], finalUrl).href)
      if (sameOrigin(candidate, finalUrl) && isAllowedByRobots(candidate, robots)) links.add(candidate)
    } catch {
      // Ignore malformed links.
    }
  }
  return [...links]
}

const emptyDiscovery = (): SiteAuditDiscovery => ({
  robotsFound: false,
  robots: { found: false, sitemaps: [], disallow: [], allow: [] },
  sitemapFound: false,
  sitemapDocuments: [],
  sitemapUrls: [],
  sitemapPageCount: 0,
})

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
  discovery: emptyDiscovery(),
  error: {
    code: 'audit_failed',
    message: error instanceof Error ? error.message : 'Site audit failed.',
    recoverable: true,
  },
})

export type DiscoveryLoader = (url: string) => Promise<{ robots: RobotsPolicy; sitemap: SitemapDiscovery }>

export class SiteAuditEngine {
  constructor(
    private readonly pageEngine = new AuditEngine(),
    private readonly discoveryLoader: DiscoveryLoader = async (url) => {
      const robots = await discoverRobots(url)
      return { robots, sitemap: await discoverSitemaps(url, robots) }
    },
  ) {}

  async audit(request: SiteAuditRequest): Promise<SiteAuditReport> {
    const started = performance.now()
    const startedAt = new Date().toISOString()

    try {
      const maxPages = Math.min(Math.max(request.maxPages ?? DEFAULT_MAX_PAGES, 1), MAX_ALLOWED_PAGES)
      const concurrency = Math.min(Math.max(request.concurrency ?? DEFAULT_CONCURRENCY, 1), 3)
      const target = await assertPublicTarget(request.url)
      const firstUrl = target.href
      const timeoutMs = Math.min(request.timeoutMs ?? 10_000, 15_000)

      const { robots, sitemap } = await this.discoveryLoader(firstUrl)
      const discovery: SiteAuditDiscovery = {
        robotsFound: robots.found,
        robots,
        sitemapFound: sitemap.found,
        sitemapDocuments: sitemap.documents,
        sitemapUrls: sitemap.urls,
        sitemapPageCount: sitemap.urls.length,
      }

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
          discovery,
          error: first.error,
        }
      }

      const sitemapQueue = sitemap.urls
        .filter(url => url !== first.page!.finalUrl)
        .filter(url => isAllowedByRobots(url, robots))
      const linkedQueue = extractInternalLinks(first.page.html, first.page.finalUrl, robots)
        .filter(url => url !== first.page!.finalUrl)

      const queue = [...new Set([...sitemapQueue, ...linkedQueue])].slice(0, maxPages - 1)
      const allDiscovered = [...new Set([first.page.finalUrl, ...sitemap.urls, ...linkedQueue])]
      const discoveredUrls = allDiscovered.filter(url => sameOrigin(url, first.page!.finalUrl))
      const pages: SitePageResult[] = [{ url: first.page.finalUrl, report: first }]
      let cursor = 0

      const worker = async () => {
        while (true) {
          const index = cursor++
          if (index >= queue.length || pages.length >= maxPages) return

          const url = queue[index]
          try {
            const safe = await assertPublicTarget(url)
            if (!isAllowedByRobots(safe.href, robots)) continue
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
      pages.sort((a, b) => a.url.localeCompare(b.url))
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
        discovery,
      }
    } catch (error) {
      return failedSiteReport(request.url, startedAt, started, error)
    }
  }
}
