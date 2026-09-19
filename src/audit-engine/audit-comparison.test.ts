import { describe, expect, it } from 'vitest'
import { compareAudits } from './audit-comparison'
import type { Audit } from '../types/domain'

const audit = (id: string, issues: Audit['issues'], score = 70): Audit => ({
  id,
  websiteId: 'site-1',
  url: 'https://example.com',
  createdAt: id === 'old' ? '2026-09-18T10:00:00Z' : '2026-09-19T10:00:00Z',
  durationMs: 1000,
  scores: [{ category: 'performance', score }],
  issues,
})

const issue = (id: string, title: string, severity: Audit['issues'][number]['severity']): Audit['issues'][number] => ({
  id,
  category: 'performance',
  severity,
  title,
  summary: title,
  impact: 'Impact',
  solution: 'Fix it',
  effort: 'medium',
  priority: 70,
  status: 'open',
  confidence: 'high',
  fingerprint: 'performance|' + title.toLowerCase() + '|fix it',
  affectedPages: ['https://example.com/'],
})

describe('audit comparison', () => {
  it('identifies new and resolved findings', () => {
    const previous = audit('old', [
      issue('a', 'Old problem', 'high'),
      issue('b', 'Resolved problem', 'medium'),
    ])
    const current = audit('new', [
      issue('c', 'Old problem', 'high'),
      issue('d', 'New problem', 'medium'),
    ])

    const result = compareAudits(previous, current)

    expect(result.resolved).toBe(1)
    expect(result.newFindings).toBe(1)
    expect(result.changes.some(change => change.type === 'resolved' && change.title === 'Resolved problem')).toBe(true)
    expect(result.changes.some(change => change.type === 'new' && change.title === 'New problem')).toBe(true)
  })

  it('detects severity improvements and regressions', () => {
    const previous = audit('old', [
      issue('a', 'Shared problem', 'high'),
      issue('b', 'Growing problem', 'medium'),
    ])
    const current = audit('new', [
      issue('c', 'Shared problem', 'medium'),
      issue('d', 'Growing problem', 'high'),
    ])

    const result = compareAudits(previous, current)

    expect(result.improved).toBeGreaterThanOrEqual(1)
    expect(result.regressed).toBeGreaterThanOrEqual(1)
  })
})
