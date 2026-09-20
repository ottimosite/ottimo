import { describe, expect, it } from 'vitest'
import { EvidenceBackedReportGenerator, generateEvidenceBackedReport } from './reporting'
import type { Audit } from '../types/domain'

const audit: Audit = {
  id: 'audit-1',
  websiteId: 'site-1',
  url: 'https://example.com',
  createdAt: '2026-09-20T07:00:00Z',
  durationMs: 1000,
  scores: [],
  issues: [{
    id: 'issue-1',
    category: 'performance',
    severity: 'high',
    title: 'Slow page',
    summary: 'The page is slow.',
    impact: 'Visitors wait longer.',
    solution: 'Reduce blocking work.',
    effort: 'medium',
    priority: 80,
    status: 'open',
    evidence: { status: 'measured', value: 3200, unit: 'ms', details: 'LCP observed at 3200ms' },
  }],
  actions: [{
    id: 'action-1',
    issueId: 'issue-1',
    fingerprint: 'performance|slow-page',
    title: 'Improve page performance',
    category: 'performance',
    severity: 'high',
    impact: 'high',
    confidence: 'high',
    effort: 'medium',
    priorityScore: 80,
    status: 'open',
    lifecycleStatus: 'planned',
    affectedPages: ['https://example.com'],
    affectedResources: [],
    evidenceCount: 1,
    dependencies: [],
    implementationSteps: ['Reduce blocking work'],
    verification: [{ description: 'Finding no longer reported', affectedPages: ['https://example.com'] }],
    expectedOutcome: 'Faster page',
    priority: { impact: 80, severity: 80, confidence: 1, effort: 1, evidence: 2, score: 80 },
  }],
  comparison: {
    previousAuditId: 'audit-0',
    previousCreatedAt: '2026-09-19T07:00:00Z',
    comparedAt: '2026-09-20T07:00:00Z',
    changes: [{
      type: 'regressed',
      fingerprint: 'performance|slow-page',
      title: 'Slow page',
      category: 'performance',
      previousSeverity: 'medium',
      currentSeverity: 'high',
      affectedPages: ['https://example.com'],
    }],
    resolved: 0,
    newFindings: 0,
    improved: 0,
    regressed: 1,
    unchanged: 0,
  },
  verifications: [{
    actionId: 'action-1',
    status: 'inconclusive',
    verifiedAt: '2026-09-20T08:00:00Z',
    previousAuditId: 'audit-0',
    currentAuditId: 'audit-1',
    evidence: 'No conclusive change observed.',
    affectedPages: ['https://example.com'],
  }],
  health: {
    score: 72,
    status: 'needs-improvement',
    measuredCategories: ['performance'],
    excludedCategories: [],
    checks: 1,
    passed: 0,
    failed: 1,
    unavailable: 0,
    methodology: 'Evidence-backed score',
  },
}

describe('evidence-backed reporting', () => {
  it('keeps findings, actions, verification and history traceable to evidence', () => {
    const report = generateEvidenceBackedReport(audit, {
      websiteName: 'Example',
      generatedAt: '2026-09-20T09:00:00Z',
    })
    expect(report.id).toBe('report:audit-1')
    expect(report.title).toBe('Ottimo report — Example')
    expect(report.status).toBe('complete')
    expect(report.findings[0].evidence.sourceId).toBe('issue-1')
    expect(report.actions[0].originatingFindingId).toBe('issue-1')
    expect(report.verifications[0].evidenceId).toBe('evidence:verification:action-1:audit-1')
    expect(report.history.previousAuditId).toBe('audit-0')
    expect(report.history.comparisonEvidenceIds).toEqual(['evidence:comparison:performance|slow-page'])
    expect(report.evidence.map(item => item.id)).toContain('evidence:health:audit-1')
  })

  it('marks unsupported sections as unavailable instead of inventing data', () => {
    const partial = generateEvidenceBackedReport({
      ...audit,
      health: undefined,
      actions: undefined,
      comparison: undefined,
      verifications: undefined,
    })
    expect(partial.status).toBe('partial')
    expect(partial.summary.healthScore).toBeUndefined()
    expect(partial.unavailable).toContain('Overall health score was not measured.')
    expect(partial.unavailable).toContain('No optimisation actions were recorded for this audit.')
    expect(partial.unavailable).toContain('No previous-audit comparison is available.')
    expect(partial.unavailable).toContain('No verification outcomes are recorded.')
  })

  it('supports a replaceable generator service', () => {
    const generator = new EvidenceBackedReportGenerator()
    expect(generator.generate(audit, { generatedAt: '2026-09-20T09:00:00Z' }).id).toBe('report:audit-1')
  })
})
