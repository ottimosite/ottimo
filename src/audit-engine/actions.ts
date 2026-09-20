import type { AuditIssue, OptimizationAction, ActionDependency, VerificationCriterion } from '../types/domain'
import { prioritiseAction, type RegressionRisk } from './action-prioritisation'

export type ActionImpact = 'critical' | 'high' | 'medium' | 'low'

export type { ActionPriorityBreakdown, ActionDependency, VerificationCriterion, OptimizationAction } from '../types/domain'

const impactFor = (issue: AuditIssue): ActionImpact => {
  const occurrences = issue.occurrenceCount ?? issue.affectedPages?.length ?? 1
  if (issue.severity === 'critical') return 'critical'
  if (issue.severity === 'high' && occurrences >= 2) return 'critical'
  if (issue.severity === 'high' || (issue.severity === 'medium' && occurrences >= 5)) return 'high'
  if (issue.severity === 'medium') return 'medium'
  return 'low'
}

const verificationFor = (issue: AuditIssue): VerificationCriterion[] => {
  const pages = issue.affectedPages ?? []
  const title = issue.title.toLowerCase()
  let description = 'Re-run the audit and confirm this finding is no longer reported on the affected pages.'

  if (title.includes('missing a title')) description = 'Every affected page exposes a non-empty document title.'
  else if (title.includes('meta description')) description = 'Every affected page exposes a non-empty meta description.'
  else if (title.includes('language')) description = 'Every affected page declares a valid document language.'
  else if (title.includes('alternative text')) description = 'Every affected informative image exposes appropriate alternative text.'
  else if (title.includes('http ')) description = 'The affected resource or document returns a successful HTTP status.'
  else if (title.includes('largest contentful paint')) description = 'Re-run the performance measurement and confirm LCP is within the good threshold.'
  else if (title.includes('first contentful paint')) description = 'Re-run the performance measurement and confirm FCP is within the good threshold.'
  else if (title.includes('time to first byte')) description = 'Re-run the performance measurement and confirm TTFB is within the good threshold.'
  else if (title.includes('cumulative layout shift')) description = 'Re-run the performance measurement and confirm CLS is within the good threshold.'
  else if (title.includes('interaction to next paint')) description = 'Re-run the performance measurement and confirm INP is within the good threshold.'

  return [{ description, affectedPages: pages }]
}

const stepsFor = (issue: AuditIssue): string[] => [
  'Review the evidence and affected pages identified by Ottimo.',
  issue.solution,
  'Re-run the audit after the change and compare the result with the verification criteria.',
]

export function buildOptimizationActions(issues: AuditIssue[], options: { regressionRiskByIssueId?: Record<string, RegressionRisk> } = {}): OptimizationAction[] {
  return issues
    .map((issue): OptimizationAction => {
      const impact = impactFor(issue)
      const confidence = issue.confidence ?? 'low'
      const effort = issue.effort
      const evidenceCount = issue.evidenceCount ?? (issue.evidence ? 1 : 0)
      const priority = priorityFor(issue, impact, confidence, effort, evidenceCount)
      const priorityScore = priority.score

      return {
        id: `action-${issue.id}`,
        issueId: issue.id,
        title: issue.title,
        category: issue.category,
        severity: issue.severity,
        impact,
        confidence,
        effort,
        priorityScore,
        status: issue.status,
        lifecycleStatus: issue.status === 'resolved' ? 'resolved' : issue.status === 'in_progress' ? 'in_progress' : 'planned',
        fingerprint: issue.fingerprint ?? [issue.category, issue.title, issue.solution].map(value => value.trim().toLowerCase().replace(/\s+/g, ' ')).join('|'),
        affectedPages: issue.affectedPages ?? [],
        affectedResources: issue.affectedResources ?? [],
        evidenceCount,
        priority,
        dependencies: [],
        implementationSteps: stepsFor(issue),
        verification: verificationFor(issue),
        expectedOutcome: issue.impact,
      }
    })
    .sort((a, b) => b.priorityScore - a.priorityScore || a.title.localeCompare(b.title))
}
