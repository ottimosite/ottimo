import { describe, expect, it } from 'vitest'
import { assertSessionTenant, requireSession, type AuthenticatedSession } from './auth'

const session: AuthenticatedSession = {
  sessionId: 'session-1',
  userId: 'user-1',
  tenantId: 'tenant-1',
  expiresAt: '2099-01-01T00:00:00Z',
}

describe('server-side authentication boundary', () => {
  it('requires a live authenticated session', () => {
    expect(requireSession(session)).toEqual(session)
    expect(() => requireSession(undefined)).toThrow('AUTHENTICATION_REQUIRED')
    expect(() => requireSession({ ...session, expiresAt: '2020-01-01T00:00:00Z' })).toThrow('AUTHENTICATION_REQUIRED')
  })

  it('rejects cross-tenant access', () => {
    expect(() => assertSessionTenant(session, 'tenant-1')).not.toThrow()
    expect(() => assertSessionTenant(session, 'tenant-2')).toThrow('TENANT_ACCESS_DENIED')
  })
})
