import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from './auth-resend'

describe('auth-resend function', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('requires POST', async () => {
    expect((await handler(new Request('https://ottimo.test', { method: 'GET' }))).status).toBe(405)
  })

  it('uses the same opaque response for resend failures', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'public-key')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('not found', { status: 400 }))

    const response = await handler(new Request('https://ottimo.test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com' }),
    }))

    expect(response.status).toBe(202)
    expect(await response.json()).toEqual({ accepted: true })
  })
})
