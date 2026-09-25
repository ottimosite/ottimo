import { createNetlifyStorageAdapter } from '../../src/services/netlify-storage'
import { SupabaseRequestAuthenticator } from '../../src/services/supabase-auth'
import { SupabaseWorkspaceRepository } from '../../src/services/supabase-tenant-repository'
import { TenantRepository } from '../../src/services/persistence'

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
})

export default async (request: Request) => {
  if (request.method !== 'GET') return json(405, { error: 'Method not allowed.' })
  const supabaseUrl = process.env.SUPABASE_URL
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!supabaseUrl || !publishableKey || !secretKey) return json(503, { error: 'Authentication is not configured.' })

  try {
    const jobId = new URL(request.url).searchParams.get('jobId') ?? ''
    if (!jobId) return json(400, { error: { code: 'INVALID_JOB', message: 'A jobId is required.' } })
    const workspaceRepository = new SupabaseWorkspaceRepository({ url: supabaseUrl, secretKey })
    const authenticator = new SupabaseRequestAuthenticator(
      { url: supabaseUrl, publishableKey },
      userId => workspaceRepository.resolveTenant(userId),
    )
    const session = await authenticator.verify(request)
    if (!session) return json(401, { error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication is required.' } })

    const job = await new TenantRepository(createNetlifyStorageAdapter()).getAuditJob(session, jobId)
    if (!job) return json(404, { error: { code: 'AUDIT_JOB_NOT_FOUND', message: 'The audit job was not found.' } })
    return json(200, job)
  } catch {
    return json(500, { error: { code: 'AUDIT_STATUS_FAILED', message: 'The audit status could not be retrieved.' } })
  }
}
