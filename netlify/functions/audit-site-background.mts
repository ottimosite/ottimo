import { runSiteAudit } from '../../src/services/site-audit-runner'
import { toResult } from '../../src/services/server-audit'
import { createNetlifyStorageAdapter } from '../../src/services/netlify-storage'
import { SupabaseWorkspaceRepository } from '../../src/services/supabase-tenant-repository'
import { TenantRepository, type AuditJob } from '../../src/services/persistence'
import { transitionLifecycle } from '../../src/services/account-lifecycle'
import { auditCategories, auditJobError } from '../../src/services/audit-jobs'
import type { AuditCategory } from '../../src/audit-engine'

const sameSecret = (provided: string | null, expected: string): boolean => {
  if (!provided || provided.length !== expected.length) return false
  let difference = 0
  for (let index = 0; index < expected.length; index += 1) {
    difference |= provided.charCodeAt(index) ^ expected.charCodeAt(index)
  }
  return difference === 0
}

export default async (request: Request) => {
  if (request.method !== 'POST') return new Response('Method not allowed.', { status: 405 })

  const workerSecret = process.env.OTTIMO_AUDIT_WORKER_SECRET
  if (!workerSecret || !sameSecret(request.headers.get('x-ottimo-worker-secret'), workerSecret)) {
    return new Response('Not found.', { status: 404 })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!supabaseUrl || !secretKey) return new Response('Audit worker is not configured.', { status: 503 })

  let input: {
    jobId?: string
    userId?: string
    tenantId?: string
    websiteId?: string
    categories?: AuditCategory[]
  }
  try {
    input = await request.json() as typeof input
  } catch {
    return new Response('Invalid worker payload.', { status: 400 })
  }

  if (!input.jobId || !input.userId || !input.tenantId || !input.websiteId) {
    return new Response('Invalid worker payload.', { status: 400 })
  }

  const principal = { userId: input.userId, tenantId: input.tenantId }
  const repository = new TenantRepository(createNetlifyStorageAdapter())
  const job = await repository.getAuditJob(principal, input.jobId)
  if (!job || job.websiteId !== input.websiteId) return new Response('Not found.', { status: 404 })
  if (job.state === 'audit_ready') return new Response(null, { status: 202 })

  const workspaceRepository = new SupabaseWorkspaceRepository({ url: supabaseUrl, secretKey })
  const website = await workspaceRepository.findWebsite(input.tenantId, input.websiteId)
  if (!website) {
    const failed = { ...job, ...auditJobError(new Error('WEBSITE_NOT_FOUND')) }
    await repository.saveAuditJob(principal, failed)
    return new Response(null, { status: 202 })
  }

  try {
    let lifecycle = await repository.getLifecycle(principal)
    if (!lifecycle) throw new Error('LIFECYCLE_NOT_INITIALIZED')

    if (lifecycle.audit === 'audit_ready') {
      await repository.saveAuditJob(principal, { ...job, state: 'audit_ready', updatedAt: new Date().toISOString(), auditId: job.auditId ?? job.id })
      return new Response(null, { status: 202 })
    }

    if (job.state === 'audit_failed_retryable') {
      lifecycle = transitionLifecycle(lifecycle, 'retry_audit')
      await repository.saveLifecycle(principal, lifecycle)
    }

    lifecycle = transitionLifecycle(lifecycle, 'start_audit')
    await repository.saveLifecycle(principal, lifecycle)
    const running: AuditJob = { ...job, state: 'audit_running', updatedAt: lifecycle.updatedAt }
    await repository.saveAuditJob(principal, running)

    const categories = Array.isArray(input.categories) && input.categories.length
      ? input.categories.filter(category => auditCategories.includes(category))
      : auditCategories
    const report = await runSiteAudit(website.url, categories, { maxPages: 10 })
    if (report.run.status !== 'completed') {
      throw new Error(report.error?.message ?? 'The audit engine could not complete the audit.')
    }

    const result = toResult(report)
    await repository.saveAudit(principal, {
      id: job.id,
      websiteId: website.id,
      url: website.url,
      createdAt: job.createdAt,
      ...result,
    })

    const completedLifecycle = transitionLifecycle(lifecycle, 'complete_audit')
    await repository.saveLifecycle(principal, completedLifecycle)
    await repository.saveAuditJob(principal, {
      ...running,
      state: 'audit_ready',
      updatedAt: completedLifecycle.updatedAt,
      auditId: job.id,
      error: undefined,
    })

    return new Response(null, { status: 202 })
  } catch (error) {
    const failedAt = new Date().toISOString()
    const failed = { ...job, ...auditJobError(error, failedAt) }
    await repository.saveAuditJob(principal, failed)

    const lifecycle = await repository.getLifecycle(principal)
    if (lifecycle?.audit === 'audit_running') {
      await repository.saveLifecycle(principal, transitionLifecycle(lifecycle, 'fail_audit_retryable', failedAt))
    }

    throw error
  }
}

export const config = {
  background: true,
}
