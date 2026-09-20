import { describe, expect, it } from 'vitest'
import type { Audit } from '../types/domain'
import { buildWebsiteHistory, snapshotAudit } from './longitudinal-intelligence'

const audit = (overrides: Partial<Audit> = {}): Audit => ({
  id: 'audit-1',
  websiteId: 'site-1',
  url: 'https://example.com',
  createdAt: '2026-09-20T10:00:00Z',
  durationMs: 1000,
  scores: [
    { category: 'performance', score: 72, measurement: 'measured' },
    { category: 'seo', score: undefined, measurement: 'unavailable' },
  ],
  issues: [
    {
      id: 'issue-1',
      category: 'performance',
      severity: 'high',
      title: 'Slow LCP',
      summary: 'LCP is slow.',
      impact: 'Users wait longer.',
      solution: 'Improve loading.',
      effort: 'medium',
      priority: 80,
      status: 'open',
      evidence: { status: 'measured', value: 3200, unit: 'ms', source: 'browser', observedAt: '2026-09-20T10:00:00Z' },
    },
  ],
  ...overrides,
})

describe('longitudinal website intelligence', () => {
  it('creates an evidence-aware snapshot without changing the source audit', () => {
    const source = audit({ score: 72 })
    const snapshot = snapshotAudit(source)

    expect(snapshot).toEqual({
      auditId: 'audit-1',
      websiteId: 'site-1',
      createdAt: '2026-09-20T10:00:00Z',
      url: 'https://example.com',
      score: 72,
      issueCount: 1,
      actionCount: 0,
      coverage: { measured: 2, inferred: 0, unavailable: 1 },
      categories: [
        { category: 'performance', score: 72, measurement: 'measured' },
        { category: 'seo', score: undefined, measurement: 'unavailable' },
      ],
    })
    expect(source.issues[0].evidence?.status).toBe('measured')
  })

  it('orders only the requested website and exposes the latest pair', () => {
    const history = buildWebsiteHistory([
      audit({ id: 'other', websiteId: 'site-2', createdAt: '2026-09-22T10:00:00Z' }),
      audit({ id: 'audit-1', createdAt: '2026-09-20T10:00:00Z' }),
      audit({ id: 'audit-2', createdAt: '2026-09-21T10:00:00Z', score: 81 }),
    ], 'site-1')

    expect(history.audits.map(item => item.auditId)).toEqual(['audit-1', 'audit-2'])
    expect(history.latest?.auditId).toBe('audit-2')
    expect(history.previous?.auditId).toBe('audit-1')
    expect(history.latestPair).toEqual({
      previous: history.previous,
      current: history.latest,
    })
  })

  it('does not invent a comparison when fewer than two audits exist', () => {
    const history = buildWebsiteHistory([audit()], 'site-1')

    expect(history.latest?.auditId).toBe('audit-1')
    expect(history.previous).toBeUndefined()
    expect(history.latestPair).toBeUndefined()
  })
})
