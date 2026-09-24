import { describe, expect, it, vi } from 'vitest'
import {
  clientIp,
  requestEmailVerification,
  verifyEmailToken,
  type AuthRateLimiter,
} from './supabase-email-auth'

describe('Supabase email authentication flow', () => {
  it('requests provider-managed email verification without exposing account state', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    const limiter: AuthRateLimiter = { allow: vi.fn().mockReturnValue(true) }

    const result = await requestEmailVerification(
      { url: 'https://example.supabase.co/', publishableKey: 'public-key' },
      ' User@example.com ',
      limiter,
      '127.0.0.1',
    )

    expect(result).toEqual({ accepted: true, providerStatus: 200 })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.supabase.co/auth/v1/otp',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'user@example.com', create_user: true }),
      }),
    )
    expect(limiter.allow).toHaveBeenCalledWith('127.0.0.1')
    fetchMock.mockRestore()
  })

  it('returns an opaque non-accepted result when the provider rejects the request', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('already registered', { status: 400 }))
    const limiter: AuthRateLimiter = { allow: vi.fn().mockReturnValue(true) }

    await expect(
      requestEmailVerification(
        { url: 'https://example.supabase.co', publishableKey: 'public-key' },
        'user@example.com',
        limiter,
        'ip-1',
      ),
    ).resolves.toEqual({ accepted: false, providerStatus: 400 })

    fetchMock.mockRestore()
  })

  it('blocks requests after the application-level rate limit', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    const limiter: AuthRateLimiter = { allow: vi.fn().mockReturnValue(false) }

    await expect(
      requestEmailVerification(
        { url: 'https://example.supabase.co', publishableKey: 'public-key' },
        'user@example.com',
        limiter,
        'ip-1',
      ),
    ).resolves.toEqual({ accepted: false, providerStatus: 429 })

    expect(fetchMock).not.toHaveBeenCalled()
    fetchMock.mockRestore()
  })

  it('rejects malformed email addresses before contacting the provider', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')

    await expect(
      requestEmailVerification(
        { url: 'https://example.supabase.co', publishableKey: 'public-key' },
        'not-an-email',
      ),
    ).rejects.toThrow('AUTH_EMAIL_INVALID')

    expect(fetchMock).not.toHaveBeenCalled()
    fetchMock.mockRestore()
  })

  it('exchanges a provider token hash for a verified session', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        access_token: 'access-token',
        expires_in: 3600,
        user: {
          id: 'user-1',
          email_confirmed_at: '2026-09-24T22:00:00Z',
        },
      }), { status: 200 }),
    )

    await expect(
      verifyEmailToken(
        { url: 'https://example.supabase.co/', publishableKey: 'public-key' },
        'token-hash',
        'email',
      ),
    ).resolves.toEqual({
      accessToken: 'access-token',
      expiresIn: 3600,
      userId: 'user-1',
      emailConfirmedAt: '2026-09-24T22:00:00Z',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.supabase.co/auth/v1/verify',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ token_hash: 'token-hash', type: 'email' }),
      }),
    )
    fetchMock.mockRestore()
  })

  it('rejects invalid, expired, replayed or incomplete provider verification', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('invalid', { status: 400 }))

    await expect(
      verifyEmailToken(
        { url: 'https://example.supabase.co', publishableKey: 'public-key' },
        'token-hash',
        'email',
      ),
    ).rejects.toThrow('AUTH_VERIFICATION_FAILED')

    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      access_token: 'access-token',
      expires_in: 3600,
      user: { id: 'user-1' },
    }), { status: 200 }))

    await expect(
      verifyEmailToken(
        { url: 'https://example.supabase.co', publishableKey: 'public-key' },
        'token-hash',
        'email',
      ),
    ).rejects.toThrow('AUTH_VERIFICATION_INCOMPLETE')

    await expect(
      verifyEmailToken(
        { url: 'https://example.supabase.co', publishableKey: 'public-key' },
        '',
        'email',
      ),
    ).rejects.toThrow('AUTH_TOKEN_INVALID')

    await expect(
      verifyEmailToken(
        { url: 'https://example.supabase.co', publishableKey: 'public-key' },
        'token-hash',
        'password',
      ),
    ).rejects.toThrow('AUTH_TYPE_INVALID')

    fetchMock.mockRestore()
  })

  it('prefers the Netlify client IP and safely falls back to forwarded IP', () => {
    expect(clientIp(new Request('https://ottimo.test', {
      headers: { 'x-nf-client-connection-ip': '203.0.113.10', 'x-forwarded-for': '198.51.100.1' },
    }))).toBe('203.0.113.10')

    expect(clientIp(new Request('https://ottimo.test', {
      headers: { 'x-forwarded-for': '198.51.100.1, 198.51.100.2' },
    }))).toBe('198.51.100.1')
  })
})
