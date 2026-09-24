import { chromium, type Browser } from 'playwright'
import axe from 'axe-core'
import { assertPublicTarget, assertRedirectTarget } from './security'
import type { AuditRequest, PageSnapshot, ResourceSnapshot } from './types'

const MAX_HTML_BYTES = 5 * 1024 * 1024
const MAX_RESOURCES = 500
const USER_AGENT = 'OttimoAuditEngine/0.1 (+https://ottimo-site.netlify.app/)'

export interface PageCollector {
  collect(request: AuditRequest): Promise<PageSnapshot>
}
const axeSource = axe.source

export type BrowserFactory = () => Promise<Browser>

type BrowserMetrics = {
  lcpMs?: number
  cls?: number
  inpMs?: number
}

export class PlaywrightPageCollector implements PageCollector {
  constructor(private readonly browserFactory: BrowserFactory = () => chromium.launch({ headless: true })) {}

  async collect(request: AuditRequest): Promise<PageSnapshot> {
    const target = await assertPublicTarget(request.url)
    const browser: Browser = await this.browserFactory()
    const page = await browser.newPage({
      viewport: request.viewport ?? { width: 1365, height: 900 },
      userAgent: USER_AGENT,
    })
    const resources = new Map<string, ResourceSnapshot>()
    const failures: Array<{ url: string; errorText: string }> = []
    const redirects = [target.href]

    await page.route('**/*', async route => {
      const requestEvent = route.request()
      if (requestEvent.isNavigationRequest() && requestEvent.resourceType() === 'document') {
        await assertRedirectTarget(requestEvent.url())
      }
      await route.continue()
    })

    await page.addInitScript(() => {
      const state = { lcpMs: undefined as number | undefined, cls: 0, inpMs: undefined as number | undefined }
      ;(window as Window & { __ottimoMetrics?: typeof state }).__ottimoMetrics = state
      try {
        new PerformanceObserver(list => {
          const entries = list.getEntries() as PerformanceEntry[]
          const last = entries.at(-1)
          if (last) state.lcpMs = last.startTime
        }).observe({ type: 'largest-contentful-paint', buffered: true })
      } catch { state.lcpMs = undefined }
      try {
        let cls = 0
        new PerformanceObserver(list => {
          for (const entry of list.getEntries() as Array<PerformanceEntry & { value?: number; hadRecentInput?: boolean }>) {
            if (!entry.hadRecentInput) cls += entry.value ?? 0
          }
          state.cls = cls
        }).observe({ type: 'layout-shift', buffered: true })
      } catch { state.cls = 0 }
      try {
        new PerformanceObserver(list => {
          for (const entry of list.getEntries() as Array<PerformanceEntry & { duration?: number }>) {
            state.inpMs = Math.max(state.inpMs ?? 0, entry.duration ?? 0)
          }
        }).observe({ type: 'event', buffered: true } as PerformanceObserverInit)
      } catch { state.inpMs = undefined }
    })

    await page.addInitScript({ content: axeSource })

    page.on('response', response => {
      if (resources.size >= MAX_RESOURCES) return
      const type = response.request().resourceType()
      if (type === 'document' && !redirects.includes(response.url())) redirects.push(response.url())
      resources.set(response.url(), {
        url: response.url(),
        type,
        status: response.status(),
        contentType: response.headers()['content-type'],
      })
    })
    page.on('requestfailed', event => {
      failures.push({
        url: event.url(),
        errorText: event.failure()?.errorText ?? 'Unknown network failure',
      })
    })

    try {
      const timeoutMs = request.timeoutMs ?? 10_000
      const response = await page.goto(target.href, {
        waitUntil: 'domcontentloaded',
        timeout: timeoutMs,
      })
      // Do not make audit completion depend on an indefinitely quiet network. Modern
      // sites can keep analytics, ads, or live connections open for the lifetime of
      // the page. Give the page a short settling window, but keep the request bounded.
      await page.waitForLoadState('networkidle', {
        timeout: Math.min(2_000, Math.max(250, Math.floor(timeoutMs / 4))),
      }).catch(() => undefined)
      if (!response) throw new Error('The browser did not receive a document response.')

      const html = await page.content()
      if (new TextEncoder().encode(html).byteLength > MAX_HTML_BYTES) {
        throw new Error("The target HTML exceeds the collection limit.")
      }

      const captured = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
        const paint = performance.getEntriesByName('first-contentful-paint')[0]
        const metrics = (window as Window & { __ottimoMetrics?: BrowserMetrics }).__ottimoMetrics
        return {
          timing: {
            dnsMs: nav ? nav.domainLookupEnd - nav.domainLookupStart : undefined,
            connectionMs: nav ? nav.connectEnd - nav.connectStart : undefined,
            requestMs: nav ? nav.responseEnd - nav.requestStart : undefined,
            ttfbMs: nav ? nav.responseStart - nav.requestStart : undefined,
            domContentLoadedMs: nav?.domContentLoadedEventEnd,
            loadMs: nav?.loadEventEnd,
            fcpMs: paint?.startTime,
            lcpMs: metrics?.lcpMs,
            cls: metrics?.cls,
            inpMs: metrics?.inpMs,
            transferSize: nav?.transferSize,
            encodedBodySize: nav?.encodedBodySize,
            decodedBodySize: nav?.decodedBodySize,
          },
          title: document.title.trim(),
          language: document.documentElement.lang || undefined,
          secureContext: window.isSecureContext,
        }
      })

      const resourceMetrics = await page.evaluate(() => {
        const entries = performance.getEntriesByType('resource') as Array<PerformanceResourceTiming & { initiatorType?: string }>
        return entries.map(entry => ({
          url: entry.name,
          durationMs: entry.duration,
          transferSize: entry.transferSize,
          encodedBodySize: entry.encodedBodySize,
          decodedBodySize: entry.decodedBodySize,
          initiatorType: entry.initiatorType,
        }))
      })

      for (const metric of resourceMetrics.slice(0, 500)) {
        const resource = resources.get(metric.url)
        if (resource) Object.assign(resource, metric)
      }

      const intelligence = await page.evaluate(() => {
        const text = document.documentElement.innerHTML
        const scripts = [...document.scripts].map(s => s.src).filter(Boolean)
        const links = [...document.querySelectorAll('link')].map(l => ({ rel: l.rel, href: l.href, type: l.type })).filter(x => x.href)
        const meta = (name: string) => document.querySelector('meta[name="' + name + '"]')?.getAttribute('content') ?? undefined
        const property = (name: string) => document.querySelector('meta[property="' + name + '"]')?.getAttribute('content') ?? undefined
        const technology: Array<{name:string;category:'cms'|'framework'|'analytics'|'hosting'|'cdn'|'library'|'commerce';confidence:'high'|'medium'|'low';evidence:string}> = []
        const add = (name:string, category: typeof technology[number]['category'], evidence:string, confidence: typeof technology[number]['confidence'] = 'medium') => { if (!technology.some(t => t.name === name)) technology.push({name, category, confidence, evidence}) }
        if (text.includes('wp-content/') || text.includes('wp-includes/')) add('WordPress','cms','wp-content/wp-includes paths detected','high')
        if (scripts.some(s => /googletagmanager|google-analytics/i.test(s))) add('Google Analytics / Tag Manager','analytics','Google analytics/tag manager script URL detected','high')
        if (scripts.some(s => /react/i.test(s)) || /data-reactroot|__NEXT_DATA__/.test(text)) add('React','framework','React markers detected in rendered document','medium')
        if (scripts.some(s => /shopify/i.test(s)) || /cdn\.shopify\.com/i.test(text)) add('Shopify','commerce','Shopify CDN/script marker detected','high')
        if (links.some(l => /cloudflare/i.test(l.href)) || scripts.some(s => /cloudflare/i.test(s))) add('Cloudflare','cdn','Cloudflare asset marker detected','medium')
        const jsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')].length
        const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
        let canonicalUrl: string | undefined
        let canonicalNormalised = false
        let canonicalSameOrigin: boolean | undefined
        if (canonical?.getAttribute('href')?.trim()) {
          try {
            const resolved = new URL(canonical.getAttribute('href')!.trim(), location.href)
            resolved.hash = ''
            canonicalUrl = resolved.href
            canonicalNormalised = true
            canonicalSameOrigin = resolved.origin === location.origin
          } catch { canonicalUrl = undefined }
        }
        return {
          technology,
          searchVisibility: { titlePresent: !!document.title.trim(), titleLength: document.title.trim().length || undefined, metaDescriptionPresent: !!meta('description'), metaDescriptionLength: meta('description')?.length || undefined, canonicalPresent: !!canonical, canonicalUrl, canonicalSameOrigin, canonicalNormalised, h1Count: document.querySelectorAll('h1').length, structuredDataCount: jsonLd, openGraphPresent: !!property('og:title'), twitterCardPresent: !!meta('twitter:card'), sitemapLinked: links.some(l => /sitemap/i.test(l.href)) },
          socialPresence: { profiles: [...document.querySelectorAll('a[href]')].map(a => (a as HTMLAnchorElement).href).filter(h => /facebook\\.com|instagram\\.com|linkedin\\.com|x\\.com|twitter\\.com|youtube\\.com|tiktok\\.com/i.test(h)).slice(0,20), shareMetadata: ['og:title','og:description','og:image','twitter:card'].filter(p => p.startsWith('og:') ? !!property(p) : !!meta(p)), socialScripts: scripts.filter(s => /facebook|instagram|linkedin|twitter|tiktok|pinterest/i.test(s)).slice(0,20) }
        }
      })

      const axeResults = await page.evaluate(async () => {
        const win = window as Window & { axe?: { run: () => Promise<{ violations: Array<{ id: string; impact?: string; help: string; description: string; nodes: Array<{ target: string[]; html?: string; failureSummary?: string }> }> }> } }
        return win.axe ? await win.axe.run() : null
      })

      const accessibility = {
        violations: axeResults?.violations ?? [],
      }

      await browser.close()
      return {
        requestedUrl: target.href,
        finalUrl: page.url(),
        status: response.status(),
        statusText: response.statusText(),
        contentType: response.headers()['content-type'] ?? '',
        redirectChain: redirects,
        html,
        title: captured.title,
        language: captured.language,
        secureContext: captured.secureContext,
        timing: captured.timing,
        resources: [...resources.values()],
        requestFailures: failures,
        accessibility,
        technology: intelligence.technology,
        searchVisibility: intelligence.searchVisibility,
        socialPresence: intelligence.socialPresence,
      }
    } catch (error) {
      await browser.close()
      throw error
    }
  }
}
