export type CollectionErrorCode =
  | 'INVALID_URL' | 'UNSUPPORTED_PROTOCOL' | 'DNS_FAILURE' | 'PRIVATE_ADDRESS'
  | 'TIMEOUT' | 'REDIRECT_LIMIT' | 'HTTP_ERROR' | 'RESPONSE_TOO_LARGE'
  | 'UNSUPPORTED_CONTENT_TYPE' | 'NETWORK_ERROR'

export interface CollectedPage {
  requestedUrl: string
  finalUrl: string
  status: number
  contentType: string
  contentLength: number
  body: string
  redirectChain: string[]
  collectionMs: number
}

export interface CollectionFailure {
  code: CollectionErrorCode
  message: string
  status?: number
}

export class CollectionError extends Error {
  code: CollectionErrorCode
  status?: number
  constructor(error: CollectionFailure) {
    super(error.message)
    this.name = 'CollectionError'
    this.code = error.code
    this.status = error.status
  }
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
  error?: CollectionFailure
}

export async function collectPage(url: string, accept = 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1', signal?: AbortSignal): Promise<CollectedPage> {
  const started = performance.now()
  let response: Response
  try {
    response = await fetch('/.netlify/functions/collect-page', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url, accept }),
      signal,
    })
  } catch (cause) {
    throw new CollectionError({ code: 'NETWORK_ERROR', message: cause instanceof Error ? cause.message : 'Ottimo could not reach its collection service.' })
  }
  let payload: CollectionResponse
  try { payload = await response.json() as CollectionResponse } catch {
    throw new CollectionError({ code: 'NETWORK_ERROR', message: 'Ottimo received an invalid response from its collection service.' })
  }
  if (!payload.ok) throw new CollectionError(payload.error ?? { code: 'NETWORK_ERROR', message: 'Ottimo could not collect the target website.' })
  if (!payload.finalUrl || payload.status === undefined || !payload.body || !payload.contentType) {
    throw new CollectionError({ code: 'NETWORK_ERROR', message: 'Ottimo received incomplete collection data.' })
  }
  return {
    requestedUrl: payload.requestedUrl ?? url,
    finalUrl: payload.finalUrl,
    status: payload.status,
    contentType: payload.contentType,
    contentLength: payload.contentLength ?? new TextEncoder().encode(payload.body).length,
    body: payload.body,
    redirectChain: payload.redirectChain ?? [url],
    collectionMs: Math.round(performance.now() - started),
  }
}
