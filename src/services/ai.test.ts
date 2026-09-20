import { describe, expect, it } from 'vitest'
import type { Audit } from '../types/domain'
import { MockAIProvider, UnsupportedAIOutputError, analyseWithSafeguards, buildAIContext, validateAIAnalysis } from './ai'

const audit: Audit = {
  id: 'audit-1', websiteId: 'site-1', url: 'https://example.com', createdAt: '2026-09-20T00:00:00Z',
  durationMs: 100, scores: [], issues: [{
    id: 'issue-1', category: 'performance', severity: 'high', title: 'Slow LCP',
    summary: 'Observed LCP is above the target.', impact: 'The page may feel slower.',
    solution: 'Investigate the observed rendering cost.', effort: 'medium', priority: 80, status: 'open',
    evidence: { status: 'measured', value: 2800, unit: 'ms', source: 'browser', observedAt: '2026-09-20T00:00:00Z' },
  }],
  actions: [{
    id: 'action-1', issueId: 'issue-1', fingerprint: 'fp-1', title: 'Investigate LCP',
    category: 'performance', severity: 'high', impact: 'high', confidence: 'high', effort: 'medium',
    priorityScore: 80, status: 'open', lifecycleStatus: 'planned', affectedPages: ['https://example.com'],
    affectedResources: [], evidenceCount: 1, dependencies: [], implementationSteps: ['Investigate'],
    verification: [{ description: 'Run the audit again.', affectedPages: ['https://example.com'] }],
    expectedOutcome: 'Reduce observed rendering delay.',
    priority: { impact: 8, severity: 8, confidence: 8, effort: 5, evidence: 1, score: 80 },
  }],
}

describe('evidence-grounded AI', () => {
  it('builds context from existing audit evidence', () => {
    const context = buildAIContext(audit)
    expect(context.findingIds).toEqual(['issue-1'])
    expect(context.actionIds).toEqual(['action-1'])
    expect(context.evidence[0]).toMatchObject({ id: 'finding:audit-1:issue-1', status: 'measured', value: 2800, unit: 'ms' })
  })

  it('accepts an evidence-backed measurement when the evidence matches', () => {
    const context = buildAIContext(audit)
    expect(() => validateAIAnalysis({
      explanation: { kind: 'evidence-backed', text: 'Observed LCP is 2800 ms.', evidenceIds: ['finding:audit-1:issue-1'] },
      nextStep: { kind: 'proposal', text: 'Investigate the rendering path.', evidenceIds: [] },
    }, context)).not.toThrow()
  })

  it('rejects unsupported measurements, unreferenced evidence and acquisition claims', () => {
    const context = buildAIContext(audit)
    expect(() => validateAIAnalysis({
      explanation: { kind: 'evidence-backed', text: 'LCP is 4500 ms.', evidenceIds: ['finding:audit-1:issue-1'] },
      nextStep: { kind: 'proposal', text: 'Investigate it.', evidenceIds: [] },
    }, context)).toThrow(UnsupportedAIOutputError)
    expect(() => validateAIAnalysis({
      explanation: { kind: 'evidence-backed', text: 'The page has a problem.', evidenceIds: ['missing'] },
      nextStep: { kind: 'proposal', text: 'Investigate it.', evidenceIds: [] },
    }, context)).toThrow(UnsupportedAIOutputError)
    expect(() => validateAIAnalysis({
      explanation: { kind: 'evidence-backed', text: 'The audit evidence is available.', evidenceIds: ['finding:audit-1:issue-1'] },
      nextStep: { kind: 'proposal', text: 'This should improve conversions.', evidenceIds: [] },
    }, context)).toThrow(/acquisition metric/)
  })

  it('fails closed when a provider returns unsafe output', async () => {
    const context = buildAIContext(audit)
    const provider = { analyse: async () => ({
      explanation: { kind: 'evidence-backed' as const, text: 'LCP is 4500 ms.', evidenceIds: ['finding:audit-1:issue-1'] },
      nextStep: { kind: 'proposal' as const, text: 'Investigate it.', evidenceIds: [] },
    }) }
    await expect(analyseWithSafeguards(provider, context)).resolves.toBeUndefined()
  })

  it('keeps the mock provider useful without inventing measurements', async () => {
    const output = await analyseWithSafeguards(new MockAIProvider(), buildAIContext(audit))
    expect(output?.explanation.kind).toBe('evidence-backed')
    expect(output?.explanation.evidenceIds).toEqual(['finding:audit-1:issue-1'])
    expect(output?.nextStep.kind).toBe('proposal')
  })
})
