import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from './auth-verify'
import { completeVerifiedLifecycle } from '../../src/services/verification-lifecycle'

vi.mock('../../src/services/verification-lifecycle', () => ({
  completeVerifiedLifecycle: vi.fn().mockResolvedValue({ userId: 'user-1', tenantId: 'workspace-1' }),
}))

function token(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return header + '.' + body + '.signature'
}

describe('auth-verify function', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('rejects unsupported methods and missing configuration', async () => {
    expect((await handler(new Request('https://ottimo.test', { method: 'POST' }))).status).toBe(405)

    vi.stubEnv('SUPABASE_URL', '')
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', '')
    vi.stubEnv('SUPABASE_SECRET_KEY', '')
    expect((await handler(new Request('https://ottimo.test/auth-verify?token_hash=x&type=email'))).status).toBe(503)
  })

  it('exchanges a verified provider token and establishes an HttpOnly session cookie', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'public-key')
    vi.stubEnv('SUPABASE_SECRET_KEY', 'secret-key')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        access_token: token({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) + 3600 }),
        expires_in: 3600,
        user: { id: 'user-1', email_confirmed_at: '2026-09-24T22:00:00Z' },
      }), { status: 200 }),
    )

    const response = await handler(new Request('https://ottimo.test/auth-verify?token_hash=secret-hash&type=email'))

    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('/app')
    expect(response.headers.get('set-cookie')).toContain('ottimo_auth=')
    expect(response.headers.get('set-cookie')).toContain('HttpOnly')
    expect(response.headers.get('set-cookie')).toContain('Secure')
    expect(response.headers.get('set-cookie')).not.toContain('secret-hash')
    expect(completeVerifiedLifecycle).toHaveBeenCalledWith(
      'user-1',
      expect.anything(),
      expect.anything(),
    )
  })

  it('rejects invalid or replayed verification without establishing a session', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'public-key')
    vi.stubEnv('SUPABASE_SECRET_KEY', 'secret-key')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('invalid', { status: 400 }))

    const response = await handler(new Request('https://ottimo.test/auth-verify?token_hash=secret-hash&type=email'))

    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('/auth/error?code=invalid-or-expired')
    expect(response.headers.get('set-cookie')).toBeNull()
  })
})
