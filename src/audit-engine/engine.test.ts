import { describe, expect, it } from 'vitest'
import { AuditEngine } from './engine'
import type { PageCollector, PageSnapshot } from './types'

const snapshot: PageSnapshot = {
  requestedUrl: 'https://example.test',
  finalUrl: 'https://example.test',
  status: 200,
  statusText: 'OK',
  contentType: 'text/html',
  redirectChain: ['https://example.test'],
  html: '<html lang="en"><head><title>Example</title></head><body></body></html>',
  title: 'Example',
  language: 'en',
  secureContext: true,
  timing: { ttfbMs: 90 },
  resources: [],
  requestFailures: [],
  accessibility: { violations: [] },
}

describe('AuditEngine', () => {
  it('returns a completed report from a collector', async () => {
    const collector: PageCollector = { collect: async () => snapshot }
    const report = await new AuditEngine(collector).audit({ url: snapshot.requestedUrl })
    expect(report.run.status).toBe('completed')
    expect(report.page?.finalUrl).toBe(snapshot.finalUrl)
  })

  it('returns a structured failed report when collection fails', async () => {
    const collector: PageCollector = { collect: async () => { throw new Error('navigation timeout') } }
    const report = await new AuditEngine(collector).audit({ url: snapshot.requestedUrl })
    expect(report.run.status).toBe('failed')
    expect(report.error?.code).toBe('timeout')
    expect(report.page).toBeUndefined()
  })
})
