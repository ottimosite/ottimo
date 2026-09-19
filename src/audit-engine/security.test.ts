import { describe, expect, it } from 'vitest'
import { AuditSecurityError, isBlockedAddress, assertPublicTarget } from './security'

describe('audit engine security', () => {
  it('blocks private IPv4 ranges', () => {
    expect(isBlockedAddress('127.0.0.1')).toBe(true)
    expect(isBlockedAddress('192.168.1.10')).toBe(true)
    expect(isBlockedAddress('10.0.0.4')).toBe(true)
  })

  it('rejects credentials and non-standard ports before collection', async () => {
    await expect(assertPublicTarget('https://user:pass@example.com')).rejects.toBeInstanceOf(AuditSecurityError)
    await expect(assertPublicTarget('https://example.com:8080')).rejects.toBeInstanceOf(AuditSecurityError)
  })
})
