import { describe, expect, it } from 'vitest'
import { verifyActions } from './verification'
import type { Audit } from '../types/domain'

const base = (id: string, issues: Audit['issues'], actions: NonNullable<Audit['actions']>): Audit => ({
  id,
  websiteId: 'site',
  url: 'https://example.com',
  createdAt: '2026-09-19T10:00:00Z',
  durationMs: 100,
  scores: [],
  issues,
  actions,
})

describe('action verification', () => {
  it('verifies an action when its finding disappears after a re-audit', () => {
    const action = {
      id: 'action-1',
      issueId: 'issue-1',
      title: 'Missing title',
      category: 'seo' as const,
      severity: 'high' as const,
      impact: 'high' as const,
      confidence: 'high' as const,
      effort: 'low' as const,
      priorityScore: 80,
      status: 'open' as const,
      affectedPages: ['https://example.com/'],
      affectedResources: [],
      evidenceCount: 1,
      dependencies: [],
      implementationSteps: [],
      verification: [],
      expectedOutcome: 'Better discoverability',
    }

    const previous = base('old', [{
      id: 'issue-1', category: 'seo', severity: 'high', title: 'Missing title', summary: 'x', impact: 'x', solution: 'x', effort: 'low', priority: 80, status: 'open',
    }], [action])
    const current = base('new', [], [])

    expect(verifyActions(previous, current)[0].status).toBe('verified')
  })
})
