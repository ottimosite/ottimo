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
  resources: [\n    { url: 'https://example.test/missing.js', type: 'script', status: 404 },\n    { url: 'https://example.test/hero.webp', type: 'image', status: 200, transferSize: 700_000, durationMs: 450 },\n  ],
  requestFailures: [],
  accessibility: { violations: [{ id: 'image-alt', impact: 'serious', help: 'Images must have alternate text', description: 'Images must have alternate text', nodes: [{ target: ['img'] }] }] },
}

describe('audit engine rules', () => {
  it('creates evidence-backed findings without calculating a synthetic score', () => {
    const context = { page, evidence: [] as import('./types').AuditEvidence[], measurements: [] as import('./types').AuditMeasurement[], checks: [] as import('./types').AuditCheck[], findings: [] as import('./types').AuditFinding[] }
    runAuditRules(context, ['performance', 'accessibility', 'seo', 'technical'])
    expect(context.measurements.some(item => item.metric === 'ttfb')).toBe(true)
    expect(context.findings.some(item => item.category === 'accessibility')).toBe(true)
    expect(context.findings.some(item => item.category === 'technical')).toBe(true)\n    expect(context.findings.some(item => item.category === 'performance' && item.scope === 'resource')).toBe(true)
    expect(context.checks.some(item => item.criterion === 'title' && item.status === 'pass')).toBe(true)
    expect(context.evidence.every(item => item.id)).toBe(true)
  })
})
