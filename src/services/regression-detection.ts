import type { Audit, Category, MeasurementStatus } from '../types/domain'

export type RegressionSeverity = 'low' | 'medium' | 'high'

export interface RegressionSignal {
  id: string
  category: Category
  kind: 'score-drop' | 'new-critical-issue' | 'new-high-issue'
  severity: RegressionSeverity
  previousValue?: number
  currentValue?: number
  auditIds: string[]
  evidence: MeasurementStatus
  rationale: string
}

export interface RegressionDetection {
  websiteId: string
  previousAuditId: string
  currentAuditId: string
  detectedAt: string
  regressions: RegressionSignal[]
}

const scoreDropSeverity = (delta: number): RegressionSeverity =>
  delta <= -20 ? 'high' : delta <= -10 ? 'medium' : 'low'

export function detectRegressions(input: {
  previous: Audit
  current: Audit
  detectedAt: string
}): RegressionDetection {
  if (input.previous.websiteId !== input.current.websiteId) {
    throw new Error('REGRESSION_DETECTION_WEBSITE_MISMATCH')
  }

  const regressions: RegressionSignal[] = []
  const previousScores = new Map(input.previous.scores.map(score => [score.category, score]))

  for (const currentScore of input.current.scores) {
    const previousScore = previousScores.get(currentScore.category)
    if (
      previousScore?.score === undefined ||
      currentScore.score === undefined ||
      (currentScore.measurement !== 'measured' && currentScore.measurement !== 'inferred') ||
      (previousScore.measurement !== 'measured' && previousScore.measurement !== 'inferred')
    ) continue

    const delta = currentScore.score - previousScore.score
    if (delta >= 0) continue

    regressions.push({
      id: `score-drop:${currentScore.category}`,
      category: currentScore.category,
      kind: 'score-drop',
      severity: scoreDropSeverity(delta),
      previousValue: previousScore.score,
      currentValue: currentScore.score,
      auditIds: [input.previous.id, input.current.id],
      evidence: currentScore.measurement,
      rationale: `The ${currentScore.category} score decreased by ${Math.abs(delta)} points between comparable measured audits.`,
    })
  }

  const previousFingerprints = new Set(
    input.previous.issues.map(issue => issue.fingerprint ?? [issue.category, issue.criterion ?? issue.title, ...(issue.affectedPages ?? [])].join('|')),
  )

  for (const issue of input.current.issues) {
    const fingerprint = issue.fingerprint ?? [issue.category, issue.criterion ?? issue.title, ...(issue.affectedPages ?? [])].join('|')
    if (previousFingerprints.has(fingerprint) || !issue.evidence || issue.evidence.status === 'unavailable') continue

    if (issue.severity === 'critical' || issue.severity === 'high') {
      regressions.push({
        id: `new-${issue.severity}:${fingerprint}`,
        category: issue.category,
        kind: issue.severity === 'critical' ? 'new-critical-issue' : 'new-high-issue',
        severity: issue.severity === 'critical' ? 'high' : 'medium',
        auditIds: [input.previous.id, input.current.id],
        evidence: issue.evidence.status,
        rationale: `A new ${issue.severity}-severity finding is present in the current audit and was not present in the previous audit.`,
      })
    }
  }

  return {
    websiteId: input.current.websiteId,
    previousAuditId: input.previous.id,
    currentAuditId: input.current.id,
    detectedAt: input.detectedAt,
    regressions,
  }
}
