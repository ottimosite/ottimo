import { describe, expect, it } from 'vitest'
import { createCopilotContext, DeterministicCopilotProvider, validateCopilotProposal } from './copilot'
import type { Audit } from '../types/domain'

const audit: Audit = {
  id: 'audit-1',
  websiteId: 'site-1',
  url: 'https://example.com',
  createdAt: '2026-09-20T00:00:00Z',
  durationMs: 100,
  scores: [{ category: 'seo', score: 70 }],
  issues: [{
    id: 'issue-1',
    category: 'seo',
    severity: 'medium',
    title: 'Missing title',
    summary: 'No document title was observed.',
    impact: 'Search result context may be weaker.',
    solution: 'Add a descriptive document title.',
    effort: 'low',
    priority: 70,
    status: 'open',
    evidence: { status: 'measured', value: false, source: 'browser' },
    confidence: 'high',
    affectedPages: ['https://example.com/'],
  }],
  actions: [{
    id: 'action-1',
    issueId: 'issue-1',
    fingerprint: 'seo|missing title|add title',
    title: 'Missing title',
    category: 'seo',
    severity: 'medium',
    impact: 'medium',
    confidence: 'high',
    effort: 'low',
    priorityScore: 70,
    status: 'open',
    lifecycleStatus: 'planned',
    affectedPages: ['https://example.com/'],
    affectedResources: [],
    evidenceCount: 1,
    dependencies: [],
    implementationSteps: ['Add a descriptive document title.'],
    verification: [{ description: 'Every affected page exposes a non-empty document title.', affectedPages: ['https://example.com/'] }],
    expectedOutcome: 'Search result context may be weaker.',
    priority: { impact: 55, severity: 55, confidence: 1, effort: 1, evidence: 2, score: 70 },
  }],
}

describe('evidence-grounded copilot', () => {
  it('only accepts supplied evidence and labels output as a proposal', async () => {
    const evidence = [{
      status: 'measured' as const,
      value: false,
      source: 'browser',
      details: 'No title observed',
      observedAt: '2026-09-20T00:00:00Z',
    }]
    const context = createCopilotContext(audit, evidence)
    const provider = new DeterministicCopilotProvider()
    const proposal = await provider.generate('implementation', context, 'action-1')

    expect(proposal.isProposal).toBe(true)
    expect(proposal.actionId).toBe('action-1')
    expect(proposal.affectedPages).toEqual(['https://example.com/'])
    expect(proposal.uncertainty.some(item => item.includes('traffic, conversion'))).toBe(true)
  })

  it('strips unsupported affected pages and evidence references', () => {
    const context = createCopilotContext(audit, [])
    const proposal = validateCopilotProposal({
      task: 'explanation',
      title: 'Unsupported',
      summary: 'Proposal',
      evidenceIds: ['unknown'],
      affectedPages: ['https://unknown.example/'],
      verification: [],
      uncertainty: [],
      isProposal: true,
    }, context)

    expect(proposal.evidenceIds).toEqual([])
    expect(proposal.affectedPages).toEqual([])
    expect(proposal.isProposal).toBe(true)
  })

  it('degrades gracefully when no findings or actions exist', async () => {
    const empty = { ...audit, issues: [], actions: undefined }
    const context = createCopilotContext(empty)
    const proposal = await new DeterministicCopilotProvider().generate('explanation', context)

    expect(proposal.summary).toContain('does not have a finding or action')
    expect(proposal.evidenceIds).toEqual([])
  })
})
