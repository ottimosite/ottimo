import type { AuditFinding, AuditReport } from './types'

export interface AggregatedFinding {
  fingerprint: string
  finding: AuditFinding
  affectedPages: string[]
  affectedResources: string[]
  occurrenceCount: number
  evidenceIds: string[]
}

const normalise = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ')

export const findingFingerprint = (finding: AuditFinding) => {
  const scopeKey = finding.scope === 'resource'
    ? finding.resourceUrl ?? ''
    : ''
  return [
    finding.category,
    finding.title,
    finding.recommendation,
    scopeKey,
  ].map(normalise).join('|')
}

export function aggregateFindings(
  pages: Array<{ url: string; report: AuditReport }>,
): AggregatedFinding[] {
  const groups = new Map<string, AggregatedFinding>()

  for (const page of pages) {
    if (page.report.run.status !== 'completed') continue

    for (const finding of page.report.findings) {
      const fingerprint = findingFingerprint(finding)
      const existing = groups.get(fingerprint)

      if (existing) {
        if (!existing.affectedPages.includes(page.url)) existing.affectedPages.push(page.url)
        if (finding.resourceUrl && !existing.affectedResources.includes(finding.resourceUrl)) {
          existing.affectedResources.push(finding.resourceUrl)
        }
        existing.occurrenceCount += 1
        for (const evidenceId of finding.evidenceIds) {
          if (!existing.evidenceIds.includes(evidenceId)) existing.evidenceIds.push(evidenceId)
        }
        continue
      }

      groups.set(fingerprint, {
        fingerprint,
        finding,
        affectedPages: [page.url],
        affectedResources: finding.resourceUrl ? [finding.resourceUrl] : [],
        occurrenceCount: 1,
        evidenceIds: [...finding.evidenceIds],
      })
    }
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      affectedPages: [...group.affectedPages].sort(),
      affectedResources: [...group.affectedResources].sort(),
      evidenceIds: [...group.evidenceIds].sort(),
    }))
    .sort((a, b) => a.fingerprint.localeCompare(b.fingerprint))
}
