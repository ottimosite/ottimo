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

const normaliseAddress = (ip: string): string => ip.replace(/^\[/, '').replace(/\]$/, '').toLowerCase()

const mappedIpv4FromIpv6 = (ip: string): string | null => {
  const value = normaliseAddress(ip)
  if (isIP(value) !== 6) return null

  const mappedDotted = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mappedDotted) return mappedDotted[1]

  const parts = value.split(':')
  const expanded: string[] = []
  const emptyIndex = parts.indexOf('')

  if (emptyIndex >= 0) {
    const left = parts.slice(0, emptyIndex).filter(Boolean)
    const right = parts.slice(emptyIndex + 1).filter(Boolean)
    expanded.push(...left, ...Array(8 - left.length - right.length).fill('0'), ...right)
  } else {
    expanded.push(...parts)
  }

  if (expanded.length !== 8) return null
  if (expanded.slice(0, 6).map(part => part.padStart(4, '0')).join(':') !== '0000:0000:0000:0000:0000:ffff') {
    return null
  }

  const high = Number.parseInt(expanded[6], 16)
  const low = Number.parseInt(expanded[7], 16)
  return [high >> 8, high & 255, low >> 8, low & 255].join('.')
}

export const isBlockedAddress = (ip: string): boolean => {
  const value = normaliseAddress(ip)
  if (isIP(value) === 4) return blocked4(value)
  if (isIP(value) !== 6) return true

  const mapped = mappedIpv4FromIpv6(value)
  if (mapped) return blocked4(mapped)

  return blocked6(value)
}

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata',
  'metadata.google.internal',
  'instance-data',
])

const hasBlockedHostname = (hostname: string): boolean => {
  const normalised = hostname.toLowerCase().replace(/\.$/, '')
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

  const literalHostname = normaliseAddress(url.hostname)
  if (isIP(literalHostname) && isBlockedAddress(literalHostname)) {
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
