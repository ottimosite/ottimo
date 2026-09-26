import { describe, expect, it } from 'vitest'
import { initialLifecycle, transitionLifecycle } from './account-lifecycle'
import { queueAuditJob, normaliseAuditCategories, auditJobError } from './audit-jobs'
import type { ServerStorageAdapter } from './persistence'
import { TenantRepository, tenantKey, STORAGE_SCHEMA_VERSION } from './persistence'

function adapter(): ServerStorageAdapter & { values: Map<string, unknown> } {
  const values = new Map<string, unknown>()
  return {
    values,
    async read<T>(key: string) { return values.get(key) as { schemaVersion: 1; tenantId: string; updatedAt: string; data: T } | undefined },
    async write<T>(key: string, value: { schemaVersion: 1; tenantId: string; updatedAt: string; data: T }) { values.set(key, value) },
  }
}

describe('audit jobs', () => {
  it('queues an audit only for a verified account', async () => {
    const storage = adapter()
    const repository = new TenantRepository(storage)
    let lifecycle = initialLifecycle('2026-09-25T20:00:00Z')
    lifecycle = transitionLifecycle(lifecycle, 'start_onboarding')
    lifecycle = transitionLifecycle(lifecycle, 'request_verification')
    lifecycle = transitionLifecycle(lifecycle, 'complete_verification')
    await repository.saveLifecycle({ userId: 'user-1', tenantId: 'tenant-1' }, lifecycle)

    const result = await queueAuditJob(repository, { userId: 'user-1', tenantId: 'tenant-1' }, 'site-1', ['seo'], '2026-09-25T20:01:00Z')
    expect(result.lifecycle.audit).toBe('audit_queued')
    expect(result.job.state).toBe('audit_queued')
    expect(result.job.websiteId).toBe('site-1')
    expect(storage.values.has(tenantKey({ userId: 'user-1', tenantId: 'tenant-1' }, 'audit-jobs', result.job.id))).toBe(true)
  })

  it('normalises invalid or empty category selections to the supported audit set', () => {
    expect(normaliseAuditCategories([])).toEqual(['performance', 'accessibility', 'seo', 'technical'])
    expect(normaliseAuditCategories(['seo', 'unknown'])).toEqual(['seo'])
    expect(normaliseAuditCategories('seo')).toEqual(['performance', 'accessibility', 'seo', 'technical'])
  })

  it('records retryable execution failures without exposing secrets', () => {
    expect(auditJobError(new Error('crawl failed'), '2026-09-25T20:02:00Z')).toEqual({
      state: 'audit_failed_retryable',
      updatedAt: '2026-09-25T20:02:00Z',
      error: { code: 'AUDIT_EXECUTION_FAILED', message: 'crawl failed', retryable: true },
    })
  })
})
