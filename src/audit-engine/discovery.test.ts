import { beforeEach, describe, expect, it, vi } from 'vitest'
import { discoverRobots, discoverSitemaps, isAllowedByRobots } from './discovery'

const responses = new Map<string, { status: number; body: string }>()

beforeEach(() => {
  responses.clear()
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    const response = responses.get(url)
    if (!response) return new Response('', { status: 404 })
    return new Response(response.body, {
      status: response.status,
      headers: { 'content-type': 'application/xml' },
    })
  }))
})

describe('discovery', () => {
  it('parses wildcard robots directives and sitemap declarations', async () => {
    responses.set('https://example.com/robots.txt', {
      status: 200,
      body: 'User-agent: *\nDisallow: /private\nAllow: /private/public\nSitemap: https://example.com/sitemaps/index.xml',
    })

    const robots = await discoverRobots('https://example.com/')
    expect(robots.found).toBe(true)
    expect(robots.sitemaps).toEqual(['https://example.com/sitemaps/index.xml'])
    expect(isAllowedByRobots('https://example.com/private', robots)).toBe(false)
    expect(isAllowedByRobots('https://example.com/private/public', robots)).toBe(true)
  })

  it('walks sitemap indexes and child sitemap shards', async () => {
    responses.set('https://example.com/robots.txt', { status: 404, body: '' })
    responses.set('https://example.com/sitemap.xml', {
      status: 200,
      body: '<sitemapindex><sitemap><loc>https://example.com/sitemap-a.xml</loc></sitemap><sitemap><loc>https://example.com/sitemap-b.xml</loc></sitemap></sitemapindex>',
    })
    responses.set('https://example.com/sitemap_index.xml', { status: 404, body: '' })
    responses.set('https://example.com/sitemap-a.xml', {
      status: 200,
      body: '<urlset><url><loc>https://example.com/one</loc></url></urlset>',
    })
    responses.set('https://example.com/sitemap-b.xml', {
      status: 200,
      body: '<urlset><url><loc><![CDATA[https://example.com/two#fragment]]></loc></url></urlset>',
    })

    const robots = await discoverRobots('https://example.com/')
    const sitemap = await discoverSitemaps('https://example.com/', robots)
    expect(sitemap.found).toBe(true)
    expect(sitemap.documents).toEqual(expect.arrayContaining([
      'https://example.com/sitemap.xml',
      'https://example.com/sitemap-a.xml',
      'https://example.com/sitemap-b.xml',
    ]))
    expect(sitemap.urls).toEqual(expect.arrayContaining(['https://example.com/one', 'https://example.com/two']))
  })
})
