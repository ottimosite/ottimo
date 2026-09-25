import { describe, expect, it, vi } from 'vitest'
import { STORAGE_SCHEMA_VERSION, TenantRepository, migrateEnvelope, tenantKey, type ServerStorageAdapter } from './persistence'
import { initialLifecycle, transitionLifecycle } from './account-lifecycle'

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

  it('persists audit jobs under the authenticated tenant', async () => {
    const repository = new TenantRepository(adapter())
    const job = {
      id: 'job-1',
      websiteId: 'site-1',
      state: 'audit_queued' as const,
      createdAt: '2026-09-25T20:00:00Z',
      updatedAt: '2026-09-25T20:00:00Z',
    }
    await repository.saveAuditJob(principal, job)
    await expect(repository.getAuditJob(principal, 'job-1')).resolves.toEqual(job)
    await expect(repository.getAuditJob({ ...principal, tenantId: 'tenant-2' }, 'job-1')).resolves.toBeUndefined()
  })

  it('blocks audit release until the persisted lifecycle reaches ready', async () => {
    const storage = adapter()
    const repository = new TenantRepository(storage)
    let lifecycle = initialLifecycle()
    lifecycle = transitionLifecycle(lifecycle, 'start_onboarding')
    lifecycle = transitionLifecycle(lifecycle, 'request_verification')
    lifecycle = transitionLifecycle(lifecycle, 'complete_verification')
    await repository.saveLifecycle(principal, lifecycle)
    await repository.saveWebsite(principal, {
      id: 'site-1', name: 'Example', url: 'https://example.com', createdAt: '2026-09-20T00:00:00Z',
    })
    await repository.saveAudit(principal, {
      id: 'audit-1', websiteId: 'site-1', url: 'https://example.com', createdAt: '2026-09-20T00:00:00Z',
      durationMs: 100, scores: [], issues: [], actions: [],
    })
    await expect(repository.listAudits(principal)).rejects.toThrow('AUDIT_NOT_RELEASED')
    lifecycle = transitionLifecycle(lifecycle, 'queue_audit')
    lifecycle = transitionLifecycle(lifecycle, 'start_audit')
    lifecycle = transitionLifecycle(lifecycle, 'complete_audit')
    await repository.saveLifecycle(principal, lifecycle)
    const audits = await repository.listAudits(principal)
    expect(audits[0].id).toBe('audit-1')
    expect(audits[0].websiteId).toBe('site-1')
  })

  it('rejects audits linked to a website outside the authenticated tenant', async () => {
    const storage = adapter()
    const repository = new TenantRepository(storage)
    await repository.saveWebsite({ userId: 'user-1', tenantId: 'tenant-1' }, {
      id: 'site-1', name: 'Tenant 1', url: 'https://tenant1.test', createdAt: '2026-09-20T00:00:00Z',
    })
    await repository.saveWebsite({ userId: 'user-2', tenantId: 'tenant-2' }, {
      id: 'site-2', name: 'Tenant 2', url: 'https://tenant2.test', createdAt: '2026-09-20T00:00:00Z',
    })

    await expect(repository.saveAudit({ userId: 'user-1', tenantId: 'tenant-1' }, {
      id: 'cross-tenant-audit', websiteId: 'site-2', url: 'https://tenant2.test', createdAt: '2026-09-20T00:00:00Z',
      durationMs: 100, scores: [], issues: [], actions: [],
    })).rejects.toThrow('WEBSITE_ACCESS_DENIED')

    await expect(repository.listAuditsForWebsite({ userId: 'user-1', tenantId: 'tenant-1' }, 'site-2')).resolves.toEqual([])
  })

  it('denies pending accounts even when released audit data exists', async () => {
    const storage = adapter()
    const repository = new TenantRepository(storage)
    let lifecycle = initialLifecycle()
    lifecycle = transitionLifecycle(lifecycle, 'start_onboarding')
    lifecycle = transitionLifecycle(lifecycle, 'request_verification')
    await repository.saveLifecycle(principal, lifecycle)
    expect(await repository.getLifecycle(principal)).toMatchObject({ account: 'account_pending_verification' })
    await expect(repository.listAudits(principal)).rejects.toThrow('LIFECYCLE_ACCOUNT_NOT_VERIFIED')
  })
})
