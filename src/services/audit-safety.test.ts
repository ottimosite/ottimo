import { describe, expect, it } from 'vitest'
import { DEFAULT_AUDIT_SAFETY_LIMITS, SlidingWindowRateLimiter, clampAuditLimits, rateLimitKey } from './audit-safety'

describe('audit safety controls', () => {
  it('clamps untrusted execution limits to server-safe bounds', () => {
    expect(clampAuditLimits({ maxPages: 999, maxConcurrency: 99, timeoutMs: 999999 }).maxPages).toBe(25)
    expect(clampAuditLimits({ maxPages: -2, maxConcurrency: 0, timeoutMs: 1 }).maxConcurrency).toBe(1)
    expect(DEFAULT_AUDIT_SAFETY_LIMITS.maxResources).toBe(500)
  })

  it('enforces a sliding-window request limit independently of client input', () => {
    const limiter = new SlidingWindowRateLimiter(2, 60_000)
    expect(limiter.check('tenant-1', 1).allowed).toBe(true)
    expect(limiter.check('tenant-1', 2).allowed).toBe(true)
    const blocked = limiter.check('tenant-1', 3)
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
    expect(limiter.check('tenant-2', 3).allowed).toBe(true)
  })

  it('prefers infrastructure-provided client identity', () => {
    const request = new Request('https://ottimo.test', { headers: { 'x-forwarded-for': '203.0.113.4, 10.0.0.1' } })
    expect(rateLimitKey(request)).toBe('203.0.113.4')
  })
})
