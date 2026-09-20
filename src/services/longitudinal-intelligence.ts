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
