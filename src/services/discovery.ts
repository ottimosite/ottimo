export type DiscoveryStep = 'reachable' | 'https' | 'homepage' | 'robots' | 'sitemap' | 'pages' | 'technology' | 'ready'
export interface DiscoveryProgress { step: DiscoveryStep; label: string; status: 'running' | 'complete' | 'unavailable' | 'failed'; detail?: string }
export interface DiscoveryResult {
  url: string
  finalUrl: string
  reachable: boolean
  https: boolean
  homepage: { status: number; contentType: string; htmlBytes: number }
  robots: { found: boolean; status?: number; url: string }
  sitemap: { found: boolean; status?: number; url?: string; pageCount?: number }
  pages: string[]
  technology: string[]
  progress: DiscoveryProgress[]
}
export interface DiscoveryContext { onProgress?: (progress: DiscoveryProgress) => void; signal?: AbortSignal }
export interface DiscoveryProvider { discover(url: string, context?: DiscoveryContext): Promise<DiscoveryResult> }

const progress = (context: DiscoveryContext | undefined, item: DiscoveryProgress) => context?.onProgress?.(item)

const sameOrigin = (candidate: string, origin: string) => {
  try { return new URL(candidate, origin).origin === new URL(origin).origin } catch { return false }
}

const extractTechnology = (document: Document, html: string): string[] => {
  const found = new Set<string>()
  if (document.querySelector('meta[name="generator"]')) found.add('Generator metadata')
  if (document.querySelector('[data-reactroot], #__next, script[src*="_next/"]')) found.add('React / Next.js')
  if (document.querySelector('#___gatsby, [data-gatsby-image-wrapper], script[src*="gatsby"]')) found.add('Gatsby')
  if (document.querySelector('[id^="wp-"], link[href*="wp-content"], script[src*="wp-includes"]')) found.add('WordPress')
  if (/Shopify\.theme|cdn\.shopify\.com/i.test(html)) found.add('Shopify')
  if (document.querySelector('meta[name="generator"][content*="Drupal" i]')) found.add('Drupal')
  return [...found]
}

export class BrowserDiscoveryProvider implements DiscoveryProvider {
  async discover(url: string, context: DiscoveryContext = {}): Promise<DiscoveryResult> {
    const steps: DiscoveryProgress[] = []
    const report = (item: DiscoveryProgress) => { steps.push(item); progress(context, item) }
    const parsed = new URL(url)
    report({ step: 'reachable', label: 'Checking website reachability', status: 'running' })
    const response = await fetch(parsed.href, { headers: { Accept: 'text/html' }, signal: context.signal, redirect: 'follow' })
    const finalUrl = response.url || parsed.href
    const contentType = response.headers.get('content-type') ?? ''
    if (!response.ok) {
      report({ step: 'reachable', label: 'Website reachability', status: 'failed', detail: `HTTP ${response.status}` })
      throw new Error(`The website returned HTTP ${response.status}.`)
    }
    report({ step: 'reachable', label: 'Website reachable', status: 'complete', detail: `HTTP ${response.status}` })
    const https = new URL(finalUrl).protocol === 'https:'
    report({ step: 'https', label: 'HTTPS detected', status: https ? 'complete' : 'unavailable', detail: https ? 'Secure connection' : 'HTTP connection' })

    const html = await response.text()
    const document = new DOMParser().parseFromString(html, 'text/html')
    report({ step: 'homepage', label: 'Homepage analysed', status: 'complete', detail: `${new TextEncoder().encode(html).length.toLocaleString()} bytes` })

    const robotsUrl = new URL('/robots.txt', finalUrl).href
    let robotsFound = false
    let robotsStatus: number | undefined
    let robotsText = ''
    report({ step: 'robots', label: 'Looking for robots.txt', status: 'running' })
    try {
      const robots = await fetch(robotsUrl, { signal: context.signal })
      robotsStatus = robots.status
      robotsFound = robots.ok
      if (robotsFound) robotsText = await robots.text()
      report({ step: 'robots', label: robotsFound ? 'robots.txt discovered' : 'robots.txt not found', status: robotsFound ? 'complete' : 'unavailable', detail: `HTTP ${robots.status}` })
    } catch {
      report({ step: 'robots', label: 'robots.txt unavailable', status: 'unavailable', detail: 'Browser access was blocked or unavailable.' })
    }

    const sitemapCandidates = [new URL('/sitemap.xml', finalUrl).href]
    if (robotsFound) {
      for (const line of robotsText.split(/\r?\n/)) {
          const match = line.match(/^sitemap:\s*(\S+)/i)
          if (match) sitemapCandidates.push(match[1])
        }
      }
    }
    let sitemapFound = false
    let sitemapStatus: number | undefined
    let sitemapUrl: string | undefined
    let pageCount: number | undefined
    report({ step: 'sitemap', label: 'Looking for sitemap', status: 'running' })
    for (const candidate of [...new Set(sitemapCandidates)]) {
      try {
        const sitemap = await fetch(candidate, { signal: context.signal })
        sitemapStatus = sitemap.status
        if (!sitemap.ok) continue
        const text = await sitemap.text()
        const urls = [...text.matchAll(/<loc(?:\s[^>]*)?>([\s\S]*?)<\/loc>/gi)].map(match => match[1].trim()).filter(Boolean)
        if (!urls.length) continue
        sitemapFound = true; sitemapUrl = candidate; pageCount = urls.length
        report({ step: 'sitemap', label: 'Sitemap discovered', status: 'complete', detail: `${pageCount} URLs listed` })
        break
      } catch { /* try the next candidate */ }
    }
    if (!sitemapFound) report({ step: 'sitemap', label: 'Sitemap not available', status: 'unavailable', detail: 'No accessible sitemap.xml was found.' })

    const links = [...document.querySelectorAll<HTMLAnchorElement>('a[href]')]
      .map(link => { try { return new URL(link.href, finalUrl).href } catch { return '' } })
      .filter(href => href && sameOrigin(href, finalUrl))
    const pages = [...new Set([finalUrl, ...links])].slice(0, 50)
    report({ step: 'pages', label: 'Pages discovered', status: 'complete', detail: `${pages.length} same-origin URLs from the homepage` })

    const technology = extractTechnology(document, html)
    report({ step: 'technology', label: 'Technology stack inspected', status: 'complete', detail: technology.length ? technology.join(', ') : 'No known technology markers detected' })
    report({ step: 'ready', label: 'Discovery ready for audit', status: 'complete' })

    return { url, finalUrl, reachable: true, https, homepage: { status: response.status, contentType, htmlBytes: new TextEncoder().encode(html).length }, robots: { found: robotsFound, status: robotsStatus, url: robotsUrl }, sitemap: { found: sitemapFound, status: sitemapStatus, url: sitemapUrl, pageCount }, pages, technology, progress: steps }
  }
}
