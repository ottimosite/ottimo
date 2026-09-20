import { describe, expect, it } from 'vitest'
import { prioritiseAction } from './action-prioritisation'
import type { AuditIssue } from '../types/domain'

const issue = (overrides: Partial<AuditIssue> = {}): AuditIssue => ({
  id: 'issue-1', category: 'performance', severity: 'high', title: 'Slow page',
  summary: 'The page is slow.', impact: 'Users wait longer for content.',
  solution: 'Improve the critical rendering path.', effort: 'medium', priority: 50, status: 'open',
  confidence: 'high', evidence: { status: 'measured', value: 3200, unit: 'ms' }, evidenceCount: 3,
  affectedPages: ['https://example.com/', 'https://example.com/about'], ...overrides,
})

describe('transparent action prioritisation', () => {
  it('uses deterministic evidence factors instead of business-impact claims', () => {
    const priority = prioritiseAction(issue())
    expect(priority.severity).toBe(80)
    expect(priority.scope).toBe(50)
    expect(priority.evidence).toBe(66)
    expect(priority.dependency).toBe(100)
    expect(priority.verification).toBe(50)
    expect(priority.regressionRisk).toBe(0)
    expect(priority.score).toBe(64)
  })

  it('increases priority when supported regression risk is present', () => {
    const normal = prioritiseAction(issue(), { regressionRisk: 'none' })
    const regressed = prioritiseAction(issue(), { regressionRisk: 'high' })
    expect(regressed.regressionRisk).toBe(100)
    expect(regressed.score).toBeGreaterThan(normal.score)
  })

  it('makes blocking dependencies and lifecycle state visible in the score', () => {
    const ready = prioritiseAction(issue())
    const blocked = prioritiseAction(issue(), {
      dependencies: [{ id: 'action-2', description: 'Prerequisite', blocking: true }],
      lifecycleStatus: 'verification',
    })
    expect(blocked.dependency).toBe(75)
    expect(blocked.verification).toBe(80)
    expect(blocked.score).toBeGreaterThan(ready.score)
  })

  it('caps scope and evidence so repeated observations cannot create unbounded priority', () => {
    const priority = prioritiseAction(issue({
      affectedPages: Array.from({ length: 20 }, (_, index) => 'https://example.com/' + index),
      affectedResources: Array.from({ length: 20 }, (_, index) => 'https://cdn.example.com/' + index + '.js'),
      occurrenceCount: 100, evidenceCount: 100,
    }))
    expect(priority.scope).toBe(100)
    expect(priority.evidence).toBe(100)
    expect(priority.score).toBeLessThanOrEqual(100)
  })
})