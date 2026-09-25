import { describe, expect, it } from 'vitest'
import {
  assertAccountCanStartAudit,
  assertAuditOwnership,
  assertAuditReleased,
  initialLifecycle,
  transitionLifecycle,
  type LifecycleState,
} from './account-lifecycle'

const at = (account: LifecycleState['account'], audit?: LifecycleState['audit']): LifecycleState => ({
  account,
  audit,
  updatedAt: '2026-09-24T00:00:00.000Z',
})

describe('account and audit lifecycle', () => {
  it('allows a queued audit to fail before the worker starts', () => {
    let state = initialLifecycle('2026-09-25T20:00:00Z')
    state = transitionLifecycle(state, 'start_onboarding')
    state = transitionLifecycle(state, 'request_verification')
    state = transitionLifecycle(state, 'complete_verification')
    state = transitionLifecycle(state, 'queue_audit')
    state = transitionLifecycle(state, 'fail_audit_retryable', '2026-09-25T20:01:00Z')
    expect(state.audit).toBe('audit_failed_retryable')
  })


  it('moves an account deterministically from visitor to verified', () => {
    let state = initialLifecycle('2026-09-24T00:00:00.000Z')
    state = transitionLifecycle(state, 'start_onboarding', '2026-09-24T00:00:00.000Z')
    state = transitionLifecycle(state, 'request_verification', '2026-09-24T00:00:00.000Z')
    state = transitionLifecycle(state, 'complete_verification', '2026-09-24T00:00:00.000Z')

    expect(state).toEqual({
      account: 'verified',
      updatedAt: '2026-09-24T00:00:00.000Z',
    })
  })

  it('rejects invalid account transitions', () => {
    expect(() => transitionLifecycle(initialLifecycle(), 'complete_verification'))
      .toThrow('LIFECYCLE_INVALID_TRANSITION')
  })

  it('requires a verified account before an audit can be queued', () => {
    expect(() => transitionLifecycle(at('account_pending_verification'), 'queue_audit'))
      .toThrow('LIFECYCLE_ACCOUNT_NOT_VERIFIED')
  })

  it('moves a verified audit through queued, running and ready', () => {
    let state = at('verified')
    state = transitionLifecycle(state, 'queue_audit')
    state = transitionLifecycle(state, 'start_audit')
    state = transitionLifecycle(state, 'complete_audit')

    expect(state.audit).toBe('audit_ready')
    expect(() => assertAuditReleased(state)).not.toThrow()
  })

  it('represents retryable failures without corrupting account state', () => {
    let state = at('verified')
    state = transitionLifecycle(state, 'queue_audit')
    state = transitionLifecycle(state, 'start_audit')
    state = transitionLifecycle(state, 'fail_audit_retryable')

    expect(state).toMatchObject({
      account: 'verified',
      audit: 'audit_failed_retryable',
    })

    state = transitionLifecycle(state, 'retry_audit')
    expect(state.audit).toBe('audit_queued')
  })

  it('does not release pending or incomplete audits', () => {
    expect(() => assertAuditReleased(at('account_pending_verification', 'audit_ready')))
      .toThrow('LIFECYCLE_ACCOUNT_NOT_VERIFIED')
    expect(() => assertAuditReleased(at('verified', 'audit_running')))
      .toThrow('AUDIT_NOT_RELEASED')
  })

  it('protects audit resources with an explicit tenant ownership check', () => {
    expect(() => assertAuditOwnership('tenant-a', 'tenant-a')).not.toThrow()
    expect(() => assertAuditOwnership('tenant-a', 'tenant-b')).toThrow('TENANT_ACCESS_DENIED')
    expect(() => assertAuditOwnership('', 'tenant-a')).toThrow('TENANT_ACCESS_DENIED')
  })

  it('allows only verified accounts to start an audit workflow', () => {
    expect(() => assertAccountCanStartAudit(at('verified'))).not.toThrow()
    expect(() => assertAccountCanStartAudit(at('account_pending_verification'))).toThrow('LIFECYCLE_ACCOUNT_NOT_VERIFIED')
  })

  it('does not permit an invalid audit transition', () => {
    expect(() => transitionLifecycle(at('verified'), 'start_audit'))
      .toThrow('LIFECYCLE_INVALID_TRANSITION')
  })
})
