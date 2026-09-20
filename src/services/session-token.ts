import type { AuthenticatedSession, SessionVerifier } from './auth'

const SESSION_COOKIE = 'ottimo_session'
const encoder = new TextEncoder()

export interface SessionTokenPayload {
  sessionId: string
  userId: string
  tenantId: string
  expiresAt: string
}

const toBase64Url = (value: Uint8Array | string) => {
  const bytes = typeof value === 'string' ? encoder.encode(value) : value
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const fromBase64Url = (value: string) => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4)
  return Uint8Array.from(atob(padded), char => char.charCodeAt(0))
}

const importKey = (secret: string) =>
  crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])

const sign = async (value: string, secret: string) => {
  const key = await importKey(secret)
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value))
  return toBase64Url(new Uint8Array(signature))
}

export async function createSessionToken(session: SessionTokenPayload, secret: string): Promise<string> {
  if (secret.length < 32) throw new Error('SESSION_SECRET_TOO_SHORT')
  const payload = toBase64Url(JSON.stringify(session))
  return payload + '.' + await sign(payload, secret)
}

export class HmacSessionVerifier implements SessionVerifier {
  constructor(private readonly secret: string) {
    if (secret.length < 32) throw new Error('SESSION_SECRET_TOO_SHORT')
  }

  async verify(request: Request): Promise<AuthenticatedSession | undefined> {
    const token = request.headers.get('cookie')?.split(';').map(part => part.trim()).find(part => part.startsWith(SESSION_COOKIE + '='))?.slice(SESSION_COOKIE.length + 1)
    if (!token) return undefined

    const [payload, signature] = token.split('.')
    if (!payload || !signature) return undefined

    try {
      const key = await importKey(this.secret)
      const suppliedBytes = fromBase64Url(signature)
      if (!(await crypto.subtle.verify('HMAC', key, suppliedBytes, encoder.encode(payload)))) return undefined

      const decoded = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as Record<string, unknown>
      const keys = Object.keys(decoded).sort()
      const expectedKeys = ['expiresAt', 'sessionId', 'tenantId', 'userId']
      if (keys.length !== expectedKeys.length || keys.some((key, index) => key !== expectedKeys[index])) return undefined

      const { sessionId, userId, tenantId, expiresAt } = decoded
      if (
        typeof sessionId !== 'string' || sessionId.length === 0 ||
        typeof userId !== 'string' || userId.length === 0 ||
        typeof tenantId !== 'string' || tenantId.length === 0 ||
        typeof expiresAt !== 'string' || Number.isNaN(Date.parse(expiresAt)) ||
        new Date(expiresAt).getTime() <= Date.now()
      ) return undefined

      return { sessionId, userId, tenantId, expiresAt }
    } catch {
      return undefined
    }
  }
}

export const sessionCookieName = SESSION_COOKIE
