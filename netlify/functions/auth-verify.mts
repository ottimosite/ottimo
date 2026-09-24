import { authCookieHeader } from '../../src/services/supabase-auth'
import { verifyEmailToken } from '../../src/services/supabase-email-auth'

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
