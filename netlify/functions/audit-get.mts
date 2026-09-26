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
    const auditId = new URL(request.url).searchParams.get('id') ?? ''
    if (!auditId) return json(400, { error: { code: 'INVALID_AUDIT', message: 'An audit id is required.' } })
    const workspaceRepository = new SupabaseWorkspaceRepository({ url: supabaseUrl, secretKey })
    const authenticator = new SupabaseRequestAuthenticator(
      { url: supabaseUrl, publishableKey },
      userId => workspaceRepository.resolveTenant(userId),
    )
    const session = await authenticator.verify(request)
    if (!session) return json(401, { error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication is required.' } })

    const audit = await new TenantRepository(createNetlifyStorageAdapter()).getAudit(session, auditId)
    if (!audit) return json(404, { error: { code: 'AUDIT_NOT_FOUND', message: 'The audit was not found.' } })
    return json(200, audit)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The audit could not be retrieved.'
    const status = message === 'AUDIT_NOT_RELEASED' ? 409 : 500
    return json(status, { error: { code: message, message: 'The audit could not be retrieved.' } })
  }
}
