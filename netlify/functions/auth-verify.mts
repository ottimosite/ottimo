import { authCookieHeader } from '../../src/services/supabase-auth'
import { verifyEmailToken } from '../../src/services/supabase-email-auth'
import { SupabaseWorkspaceRepository } from '../../src/services/supabase-tenant-repository'
import { createNetlifyStorageAdapter } from '../../src/services/netlify-storage'
import { completeVerifiedLifecycle } from '../../src/services/verification-lifecycle'

const errorRedirect = '/auth/error?code=invalid-or-expired'
const successRedirect = '/app'

export default async (request: Request) => {
  if (request.method !== 'GET') return new Response('Method not allowed.', { status: 405 })

  const supabaseUrl = process.env.SUPABASE_URL
  const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY
  if (!supabaseUrl || !supabasePublishableKey) {
    return new Response('Authentication is not configured.', { status: 503 })
  }

  const url = new URL(request.url)
  const tokenHash = url.searchParams.get('token_hash') ?? ''
  const type = url.searchParams.get('type') ?? ''

  try {
    const session = await verifyEmailToken(
      { url: supabaseUrl, publishableKey: supabasePublishableKey },
      tokenHash,
      type,
    )

    const workspaceRepository = new SupabaseWorkspaceRepository({
      url: supabaseUrl,
      secretKey: process.env.SUPABASE_SECRET_KEY ?? '',
    })
    if (!process.env.SUPABASE_SECRET_KEY) throw new Error('AUTHENTICATION_NOT_CONFIGURED')

    await completeVerifiedLifecycle(
      session.userId,
      workspaceRepository,
      createNetlifyStorageAdapter(),
    )

    return new Response(null, {
      status: 303,
      headers: {
        location: successRedirect,
        'cache-control': 'no-store',
        'set-cookie': authCookieHeader(session.accessToken, session.expiresIn),
      },
    })
  } catch {
    return new Response(null, {
      status: 303,
      headers: {
        location: errorRedirect,
        'cache-control': 'no-store',
      },
    })
  }
}
