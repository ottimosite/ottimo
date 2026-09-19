import type { Audit, OptimizationAction } from '../types/domain'

export type VerificationStatus = 'verified' | 'failed' | 'inconclusive'

export interface ActionVerification {
  actionId: string
  status: VerificationStatus
  verifiedAt: string
  previousAuditId: string
  currentAuditId: string
  evidence: string
  affectedPages: string[]
}

export function verifyActions(previous: Audit, current: Audit, verifiedAt = new Date().toISOString()): ActionVerification[] {
  const currentFingerprints = new Set(current.issues.map(issue => issue.fingerprint).filter(Boolean))
  const currentTitles = new Set(current.issues.map(issue => issue.title.toLowerCase()))

  return (previous.actions ?? []).map((action: OptimizationAction) => {
    const stillPresent = action.issueId
      ? current.issues.some(issue => issue.id === action.issueId || issue.title.toLowerCase() === action.title.toLowerCase())
      : currentFingerprints.has(action.id)

    const resolvedByComparison = false

    const status: VerificationStatus = resolvedByComparison || !stillPresent
      ? 'verified'
      : currentTitles.has(action.title.toLowerCase())
        ? 'failed'
        : 'inconclusive'

    return {
      actionId: action.id,
      status,
      verifiedAt,
      previousAuditId: previous.id,
      currentAuditId: current.id,
      evidence: status === 'verified'
        ? 'The associated finding is no longer present in the latest audit.'
        : status === 'failed'
          ? 'The associated finding is still present in the latest audit.'
          : 'The latest audit did not provide enough evidence to determine whether the action was completed.',
      affectedPages: action.affectedPages,
    }
  })
}
