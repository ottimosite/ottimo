import { describe, expect, it, vi } from 'vitest'
import { SupabaseWorkspaceRepository } from './supabase-tenant-repository'

describe('Supabase workspace repository', () => {
  it('resolves a tenant only when the user has exactly one workspace', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify([{ workspace_id: 'workspace-1' }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{
        id: 'workspace-1',
        name: 'Ottimo',
        created_by: 'user-1',
        created_at: '2026-09-23T20:00:00Z',
      }]), { status: 200 }))

    const repository = new SupabaseWorkspaceRepository({
      url: 'https://example.supabase.co',
      secretKey: 'server-secret',
    })

    await expect(repository.resolveTenant('user-1')).resolves.toBe('workspace-1')
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://example.supabase.co/rest/v1/workspace_members?select=workspace_id&user_id=eq.user-1',
      expect.objectContaining({
        headers: expect.objectContaining({
          apikey: 'server-secret',
          authorization: 'Bearer server-secret',
        }),
      }),
    )

    fetchMock.mockRestore()
  })

  it('denies a website lookup outside the resolved workspace', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }))

    const repository = new SupabaseWorkspaceRepository({
      url: 'https://example.supabase.co',
      secretKey: 'server-secret',
    })

    await expect(repository.findWebsite('workspace-1', 'website-2')).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.supabase.co/rest/v1/websites?select=id,workspace_id,name,url,created_by,created_at&id=eq.website-2&workspace_id=eq.workspace-1&limit=1',
      expect.any(Object),
    )

    fetchMock.mockRestore()
  })

  it('fails closed when Supabase rejects a request', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('forbidden', { status: 403 }))

    const repository = new SupabaseWorkspaceRepository({
      url: 'https://example.supabase.co',
      secretKey: 'server-secret',
    })

    await expect(repository.findWorkspaceForUser('user-1')).rejects.toThrow('SUPABASE_DATABASE_REQUEST_FAILED')

    fetchMock.mockRestore()
  })
})
