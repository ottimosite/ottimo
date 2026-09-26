import type { AuditCategory } from '../audit-engine'
import { transitionLifecycle, type LifecycleState } from './account-lifecycle'
import type { AuditJob, ServerStorageAdapter, TenantPrincipal } from './persistence'
import { TenantRepository } from './persistence'

export const auditCategories: AuditCategory[] = ['performance', 'accessibility', 'seo', 'technical']

export function normaliseAuditCategories(input: unknown): AuditCategory[] {
  if (!Array.isArray(input)) return auditCategories
  const selected = input.filter((value): value is AuditCategory => typeof value === 'string' && auditCategories.includes(value as AuditCategory))
  return selected.length ? selected : auditCategories
}

export async function queueAuditJob(
  repository: TenantRepository,
  principal: TenantPrincipal,
  websiteId: string,
  categories: AuditCategory[],
  now = new Date().toISOString(),
): Promise<{ job: AuditJob; lifecycle: LifecycleState }> {
  const current = await repository.getLifecycle(principal)
  if (!current) throw new Error('LIFECYCLE_NOT_INITIALIZED')
  const lifecycle = transitionLifecycle(current, 'queue_audit', now)
  const job: AuditJob = {
    id: crypto.randomUUID(),
    websiteId,
    state: 'audit_queued',
    createdAt: now,
    updatedAt: now,
  }
  await repository.saveAuditJob(principal, job)
  await repository.saveLifecycle(principal, lifecycle)
  return { job, lifecycle }
}

export function auditJobError(error: unknown, now = new Date().toISOString()): Pick<AuditJob, 'state' | 'updatedAt' | 'error'> {
  return {
    state: 'audit_failed_retryable',
    updatedAt: now,
    error: {
      code: 'AUDIT_EXECUTION_FAILED',
      message: error instanceof Error ? error.message : 'The audit could not be completed.',
      retryable: true,
    },
  }
}

export function createAuditRepository(adapter: ServerStorageAdapter): TenantRepository {
  return new TenantRepository(adapter)
}
