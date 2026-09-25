import { describe, expect, it, vi } from 'vitest'
import { startOnboarding } from './supabase-onboarding'\nimport { SupabaseWorkspaceRepository } from './supabase-tenant-repository'
import type { ServerStorageAdapter } from './persistence'

function storage(): ServerStorageAdapter {
  const values = new Map<string, unknown>()
  return {
    async read<T>(key: string) { return values.get(key) as never as { schemaVersion: 1; tenantId: string; updatedAt: string; data: T } | undefined },
    async write<T>(key: string, value: { schemaVersion: 1; tenantId: string; updatedAt: string; data: T }) { values.set(key, value) },
  }
}

describe('startOnboarding', () => {\n  afterEach(() => vi.restoreAllMocks())
  it('creates the user, workspace, website and pending lifecycle before sending verification', async () => {
    vi.spyOn(SupabaseWorkspaceRepository.prototype, 'createWorkspace').mockResolvedValue({ id: 'workspace-1', name: 'My Ottimo workspace', createdBy: 'user-1', createdAt: '2026-09-25T20:00:00Z' })\n    vi.spyOn(SupabaseWorkspaceRepository.prototype, 'createWebsite').mockResolvedValue({ id: 'website-1', workspaceId: 'workspace-1', name: 'example.com', url: 'https://example.com', createdBy: 'user-1', createdAt: '2026-09-25T20:00:00Z' })\n    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'user-1' }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 'workspace-1', name: 'My Ottimo workspace', created_by: 'user-1', created_at: '2026-09-25T20:00:00Z' }]), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 'website-1', workspace_id: 'workspace-1', name: 'example.com', url: 'https://example.com', created_by: 'user-1', created_at: '2026-09-25T20:00:00Z' }]), { status: 201 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))

    const result = await startOnboarding(
      { url: 'https://example.supabase.co', publishableKey: 'publishable', secretKey: 'secret' },
      { email: 'Person@example.com', websiteUrl: 'example.com', rateLimitKey: 'ip-1' },
      storage(),
      { allow: () => true },
    )

    expect(result).toMatchObject({ accepted: true, created: true, tenantId: 'workspace-1', websiteId: 'website-1' })
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://example.supabase.co/auth/v1/admin/users',
      expect.objectContaining({ headers: expect.objectContaining({ apikey: 'secret', authorization: 'Bearer secret' }) }),
    )
    expect(fetchMock).toHaveBeenLastCalledWith(
      'https://example.supabase.co/auth/v1/otp',
      expect.objectContaining({
        body: JSON.stringify({ email: 'person@example.com', create_user: true }),
      }),
    )

    fetchMock.mockRestore()
  })

  it('keeps existing-account responses opaque while using the passwordless email path', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('already exists', { status: 422 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))

    const result = await startOnboarding(
      { url: 'https://example.supabase.co', publishableKey: 'publishable', secretKey: 'secret' },
      { email: 'person@example.com', websiteUrl: 'https://example.com', rateLimitKey: 'ip-2' },
      storage(),
      { allow: () => true },
    )

    expect(result).toEqual({ accepted: true, created: false })
    expect(fetchMock).toHaveBeenLastCalledWith(
      'https://example.supabase.co/auth/v1/otp',
      expect.any(Object),
    )

    fetchMock.mockRestore()
  })

  it('fails closed when the authentication provider is unavailable', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('unavailable', { status: 503 }))

    await expect(startOnboarding(
      { url: 'https://example.supabase.co', publishableKey: 'publishable', secretKey: 'secret' },
      { email: 'person@example.com', websiteUrl: 'https://example.com', rateLimitKey: 'ip-3' },
      storage(),
      { allow: () => true },
    )).rejects.toThrow('ONBOARDING_PROVIDER_UNAVAILABLE')

    vi.restoreAllMocks()
  })
})
