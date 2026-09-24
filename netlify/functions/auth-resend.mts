import { clientIp, requestEmailVerification } from '../../src/services/supabase-email-auth'

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
    return json(503, { error: 'Authentication is not configured.' })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json(400, { error: 'Invalid request.' })
  }

  const email = typeof body === 'object' && body !== null && 'email' in body
    ? (body as { email?: unknown }).email
    : undefined

  try {
    const result = await requestEmailVerification(
      { url: supabaseUrl, publishableKey: supabasePublishableKey },
      typeof email === 'string' ? email : '',
      undefined,
      clientIp(request),
    )

    if (result.providerStatus === 429) {
      return json(429, { error: 'Too many requests. Please try again later.' })
    }
    if (result.providerStatus >= 500) {
      return json(503, { error: 'Authentication provider is temporarily unavailable.' })
    }

    return json(202, { accepted: true })
  } catch {
    return json(400, { error: 'Invalid email address.' })
  }
}
