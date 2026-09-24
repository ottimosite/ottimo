export type AccountLifecycleState =
  | 'visitor'
  | 'onboarding_started'
  | 'account_pending_verification'
  | 'verified'

export type AuditLifecycleState =
  | 'audit_queued'
  | 'audit_running'
  | 'audit_ready'
  | 'audit_failed_retryable'

export interface LifecycleState {
  account: AccountLifecycleState
  audit?: AuditLifecycleState
  updatedAt: string
}

export type LifecycleTransition =
  | 'start_onboarding'
  | 'request_verification'
  | 'complete_verification'
  | 'queue_audit'
  | 'start_audit'
  | 'complete_audit'
  | 'fail_audit_retryable'
  | 'retry_audit'

const ACCOUNT_TRANSITIONS: Record<AccountLifecycleState, Partial<Record<LifecycleTransition, AccountLifecycleState>>> = {
  visitor: { start_onboarding: 'onboarding_started' },
  onboarding_started: { request_verification: 'account_pending_verification' },
  account_pending_verification: { complete_verification: 'verified' },
  verified: {},
}

const AUDIT_TRANSITIONS: Record<AuditLifecycleState | 'none', Partial<Record<LifecycleTransition, AuditLifecycleState>>> = {
  none: { queue_audit: 'audit_queued' },
  audit_queued: { start_audit: 'audit_running' },
  audit_running: {
    complete_audit: 'audit_ready',
    fail_audit_retryable: 'audit_failed_retryable',
  },
  audit_ready: { queue_audit: 'audit_queued' },
  audit_failed_retryable: { retry_audit: 'audit_queued' },
}

export function initialLifecycle(now = new Date().toISOString()): LifecycleState {
  return { account: 'visitor', updatedAt: now }
}

export function transitionLifecycle(
  current: LifecycleState,
  transition: LifecycleTransition,
  now = new Date().toISOString(),
): LifecycleState {
  const nextAccount = ACCOUNT_TRANSITIONS[current.account][transition]
  if (nextAccount) return { ...current, account: nextAccount, updatedAt: now }

  if (transition === 'queue_audit' && current.account !== 'verified') {
    throw new Error('LIFECYCLE_ACCOUNT_NOT_VERIFIED')
  }

  const nextAudit = AUDIT_TRANSITIONS[current.audit ?? 'none'][transition]
  if (!nextAudit) throw new Error('LIFECYCLE_INVALID_TRANSITION')

  return { ...current, audit: nextAudit, updatedAt: now }
}

export function assertAccountCanStartAudit(state: LifecycleState): void {
  if (state.account !== 'verified') throw new Error('LIFECYCLE_ACCOUNT_NOT_VERIFIED')
}

export function assertAuditReleased(state: LifecycleState): void {
  if (state.account !== 'verified') throw new Error('LIFECYCLE_ACCOUNT_NOT_VERIFIED')
  if (state.audit !== 'audit_ready') throw new Error('AUDIT_NOT_RELEASED')
}

export function assertAuditOwnership(tenantId: string, resourceTenantId: string): void {
  if (!tenantId || !resourceTenantId || tenantId !== resourceTenantId) {
    throw new Error('TENANT_ACCESS_DENIED')
  }
}
