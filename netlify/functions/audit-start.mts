import { createNetlifyStorageAdapter } from '../../src/services/netlify-storage'
import { SupabaseRequestAuthenticator } from '../../src/services/supabase-auth'
import { SupabaseWorkspaceRepository } from '../../src/services/supabase-tenant-repository'
import { queueAuditJob, normaliseAuditCategories, createAuditRepository } from '../../src/services/audit-jobs'
import { transitionLifecycle } from '../../src/services/account-lifecycle'

const json = (status: number, body: unknown, headers: Record<string, string> = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
})

export default async (request: Request) => {
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed.' })

  const supabaseUrl = process.env.SUPABASE_URL
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY
  const secretKey = process.env.SUPABASE_SECRET_KEY
  const workerSecret = process.env.OTTIMO_AUDIT_WORKER_SECRET
  if (!supabaseUrl || !publishableKey || !secretKey || !workerSecret) {
    return json(503, { error: { code: 'AUDIT_SERVICE_NOT_CONFIGURED', message: 'Audit service is not configured.' } })
  }

  try {
    const input = await request.json() as { websiteId?: string; categories?: unknown }
    if (typeof input.websiteId !== 'string' || !input.websiteId.trim()) {
      return json(400, { error: { code: 'INVALID_WEBSITE', message: 'A websiteId is required.' } })
    }

    const workspaceRepository = new SupabaseWorkspaceRepository({ url: supabaseUrl, secretKey })
    const authenticator = new SupabaseRequestAuthenticator(
      { url: supabaseUrl, publishableKey },
      userId => workspaceRepository.resolveTenant(userId),
    )
    const session = await authenticator.verify(request)
    if (!session) return json(401, { error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication is required.' } })
    const website = await workspaceRepository.findWebsite(session.tenantId, input.websiteId)
    if (!website) return json(404, { error: { code: 'WEBSITE_NOT_FOUND', message: 'The requested website is not available.' } })

    const repository = createAuditRepository(createNetlifyStorageAdapter())
    const { job } = await queueAuditJob(repository, session, website.id, normaliseAuditCategories(input.categories))

    const origin = process.env.URL ?? new URL(request.url).origin
    const invocation = await fetch(origin.replace(/\/+$/, '') + '/.netlify/functions/audit-site-background', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-ottimo-worker-secret': workerSecret,
      },
      body: JSON.stringify({
        jobId: job.id,
        userId: session.userId,
        tenantId: session.tenantId,
        websiteId: website.id,
        categories: normaliseAuditCategories(input.categories),
      }),
    })

    if (!invocation.ok) {
      const failedAt = new Date().toISOString()
      const failed = { ...job, state: 'audit_failed_retryable' as const, updatedAt: failedAt, error: { code: 'AUDIT_WORKER_UNAVAILABLE', message: 'The audit worker could not be started.', retryable: true } }
      await repository.saveAuditJob(session, failed)
      const lifecycle = await repository.getLifecycle(session)
      if (lifecycle?.audit === 'audit_queued') {
        await repository.saveLifecycle(session, transitionLifecycle(lifecycle, 'fail_audit_retryable', failedAt))
      }
      return json(503, { error: { code: 'AUDIT_WORKER_UNAVAILABLE', message: 'The audit worker could not be started.' } })
    }

    return json(202, {
      jobId: job.id,
      state: 'audit_queued',
      websiteId: website.id,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The audit could not be queued.'
    const status = message === 'AUTHENTICATION_REQUIRED' ? 401
      : message.startsWith('LIFECYCLE_') ? 409
      : 500
    return json(status, { error: { code: message, message: 'The audit could not be queued.' } })
  }
}
