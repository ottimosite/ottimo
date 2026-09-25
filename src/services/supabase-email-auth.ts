export interface SupabaseEmailAuthConfig {
  url: string
  publishableKey: string
}

export interface AuthRateLimiter {
  allow(key: string, now?: number): boolean
}

export interface EmailAuthResult {
  accepted: boolean
  providerStatus: number
}

export interface VerifiedSession {
  accessToken: string
  expiresIn: number
  userId: string
  emailConfirmedAt: string
}

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX = 5

class MemoryRateLimiter implements AuthRateLimiter {
  private readonly attempts = new Map<string, number[]>()

  allow(key: string, now = Date.now()): boolean {
    const recent = (this.attempts.get(key) ?? []).filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS)
    if (recent.length >= RATE_LIMIT_MAX) {
      this.attempts.set(key, recent)
      return false
    }
    recent.push(now)
    this.attempts.set(key, recent)
    return true
  }
}

export const defaultAuthRateLimiter: AuthRateLimiter = new MemoryRateLimiter()

function normaliseUrl(url: string): string {
  return url.replace(/\/+$/, '')
}

function isEmail(value: unknown): value is string {
  return typeof value === 'string' &&
    value.length >= 3 &&
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

async function providerRequest(
  config: SupabaseEmailAuthConfig,
  path: string,
  body: unknown,
): Promise<Response> {
  return fetch(normaliseUrl(config.url) + path, {
    method: 'POST',
    headers: {
      apikey: config.publishableKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(body),
  })
}

export async function sendEmailVerification(
  config: SupabaseEmailAuthConfig,
  email: string,
): Promise<EmailAuthResult> {
  const normalisedEmail = email.trim().toLowerCase()
  if (!isEmail(normalisedEmail)) throw new Error('AUTH_EMAIL_INVALID')

  const response = await providerRequest(config, '/auth/v1/otp', {
    email: normalisedEmail,
    create_user: true,
  })

  // The caller deliberately treats provider failures as an opaque result so
  // that an existing account cannot be distinguished from a new/unknown one.
  return {
    accepted: response.ok,
    providerStatus: response.status,
  }
}

export async function requestEmailVerification(
  config: SupabaseEmailAuthConfig,
  email: string,
  rateLimiter: AuthRateLimiter = defaultAuthRateLimiter,
  rateLimitKey = 'anonymous',
): Promise<EmailAuthResult> {
  if (!rateLimiter.allow(rateLimitKey)) {
    return { accepted: false, providerStatus: 429 }
  }

  return sendEmailVerification(config, email)
}

export async function verifyEmailToken(
  config: SupabaseEmailAuthConfig,
  tokenHash: string,
  type: string,
): Promise<VerifiedSession> {
  if (!tokenHash || tokenHash.length > 2048) throw new Error('AUTH_TOKEN_INVALID')
  if (!['email', 'signup', 'magiclink'].includes(type)) throw new Error('AUTH_TYPE_INVALID')

  const response = await providerRequest(config, '/auth/v1/verify', {
    token_hash: tokenHash,
    type,
  })

  if (!response.ok) throw new Error('AUTH_VERIFICATION_FAILED')

  const payload = await response.json() as {
    access_token?: unknown
    expires_in?: unknown
    user?: {
      id?: unknown
      email_confirmed_at?: unknown
      confirmed_at?: unknown
    }
  }

  const accessToken = typeof payload.access_token === 'string' ? payload.access_token : ''
  const expiresIn = typeof payload.expires_in === 'number' ? payload.expires_in : 0
  const userId = typeof payload.user?.id === 'string' ? payload.user.id : ''
  const emailConfirmedAt = typeof payload.user?.email_confirmed_at === 'string'
    ? payload.user.email_confirmed_at
    : typeof payload.user?.confirmed_at === 'string'
      ? payload.user.confirmed_at
      : ''

  if (!accessToken || expiresIn <= 0 || !userId || !emailConfirmedAt) {
    throw new Error('AUTH_VERIFICATION_INCOMPLETE')
  }

  return { accessToken, expiresIn, userId, emailConfirmedAt }
}

export function clientIp(request: Request): string {
  const netlifyIp = request.headers.get('x-nf-client-connection-ip')?.trim()
  if (netlifyIp) return netlifyIp

  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || 'anonymous'
}
