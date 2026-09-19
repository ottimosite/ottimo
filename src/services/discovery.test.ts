import { describe, expect, it, vi } from 'vitest'
import { BrowserDiscoveryProvider } from './discovery'

describe('BrowserDiscoveryProvider', () => {
  it('discovers robots, sitemap, same-origin pages and technology markers', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) !== '/.netlify/functions/collect-page') throw new Error('Unexpected direct target fetch')
      const body = JSON.parse(String(init?.body ?? '{}')) as { url: string }
      const url = body.url
      if (url.endsWith('/robots.txt')) return new Response(JSON.stringify({ ok: true, requestedUrl: url, finalUrl: url, status: 200, contentType: 'text/plain', contentLength: 56, body: 'User-agent: *\nSitemap: https://example.com/custom.xml' }), { status: 200 })
      if (url.endsWith('/custom.xml')) return new Response(JSON.stringify({ ok: true, requestedUrl: url, finalUrl: url, status: 200, contentType: 'application/xml', contentLength: 130, body: '<?xml version="1.0"?><urlset>\n  <url><loc>https://example.com/</loc></url>\n  <url><loc>https://example.com/about</loc></url>\n</urlset>' }), { status: 200 })
      return new Response(JSON.stringify({ ok: true, requestedUrl: url, finalUrl: url, status: 200, contentType: 'text/html', contentLength: 180, body: '<html lang="en"><head><meta name="generator" content="WordPress"><title>Example</title></head><body><a href="/about">About</a><a href="https://other.test/out">External</a></body></html>' }), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('DOMParser', class { parseFromString(html: string) { const container = document.implementation.createHTMLDocument('test'); container.documentElement.innerHTML = html; return container } })
    const result = await new BrowserDiscoveryProvider().discover('https://example.com')
    expect(result.reachable).toBe(true)
    expect(result.https).toBe(true)
    expect(result.robots.found).toBe(true)
    expect(result.sitemap.found).toBe(true)
    expect(result.sitemap.pageCount).toBe(2)
    expect(result.sitemap.url).toBe('https://example.com/custom.xml')
    expect(result.pages).toContain('https://example.com/about')
    expect(result.pages).not.toContain('https://other.test/out')
    expect(result.technology).toContain('WordPress')
    expect(result.progress.at(-1)?.step).toBe('ready')
  })
})
