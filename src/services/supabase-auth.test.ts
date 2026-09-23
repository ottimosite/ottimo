import { describe, expect, it, vi } from 'vitest'
import {
  authCookieHeader,
  clearAuthCookie,
  readAuthCookie,
  SupabaseRequestAuthenticator,
  supabaseAuthCookieName,
} from './supabase-auth'

const futureExpiry = Math.floor(Date.now() / 1000) + 3600

function token(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return header + '.' + body + '.signature'
}

describe('Supabase server authentication boundary', () => {
  it('reads only the HttpOnly session cookie value', () => {
    const request = new Request('https://ottimo.test', {
      headers: { cookie: 'theme=dark; ' + supabaseAuthCookieName + '=abc%20123; other=value' },
    })
    expect(readAuthCookie(request)).toBe('abc 123')
    expect(readAuthCookie(new Request('https://ottimo.test'))).toBeUndefined()
  })

  it('rejects malformed or oversized cookies', () => {
    const malformed = new Request('https://ottimo.test', {
      headers: { cookie: supabaseAuthCookieName + '=%E0%A4%A' },
    })
    expect(readAuthCookie(malformed)).toBeUndefined()

    const oversized = new Request('https://ottimo.test', {
      headers: { cookie: supabaseAuthCookieName + '=' + 'x'.repeat(12_001) },
    })
    expect(readAuthCookie(oversized)).toBeUndefined()
  })

  it('creates strict authentication cookies and a clearing cookie', () => {
    expect(authCookieHeader('token', 3600)).toBe(
      supabaseAuthCookieName + '=token; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600',
    )
    expect(clearAuthCookie()).toContain('Max-Age=0')
  })

  it('resolves tenant ownership on the server after validating the Supabase user', async () => {
    const accessToken = token({ sub: 'user-1', session_id: 'session-1', exp: futureExpiry })
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'user-1', email_confirmed_at: '2026-09-23T19:00:00Z' }), { status: 200 }),
    )

    const authenticator = new SupabaseRequestAuthenticator(
      { url: 'https://example.supabase.co/', publishableKey: 'public-key' },
      async userId => userId === 'user-1' ? 'tenant-1' : undefined,
    )

    const result = await authenticator.verify(new Request('https://ottimo.test', {
      headers: { cookie: supabaseAuthCookieName + '=' + accessToken },
    }))

    expect(result).toEqual({
      sessionId: 'session-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      expiresAt: new Date(futureExpiry * 1000).toISOString(),
    })
    expect(fetchMock).toHaveBeenCalledWith('https://example.supabase.co/auth/v1/user', expect.objectContaining({
      headers: expect.objectContaining({
        apikey: 'public-key',
        authorization: 'Bearer ' + accessToken,
      }),
    }))
    fetchMock.mockRestore()
  })

  it('denies expired, invalid-provider and tenantless sessions', async () => {
    const expired = token({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) - 1 })
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ id: 'user-1' }), { status: 200 }))
    const authenticator = new SupabaseRequestAuthenticator(
      { url: 'https://example.supabase.co', publishableKey: 'public-key' },
      async () => undefined,
    )

    await expect(authenticator.verify(new Request('https://ottimo.test', {
      headers: { cookie: supabaseAuthCookieName + '=' + expired },
    }))).resolves.toBeUndefined()

    fetchMock.mockResolvedValue(new Response('unauthorized', { status: 401 }))
    const valid = token({ sub: 'user-1', exp: futureExpiry })
    await expect(authenticator.verify(new Request('https://ottimo.test', {
      headers: { cookie: supabaseAuthCookieName + '=' + valid },
    }))).resolves.toBeUndefined()

    fetchMock.mockRestore()
  })

  it('revokes the provider session using the server-held cookie', async () => {
    const accessToken = token({ sub: 'user-1', exp: futureExpiry })
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))
    const { revokeSupabaseSession } = await import('./supabase-auth')

    await revokeSupabaseSession(
      { url: 'https://example.supabase.co', publishableKey: 'public-key' },
      new Request('https://ottimo.test', { headers: { cookie: supabaseAuthCookieName + '=' + accessToken } }),
    )

    expect(fetchMock).toHaveBeenCalledWith('https://example.supabase.co/auth/v1/logout', expect.objectContaining({
      method: 'POST',
    }))
    fetchMock.mockRestore()
  })
})
