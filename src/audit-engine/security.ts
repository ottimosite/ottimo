import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

export class AuditSecurityError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuditSecurityError'
  }
}

const blocked4 = (ip: string) => {
  const [a, b] = ip.split('.').map(Number)
  return (
    a === 0 ||
    a === 10 ||
    (a === 100 && b >= 64 && b <= 127) ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && b >= 18 && b <= 19) ||
    a >= 224
  )
}

const blocked6 = (ip: string) => {
  const value = ip.toLowerCase()
  return (
    value === '::' ||
    value === '::1' ||
    value.startsWith('fc') ||
    value.startsWith('fd') ||
    value.startsWith('fe8') ||
    value.startsWith('fe9') ||
    value.startsWith('fea') ||
    value.startsWith('feb') ||
    value.startsWith('ff') ||
    value.startsWith('2001:db8:') ||
    value.startsWith('2001:0db8:')
  )
}

export const isBlockedAddress = (ip: string): boolean => {
  if (isIP(ip) === 4) return blocked4(ip)
  if (isIP(ip) !== 6) return true

  const mapped = ip.toLowerCase().match(/^::ffff:(\\d+\\.\\d+\\.\\d+\\.\\d+)$/)
  if (mapped) return isBlockedAddress(mapped[1])

  return blocked6(ip)
}

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata',
  'metadata.google.internal',
  'instance-data',
])

const hasBlockedHostname = (hostname: string): boolean => {
  const normalised = hostname.toLowerCase().replace(/\\.$/, '')
  return (
    BLOCKED_HOSTNAMES.has(normalised) ||
    normalised.endsWith('.localhost') ||
    normalised.endsWith('.local') ||
    normalised.endsWith('.internal')
  )
}

export function assertSafeUrlShape(rawUrl: string): URL {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new AuditSecurityError('The audit target is not a valid URL.')
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new AuditSecurityError('Only HTTP and HTTPS audit targets are supported.')
  }
  if (url.username || url.password) {
    throw new AuditSecurityError('URLs containing credentials are not permitted.')
  }
  if (url.port && !['80', '443'].includes(url.port)) {
    throw new AuditSecurityError('Only standard HTTP and HTTPS ports are permitted.')
  }
  if (hasBlockedHostname(url.hostname)) {
    throw new AuditSecurityError('Internal audit targets are not permitted.')
  }
  if (isIP(url.hostname) && isBlockedAddress(url.hostname)) {
    throw new AuditSecurityError('The audit target resolves to a private or reserved network address.')
  }

  return url
}

export async function assertPublicTarget(rawUrl: string): Promise<URL> {
  const url = assertSafeUrlShape(rawUrl)

  let addresses
  try {
    addresses = await lookup(url.hostname, { all: true, verbatim: true })
  } catch {
    throw new AuditSecurityError('The audit target hostname could not be resolved.')
  }

  if (!addresses.length || addresses.some(address => isBlockedAddress(address.address))) {
    throw new AuditSecurityError('The audit target resolves to a private or reserved network address.')
  }

  return url
}

export async function assertRedirectTarget(rawUrl: string): Promise<URL> {
  return assertPublicTarget(rawUrl)
}
