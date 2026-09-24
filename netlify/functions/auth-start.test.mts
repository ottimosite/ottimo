import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from './auth-start'

describe('auth-start function', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('requires POST and authentication configuration', async () => {
    expect((await handler(new Request('https://ottimo.test', { method: 'GET' }))).status).toBe(405)

    vi.stubEnv('SUPABASE_URL', '')
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', '')
    expect((await handler(new Request('https://ottimo.test', { method: 'POST' }))).status).toBe(503)
  })

  it('accepts a valid email without exposing provider account state', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'public-key')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))

    const response = await handler(new Request('https://ottimo.test', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-nf-client-connection-ip': '203.0.113.1' },
      body: JSON.stringify({ email: 'user@example.com' }),
    }))

    expect(response.status).toBe(202)
    expect(await response.json()).toEqual({ accepted: true })
  })

  it('does not reveal invalid provider/account state', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'public-key')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('already registered', { status: 400 }))

    const response = await handler(new Request('https://ottimo.test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com' }),
    }))

    expect(response.status).toBe(202)
    expect(await response.json()).toEqual({ accepted: true })
  })

  it('returns a rate-limit response without contacting the provider after repeated requests', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'public-key')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))

    const request = () => handler(new Request('https://ottimo.test', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-nf-client-connection-ip': '198.51.100.77' },
      body: JSON.stringify({ email: 'user@example.com' }),
    }))

    for (let index = 0; index < 5; index += 1) {
      expect((await request()).status).toBe(202)
    }
    expect((await request()).status).toBe(429)
    expect(fetchMock).toHaveBeenCalledTimes(5)
  })
})
