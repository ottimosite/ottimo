import { describe, expect, it } from 'vitest'
import { buildInitialActionLifecycle, carryForwardActionLifecycle } from './action-lifecycle'
import type { Audit, OptimizationAction } from '../types/domain'

const action = (status: 'open' | 'in_progress' | 'resolved' = 'open'): OptimizationAction => ({
  id: 'action-1',
  issueId: 'issue-1',
  fingerprint: 'performance|test issue|test solution',
  title: 'Test action',
  category: 'performance',
  severity: 'high',
  impact: 'high',
  confidence: 'high',
  effort: 'low',
  priorityScore: 90,
  status,
  lifecycleStatus: status === 'resolved' ? 'resolved' : status === 'in_progress' ? 'in_progress' : 'planned',
  affectedPages: ['https://example.com/'],
  affectedResources: [],
  evidenceCount: 1,
  dependencies: [],
  implementationSteps: ['Review evidence', 'Apply fix', 'Re-run audit'],
  verification: [{ description: 'The finding is no longer reported.', affectedPages: ['https://example.com/'] }],
  expectedOutcome: 'Improve the user experience.',
  priority: { impact: 80, severity: 80, confidence: 1, effort: 1, evidence: 2, score: 90 },
})

const audit = (id: string, actions: OptimizationAction[], verifications: NonNullable<Audit['verifications']> = []): Audit => ({
  id,
  websiteId: 'site-1',
  url: 'https://example.com/',
  createdAt: '2026-09-19T23:00:00.000Z',
  durationMs: 100,
  scores: [],
  issues: [{
    id: 'issue-1',
    category: 'performance',
    severity: 'high',
    title: 'Test issue',
    summary: 'Test summary',
    impact: 'Test impact',
    solution: 'Test solution',
    effort: 'low',
    priority: 90,
    status: 'open',
  }],
  actions,
  comparison: {
    previousAuditId: id,
    previousCreatedAt: '2026-09-19T22:00:00.000Z',
    comparedAt: '2026-09-19T23:00:00.000Z',
    changes: [],
    resolved: 0,
    newFindings: 0,
    improved: 0,
    regressed: 0,
    unchanged: 0,
  },
  verifications,
})

describe('action lifecycle', () => {
  it('keeps the existing action status contract while exposing a lifecycle status', () => {
    const result = buildInitialActionLifecycle([action('open')])

    expect(result[0].status).toBe('open')
    expect(result[0].lifecycleStatus).toBe('planned')
  })

  it('preserves verification lifecycle states without corrupting issue status', () => {
    const previous = audit('previous', [action('open')])
    const current = audit('current', [action('open')], [
      {
        actionId: 'action-1',
        status: 'failed',
        verifiedAt: '2026-09-19T23:00:00.000Z',
        previousAuditId: 'previous',
        currentAuditId: 'current',
        evidence: 'The finding is still present.',
        affectedPages: ['https://example.com/'],
      },
    ])

    const result = carryForwardActionLifecycle(previous, current, [action('open')])

    expect(result[0].status).toBe('open')
    expect(result[0].lifecycleStatus).toBe('failed')
  })
})
