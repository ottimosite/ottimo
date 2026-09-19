import { describe, expect, it } from 'vitest'
import { runAuditRules } from './rules'
import type { PageSnapshot } from './types'

const page: PageSnapshot = {
  requestedUrl: 'https://example.test',
  finalUrl: 'https://example.test',
  status: 200,
  statusText: 'OK',
  contentType: 'text/html',
  redirectChain: ['https://example.test'],
  html: '<html><head><title>Example</title><meta name="description" content="Example page"></head><body><img src="/hero.jpg"></body></html>',
  title: 'Example',
  language: 'en',
  secureContext: true,
  timing: { ttfbMs: 120 },
  resources: [{ url: 'https://example.test/missing.js', type: 'script', status: 404 }],
  requestFailures: [],
  accessibility: { violations: [{ id: 'image-alt', impact: 'serious', help: 'Images must have alternate text', description: 'Images must have alternate text', nodes: [{ target: ['img'] }] }] },
}

describe('audit engine rules', () => {
  it('creates evidence-backed findings without calculating a synthetic score', () => {
    const context = { page, evidence: [], measurements: [], checks: [], findings: [] }
    runAuditRules(context, ['performance', 'accessibility', 'seo', 'technical'])
    expect(context.measurements.some(item => item.metric === 'ttfb')).toBe(true)
    expect(context.findings.some(item => item.category === 'accessibility')).toBe(true)
    expect(context.findings.some(item => item.category === 'technical')).toBe(true)
    expect(context.checks.some(item => item.criterion === 'title' && item.status === 'pass')).toBe(true)
    expect(context.evidence.every(item => item.id)).toBe(true)
  })
})
