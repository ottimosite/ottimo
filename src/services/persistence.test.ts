import { describe, expect, it, vi } from 'vitest'
import { STORAGE_SCHEMA_VERSION, TenantRepository, migrateEnvelope, tenantKey, type ServerStorageAdapter } from './persistence'

const principal = { userId: 'user-1', tenantId: 'tenant-1' }

function adapter(): ServerStorageAdapter & { values: Map<string, unknown> } {
  const values = new Map<string, unknown>()
  return {
    values,
    async read<T>(key: string) { return values.get(key) as { schemaVersion: 1; tenantId: string; updatedAt: string; data: T } | undefined },
    async write<T>(key: string, value: { schemaVersion: 1; tenantId: string; updatedAt: string; data: T }) { values.set(key, value) },
  }
}

describe('tenant-safe persistence boundary', () => {
  it('namespaces every resource by tenant', () => {
    expect(tenantKey(principal, 'audits')).toBe('tenant/tenant-1/audits')
    expect(tenantKey({ ...principal, tenantId: 'tenant-2' }, 'audits')).not.toBe(tenantKey(principal, 'audits'))
  })

  it('requires an authenticated tenant before reading or writing', async () => {
    const repository = new TenantRepository(adapter())
    await expect(repository.listAudits({ userId: '', tenantId: '' })).rejects.toThrow('AUTHENTICATION_REQUIRED')
  })

  it('never returns another tenant envelope', async () => {
    const storage = adapter()
    storage.values.set(tenantKey(principal, 'websites'), {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      tenantId: 'tenant-2',
      updatedAt: new Date().toISOString(),
      data: [{ id: 'other', name: 'Other', url: 'https://other.test', createdAt: '2026-09-20T00:00:00Z' }],
    })
    await expect(new TenantRepository(storage).listWebsites(principal)).resolves.toEqual([])
  })

  it('migrates supported envelopes deterministically and rejects future schemas', () => {
    const migrated = migrateEnvelope({ schemaVersion: 0, tenantId: 'tenant-1', updatedAt: '2026-09-20T00:00:00Z', data: ['audit'] })
    expect(migrated.schemaVersion).toBe(STORAGE_SCHEMA_VERSION)
    expect(() => migrateEnvelope({ schemaVersion: STORAGE_SCHEMA_VERSION + 1, tenantId: 'tenant-1', updatedAt: '2026-09-20T00:00:00Z', data: [] })).toThrow('UNSUPPORTED_STORAGE_SCHEMA')
  })

  it('preserves audit data through repository writes', async () => {
    const storage = adapter()
    const repository = new TenantRepository(storage)
    await repository.saveAudit(principal, {
      id: 'audit-1', websiteId: 'site-1', url: 'https://example.com', createdAt: '2026-09-20T00:00:00Z',
      durationMs: 100, scores: [], issues: [], actions: [],
    })
    const audits = await repository.listAudits(principal)
    expect(audits[0].id).toBe('audit-1')
    expect(audits[0].websiteId).toBe('site-1')
  })
})
