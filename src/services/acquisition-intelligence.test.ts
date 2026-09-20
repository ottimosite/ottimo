import { describe, expect, it } from 'vitest'
import type { Audit } from '../types/domain'
import { buildAcquisitionIntelligence } from './acquisition-intelligence'

const audit = (category: Audit['scores'][number]['category']): Audit => ({
  id: 'audit-1',
  websiteId: 'site-1',
  url: 'https://example.com/',
  createdAt: '2026-09-20T12:00:00Z',
  durationMs: 1,
  score: 80,
  scores: [{ category, score: 80, measurement: 'measured' }],
  issues: [{
    id: 'issue-1',
    category,
    severity: 'medium',
    title: 'Observed issue',
    summary: 'An observed issue',
    impact: 'Impact',
    solution: 'Solution',
    effort: 'low',
    priority: 1,
    status: 'open',
    evidence: { status: 'measured', details: 'Audit evidence' },
  }],
})

const observation = (provider: 'search-console' | 'analytics', id: string) => ({
  id,
  provider,
  metric: provider === 'search-console' ? 'clicks' as const : 'sessions' as const,
  value: 100,
  unit: 'count' as const,
  periodStart: '2026-09-01',
  periodEnd: '2026-09-20',
  provenance: {
    provider,
    sourceId: provider + '-property',
    observedAt: '2026-09-20T11:00:00Z',
    retrievedAt: '2026-09-20T11:05:00Z',
  },
  confidence: 'high' as const,
})

describe('acquisition intelligence', () => {
  it('keeps provider observations as observations', () => {
    const result = buildAcquisitionIntelligence({
      generatedAt: '2026-09-20T12:00:00Z',
      observations: [observation('search-console', 'sc-1')],
      audits: [],
    })
    expect(result.insights[0].evidence.kind).toBe('observation')
    expect(result.insights[0].evidence.observationIds).toEqual(['sc-1'])
  })

  it('labels overlapping external and audit evidence as correlation, not causation', () => {
    const result = buildAcquisitionIntelligence({
      generatedAt: '2026-09-20T12:00:00Z',
      observations: [observation('search-console', 'sc-1'), observation('analytics', 'ga-1')],
      audits: [audit('seo'), audit('usability')],
    })
    const correlations = result.insights.filter(item => item.evidence.kind === 'correlation')
    expect(correlations.length).toBeGreaterThan(0)
    expect(correlations.every(item => !item.rationale.toLowerCase().includes('caused'))).toBe(true)
  })

  it('does not invent acquisition results when external data is absent', () => {
    const result = buildAcquisitionIntelligence({
      generatedAt: '2026-09-20T12:00:00Z',
      observations: [],
      audits: [audit('seo')],
    })
    expect(result.insights).toEqual([expect.objectContaining({
      evidence: expect.objectContaining({ kind: 'unavailable', status: 'unavailable' }),
    })])
  })
})
