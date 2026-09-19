import { describe, expect, it } from 'vitest'
import { calculateHealth } from './scoring'
import type { AuditReport } from './types'

const report = (checks: AuditReport['checks'], findings: AuditReport['findings'] = []): AuditReport => ({
  engineVersion: 'test',
  run: { id: '1', status: 'completed', startedAt: '', completedAt: '', durationMs: 1 },
  evidence: [],
  measurements: [],
  checks,
  findings,
})

describe('calculateHealth', () => {
  it('calculates category and overall scores from measured checks', () => {
    const result = calculateHealth([report([
      { id: '1', category: 'seo', criterion: 'title', status: 'pass', message: '', evidenceIds: ['a'] },
      { id: '2', category: 'seo', criterion: 'meta', status: 'fail', message: '', evidenceIds: ['b'] },
    ], [{
      id: 'f', category: 'seo', severity: 'high', title: 'Missing metadata', summary: '', impact: '', recommendation: '', scope: 'page', evidenceIds: ['b'],
    }])])
    expect(result.categoryScores.find(item => item.category === 'seo')?.score).toBe(63)
    expect(result.score).toBe(63)
    expect(result.failed).toBe(1)
    expect(result.measuredCategories).toEqual(['seo'])
  })

  it('does not score unavailable categories', () => {
    const result = calculateHealth([report([
      { id: '1', category: 'technical', criterion: 'status', status: 'unavailable', message: '', evidenceIds: [] },
      { id: '2', category: 'seo', criterion: 'title', status: 'pass', message: '', evidenceIds: ['a'] },
      { id: '3', category: 'seo', criterion: 'meta', status: 'pass', message: '', evidenceIds: ['b'] },
    ])])
    expect(result.score).toBe(100)
    expect(result.excludedCategories).toContain('technical')
    expect(result.unavailable).toBe(1)
  })

  it('refuses to produce a score with insufficient measured evidence', () => {
    const result = calculateHealth([report([
      { id: '1', category: 'seo', criterion: 'title', status: 'pass', message: '', evidenceIds: ['a'] },
    ])])
    expect(result.score).toBeUndefined()
    expect(result.status).toBe('not-measured')
  })
})
