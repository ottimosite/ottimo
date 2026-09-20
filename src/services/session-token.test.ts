import { describe, expect, it } from 'vitest'
import { createSessionToken, HmacSessionVerifier, sessionCookieName } from './session-token'

const secret = '0123456789abcdef0123456789abcdef'

describe('HMAC session boundary', () => {
  it('round-trips a signed tenant session from a cookie', async () => {
    const session = {
      sessionId: 'session-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      expiresAt: '2099-01-01T00:00:00Z',
    }
    const token = await createSessionToken(session, secret)
    const request = new Request('https://ottimo.test', { headers: { cookie: sessionCookieName + '=' + token } })
    await expect(new HmacSessionVerifier(secret).verify(request)).resolves.toEqual(session)
  })

  it('rejects tampered and expired tokens', async () => {
    const session = {
      sessionId: 'session-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      expiresAt: '2099-01-01T00:00:00Z',
    }
    const token = await createSessionToken(session, secret)
    const verifier = new HmacSessionVerifier(secret)
    await expect(verifier.verify(new Request('https://ottimo.test', { headers: { cookie: sessionCookieName + '=' + token + 'x' } }))).resolves.toBeUndefined()
    const expired = await createSessionToken({ ...session, expiresAt: '2020-01-01T00:00:00Z' }, secret)
    await expect(verifier.verify(new Request('https://ottimo.test', { headers: { cookie: sessionCookieName + '=' + expired } }))).resolves.toBeUndefined()
  })

  it('rejects malformed claims and unexpected fields', async () => {
    const verifier = new HmacSessionVerifier(secret)
    const malformed = await createSessionToken({
      sessionId: 'session-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      expiresAt: 'not-a-date',
    }, secret)
    await expect(verifier.verify(new Request('https://ottimo.test', {
      headers: { cookie: sessionCookieName + '=' + malformed },
    }))).resolves.toBeUndefined()

    const extra = await createSessionToken({
      sessionId: 'session-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      expiresAt: '2099-01-01T00:00:00Z',
      role: 'admin',
    } as never, secret)
    await expect(verifier.verify(new Request('https://ottimo.test', {
      headers: { cookie: sessionCookieName + '=' + extra },
    }))).resolves.toBeUndefined()
  })

  it('requires a sufficiently strong signing secret', async () => {
    expect(() => new HmacSessionVerifier('short')).toThrow('SESSION_SECRET_TOO_SHORT')
    await expect(createSessionToken({ sessionId: 's', userId: 'u', tenantId: 't', expiresAt: '2099-01-01T00:00:00Z' }, 'short')).rejects.toThrow('SESSION_SECRET_TOO_SHORT')
  })
})
