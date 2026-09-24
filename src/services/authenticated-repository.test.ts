import { describe, expect, it } from 'vitest'
import { AuthenticatedTenantRepository } from './authenticated-repository'
import { initialLifecycle, transitionLifecycle } from './account-lifecycle'
import type { AuthenticatedSession, SessionVerifier } from './auth'
import { STORAGE_SCHEMA_VERSION, tenantKey, type ServerStorageAdapter } from './persistence'

const session: AuthenticatedSession = {
  sessionId: 'session-1',
  userId: 'user-1',
  tenantId: 'tenant-1',
  expiresAt: '2099-01-01T00:00:00Z',
}

function adapter(): ServerStorageAdapter & { values: Map<string, unknown> } {
  const values = new Map<string, unknown>()
  return {
    values,
    async read<T>(key: string) {
      return values.get(key) as { schemaVersion: 1; tenantId: string; updatedAt: string; data: T } | undefined
    },
    async write<T>(key: string, value: { schemaVersion: 1; tenantId: string; updatedAt: string; data: T }) {
      values.set(key, value)
    },
  }
}

const verifier: SessionVerifier = {
  async verify() { return session },
}

function readyLifecycle() {
  let state = initialLifecycle('2026-09-24T00:00:00.000Z')
  state = transitionLifecycle(state, 'start_onboarding')
  state = transitionLifecycle(state, 'request_verification')
  state = transitionLifecycle(state, 'complete_verification')
  state = transitionLifecycle(state, 'queue_audit')
  state = transitionLifecycle(state, 'start_audit')
  return transitionLifecycle(state, 'complete_audit')
}

describe('authenticated persistence boundary', () => {
  it('uses the verified tenant rather than client-supplied identity', async () => {
    const storage = adapter()
    storage.values.set(tenantKey(session, 'lifecycle'), {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      tenantId: session.tenantId,
      updatedAt: new Date().toISOString(),
      data: readyLifecycle(),
    })
    const repository = new AuthenticatedTenantRepository(verifier, storage)
    await repository.saveAudit(new Request('https://ottimo.test'), {
      id: 'audit-1', websiteId: 'site-1', url: 'https://example.com', createdAt: '2026-09-20T00:00:00Z',
      durationMs: 100, scores: [], issues: [], actions: [],
    })
    await expect(repository.listAudits(new Request('https://ottimo.test'))).resolves.toHaveLength(1)
  })

  it('rejects audit reads for a verified but unreleased audit', async () => {
    const storage = adapter()
    let lifecycle = readyLifecycle()
    lifecycle = transitionLifecycle(lifecycle, 'queue_audit')
    storage.values.set(tenantKey(session, 'lifecycle'), {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      tenantId: session.tenantId,
      updatedAt: new Date().toISOString(),
      data: lifecycle,
    })
    const repository = new AuthenticatedTenantRepository(verifier, storage)
    await expect(repository.listAudits(new Request('https://ottimo.test'))).rejects.toThrow('AUDIT_NOT_RELEASED')
  })

  it('rejects requests without a valid session', async () => {
    const rejectedVerifier: SessionVerifier = { async verify() { return undefined } }
    const repository = new AuthenticatedTenantRepository(rejectedVerifier, adapter())
    await expect(repository.listAudits(new Request('https://ottimo.test'))).rejects.toThrow('AUTHENTICATION_REQUIRED')
  })
})
