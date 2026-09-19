import { describe, expect, it } from 'vitest'
import { aggregateFindings, findingFingerprint } from './aggregation'
import type { AuditReport } from './types'

const report = (findings: AuditReport['findings']): AuditReport => ({
  engineVersion: 'test',
  run: {
    id: 'run',
    status: 'completed',
    startedAt: '2026-01-01T00:00:00.000Z',
    completedAt: '2026-01-01T00:00:01.000Z',
    durationMs: 1000,
  },
  measurements: [],
  checks: [],
  findings,
  evidence: [],
})

describe('site finding aggregation', () => {
  it('deduplicates the same page-level finding across pages while retaining affected pages', () => {
    const finding = {
      id: 'finding-title',
      category: 'seo' as const,
      severity: 'high' as const,
      title: 'Page is missing a title',
      summary: 'The rendered document does not expose a document title.',
      impact: 'Search engines and users receive less page context.',
      recommendation: 'Add one unique, descriptive title matching the page intent.',
      scope: 'page' as const,
      evidenceIds: ['e1'],
    }

    const result = aggregateFindings([
      { url: 'https://example.com/', report: report([finding]) },
      { url: 'https://example.com/about', report: report([{ ...finding, id: 'finding-title-2', evidenceIds: ['e2'] }]) },
    ])

    expect(result).toHaveLength(1)
    expect(result[0].occurrenceCount).toBe(2)
    expect(result[0].affectedPages).toEqual(['https://example.com/', 'https://example.com/about'])
    expect(result[0].evidenceIds).toEqual(['e1', 'e2'])
  })

  it('keeps different resource failures separate', () => {
    const base = {
      category: 'technical' as const,
      severity: 'medium' as const,
      title: 'Resource returned HTTP 404',
      summary: 'A browser-collected resource returned an error status.',
      impact: 'Broken resources can remove content or functionality.',
      recommendation: 'Investigate the resource response and restore a successful response.',
      scope: 'resource' as const,
      evidenceIds: ['e1'],
    }

    const result = aggregateFindings([
      { url: 'https://example.com/', report: report([{ ...base, id: 'a', resourceUrl: 'https://example.com/a.js' }]) },
      { url: 'https://example.com/about', report: report([{ ...base, id: 'b', resourceUrl: 'https://example.com/b.js', evidenceIds: ['e2'] }]) },
    ])

    expect(result).toHaveLength(2)
  })

  it('produces a deterministic fingerprint for equivalent findings', () => {
    const a = { category: 'seo' as const, title: 'Missing title', recommendation: 'Add a title', scope: 'page' as const }
    const b = { category: 'seo' as const, title: ' Missing   title ', recommendation: 'Add a title', scope: 'page' as const }
    expect(findingFingerprint(a as AuditReport['findings'][number])).toBe(findingFingerprint(b as AuditReport['findings'][number]))
  })
})
