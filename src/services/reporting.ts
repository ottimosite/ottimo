import type { Audit, AuditIssue, ActionVerification, OptimizationAction, MeasurementStatus, Category } from '../types/domain'

export type ReportEvidenceStatus = MeasurementStatus | 'not-recorded'

export interface ReportEvidenceReference {
  id: string
  kind: 'finding' | 'action' | 'verification' | 'comparison' | 'health'
  label: string
  sourceId: string
  status: ReportEvidenceStatus
  value?: string | number | boolean
  unit?: string
}

export interface ReportFinding {
  id: string
  title: string
  category: Category
  severity: AuditIssue['severity']
  summary: string
  evidence: ReportEvidenceReference
}

export interface ReportAction {
  id: string
  title: string
  lifecycleStatus: OptimizationAction['lifecycleStatus']
  priorityScore: number
  originatingFindingId: string
  evidenceIds: string[]
}

export interface ReportVerification {
  actionId: string
  status: ActionVerification['status']
  evidenceId: string
}

export interface ReportHistory {
  previousAuditId?: string
  comparisonEvidenceIds: string[]
}

export interface EvidenceBackedReport {
  id: string
  auditId: string
  websiteId: string
  createdAt: string
  title: string
  status: 'complete' | 'partial'
  unavailable: string[]
  summary: {
    healthScore?: number
    healthStatus: NonNullable<Audit['health']>['status']
    findingCount: number
    openFindingCount: number
    actionCount: number
    verifiedCount: number
  }
  findings: ReportFinding[]
  actions: ReportAction[]
  verifications: ReportVerification[]
  history: ReportHistory
  evidence: ReportEvidenceReference[]
}

export interface ReportGenerator {
  generate(audit: Audit, options?: { websiteName?: string; generatedAt?: string }): EvidenceBackedReport
}

const evidenceStatus = (issue: AuditIssue): ReportEvidenceStatus => issue.evidence?.status ?? 'unavailable'

const findingEvidence = (issue: AuditIssue): ReportEvidenceReference => ({
  id: 'evidence:finding:' + issue.id,
  kind: 'finding',
  label: issue.evidence?.details ?? issue.title + ' evidence',
  sourceId: issue.id,
  status: evidenceStatus(issue),
  value: issue.evidence?.value,
  unit: issue.evidence?.unit,
})

export function generateEvidenceBackedReport(
  audit: Audit,
  options: { websiteName?: string; generatedAt?: string } = {},
): EvidenceBackedReport {
  const evidence = audit.issues.map(findingEvidence)
  const unavailable: string[] = []

  if (audit.health?.score === undefined) unavailable.push('Overall health score was not measured.')
  if (!audit.issues.length) unavailable.push('No findings were recorded for this audit.')
  if (!audit.actions?.length) unavailable.push('No optimisation actions were recorded for this audit.')
  if (!audit.comparison) unavailable.push('No previous-audit comparison is available.')
  if (!audit.verifications?.length) unavailable.push('No verification outcomes are recorded.')

  const findings: ReportFinding[] = audit.issues.map(issue => ({
    id: issue.id,
    title: issue.title,
    category: issue.category,
    severity: issue.severity,
    summary: issue.summary,
    evidence: findingEvidence(issue),
  }))

  const actions: ReportAction[] = (audit.actions ?? []).map(action => ({
    id: action.id,
    title: action.title,
    lifecycleStatus: action.lifecycleStatus,
    priorityScore: action.priorityScore,
    originatingFindingId: action.work?.originatingFindingId ?? action.issueId,
    evidenceIds: ['evidence:finding:' + (action.work?.originatingFindingId ?? action.issueId)],
  }))

  const verifications: ReportVerification[] = (audit.verifications ?? []).map(verification => {
    const evidenceId = 'evidence:verification:' + verification.actionId + ':' + verification.currentAuditId
    evidence.push({
      id: evidenceId,
      kind: 'verification',
      label: verification.evidence,
      sourceId: verification.currentAuditId,
      status: verification.status === 'verified' ? 'measured' : 'inferred',
    })
    return { actionId: verification.actionId, status: verification.status, evidenceId }
  })

  const comparisonEvidenceIds = (audit.comparison?.changes ?? []).map(change => {
    const id = 'evidence:comparison:' + change.fingerprint
    evidence.push({
      id,
      kind: 'comparison',
      label: change.type + ': ' + change.title,
      sourceId: audit.comparison?.previousAuditId ?? audit.id,
      status: 'measured',
    })
    return id
  })

  if (audit.health?.score !== undefined) {
    evidence.push({
      id: 'evidence:health:' + audit.id,
      kind: 'health',
      label: 'Overall health score',
      sourceId: audit.id,
      status: 'measured',
      value: audit.health.score,
      unit: 'score',
    })
  }

  return {
    id: 'report:' + audit.id,
    auditId: audit.id,
    websiteId: audit.websiteId,
    createdAt: options.generatedAt ?? new Date().toISOString(),
    title: options.websiteName ? 'Ottimo report — ' + options.websiteName : 'Ottimo report — ' + audit.url,
    status: unavailable.length ? 'partial' : 'complete',
    unavailable,
    summary: {
      healthScore: audit.health?.score,
      healthStatus: audit.health?.status ?? 'not-measured',
      findingCount: audit.issues.length,
      openFindingCount: audit.issues.filter(issue => issue.status !== 'resolved').length,
      actionCount: audit.actions?.length ?? 0,
      verifiedCount: audit.verifications?.filter(item => item.status === 'verified').length ?? 0,
    },
    findings,
    actions,
    verifications,
    history: {
      previousAuditId: audit.comparison?.previousAuditId,
      comparisonEvidenceIds,
    },
    evidence,
  }
}

export class EvidenceBackedReportGenerator implements ReportGenerator {
  generate(audit: Audit, options: { websiteName?: string; generatedAt?: string } = {}): EvidenceBackedReport {
    return generateEvidenceBackedReport(audit, options)
  }
}
