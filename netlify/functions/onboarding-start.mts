import { clientIp, startOnboarding } from '../../src/services/supabase-onboarding'
import { createNetlifyStorageAdapter } from '../../src/services/netlify-storage'

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })

export default async (request: Request) => {
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed.' })

  const supabaseUrl = process.env.SUPABASE_URL
  const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY
  if (!supabaseUrl || !supabasePublishableKey || !supabaseSecretKey) {
    return json(503, { error: 'Onboarding is not configured.' })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json(400, { error: 'Invalid request.' })
  }

  const input = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {}
  const email = typeof input.email === 'string' ? input.email : ''
  const websiteUrl = typeof input.websiteUrl === 'string' ? input.websiteUrl : ''
  const websiteName = typeof input.websiteName === 'string' ? input.websiteName : undefined

  try {
    await startOnboarding(
      { url: supabaseUrl, publishableKey: supabasePublishableKey, secretKey: supabaseSecretKey },
      { email, websiteUrl, websiteName, rateLimitKey: clientIp(request) },
      createNetlifyStorageAdapter(),
    )
    return json(202, {
      accepted: true,
      message: 'If the address can receive Ottimo email, a verification message is on its way.',
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'ONBOARDING_RATE_LIMITED') {
      return json(429, { error: 'Too many requests. Please try again later.' })
    }
    if (error instanceof Error && error.message === 'ONBOARDING_PROVIDER_UNAVAILABLE') {
      return json(503, { error: 'Authentication provider is temporarily unavailable.' })
    }
    if (error instanceof Error && error.message === 'ONBOARDING_EMAIL_INVALID') {
      return json(400, { error: 'Enter a valid email address.' })
    }
    if (error instanceof Error && error.message === 'ONBOARDING_WEBSITE_INVALID') {
      return json(400, { error: 'Enter a valid public website address.' })
    }
    return json(503, { error: 'We could not start onboarding. Please try again.' })
  }
}
