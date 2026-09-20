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
  resources: [
    { url: 'https://example.test/missing.js', type: 'script', status: 404 },
    { url: 'https://example.test/hero.webp', type: 'image', status: 200, transferSize: 700_000, durationMs: 450 },
  ],
  requestFailures: [],
  accessibility: { violations: [{ id: 'image-alt', impact: 'serious', help: 'Images must have alternate text', description: 'Images must have alternate text', nodes: [{ target: ['img'] }] }] },
}

describe('audit engine rules', () => {
  it('attributes resource weight and slow resource timing', () => {
    const context = {
      page: {
        ...page,
        resources: [
          { url: 'https://example.test/app.js', type: 'script', status: 200, transferSize: 400_000, durationMs: 1500 },
          { url: 'https://example.test/hero.webp', type: 'image', status: 200, transferSize: 600_000, durationMs: 500 },
        ],
      },
      evidence: [] as import('./types').AuditEvidence[],
      measurements: [] as import('./types').AuditMeasurement[],
      checks: [] as import('./types').AuditCheck[],
      findings: [] as import('./types').AuditFinding[],
    }
    runAuditRules(context, ['performance'])
    expect(context.measurements.find(item => item.metric === 'page-transfer-size')?.value).toBe(1_000_000)
    expect(context.measurements.find(item => item.metric === 'script-transfer-size')?.value).toBe(400_000)
    expect(context.findings.some(item => item.title === 'Resource has a long load duration')).toBe(true)
  })

  it('creates evidence-backed findings without calculating a synthetic score', () => {
    const context = { page, evidence: [] as import('./types').AuditEvidence[], measurements: [] as import('./types').AuditMeasurement[], checks: [] as import('./types').AuditCheck[], findings: [] as import('./types').AuditFinding[] }
    runAuditRules(context, ['performance', 'accessibility', 'seo', 'technical'])
    expect(context.measurements.some(item => item.metric === 'ttfb')).toBe(true)
    expect(context.findings.some(item => item.category === 'accessibility')).toBe(true)
    expect(context.findings.some(item => item.category === 'technical')).toBe(true)
    expect(context.findings.some(item => item.category === 'performance' && item.scope === 'resource')).toBe(true)
    expect(context.checks.some(item => item.criterion === 'title' && item.status === 'pass')).toBe(true)
    expect(context.evidence.every(item => item.id)).toBe(true)
  })

  it('flags a cross-origin canonical while preserving its measured URL', () => {
    const context = { page: { ...page, searchVisibility: { titlePresent: true, metaDescriptionPresent: true, canonicalPresent: true, canonicalUrl: 'https://canonical.example/page', canonicalSameOrigin: false, canonicalNormalised: true, h1Count: 1, structuredDataCount: 0, openGraphPresent: false, twitterCardPresent: false, sitemapLinked: false } }, evidence: [] as import('./types').AuditEvidence[], measurements: [] as import('./types').AuditMeasurement[], checks: [] as import('./types').AuditCheck[], findings: [] as import('./types').AuditFinding[] }
    runAuditRules(context, ['seo'])
    expect(context.findings.some(item => item.title === 'Canonical URL points to another origin')).toBe(true)
    expect(context.evidence.some(item => item.value === 'https://canonical.example/page')).toBe(true)
  })
})
