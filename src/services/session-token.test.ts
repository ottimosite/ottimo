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
    const session = {
      sessionId: 'session-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      expiresAt: '2099-01-01T00:00:00Z',
    }
    const token = await createSessionToken(session, secret)
    const [payload, signature] = token.split('.')
    const malformed = btoa(JSON.stringify({ ...session, expiresAt: 'not-a-date' }))
      .replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '')
    const request = new Request('https://ottimo.test', {
      headers: { cookie: sessionCookieName + '=' + malformed + '.' + signature },
    })
    await expect(new HmacSessionVerifier(secret).verify(request)).resolves.toBeUndefined()

    const signedExtra = await createSessionToken({ ...session }, secret)
    const [signedPayload, signedSignature] = signedExtra.split('.')
    const decoded = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(signedPayload.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - signedPayload.length % 4) % 4)), char => char.charCodeAt(0))))
    const extraPayload = btoa(JSON.stringify({ ...decoded, role: 'admin' }))
      .replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '')
    await expect(new HmacSessionVerifier(secret).verify(new Request('https://ottimo.test', {
      headers: { cookie: sessionCookieName + '=' + extraPayload + '.' + signedSignature },
    }))).resolves.toBeUndefined()
  })

  it('requires a sufficiently strong signing secret', async () => {
    expect(() => new HmacSessionVerifier('short')).toThrow('SESSION_SECRET_TOO_SHORT')
    await expect(createSessionToken({ sessionId: 's', userId: 'u', tenantId: 't', expiresAt: '2099-01-01T00:00:00Z' }, 'short')).rejects.toThrow('SESSION_SECRET_TOO_SHORT')
  })
})
