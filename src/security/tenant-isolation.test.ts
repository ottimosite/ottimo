import { describe, expect, it } from 'vitest'
import { AuthenticatedTenantRepository } from '../services/authenticated-repository'
import type { AuthenticatedSession, SessionVerifier } from '../services/auth'
import { TenantRepository, STORAGE_SCHEMA_VERSION, tenantKey, type ServerStorageAdapter } from '../services/persistence'

const tenantA: AuthenticatedSession = {
  sessionId: 'session-a',
  userId: 'user-a',
  tenantId: 'tenant-a',
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

describe('production security regression boundary', () => {
  it('denies unauthenticated protected-resource access', async () => {
    const verifier: SessionVerifier = { async verify() { return undefined } }
    const repository = new AuthenticatedTenantRepository(verifier, adapter())

    await expect(repository.listWebsites(new Request('https://ottimo.test/app/websites')))
      .rejects.toThrow('AUTHENTICATION_REQUIRED')
  })

  it('keeps tenant resource reads isolated even when another tenant id is known', async () => {
    const storage = adapter()
    const repository = new TenantRepository(storage)

    await repository.saveWebsite(tenantA, {
      id: 'site-a', name: 'Tenant A', url: 'https://a.test', createdAt: '2026-09-20T00:00:00Z',
    })
    storage.values.set(tenantKey({ userId: 'user-b', tenantId: 'tenant-b' }, 'websites'), {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      tenantId: 'tenant-b',
      updatedAt: new Date().toISOString(),
      data: [{ id: 'site-b', name: 'Tenant B', url: 'https://b.test', createdAt: '2026-09-20T00:00:00Z' }],
    })

    await expect(repository.listWebsites(tenantA)).resolves.toEqual([
      expect.objectContaining({ id: 'site-a' }),
    ])
    await expect(repository.listAuditsForWebsite(tenantA, 'site-b')).resolves.toEqual([])
  })

  it('requires an owned website before an audit can be persisted', async () => {
    const repository = new TenantRepository(adapter())

    await expect(repository.saveAudit(tenantA, {
      id: 'audit-b', websiteId: 'site-b', url: 'https://b.test', createdAt: '2026-09-20T00:00:00Z',
      durationMs: 100, scores: [], issues: [], actions: [],
    })).rejects.toThrow('WEBSITE_ACCESS_DENIED')
  })
})
