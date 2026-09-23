import type { AuthenticatedSession, SessionVerifier } from './auth'

const AUTH_COOKIE = 'ottimo_auth'
const MAX_COOKIE_BYTES = 12_000

interface SupabaseUser {
  id: string
  email_confirmed_at?: string | null
  confirmed_at?: string | null
}

export interface SupabaseAuthConfig {
  url: string
  publishableKey: string
}

export type TenantResolver = (userId: string) => Promise<string | undefined>

export function readAuthCookie(request: Request): string | undefined {
  const raw = request.headers.get('cookie')
  if (!raw) return undefined
  const value = raw.split(';').map(part => part.trim()).find(part => part.startsWith(AUTH_COOKIE + '='))?.slice(AUTH_COOKIE.length + 1)
  if (!value || value.length > MAX_COOKIE_BYTES) return undefined
  try { return decodeURIComponent(value) } catch { return undefined }
}

export function authCookieHeader(token: string, maxAgeSeconds: number): string {
  if (!token || token.length > MAX_COOKIE_BYTES) throw new Error('AUTH_COOKIE_INVALID')
  return [
    AUTH_COOKIE + '=' + encodeURIComponent(token),
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Max-Age=' + Math.max(0, Math.floor(maxAgeSeconds)),
  ].join('; ')
}

export function clearAuthCookie(): string {
  return authCookieHeader('deleted', 0)
}

function normaliseUrl(url: string): string {
  return url.replace(/\/+$/, '')
}

export class SupabaseRequestAuthenticator implements SessionVerifier {
  constructor(
    private readonly config: SupabaseAuthConfig,
    private readonly resolveTenant: TenantResolver,
  ) {}

  async verify(request: Request): Promise<AuthenticatedSession | undefined> {
    const accessToken = readAuthCookie(request)
    if (!accessToken) return undefined

    const response = await fetch(normaliseUrl(this.config.url) + '/auth/v1/user', {
      headers: {
        apikey: this.config.publishableKey,
        authorization: 'Bearer ' + accessToken,
        accept: 'application/json',
      },
    })
    if (!response.ok) return undefined

    const user = await response.json() as SupabaseUser
    if (!user.id) return undefined

    const expiresAt = readJwtExpiry(accessToken)
    if (!expiresAt || Date.parse(expiresAt) <= Date.now()) return undefined

    const tenantId = await this.resolveTenant(user.id)
    if (!tenantId) return undefined

    return {
      sessionId: readJwtClaim(accessToken, 'session_id') ?? 'supabase-session',
      userId: user.id,
      tenantId,
      expiresAt,
    }
  }
}

export async function revokeSupabaseSession(config: SupabaseAuthConfig, request: Request): Promise<void> {
  const accessToken = readAuthCookie(request)
  if (!accessToken) return

  await fetch(normaliseUrl(config.url) + '/auth/v1/logout', {
    method: 'POST',
    headers: {
      apikey: config.publishableKey,
      authorization: 'Bearer ' + accessToken,
    },
  })
}

function readJwtExpiry(token: string): string | undefined {
  const expiry = readJwtClaim(token, 'exp')
  if (!expiry) return undefined
  const timestamp = Number(expiry)
  if (!Number.isFinite(timestamp) || timestamp <= 0) return undefined
  return new Date(timestamp * 1000).toISOString()
}

function readJwtClaim(token: string, claim: string): string | undefined {
  try {
    const payload = token.split('.')[1]
    if (!payload) return undefined
    const decoded = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as Record<string, unknown>
    const value = decoded[claim]
    return typeof value === 'string' || typeof value === 'number' ? String(value) : undefined
  } catch {
    return undefined
  }
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4)
  return Uint8Array.from(atob(padded), character => character.charCodeAt(0))
}

export const supabaseAuthCookieName = AUTH_COOKIE
