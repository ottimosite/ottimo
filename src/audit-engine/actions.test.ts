import { describe, expect, it } from 'vitest'
import { buildOptimizationActions } from './actions'
import type { AuditIssue } from '../types/domain'

const issue = (overrides: Partial<AuditIssue> = {}): AuditIssue => ({
  id: 'issue-1',
  category: 'seo',
  severity: 'high',
  title: 'Page is missing a title',
  summary: 'A title is missing.',
  impact: 'Search engines and users receive less page context.',
  solution: 'Add one unique, descriptive title matching the page intent.',
  effort: 'medium',
  priority: 85,
  status: 'open',
  confidence: 'high',
  affectedPages: ['https://example.com/', 'https://example.com/about'],
  evidenceCount: 2,
  ...overrides,
})

describe('optimization action engine', () => {
  it('turns an aggregated finding into a verifiable action', () => {
    const [action] = buildOptimizationActions([issue()])

    expect(action.title).toBe('Page is missing a title')
    expect(action.impact).toBe('critical')
    expect(action.affectedPages).toHaveLength(2)
    expect(action.evidenceCount).toBe(2)
    expect(action.dependencies).toEqual([])
    expect(action.verification[0].description).toContain('non-empty document title')
    expect(action.implementationSteps).toHaveLength(3)
    expect(action.priority.score).toBe(action.priorityScore)
    expect(action.priority.evidence).toBe(44)
  })

  it('accounts for confidence and effort when calculating action priority', () => {
    const [lowEffort] = buildOptimizationActions([issue({ effort: 'low' })])
    const [highEffort] = buildOptimizationActions([issue({ effort: 'high' })])

    expect(lowEffort.priorityScore).toBeGreaterThan(highEffort.priorityScore)
  })

  it('uses the same deterministic inputs to order actions', () => {
    const [highConfidence] = buildOptimizationActions([issue({ id: 'high', confidence: 'high', effort: 'low', evidenceCount: 4 })])
    const [lowConfidence] = buildOptimizationActions([issue({ id: 'low', confidence: 'low', effort: 'high', evidenceCount: 1 })])
    expect(highConfidence.priorityScore).toBeGreaterThan(lowConfidence.priorityScore)
  })

  it('keeps verification scoped to the affected pages', () => {
    const [action] = buildOptimizationActions([issue({ affectedPages: ['https://example.com/contact'] })])
    expect(action.verification[0].affectedPages).toEqual(['https://example.com/contact'])
  })
})
