import { describe, expect, it } from 'vitest'
import { buildEvidenceBundle, createAuditRun, executeAudit } from '../services/orchestrator'
import type { AuditResult } from '../types/domain'

const result: AuditResult = {
  score: 70,
  scores: [
    { category: 'performance', score: 82 },
    { category: 'seo', score: 82 },
  ],
  issues: [{
    id: 'issue-1',
    category: 'seo',
    severity: 'medium',
    title: 'Missing title',
    summary: 'No title was observed.',
    impact: 'Page context is weaker.',
    solution: 'Add a descriptive title.',
    effort: 'low',
    priority: 70,
    status: 'open',
    criterion: 'Title element',
    confidence: 'high',
    evidence: { status: 'measured', value: false, source: 'browser-fetch' },
  }],
  durationMs: 20,
  standards: ['Technical SEO'],
  stats: { source: 'live' },
}

describe('audit evidence model', () => {
  it('keeps evidence status explicit', () => {
    const bundle = buildEvidenceBundle(createAuditRun({ url: 'https://example.com' }, 'run-1'), result)
    expect(bundle.evidence[0].measurement).toBe('measured')
    expect(bundle.measurements.find(item => item.metric === 'performance.score')?.status).toBe('measured')
  })

  it('creates traceable checks and findings', () => {
    const bundle = buildEvidenceBundle(createAuditRun({ url: 'https://example.com' }, 'run-2'), result)
    expect(bundle.checks[0].evidenceIds).toContain(bundle.evidence[0].id)
    expect(bundle.findings[0].evidenceIds).toContain(bundle.evidence[0].id)
    expect(bundle.findings[0].affectedPages).toEqual(['https://example.com'])
  })

  it('preserves a failed run without manufacturing a result', async () => {
    const events: string[] = []
    const run = await executeAudit(
      { run: async () => { throw new Error('network unavailable') } },
      { url: 'https://example.com' },
      { onProgress: progress => events.push(progress.phase) },
      createAuditRun({ url: 'https://example.com' }, 'run-3'),
    )
    expect(run.status).toBe('failed')
    expect(run.result).toBeUndefined()
    expect(run.error?.message).toBe('network unavailable')
    expect(events.at(-1)).toBe('failed')
  })
})
