import type { Audit, AuditIssue, AuditScore } from '../types/domain'

export type AuditChangeType = 'resolved' | 'new' | 'improved' | 'regressed' | 'unchanged'

export interface AuditChange {
  type: AuditChangeType
  fingerprint: string
  title: string
  category: AuditIssue['category']
  previousSeverity?: AuditIssue['severity']
  currentSeverity?: AuditIssue['severity']
  previousScore?: number
  currentScore?: number
  affectedPages: string[]
}

export interface AuditComparison {
  previousAuditId: string
  previousCreatedAt: string
  comparedAt: string
  changes: AuditChange[]
  resolved: number
  newFindings: number
  improved: number
  regressed: number
  unchanged: number
}

const severityRank: Record<AuditIssue['severity'], number> = { low: 1, medium: 2, high: 3, critical: 4 }

export const fingerprintFor = (issue: AuditIssue) => issue.fingerprint ?? [
  issue.category,
  issue.title,
  issue.solution,
].map(value => value.trim().toLowerCase().replace(/\s+/g, ' ')).join('|')

const scoreFor = (scores: AuditScore[], category: AuditScore['category']) =>
  scores.find(score => score.category === category)?.score

export function compareAudits(previous: Audit, current: Pick<Audit, 'id' | 'createdAt' | 'scores' | 'issues'>): AuditComparison {
  const previousByFingerprint = new Map(previous.issues.map(issue => [fingerprintFor(issue), issue]))
  const currentByFingerprint = new Map(current.issues.map(issue => [fingerprintFor(issue), issue]))
  const changes: AuditChange[] = []

  for (const [fingerprint, oldIssue] of previousByFingerprint) {
    const nextIssue = currentByFingerprint.get(fingerprint)
    if (!nextIssue) {
      changes.push({
        type: 'resolved',
        fingerprint,
        title: oldIssue.title,
        category: oldIssue.category,
        previousSeverity: oldIssue.severity,
        affectedPages: oldIssue.affectedPages ?? [],
      })
      continue
    }

    if (severityRank[nextIssue.severity] < severityRank[oldIssue.severity]) {
      changes.push({ type: 'improved', fingerprint, title: nextIssue.title, category: nextIssue.category, previousSeverity: oldIssue.severity, currentSeverity: nextIssue.severity, affectedPages: nextIssue.affectedPages ?? [] })
    } else if (severityRank[nextIssue.severity] > severityRank[oldIssue.severity]) {
      changes.push({ type: 'regressed', fingerprint, title: nextIssue.title, category: nextIssue.category, previousSeverity: oldIssue.severity, currentSeverity: nextIssue.severity, affectedPages: nextIssue.affectedPages ?? [] })
    } else {
      changes.push({ type: 'unchanged', fingerprint, title: nextIssue.title, category: nextIssue.category, previousSeverity: oldIssue.severity, currentSeverity: nextIssue.severity, affectedPages: nextIssue.affectedPages ?? [] })
    }
  }

  for (const [fingerprint, issue] of currentByFingerprint) {
    if (previousByFingerprint.has(fingerprint)) continue
    changes.push({
      type: 'new',
      fingerprint,
      title: issue.title,
      category: issue.category,
      currentSeverity: issue.severity,
      affectedPages: issue.affectedPages ?? [],
    })
  }

  for (const category of new Set([...previous.scores.map(score => score.category), ...current.scores.map(score => score.category)])) {
    const oldScore = scoreFor(previous.scores, category)
    const newScore = scoreFor(current.scores, category)
    if (oldScore === undefined || newScore === undefined || oldScore === newScore) continue
    const delta = newScore - oldScore
    if (Math.abs(delta) < 1) continue
    changes.push({
      type: delta > 0 ? 'improved' : 'regressed',
      fingerprint: `score:${category}`,
      title: `${category} health score`,
      category,
      previousScore: oldScore,
      currentScore: newScore,
      affectedPages: [],
    })
  }

  return {
    previousAuditId: previous.id,
    previousCreatedAt: previous.createdAt,
    comparedAt: current.createdAt,
    changes: changes.sort((a, b) => a.title.localeCompare(b.title)),
    resolved: changes.filter(change => change.type === 'resolved').length,
    newFindings: changes.filter(change => change.type === 'new').length,
    improved: changes.filter(change => change.type === 'improved').length,
    regressed: changes.filter(change => change.type === 'regressed').length,
    unchanged: changes.filter(change => change.type === 'unchanged').length,
  }
}
