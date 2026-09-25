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
    const workspaceRepository = new SupabaseWorkspaceRepository({ url: supabaseUrl, secretKey })
    const authenticator = new SupabaseRequestAuthenticator(
      { url: supabaseUrl, publishableKey },
      userId => workspaceRepository.resolveTenant(userId),
    )
    const session = await authenticator.verify(request)
    if (!session) return json(401, { error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication is required.' } })

    const repository = new TenantRepository(createNetlifyStorageAdapter())
    const [audits, websites] = await Promise.all([
      repository.listAudits(session),
      repository.listWebsites(session),
    ])
    return json(200, { audits, websites })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The audits could not be retrieved.'
    const status = message === 'AUDIT_NOT_RELEASED' ? 409 : 500
    return json(status, { error: { code: message, message: 'The audits could not be retrieved.' } })
  }
}
