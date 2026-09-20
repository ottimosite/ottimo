import { describe, expect, it } from 'vitest'
import { AuthenticatedTenantRepository } from './authenticated-repository'
import type { AuthenticatedSession, SessionVerifier } from './auth'
import type { ServerStorageAdapter } from './persistence'

const session: AuthenticatedSession = {
  sessionId: 'session-1',
  userId: 'user-1',
  tenantId: 'tenant-1',
  expiresAt: '2099-01-01T00:00:00Z',
}

function adapter(): ServerStorageAdapter {
  const values = new Map<string, unknown>()
  return {
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

describe('authenticated persistence boundary', () => {
  it('uses the verified tenant rather than client-supplied identity', async () => {
    const repository = new AuthenticatedTenantRepository(verifier, adapter())
    await repository.saveAudit(new Request('https://ottimo.test'), {
      id: 'audit-1', websiteId: 'site-1', url: 'https://example.com', createdAt: '2026-09-20T00:00:00Z',
      durationMs: 100, scores: [], issues: [], actions: [],
    })
    await expect(repository.listAudits(new Request('https://ottimo.test'))).resolves.toHaveLength(1)
  })

  it('rejects requests without a valid session', async () => {
    const rejectedVerifier: SessionVerifier = { async verify() { return undefined } }
    const repository = new AuthenticatedTenantRepository(rejectedVerifier, adapter())
    await expect(repository.listAudits(new Request('https://ottimo.test'))).rejects.toThrow('AUTHENTICATION_REQUIRED')
  })
})
