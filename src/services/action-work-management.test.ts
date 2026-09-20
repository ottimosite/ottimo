import { describe, expect, it } from 'vitest'
import {
  MemoryActionWorkRepository,
  canTransitionActionLifecycle,
  toActionWorkItem,
} from './action-work-management'
import type { OptimizationAction } from '../types/domain'

const action: OptimizationAction = {
  id: 'action-1',
  issueId: 'issue-1',
  fingerprint: 'performance|test|fix',
  title: 'Improve test performance',
  category: 'performance',
  severity: 'high',
  impact: 'high',
  confidence: 'high',
  effort: 'low',
  priorityScore: 90,
  status: 'open',
  lifecycleStatus: 'planned',
  affectedPages: ['https://example.com'],
  affectedResources: [],
  evidenceCount: 1,
  dependencies: [],
  implementationSteps: ['Review evidence', 'Apply the fix', 'Re-run the audit'],
  verification: [{ description: 'The finding is no longer reported.', affectedPages: ['https://example.com'] }],
  expectedOutcome: 'Faster page experience.',
  priority: { impact: 80, severity: 80, confidence: 1, effort: 1, evidence: 2, score: 90 },
}

describe('action work management', () => {
  it('keeps implementation ownership and originating evidence attached to the action', () => {
    const item = toActionWorkItem(action, {
      owner: 'Adrian',
      implementationNotes: 'Update the render path and remove the blocking request.',
      originatingFindingId: 'issue-1',
      originatingAuditId: 'audit-1',
      evidenceLinks: [
        { label: 'Originating finding', href: '/app/audits/audit-1#findings', relation: 'finding' },
        { label: 'Verification audit', href: '/app/audits/new/run?audit=audit-1', relation: 'verification' },
      ],
    })

    expect(item.work.owner).toBe('Adrian')
    expect(item.work.originatingFindingId).toBe('issue-1')
    expect(item.work.originatingAuditId).toBe('audit-1')
    expect(item.work.evidenceLinks).toHaveLength(2)
  })

  it('persists work items by action id', () => {
    const repository = new MemoryActionWorkRepository()
    const item = toActionWorkItem(action, {
      originatingFindingId: 'issue-1',
      evidenceLinks: [],
    })

    repository.save(item)
    expect(repository.list()).toEqual([item])
    repository.save({ ...item, work: { ...item.work, owner: 'Team' } })
    expect(repository.list()).toHaveLength(1)
    expect(repository.list()[0].work.owner).toBe('Team')
  })

  it('allows only evidence-safe lifecycle transitions', () => {
    expect(canTransitionActionLifecycle('planned', 'in_progress')).toBe(true)
    expect(canTransitionActionLifecycle('in_progress', 'verification')).toBe(true)
    expect(canTransitionActionLifecycle('verification', 'resolved')).toBe(true)
    expect(canTransitionActionLifecycle('planned', 'resolved')).toBe(false)
    expect(canTransitionActionLifecycle('verification', 'in_progress')).toBe(false)
  })
})
