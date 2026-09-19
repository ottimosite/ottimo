import { describe, expect, it } from 'vitest'
import { SiteAuditEngine } from './site'
import type { AuditReport, PageSnapshot } from './types'

const page = (url: string, html: string): PageSnapshot => ({
  requestedUrl: url, finalUrl: url, status: 200, statusText: 'OK', contentType: 'text/html',
  redirectChain: [url], html, title: 'Test', language: 'en', secureContext: true,
  timing: {}, resources: [], requestFailures: [], accessibility: { violations: [] },
})

const report = (url: string, html: string): AuditReport => ({
  engineVersion: 'test',
  run: { id: crypto.randomUUID(), status: 'completed', startedAt: new Date().toISOString(), completedAt: new Date().toISOString(), durationMs: 1 },
  page: page(url, html), evidence: [], measurements: [], checks: [], findings: [],
})

describe('SiteAuditEngine', () => {
  it('discovers and audits bounded same-origin pages', async () => {
    const pages = new Map([
      ['https://example.com/', '<a href="/about">About</a><a href="https://other.example/">Other</a>'],
      ['https://example.com/about', '<a href="/">Home</a>'],
    ])
    const fake = { audit: async ({ url }: { url: string }) => report(url, pages.get(url) ?? '') }
    const engine = new SiteAuditEngine(fake as never)
    const result = await engine.audit({ url: 'https://example.com/', maxPages: 2 })
    expect(result.pages).toHaveLength(2)
    expect(result.pages.map(item => item.url)).toEqual(expect.arrayContaining(['https://example.com/', 'https://example.com/about']))
    expect(result.discoveredUrls).not.toContain('https://other.example/')
  })

  it('honours the page limit', async () => {
    const html = '<a href="/one">1</a><a href="/two">2</a><a href="/three">3</a>'
    const fake = { audit: async ({ url }: { url: string }) => report(url, html) }
    const result = await new SiteAuditEngine(fake as never).audit({ url: 'https://example.com/', maxPages: 2 })
    expect(result.pages).toHaveLength(2)
    expect(result.truncated).toBe(true)
  })
})
