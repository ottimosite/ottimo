import { describe, expect, it } from 'vitest'
import { canTransitionAction, normaliseActionDependencies, validateActionDependencies } from './action-dependencies'
import type { OptimizationAction } from '../types/domain'

const makeAction = (id: string, lifecycleStatus: OptimizationAction['lifecycleStatus'] = 'planned', dependencies: OptimizationAction['dependencies'] = []): OptimizationAction => ({
  id,
  issueId: `issue-${id}`,
  fingerprint: `test|${id}`,
  title: `Action ${id}`,
  category: 'technical',
  severity: 'medium',
  impact: 'medium',
  confidence: 'high',
  effort: 'medium',
  priorityScore: 50,
  status: lifecycleStatus === 'resolved' ? 'resolved' : lifecycleStatus === 'in_progress' ? 'in_progress' : 'open',
  lifecycleStatus,
  affectedPages: [],
  affectedResources: [],
  evidenceCount: 1,
  dependencies,
  implementationSteps: ['Review', 'Fix', 'Verify'],
  verification: [{ description: 'Finding is resolved.', affectedPages: [] }],
  expectedOutcome: 'Improve reliability.',
  priority: { impact: 55, severity: 55, confidence: 1, effort: .85, evidence: 2, score: 50 },
})

describe('action dependencies', () => {
  it('accepts a valid dependency graph', () => {
    const actions = [
      makeAction('a'),
      makeAction('b', 'planned', [{ id: 'a', description: 'Prerequisite', blocking: true }]),
    ]
    expect(validateActionDependencies(actions)).toEqual({ valid: true, errors: [] })
  })

  it('rejects self, duplicate and missing dependencies', () => {
    const result = validateActionDependencies([
      makeAction('a', 'planned', [
        { id: 'a', description: 'self', blocking: true },
        { id: 'missing', description: 'missing', blocking: true },
        { id: 'missing', description: 'duplicate', blocking: false },
      ]),
    ])
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toMatch(/self|missing|duplicate/)
  })

  it('rejects cyclic dependency graphs', () => {
    const result = validateActionDependencies([
      makeAction('a', 'planned', [{ id: 'b', description: 'b first', blocking: true }]),
      makeAction('b', 'planned', [{ id: 'a', description: 'a first', blocking: true }]),
    ])
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('Cyclic action dependency')
  })

  it('prevents a blocking action from entering verification until prerequisites resolve', () => {
    const actions = [
      makeAction('a', 'in_progress'),
      makeAction('b', 'in_progress', [{ id: 'a', description: 'a must be resolved first', blocking: true }]),
    ]
    expect(canTransitionAction(actions[1], 'verification', actions)).toBe(false)
    expect(canTransitionAction(actions[1], 'in_progress', actions)).toBe(true)
    actions[0] = makeAction('a', 'resolved')
    expect(canTransitionAction(actions[1], 'verification', actions)).toBe(true)
  })

  it('normalises persisted dependencies without inventing relationships', () => {
    const actions = [
      makeAction('a'),
      makeAction('b', 'planned', [
        { id: 'a', description: 'valid', blocking: true },
        { id: 'a', description: 'duplicate', blocking: false },
        { id: 'b', description: 'self', blocking: true },
        { id: 'missing', description: 'unknown', blocking: true },
      ]),
    ]
    expect(normaliseActionDependencies(actions)[1].dependencies).toEqual([
      { id: 'a', description: 'valid', blocking: true },
    ])
  })
})

  
