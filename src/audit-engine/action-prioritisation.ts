import type {
  ActionDependency,
  ActionLifecycleStatus,
  AuditIssue,
  Severity,
} from '../types/domain'

export type RegressionRisk = 'none' | 'low' | 'medium' | 'high'

export interface ActionPrioritisationContext {
  dependencies?: ActionDependency[]
  lifecycleStatus?: ActionLifecycleStatus
  regressionRisk?: RegressionRisk
}

export interface ActionPriorityBreakdown {
  /** Legacy factors retained so existing stored actions remain type-compatible. */
  impact: number
  confidence: number
  effort: number
  severity: number
  scope: number
  evidence: number
  dependency: number
  verification: number
  regressionRisk: number
  score: number
}

const severityWeight: Record<Severity, number> = {
  critical: 100,
  high: 80,
  medium: 55,
  low: 30,
}

const regressionWeight: Record<RegressionRisk, number> = {
  none: 0,
  low: 25,
  medium: 60,
  high: 100,
}

const verificationWeight: Record<ActionLifecycleStatus, number> = {
  planned: 50,
  in_progress: 65,
  verification: 80,
  resolved: 0,
  failed: 90,
  inconclusive: 75,
}

/**
 * Calculates a deterministic action priority from evidence already present in the domain model.
 * The factors are deliberately independent and capped so the score cannot imply unsupported
 * business impact. The weights are fixed product rules, not learned or customer-specific values.
 */
export function prioritiseAction(
  issue: AuditIssue,
  context: ActionPrioritisationContext = {},
): ActionPriorityBreakdown {
  const pages = issue.affectedPages?.length ?? 0
  const resources = issue.affectedResources?.length ?? 0
  const occurrences = issue.occurrenceCount ?? 0
  const scope = Math.min(100, pages * 20 + resources * 10 + Math.min(occurrences, 10) * 5)

  const evidenceCount = issue.evidenceCount ?? (issue.evidence ? 1 : 0)
  const measurement = issue.evidence?.status ?? 'unavailable'
  const measurementStrength = measurement === 'measured' ? 60 : measurement === 'inferred' ? 35 : 0
  const confidenceStrength = issue.confidence === 'high' ? 40 : issue.confidence === 'medium' ? 25 : issue.confidence === 'low' ? 10 : 0
  const evidence = Math.min(100, measurementStrength + confidenceStrength + Math.min(evidenceCount, 10) * 2)

  const blockingDependencies = (context.dependencies ?? []).filter(dependency => dependency.blocking).length
  const dependency = blockingDependencies === 0 ? 100 : Math.max(20, 100 - blockingDependencies * 25)
  const verification = verificationWeight[context.lifecycleStatus ?? 'planned']
  const regressionRisk = regressionWeight[context.regressionRisk ?? 'none']

  const score = Math.round(
    severityWeight[issue.severity] * 0.30 +
    scope * 0.15 +
    evidence * 0.20 +
    dependency * 0.10 +
    verification * 0.10 +
    regressionRisk * 0.15,
  )

  return {
    impact: severityWeight[issue.severity],
    confidence: issue.confidence === 'high' ? 1 : issue.confidence === 'medium' ? 0.85 : 0.7,
    effort: 1,
    severity: severityWeight[issue.severity],
    scope,
    evidence,
    dependency,
    verification,
    regressionRisk,
    score: Math.min(100, Math.max(0, score)),
  }
}
