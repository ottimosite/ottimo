export interface AuditSafetyLimits {
  maxPages: number
  maxConcurrency: number
  timeoutMs: number
  maxResources: number
  maxHtmlBytes: number
  maxRedirects: number
}

export const DEFAULT_AUDIT_SAFETY_LIMITS: Readonly<AuditSafetyLimits> = {
  maxPages: 10,
  maxConcurrency: 2,
  timeoutMs: 10_000,
  maxResources: 500,
  maxHtmlBytes: 5 * 1024 * 1024,
  maxRedirects: 5,
}

export function clampAuditLimits(input: Partial<AuditSafetyLimits> = {}): AuditSafetyLimits {
  return {
    maxPages: Math.min(Math.max(Math.floor(input.maxPages ?? DEFAULT_AUDIT_SAFETY_LIMITS.maxPages), 1), 25),
    maxConcurrency: Math.min(Math.max(Math.floor(input.maxConcurrency ?? DEFAULT_AUDIT_SAFETY_LIMITS.maxConcurrency), 1), 3),
    timeoutMs: Math.min(Math.max(Math.floor(input.timeoutMs ?? DEFAULT_AUDIT_SAFETY_LIMITS.timeoutMs), 1_000), 15_000),
    maxResources: Math.min(Math.max(Math.floor(input.maxResources ?? DEFAULT_AUDIT_SAFETY_LIMITS.maxResources), 50), 500),
    maxHtmlBytes: Math.min(Math.max(Math.floor(input.maxHtmlBytes ?? DEFAULT_AUDIT_SAFETY_LIMITS.maxHtmlBytes), 256 * 1024), 5 * 1024 * 1024),
    maxRedirects: Math.min(Math.max(Math.floor(input.maxRedirects ?? DEFAULT_AUDIT_SAFETY_LIMITS.maxRedirects), 0), 5),
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

export class SlidingWindowRateLimiter {
  private readonly buckets = new Map<string, number[]>()

  constructor(private readonly maxRequests: number, private readonly windowMs: number) {}

  check(key: string, now = Date.now()): RateLimitResult {
    const cutoff = now - this.windowMs
    const timestamps = (this.buckets.get(key) ?? []).filter(timestamp => timestamp > cutoff)
    if (timestamps.length >= this.maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil(((timestamps[0] + this.windowMs) - now) / 1000))
      this.buckets.set(key, timestamps)
      return { allowed: false, remaining: 0, retryAfterSeconds }
    }
    timestamps.push(now)
    this.buckets.set(key, timestamps)
    return { allowed: true, remaining: this.maxRequests - timestamps.length, retryAfterSeconds: 0 }
  }
}

export function rateLimitKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || request.headers.get('x-nf-client-connection-ip') || 'anonymous'
}
