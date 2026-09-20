import { describe, expect, it } from 'vitest'
import type { Audit } from '../types/domain'
import { detectRegressions } from './regression-detection'

const audit = (id: string, score: number, issueSeverity?: Audit['issues'][number]['severity']): Audit => ({
  id,
  websiteId: 'site-1',
  url: 'https://example.com/',
  createdAt: id,
  durationMs: 1,
  score,
  scores: [{ category: 'performance', score, measurement: 'measured' }],
  issues: issueSeverity ? [{
    id: `issue-${id}`,
    category: 'performance',
    severity: issueSeverity,
    title: 'New issue',
    summary: 'New issue',
    impact: 'Impact',
    solution: 'Solution',
    effort: 'medium',
    priority: 1,
    status: 'open',
    evidence: { status: 'measured', details: 'Measured evidence' },
  }] : [],
})

describe('regression detection', () => {
  it('detects evidence-backed score drops', () => {
    const result = detectRegressions({
      previous: audit('audit-1', 90),
      current: audit('audit-2', 75),
      detectedAt: '2026-09-20T12:00:00Z',
    })

    expect(result.regressions).toEqual([expect.objectContaining({
      kind: 'score-drop',
      category: 'performance',
      severity: 'medium',
      previousValue: 90,
      currentValue: 75,
      evidence: 'measured',
    })])
  })

  it('detects new high-severity findings but ignores unavailable evidence', () => {
    const result = detectRegressions({
      previous: audit('audit-1', 90),
      current: audit('audit-2', 90, 'critical'),
      detectedAt: '2026-09-20T12:00:00Z',
    })

    expect(result.regressions).toEqual([expect.objectContaining({
      kind: 'new-critical-issue',
      severity: 'high',
    })])
  })

  it('rejects comparisons across websites', () => {
    expect(() => detectRegressions({
      previous: audit('audit-1', 90),
      current: { ...audit('audit-2', 80), websiteId: 'site-2' },
      detectedAt: '2026-09-20T12:00:00Z',
    })).toThrow('REGRESSION_DETECTION_WEBSITE_MISMATCH')
  })
})
