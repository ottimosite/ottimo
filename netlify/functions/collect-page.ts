import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

type CollectionErrorCode =
  | 'INVALID_URL'
  | 'UNSUPPORTED_PROTOCOL'
  | 'DNS_FAILURE'
  | 'PRIVATE_ADDRESS'
  | 'TIMEOUT'
  | 'REDIRECT_LIMIT'
  | 'HTTP_ERROR'
  | 'RESPONSE_TOO_LARGE'
  | 'UNSUPPORTED_CONTENT_TYPE'
  | 'NETWORK_ERROR'

const SAFE_ERROR_MESSAGES: Record<CollectionErrorCode, string> = {
  INVALID_URL: 'Enter a valid HTTP or HTTPS URL.',
  UNSUPPORTED_PROTOCOL: 'Only HTTP and HTTPS URLs can be collected.',
  DNS_FAILURE: 'Ottimo could not resolve the target host.',
  PRIVATE_ADDRESS: 'Ottimo cannot collect private or local network addresses.',
  TIMEOUT: 'The target website took too long to respond.',
  REDIRECT_LIMIT: 'The target exceeded Ottimo\'s redirect limit.',
  HTTP_ERROR: 'The target returned an HTTP error.',
  RESPONSE_TOO_LARGE: 'The target response is too large to collect.',
  UNSUPPORTED_CONTENT_TYPE: 'The target response content type is not supported.',
  NETWORK_ERROR: 'Ottimo could not collect the target website.',
}

const isCollectionErrorCode = (value: unknown): value is CollectionErrorCode =>
  typeof value === 'string' && value in SAFE_ERROR_MESSAGES

interface CollectionError {
  code: CollectionErrorCode
  message: string
  status?: number
}

interface CollectionResponse {
  ok: boolean
  requestedUrl?: string
  finalUrl?: string
  status?: number
  contentType?: string
  contentLength?: number
  body?: string
  redirectChain?: string[]
  error?: CollectionError
}

const MAX_REDIRECTS = 5
const MAX_BYTES = 2 * 1024 * 1024
const TIMEOUT_MS = 15_000
const USER_AGENT = 'OttimoBot/1.0 (+https://ottimo-site.netlify.app/)'

const isPrivateIpv4 = (ip: string) => {
  const octets = ip.split('.').map(Number)
  if (octets.length !== 4 || octets.some(Number.isNaN)) return false
  const [a, b] = octets
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
}

const isPrivateIpv6 = (ip: string) => {
  const normalised = ip.toLowerCase()
  return normalised === '::1' || normalised === '::' || normalised.startsWith('fc') ||
    normalised.startsWith('fd') || normalised.startsWith('fe8') || normalised.startsWith('fe9') ||
    normalised.startsWith('fea') || normalised.startsWith('feb') || normalised.startsWith('ff')
}

const isBlockedAddress = (ip: string) => {
  if (isIP(ip) === 4) return isPrivateIpv4(ip)
  if (isIP(ip) === 6) return isPrivateIpv6(ip)
  return true
}

async function assertPublicHostname(hostname: string) {
  let addresses: Awaited<ReturnType<typeof lookup>>
  try { addresses = await lookup(hostname, { all: true, verbatim: true }) } catch {
    throw { code: 'DNS_FAILURE', message: 'Ottimo could not resolve the target hostname.' } satisfies CollectionError
  }
  if (!addresses.length || addresses.some(address => isBlockedAddress(address.address))) {
    throw { code: 'PRIVATE_ADDRESS', message: 'The target resolves to a private or reserved network address.' } satisfies CollectionError
  }
}

async function readBody(response: Response) {
  const contentLength = Number(response.headers.get('content-length') ?? '')
  if (Number.isFinite(contentLength) && contentLength > MAX_BYTES) {
    throw { code: 'RESPONSE_TOO_LARGE', message: 'The response is larger than Ottimo allows for collection.' } satisfies CollectionError
  }
  const buffer = await response.arrayBuffer()
  if (buffer.byteLength > MAX_BYTES) {
    throw { code: 'RESPONSE_TOO_LARGE', message: 'The response is larger than Ottimo allows for collection.' } satisfies CollectionError
  }
  return { body: new TextDecoder().decode(buffer), contentLength: buffer.byteLength }
}

async function collect(requestedUrl: string, accept: string): Promise<CollectionResponse> {
  let current = new URL(requestedUrl)
  if (!['http:', 'https:'].includes(current.protocol)) throw { code: 'UNSUPPORTED_PROTOCOL', message: 'Only HTTP and HTTPS URLs can be collected.' } satisfies CollectionError
  const redirectChain = [current.href]

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    await assertPublicHostname(current.hostname)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    let response: Response
    try {
      response = await fetch(current.href, {
        redirect: 'manual',
        signal: controller.signal,
        headers: { Accept: accept, 'User-Agent': USER_AGENT },
      })
    } catch (cause) {
      clearTimeout(timer)
      if (cause instanceof Error && cause.name === 'AbortError') throw { code: 'TIMEOUT', message: 'The target did not respond within Ottimo\'s collection timeout.' } satisfies CollectionError
      throw { code: 'NETWORK_ERROR', message: 'Ottimo could not connect to the target website.' } satisfies CollectionError
    }
    clearTimeout(timer)

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location')
      if (!location) throw { code: 'HTTP_ERROR', message: 'The target returned a redirect without a destination.', status: response.status } satisfies CollectionError
      if (redirects === MAX_REDIRECTS) throw { code: 'REDIRECT_LIMIT', message: 'The target exceeded Ottimo\'s redirect limit.' } satisfies CollectionError
      current = new URL(location, current.href)
      if (!['http:', 'https:'].includes(current.protocol)) throw { code: 'UNSUPPORTED_PROTOCOL', message: 'The redirect points to an unsupported protocol.' } satisfies CollectionError
      redirectChain.push(current.href)
      continue
    }

    const contentType = response.headers.get('content-type') ?? ''
    const { body, contentLength } = await readBody(response)
    const ok = response.status >= 200 && response.status < 300
    if (!ok) return { ok: false, requestedUrl, finalUrl: current.href, status: response.status, contentType, contentLength, body, redirectChain, error: { code: 'HTTP_ERROR', message: `The target returned HTTP ${response.status}.`, status: response.status } }
    return { ok: true, requestedUrl, finalUrl: current.href, status: response.status, contentType, contentLength, body, redirectChain }
  }

  throw { code: 'REDIRECT_LIMIT', message: 'The target exceeded Ottimo\'s redirect limit.' } satisfies CollectionError
}

const json = (status: number, payload: CollectionResponse) => new Response(JSON.stringify(payload), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
})

export default async (request: Request) => {
  if (request.method !== 'POST') return json(405, { ok: false, error: { code: 'HTTP_ERROR', message: 'Method not allowed.' } })
  let input: { url?: string; accept?: string }
  try { input = await request.json() } catch { return json(400, { ok: false, error: { code: 'INVALID_URL', message: 'Request body must be valid JSON.' } }) }
  if (typeof input.url !== 'string') return json(400, { ok: false, error: { code: 'INVALID_URL', message: 'A URL is required.' } })

  let parsed: URL
  try { parsed = new URL(input.url) } catch { return json(200, { ok: false, error: { code: 'INVALID_URL', message: 'Enter a valid HTTP or HTTPS URL.' } }) }
  if (!['http:', 'https:'].includes(parsed.protocol)) return json(200, { ok: false, error: { code: 'UNSUPPORTED_PROTOCOL', message: 'Only HTTP and HTTPS URLs can be collected.' } })

  try {
    const result = await collect(parsed.href, typeof input.accept === 'string' ? input.accept : 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1')
    return json(200, result)
  } catch (cause) {
    const code: CollectionErrorCode =
      (cause && typeof cause === 'object' && 'code' in cause && isCollectionErrorCode((cause as { code?: unknown }).code))
        ? (cause as { code: CollectionErrorCode }).code
        : 'NETWORK_ERROR'
    const error: CollectionError = { code, message: SAFE_ERROR_MESSAGES[code] }
    return json(200, { ok: false, requestedUrl: parsed.href, redirectChain: [parsed.href], error })
  }
}
