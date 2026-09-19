import { describe, expect, it, vi } from 'vitest'
import { CollectionError, collectPage } from './collection'

describe('collectPage', () => {
  it('returns collected page data from the server collection endpoint', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      ok: true,
      requestedUrl: 'https://example.com',
      finalUrl: 'https://www.example.com/',
      status: 200,
      contentType: 'text/html; charset=utf-8',
      contentLength: 42,
      body: '<html></html>',
      redirectChain: ['https://example.com', 'https://www.example.com/'],
    }), { status: 200, headers: { 'content-type': 'application/json' } })))

    const result = await collectPage('https://example.com')
    expect(result.finalUrl).toBe('https://www.example.com/')
    expect(result.status).toBe(200)
    expect(result.body).toBe('<html></html>')
    expect(result.redirectChain).toHaveLength(2)
  })

  it('preserves structured collection failures', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      ok: false,
      error: { code: 'HTTP_ERROR', message: 'The target returned HTTP 403.', status: 403 },
    }), { status: 200, headers: { 'content-type': 'application/json' } })))

    await expect(collectPage('https://example.com')).rejects.toMatchObject({
      code: 'HTTP_ERROR',
      status: 403,
    })
  })
})
