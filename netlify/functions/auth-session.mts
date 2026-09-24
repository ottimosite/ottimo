import { SupabaseRequestAuthenticator } from '../../src/services/supabase-auth'
import { SupabaseWorkspaceRepository } from '../../src/services/supabase-tenant-repository'

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers,
    },
  })

export default async (request: Request) => {
  if (request.method !== 'GET') return json(405, { error: 'Method not allowed.' })

  const supabaseUrl = process.env.SUPABASE_URL
  const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !supabasePublishableKey || !supabaseSecretKey) {
    return json(503, { error: 'Authentication is not configured.' })
  }

  const tenantRepository = new SupabaseWorkspaceRepository({
    url: supabaseUrl,
    secretKey: supabaseSecretKey,
  })

  const authenticator = new SupabaseRequestAuthenticator(
    {
      url: supabaseUrl,
      publishableKey: supabasePublishableKey,
    },
    userId => tenantRepository.resolveTenant(userId),
  )

  const session = await authenticator.verify(request)
  if (!session) return json(401, { authenticated: false })

  return json(200, {
    authenticated: true,
    userId: session.userId,
    tenantId: session.tenantId,
    expiresAt: session.expiresAt,
  })
}
