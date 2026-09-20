import { describe, expect, it } from 'vitest'
import { SiteAuditEngine } from '../site'
import type { AuditReport, PageSnapshot } from '../types'

const fixturePage = (url: string, html: string, overrides: Partial<PageSnapshot> = {}): PageSnapshot => ({
  requestedUrl: url,
  finalUrl: url,
  status: 200,
  statusText: 'OK',
  contentType: 'text/html',
  redirectChain: [url],
  html,
  title: 'Fixture page',
  language: 'en',
  secureContext: true,
  timing: {
    ttfbMs: 220,
    fcpMs: 900,
    lcpMs: 1400,
    cls: 0.02,
    inpMs: undefined,
    transferSize: 120_000,
  },
  resources: [
    { url: url + 'app.js', type: 'script', status: 200, transferSize: 40_000, durationMs: 300 },
  ],
  requestFailures: [],
  accessibility: { violations: [] },
  searchVisibility: {
    titlePresent: true,
    titleLength: 14,
    metaDescriptionPresent: true,
    metaDescriptionLength: 80,
    canonicalPresent: true,
    canonicalUrl: url,
    canonicalSameOrigin: true,
    canonicalNormalised: true,
    h1Count: 1,
    structuredDataCount: 1,
    openGraphPresent: true,
    twitterCardPresent: true,
    sitemapLinked: true,
  },
  ...overrides,
})

const report = (page: PageSnapshot): AuditReport => ({
  engineVersion: 'acceptance-fixture',
  run: {
    id: 'fixture-' + page.finalUrl,
    status: 'completed',
    startedAt: '2026-09-20T00:00:00.000Z',
    completedAt: '2026-09-20T00:00:00.100Z',
    durationMs: 100,
  },
  page,
  evidence: [],
  measurements: [],
  checks: [],
  findings: [],
})

describe('real-site acceptance contracts', () => {
  it('keeps discovery bounded and evidence reproducible for a content site fixture', async () => {
    const html = '<html lang="en"><head><title>Fixture</title><link rel="canonical" href="https://fixture.test/"></head><body><h1>Home</h1><a href="/article">Article</a><a href="https://external.test/">External</a></body></html>'
    const audited: string[] = []
    const pages = new Map([
      ['https://fixture.test/', html],
      ['https://fixture.test/article', '<html lang="en"><body><h1>Article</h1></body></html>'],
    ])
    const fake = {
      audit: async ({ url }: { url: string }) => {
        audited.push(url)
        return report(fixturePage(url, pages.get(url) ?? ''))
      },
    }

    const result = await new SiteAuditEngine(fake as never, async () => ({
      robots: { found: true, sitemaps: [], disallow: ['/private'], allow: [] },
      sitemap: { found: true, documents: ['https://fixture.test/sitemap.xml'], urls: ['https://fixture.test/article', 'https://fixture.test/private/secret'] },
    })).audit({ url: 'https://fixture.test/', maxPages: 2 })

    expect(result.pages).toHaveLength(2)
    expect(audited).toEqual(['https://fixture.test/', 'https://fixture.test/article'])
    expect(result.discoveredUrls).toContain('https://fixture.test/article')
    expect(result.discoveredUrls).not.toContain('https://external.test/')
    expect(result.discovery.sitemapPageCount).toBe(2)
  })

  it('preserves unavailable performance evidence instead of inventing a measurement', async () => {
    const url = 'https://spa.fixture.test/'
    const page = fixturePage(url, '<html lang="en"><body><div id="app"></div></body></html>', {
      timing: { ttfbMs: 300, fcpMs: undefined, lcpMs: undefined, cls: undefined, inpMs: undefined },
      resources: [],
      searchVisibility: {
        titlePresent: false,
        metaDescriptionPresent: false,
        canonicalPresent: false,
        h1Count: 0,
        structuredDataCount: 0,
        openGraphPresent: false,
        twitterCardPresent: false,
        sitemapLinked: false,
      },
    })

    expect(page.timing.fcpMs).toBeUndefined()
    expect(page.timing.lcpMs).toBeUndefined()
    expect(page.resources).toHaveLength(0)
    expect(page.searchVisibility?.canonicalPresent).toBe(false)
  })

  it('captures representative SEO and redirect evidence as facts', () => {
    const page = fixturePage(
      'https://redirect.fixture.test/final',
      '<html lang="en"><head><link rel="canonical" href="https://redirect.fixture.test/final"></head><body><h1>Final</h1></body></html>',
      {
        requestedUrl: 'https://redirect.fixture.test/',
        redirectChain: ['https://redirect.fixture.test/', 'https://redirect.fixture.test/final'],
      },
    )

    expect(page.redirectChain).toEqual([
      'https://redirect.fixture.test/',
      'https://redirect.fixture.test/final',
    ])
    expect(page.finalUrl).toBe('https://redirect.fixture.test/final')
    expect(page.searchVisibility?.canonicalUrl).toBe('https://redirect.fixture.test/final')
  })

  it('keeps failed audit runs without manufacturing a report', () => {
    const failed: AuditReport = {
      engineVersion: 'acceptance-fixture',
      run: {
        id: 'failed-fixture',
        status: 'failed',
        startedAt: '2026-09-20T00:00:00.000Z',
        completedAt: '2026-09-20T00:00:01.000Z',
        durationMs: 1000,
      },
      evidence: [],
      measurements: [],
      checks: [],
      findings: [],
      error: { code: 'timeout', message: 'Fixture timed out', recoverable: true },
    }

    expect(failed.run.status).toBe('failed')
    expect(failed.page).toBeUndefined()
    expect(failed.error?.code).toBe('timeout')
  })
})
