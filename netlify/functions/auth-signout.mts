import { clearAuthCookie, revokeSupabaseSession } from '../../src/services/supabase-auth'

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
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed.' })

  const supabaseUrl = process.env.SUPABASE_URL
  const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabasePublishableKey) {
    return json(503, { error: 'Authentication is not configured.' }, { 'set-cookie': clearAuthCookie() })
  }

  let providerRevoked = true
  try {
    await revokeSupabaseSession(
      { url: supabaseUrl, publishableKey: supabasePublishableKey },
      request,
    )
  } catch {
    providerRevoked = false
  }

  return json(
    providerRevoked ? 200 : 502,
    {
      authenticated: false,
      providerRevoked,
    },
    { 'set-cookie': clearAuthCookie() },
  )
}
