import { describe, expect, it } from 'vitest'
import { AuditSecurityError, assertSafeUrlShape, assertPublicTarget, isBlockedAddress } from './security'

describe('audit engine security', () => {
  it('blocks private, reserved and link-local IPv4 ranges', () => {
    expect(isBlockedAddress('0.0.0.0')).toBe(true)
    expect(isBlockedAddress('10.0.0.4')).toBe(true)
    expect(isBlockedAddress('127.0.0.1')).toBe(true)
    expect(isBlockedAddress('169.254.169.254')).toBe(true)
    expect(isBlockedAddress('192.168.1.10')).toBe(true)
    expect(isBlockedAddress('198.18.0.1')).toBe(true)
    expect(isBlockedAddress('224.0.0.1')).toBe(true)
    expect(isBlockedAddress('8.8.8.8')).toBe(false)
  })

  it('blocks private, loopback, multicast and documentation IPv6 ranges', () => {
    expect(isBlockedAddress('::')).toBe(true)
    expect(isBlockedAddress('::1')).toBe(true)
    expect(isBlockedAddress('fc00::1')).toBe(true)
    expect(isBlockedAddress('fd00::1')).toBe(true)
    expect(isBlockedAddress('fe80::1')).toBe(true)
    expect(isBlockedAddress('ff02::1')).toBe(true)
    expect(isBlockedAddress('2001:db8::1')).toBe(true)
    expect(isBlockedAddress('2001:4860:4860::8888')).toBe(false)
  })

  it('blocks IPv4-mapped IPv6 private targets', () => {
    expect(isBlockedAddress('::ffff:127.0.0.1')).toBe(true)
    expect(isBlockedAddress('::ffff:192.168.1.10')).toBe(true)
    expect(isBlockedAddress('::ffff:8.8.8.8')).toBe(false)
  })

  it('rejects internal hostnames and unsafe URL shapes before DNS resolution', () => {
    expect(() => assertSafeUrlShape('http://localhost')).toThrow(AuditSecurityError)
    expect(() => assertSafeUrlShape('https://service.internal')).toThrow(AuditSecurityError)
    expect(() => assertSafeUrlShape('https://example.local')).toThrow(AuditSecurityError)
    expect(() => assertSafeUrlShape('https://user:pass@example.com')).toThrow(AuditSecurityError)
    expect(() => assertSafeUrlShape('https://example.com:8080')).toThrow(AuditSecurityError)
    expect(() => assertSafeUrlShape('ftp://example.com')).toThrow(AuditSecurityError)
  })

  it('rejects literal private targets before DNS resolution', () => {
    expect(() => assertSafeUrlShape('http://127.0.0.1')).toThrow(AuditSecurityError)
    expect(() => assertSafeUrlShape('http://169.254.169.254')).toThrow(AuditSecurityError)
    expect(() => assertSafeUrlShape('http://[::1]')).toThrow(AuditSecurityError)
  })

  it('keeps public URL validation available', () => {
    expect(assertSafeUrlShape('https://example.com/path').href).toBe('https://example.com/path')
  })

  it('rejects credentials and non-standard ports through the public async boundary', async () => {
    await expect(assertPublicTarget('https://user:pass@example.com')).rejects.toBeInstanceOf(AuditSecurityError)
    await expect(assertPublicTarget('https://example.com:8080')).rejects.toBeInstanceOf(AuditSecurityError)
  })
})
