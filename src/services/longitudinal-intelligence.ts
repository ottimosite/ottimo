import type { Audit, Category, MeasurementStatus } from '../types/domain'

export interface LongitudinalCoverage {
  measured: number
  inferred: number
  unavailable: number
}

export interface LongitudinalAuditSnapshot {
  auditId: string
  websiteId: string
  createdAt: string
  url: string
  score?: number
  issueCount: number
  actionCount: number
  coverage: LongitudinalCoverage
  categories: Array<{
    category: Category
    score?: number
    measurement: MeasurementStatus
  }>
}

export interface LongitudinalAuditPair {
  previous: LongitudinalAuditSnapshot
  current: LongitudinalAuditSnapshot
}

export interface LongitudinalWebsiteHistory {
  websiteId: string
  audits: LongitudinalAuditSnapshot[]
  latest?: LongitudinalAuditSnapshot
  previous?: LongitudinalAuditSnapshot
  latestPair?: LongitudinalAuditPair
}

function coverageFor(audit: Audit): LongitudinalCoverage {
  const coverage: LongitudinalCoverage = { measured: 0, inferred: 0, unavailable: 0 }

  for (const score of audit.scores) {
    coverage[score.measurement ?? 'unavailable'] += 1
  }

  for (const issue of audit.issues) {
    if (issue.evidence?.status) coverage[issue.evidence.status] += 1
  }

  return coverage
}

export function snapshotAudit(audit: Audit): LongitudinalAuditSnapshot {
  return {
    auditId: audit.id,
    websiteId: audit.websiteId,
    createdAt: audit.createdAt,
    url: audit.url,
    score: audit.score,
    issueCount: audit.issues.length,
    actionCount: audit.actions?.length ?? 0,
    coverage: coverageFor(audit),
    categories: audit.scores.map(score => ({
      category: score.category,
      score: score.score,
      measurement: score.measurement ?? 'unavailable',
    })),
  }
}

export function buildWebsiteHistory(audits: Audit[], websiteId: string): LongitudinalWebsiteHistory {
  const scoped = audits
    .filter(audit => audit.websiteId === websiteId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  const snapshots = scoped.map(snapshotAudit)
  const latest = snapshots.at(-1)
  const previous = snapshots.at(-2)

  return {
    websiteId,
    audits: snapshots,
    latest,
    previous,
    latestPair: latest && previous ? { previous, current: latest } : undefined,
  }
}


export type AuditChangeType = 'resolved' | 'new' | 'regressed' | 'improved' | 'unchanged' | 'inconclusive'

export interface AuditChange {
  type: AuditChangeType
  fingerprint: string
  title: string
  category: Category
  previousSeverity?: Audit['issues'][number]['severity']
  currentSeverity?: Audit['issues'][number]['severity']
  previousScore?: number
  currentScore?: number
  affectedPages: string[]
  evidence: MeasurementStatus
}

export interface AuditChangeSet {
  previousAuditId: string
  currentAuditId: string
  comparedAt: string
  changes: AuditChange[]
  resolved: number
  newFindings: number
  regressed: number
  improved: number
  unchanged: number
  inconclusive: number
}

const issueFingerprint = (issue: Audit['issues'][number]): string =>
  issue.fingerprint ?? [issue.category, issue.criterion ?? issue.title, ...(issue.affectedPages ?? [])].join('|')

const severityRank: Record<Audit['issues'][number]['severity'], number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
}

function issueEvidenceStatus(issue: Audit['issues'][number]): MeasurementStatus {
  return issue.evidence?.status ?? 'unavailable'
}

export function compareAudits(previous: Audit, current: Audit, comparedAt = new Date().toISOString()): AuditChangeSet {
  if (previous.websiteId !== current.websiteId) {
    throw new Error('AUDIT_COMPARISON_WEBSITE_MISMATCH')
  }

  const previousByFingerprint = new Map(previous.issues.map(issue => [issueFingerprint(issue), issue]))
  const currentByFingerprint = new Map(current.issues.map(issue => [issueFingerprint(issue), issue]))
  const changes: AuditChange[] = []

  for (const [fingerprint, issue] of previousByFingerprint) {
    if (currentByFingerprint.has(fingerprint)) continue
    changes.push({
      type: 'resolved',
      fingerprint,
      title: issue.title,
      category: issue.category,
      previousSeverity: issue.severity,
      affectedPages: issue.affectedPages ?? [],
      evidence: issueEvidenceStatus(issue),
    })
  }

  for (const [fingerprint, issue] of currentByFingerprint) {
    const previousIssue = previousByFingerprint.get(fingerprint)
    if (!previousIssue) {
      changes.push({
        type: 'new',
        fingerprint,
        title: issue.title,
        category: issue.category,
        currentSeverity: issue.severity,
        affectedPages: issue.affectedPages ?? [],
        evidence: issueEvidenceStatus(issue),
      })
      continue
    }

    const previousSeverity = severityRank[previousIssue.severity]
    const currentSeverity = severityRank[issue.severity]
    const evidence = issueEvidenceStatus(issue)
    const type: AuditChangeType =
      evidence === 'unavailable' && issueEvidenceStatus(previousIssue) === 'unavailable'
        ? 'inconclusive'
        : currentSeverity < previousSeverity
          ? 'improved'
          : currentSeverity > previousSeverity
            ? 'regressed'
            : 'unchanged'

    changes.push({
      type,
      fingerprint,
      title: issue.title,
      category: issue.category,
      previousSeverity: previousIssue.severity,
      currentSeverity: issue.severity,
      affectedPages: Array.from(new Set([...(previousIssue.affectedPages ?? []), ...(issue.affectedPages ?? [])])),
      evidence,
    })
  }

  for (const score of current.scores) {
    const previousScore = previous.scores.find(item => item.category === score.category)
    if (score.score === undefined || previousScore?.score === undefined) continue
    if (score.score === previousScore.score) continue
    const fingerprint = `score:${score.category}`
    const type: AuditChangeType = score.score > previousScore.score ? 'improved' : 'regressed'
    changes.push({
      type,
      fingerprint,
      title: `${score.category} score changed`,
      category: score.category,
      previousScore: previousScore.score,
      currentScore: score.score,
      affectedPages: [],
      evidence: score.measurement ?? 'unavailable',
    })
  }

  return {
    previousAuditId: previous.id,
    currentAuditId: current.id,
    comparedAt,
    changes,
    resolved: changes.filter(change => change.type === 'resolved').length,
    newFindings: changes.filter(change => change.type === 'new').length,
    regressed: changes.filter(change => change.type === 'regressed').length,
    improved: changes.filter(change => change.type === 'improved').length,
    unchanged: changes.filter(change => change.type === 'unchanged').length,
    inconclusive: changes.filter(change => change.type === 'inconclusive').length,
  }
}


export type HealthTrendDirection = 'improving' | 'stable' | 'regressing' | 'insufficient-evidence'

export interface WebsiteHealthTrend {
  direction: HealthTrendDirection
  previousAuditId?: string
  currentAuditId?: string
  previousScore?: number
  currentScore?: number
  scoreDelta?: number
  evidence: MeasurementStatus
  rationale: string
}

export interface WebsiteHealthTrends {
  websiteId: string
  overall: WebsiteHealthTrend
  categories: Array<{
    category: Category
    trend: WebsiteHealthTrend
  }>
}

function trendForScores(
  previousScore: number | undefined,
  currentScore: number | undefined,
  previousMeasurement: MeasurementStatus | undefined,
  currentMeasurement: MeasurementStatus | undefined,
  previousAuditId?: string,
  currentAuditId?: string,
): WebsiteHealthTrend {
  const evidence = currentMeasurement ?? previousMeasurement ?? 'unavailable'

  if (previousScore === undefined || currentScore === undefined || evidence === 'unavailable') {
    return {
      direction: 'insufficient-evidence',
      previousAuditId,
      currentAuditId,
      previousScore,
      currentScore,
      scoreDelta: previousScore !== undefined && currentScore !== undefined ? currentScore - previousScore : undefined,
      evidence,
      rationale: 'Comparable measured or inferred scores are not available for both audits.',
    }
  }

  const scoreDelta = currentScore - previousScore
  return {
    direction: scoreDelta > 0 ? 'improving' : scoreDelta < 0 ? 'regressing' : 'stable',
    previousAuditId,
    currentAuditId,
    previousScore,
    currentScore,
    scoreDelta,
    evidence,
    rationale: scoreDelta > 0
      ? 'The current comparable score is higher than the previous audit.'
      : scoreDelta < 0
        ? 'The current comparable score is lower than the previous audit.'
        : 'The current comparable score is unchanged from the previous audit.',
  }
}

export function buildWebsiteHealthTrends(history: LongitudinalWebsiteHistory): WebsiteHealthTrends {
  const previous = history.previous
  const current = history.latest

  const overall = trendForScores(
    previous?.score,
    current?.score,
    current?.score === undefined ? 'unavailable' : 'measured',
    current?.score === undefined ? 'unavailable' : 'measured',
    previous?.auditId,
    current?.auditId,
  )

  const categories = Array.from(new Set([
    ...(previous?.categories.map(category => category.category) ?? []),
    ...(current?.categories.map(category => category.category) ?? []),
  ])).sort()

  return {
    websiteId: history.websiteId,
    overall,
    categories: categories.map(category => {
      const previousCategory = previous?.categories.find(item => item.category === category)
      const currentCategory = current?.categories.find(item => item.category === category)
      return {
        category,
        trend: trendForScores(
          previousCategory?.score,
          currentCategory?.score,
          previousCategory?.measurement,
          currentCategory?.measurement,
          previous?.auditId,
          current?.auditId,
        ),
      }
    }),
  }
}
