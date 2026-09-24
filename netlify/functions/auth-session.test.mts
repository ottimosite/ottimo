import { describe, expect, it, vi, afterEach } from 'vitest'
import handler from '../../netlify/functions/auth-session'

describe('auth-session function', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('rejects unsupported methods', async () => {
    const response = await handler(new Request('https://ottimo.test', { method: 'POST' }))
    expect(response.status).toBe(405)
  })

  it('fails closed when Supabase configuration is missing', async () => {
    const previous = {
      url: process.env.SUPABASE_URL,
      publishable: process.env.SUPABASE_PUBLISHABLE_KEY,
      secret: process.env.SUPABASE_SECRET_KEY,
    }
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_PUBLISHABLE_KEY
    delete process.env.SUPABASE_SECRET_KEY

    try {
      const response = await handler(new Request('https://ottimo.test'))
      expect(response.status).toBe(503)
    } finally {
      if (previous.url) vi.stubEnv('SUPABASE_URL', previous.url
      if (previous.publishable) vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', previous.publishable
      if (previous.secret) vi.stubEnv('SUPABASE_SECRET_KEY', previous.secret
    }
  })

  it('denies requests without a valid Supabase session', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'public-key')
    vi.stubEnv('SUPABASE_SECRET_KEY', 'service-role-key')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('unauthorized', { status: 401 }))

    const response = await handler(new Request('https://ottimo.test', {
      headers: { cookie: 'ottimo_auth=invalid-token' },
    }))

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ authenticated: false })
    expect(fetchMock).toHaveBeenCalled()
  })
})
