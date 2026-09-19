import type { AuditResult } from '../types/domain'
import type { AuditRequest } from './contracts'
import { check, evidence, finding, measurement, type AuditEvidenceBundle, type AuditRun, type AuditRunPhase } from './audit-model'

export interface AuditExecutionContext {
  onProgress?: (progress: { phase: AuditRunPhase; message: string; completedSteps: number; totalSteps: number }) => void
  signal?: AbortSignal
  runId?: string
}

export interface AuditOrchestratorProvider {
  run(request: AuditRequest, context?: AuditExecutionContext): Promise<AuditResult>
}

const report = (context: AuditExecutionContext | undefined, phase: AuditRunPhase, message: string, completedSteps: number, totalSteps: number) =>
  context?.onProgress?.({ phase, message, completedSteps, totalSteps })

export const createAuditRun = (request: AuditRequest, runId = `audit-${Date.now()}`): AuditRun => ({
  id: runId,
  url: request.url,
  startedAt: new Date().toISOString(),
  phase: 'queued',
  status: 'pending',
  categories: request.categories,
  maxPages: request.maxPages,
  pages: [],
  evidence: [],
  checks: [],
  findings: [],
  measurements: [],
})

export const buildEvidenceBundle = (run: AuditRun, result: AuditResult): AuditEvidenceBundle => {
  const observedAt = new Date().toISOString()
  const evidenceRecords = [...run.evidence]
  const checks = [...run.checks]
  const findings = [...run.findings]
  const measurements = [...run.measurements]

  result.issues.forEach(issue => {
    const checkId = issue.criterion ?? issue.title
    const record = evidence({
      auditRunId: run.id,
      checkId,
      observedAt,
      source: result.stats?.source === 'live' ? 'browser-fetch' : 'fixture',
      value: issue.evidence?.value ?? null,
      expected: issue.criterion,
      details: issue.summary,
      measurement: issue.evidence?.status ?? 'inferred',
    })
    evidenceRecords.push(record)
    checks.push(check({
      auditRunId: run.id,
      category: issue.category,
      criterion: checkId,
      status: 'fail',
      evidenceIds: [record.id],
      confidence: issue.confidence ?? 'medium',
      message: issue.summary,
    }))
    findings.push(finding({
      auditRunId: run.id,
      category: issue.category,
      criterion: issue.criterion,
      severity: issue.severity,
      title: issue.title,
      summary: issue.summary,
      evidenceIds: [record.id],
      impact: issue.impact,
      recommendation: issue.solution,
      remediation: issue.solution,
      scope: 'page',
      affectedPages: [run.url],
      confidence: issue.confidence ?? 'medium',
      measurement: issue.evidence?.status ?? 'inferred',
    }))
  })

  result.scores.forEach(score => {
    measurements.push(measurement({
      auditRunId: run.id,
      metric: `${score.category}.score`,
      value: score.score,
      unit: 'score',
      status: typeof score.score === 'number' ? 'measured' : 'unavailable',
      source: result.stats?.source === 'live' ? 'audit-provider' : 'fixture',
      evidenceIds: [],
    }))
  })

  return { scores: result.scores, issues: result.issues, standards: result.standards ?? [], evidence: evidenceRecords, checks, findings, measurements }
}

export async function executeAudit(
  provider: AuditOrchestratorProvider,
  request: AuditRequest,
  context: AuditExecutionContext = {},
  existingRun = createAuditRun(request, context.runId),
): Promise<AuditRun & { result?: AuditResult }> {
  const run = existingRun
  run.status = 'running'
  run.phase = 'auditing'
  report(context, 'auditing', 'Collecting audit evidence', 1, 3)

  try {
    const result = await provider.run(request, context)
    run.phase = 'analysing'
    report(context, 'analysing', 'Turning evidence into findings', 2, 3)
    const bundle = buildEvidenceBundle(run, result)
    run.evidence = bundle.evidence
    run.checks = bundle.checks
    run.findings = bundle.findings
    run.measurements = bundle.measurements
    run.phase = 'completed'
    run.status = 'completed'
    run.completedAt = new Date().toISOString()
    report(context, 'completed', 'Audit complete', 3, 3)
    return { ...run, result }
  } catch (error) {
    run.phase = 'failed'
    run.status = 'failed'
    run.error = {
      code: 'AUDIT_FAILED',
      message: error instanceof Error ? error.message : 'Audit failed.',
      phase: 'failed',
      recoverable: true,
    }
    report(context, 'failed', run.error.message, 0, 3)
    return run
  }
}
