import { describe, expect, it, vi, afterEach } from 'vitest'
import handler from '../../netlify/functions/auth-signout'

describe('auth-signout function', () => {
  afterEach(() => vi.restoreAllMocks())

  it('rejects unsupported methods', async () => {
    const response = await handler(new Request('https://ottimo.test'))
    expect(response.status).toBe(405)
  })

  it('clears the authentication cookie and revokes the provider session', async () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_PUBLISHABLE_KEY = 'public-key'
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))

    const response = await handler(new Request('https://ottimo.test', {
      method: 'POST',
      headers: { cookie: 'ottimo_auth=access-token' },
    }))

    expect(response.status).toBe(200)
    expect(response.headers.get('set-cookie')).toContain('ottimo_auth=')
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.supabase.co/auth/v1/logout',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('still clears the local cookie when provider revocation fails', async () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_PUBLISHABLE_KEY = 'public-key'
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('provider unavailable'))

    const response = await handler(new Request('https://ottimo.test', {
      method: 'POST',
      headers: { cookie: 'ottimo_auth=access-token' },
    }))

    expect(response.status).toBe(502)
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0')
  })
})
