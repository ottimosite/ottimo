import type { Audit, OptimizationAction } from '../types/domain'
import { compareAudits } from './audit-comparison'
import { verifyActions } from './verification'

export type ActionLifecycleStatus = 'planned' | 'in_progress' | 'verification' | 'resolved' | 'failed' | 'inconclusive'

const lifecycleFromIssueStatus = (status: Audit['issues'][number]['status']): ActionLifecycleStatus =>
  status === 'resolved' ? 'resolved' : status === 'in_progress' ? 'in_progress' : 'planned'

export const buildInitialActionLifecycle = (actions: OptimizationAction[]): OptimizationAction[] =>
  actions.map(action => ({
    ...action,
    status: lifecycleFromIssueStatus(action.status),
  }))

export function carryForwardActionLifecycle(
  previous: Audit,
  current: Audit,
  actions: OptimizationAction[],
  verifiedAt = current.createdAt,
): OptimizationAction[] {
  const comparison = current.comparison ?? compareAudits(previous, current)
  const verifications = current.verifications ?? verifyActions(previous, current, verifiedAt)
  const previousByFingerprint = new Map(previous.issues.map(issue => [
    issue.fingerprint ?? [issue.category, issue.title, issue.solution].map(value => value.trim().toLowerCase().replace(/\s+/g, ' ')).join('|'),
    issue.id,
  ]))
  const verificationByAction = new Map(verifications.map(item => [item.actionId, item]))

  return actions.map(action => {
    const previousAction = (previous.actions ?? []).find(candidate => {
      const previousIssueId = candidate.issueId
      const currentPreviousIssueId = previousByFingerprint.get(
        previous.issues.find(issue => issue.id === previousIssueId)?.fingerprint ??
          (previous.issues.find(issue => issue.id === previousIssueId)
            ? [previous.issues.find(issue => issue.id === previousIssueId)!.category, previous.issues.find(issue => issue.id === previousIssueId)!.title, previous.issues.find(issue => issue.id === previousIssueId)!.solution].map(value => value.trim().toLowerCase().replace(/\s+/g, ' ')).join('|')
            : ''),
      )
      return candidate.id === action.id || candidate.issueId === action.issueId || currentPreviousIssueId === action.issueId
    })

    const verification = previousAction ? verificationByAction.get(previousAction.id) : undefined
    if (verification) {
      return {
        ...action,
        status: verification.status === 'verified'
          ? 'resolved'
          : verification.status === 'failed'
            ? 'failed'
            : 'inconclusive',
      }
    }

    if (previousAction) {
      return { ...action, status: previousAction.status }
    }

    const change = comparison.changes.find(item => item.fingerprint === action.issueId || item.title === action.title)
    return {
      ...action,
      status: change?.type === 'resolved' ? 'resolved' : 'planned',
    }
  })
}
