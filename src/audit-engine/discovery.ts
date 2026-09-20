import { assertPublicTarget } from './security'

const MAX_SITEMAP_DOCUMENTS = 20
const MAX_SITEMAP_URLS = 5_000
const FETCH_TIMEOUT_MS = 5_000
const MAX_BODY_BYTES = 2 * 1024 * 1024

export interface RobotsPolicy {
  found: boolean
  sitemaps: string[]
  disallow: string[]
  allow: string[]
}

export interface SitemapDiscovery {
  found: boolean
  documents: string[]
  urls: string[]
}

export interface SiteDiscovery {
  robots: RobotsPolicy
  sitemap: SitemapDiscovery
}

const normaliseUrl = (raw: string, base: string) => {
  const url = new URL(raw, base)
  url.hash = ''
  return url.href
}

const sameOrigin = (candidate: string, origin: string) => {
  try { return new URL(candidate).origin === new URL(origin).origin } catch { return false }
}

const fetchText = async (rawUrl: string) => {
  let current = rawUrl
  for (let redirects = 0; redirects <= 5; redirects += 1) {
    const target = await assertPublicTarget(current)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    try {
      const response = await fetch(target.href, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          accept: 'text/plain,application/xml,text/xml;q=0.9,*/*;q=0.1',
          'user-agent': 'OttimoAuditEngine/0.1 (+https://ottimo-site.netlify.app/)',
        },
      })

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location')
        if (!location || redirects === 5) return undefined
        const redirected = normaliseUrl(location, target.href)
        const safeRedirect = await assertPublicTarget(redirected)
        if (!sameOrigin(safeRedirect.href, target.href)) return undefined
        current = safeRedirect.href
        continue
      }

      if (!response.ok) return undefined
      const buffer = await response.arrayBuffer()
      if (buffer.byteLength > MAX_BODY_BYTES) return undefined
      return new TextDecoder().decode(buffer)
    } catch {
      return undefined
    } finally {
      clearTimeout(timer)
    }
  }
  return undefined
}

const directivePath = (value: string) => {
  try {
    const url = new URL(value, 'https://example.invalid')
    return url.pathname + (url.search || '')
  } catch {
    return value.trim()
  }
}

export async function discoverRobots(baseUrl: string): Promise<RobotsPolicy> {
  const origin = new URL(baseUrl).origin
  const robotsUrl = new URL('/robots.txt', baseUrl).href
  const body = await fetchText(robotsUrl)
  if (body === undefined) return { found: false, sitemaps: [], disallow: [], allow: [] }

  let applies = false
  const disallow: string[] = []
  const allow: string[] = []
  const sitemaps = new Set<string>()

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, '').trim()
    if (!line) continue
    const separator = line.indexOf(':')
    if (separator < 0) continue
    const key = line.slice(0, separator).trim().toLowerCase()
    const value = line.slice(separator + 1).trim()
    if (key === 'user-agent') {
      applies = value === '*'
      continue
    }
    if (key === 'sitemap') {
      try {
        const url = normaliseUrl(value, baseUrl)
        if (sameOrigin(url, origin)) sitemaps.add(url)
      } catch { /* Ignore malformed sitemap declarations. */ }
      continue
    }
    if (!applies) continue
    if (key === 'disallow' && value) disallow.push(directivePath(value))
    if (key === 'allow' && value) allow.push(directivePath(value))
  }

  return { found: true, sitemaps: [...sitemaps], disallow, allow }
}

export function isAllowedByRobots(url: string, policy: RobotsPolicy) {
  if (!policy.found) return true
  const target = new URL(url)
  const path = target.pathname + (target.search || '')
  const matches = (rule: string) => rule === '/' || path.startsWith(rule)
  const denied = policy.disallow.filter(matches).sort((a, b) => b.length - a.length)[0]
  const permitted = policy.allow.filter(matches).sort((a, b) => b.length - a.length)[0]
  if (!denied) return true
  return Boolean(permitted && permitted.length >= denied.length)
}

const xmlValues = (body: string, tag: string) =>
  [...body.matchAll(new RegExp('<' + tag + '\\b[^>]*>([\\s\\S]*?)</' + tag + '>', 'gi'))]
    .map(match => match[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim())
    .filter(Boolean)

export async function discoverSitemaps(baseUrl: string, robots: RobotsPolicy): Promise<SitemapDiscovery> {
  const origin = new URL(baseUrl).origin
  const initial = [...new Set([
    ...robots.sitemaps,
    new URL('/sitemap.xml', baseUrl).href,
    new URL('/sitemap_index.xml', baseUrl).href,
  ])]

  const queue = initial
  const documents = new Set<string>()
  const urls = new Set<string>()

  while (queue.length && documents.size < MAX_SITEMAP_DOCUMENTS && urls.size < MAX_SITEMAP_URLS) {
    const candidate = queue.shift()!
    let normalised: string
    try {
      normalised = normaliseUrl(candidate, baseUrl)
      if (!sameOrigin(normalised, origin)) continue
      await assertPublicTarget(normalised)
    } catch {
      continue
    }
    if (documents.has(normalised)) continue

    const body = await fetchText(normalised)
    if (!body) continue
    documents.add(normalised)

    const indexLocs = xmlValues(body, 'sitemap').flatMap(value => xmlValues(value, 'loc'))
    const pageLocs = xmlValues(body, 'url').flatMap(value => xmlValues(value, 'loc'))

    for (const location of indexLocs) {
      try {
        const child = normaliseUrl(location, normalised)
        if (sameOrigin(child, origin) && !documents.has(child)) queue.push(child)
      } catch { /* Ignore malformed sitemap locations. */ }
    }

    for (const location of pageLocs) {
      try {
        const pageUrl = normaliseUrl(location, normalised)
        if (sameOrigin(pageUrl, origin)) urls.add(pageUrl)
      } catch { /* Ignore malformed sitemap locations. */ }
    }
  }

  return { found: documents.size > 0, documents: [...documents], urls: [...urls] }
}
