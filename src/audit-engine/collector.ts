import { chromium, type Browser } from 'playwright'
import axe from 'axe-core'
import { assertPublicTarget } from './security'
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
        await assertPublicTarget(requestEvent.url())
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
      }
    } catch (error) {
      await browser.close()
      throw error
    }
  }
}
