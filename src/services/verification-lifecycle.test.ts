import { describe, expect, it } from 'vitest'
import type { ServerStorageAdapter } from './persistence'
import { tenantKey, STORAGE_SCHEMA_VERSION } from './persistence'
import { completeVerifiedLifecycle } from './verification-lifecycle'
import type { WorkspaceRepository } from './supabase-tenant-repository'

function storage(): ServerStorageAdapter & { values: Map<string, unknown> } {
  const values = new Map<string, unknown>()
  return {
    values,
    async read<T>(key: string) {
      return values.get(key) as { schemaVersion: 1; tenantId: string; updatedAt: string; data: T } | undefined
    },
    async write<T>(key: string, value: { schemaVersion: 1; tenantId: string; updatedAt: string; data: T }) {
      values.set(key, value)
    },
  }
}

const workspaceRepository: WorkspaceRepository = {
  async findWorkspaceForUser() {
    return { id: 'workspace-1', name: 'Ottimo', createdBy: 'user-1', createdAt: '2026-09-25T20:00:00Z' }
  },
  async findWebsite() { return undefined },
  async createWorkspace() { throw new Error('not used') },
  async createWebsite() { throw new Error('not used') },
}

describe('completeVerifiedLifecycle', () => {
  it('moves a pending account into the verified state', async () => {
    const adapter = storage()
    adapter.values.set(tenantKey({ userId: 'user-1', tenantId: 'workspace-1' }, 'lifecycle'), {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      tenantId: 'workspace-1',
      updatedAt: '2026-09-25T20:00:00Z',
      data: {
        account: 'account_pending_verification',
        updatedAt: '2026-09-25T20:00:00Z',
      },
    })

    await expect(completeVerifiedLifecycle('user-1', workspaceRepository, adapter, '2026-09-25T20:01:00Z'))
      .resolves.toEqual({ userId: 'user-1', tenantId: 'workspace-1' })

    const stored = adapter.values.get(tenantKey({ userId: 'user-1', tenantId: 'workspace-1' }, 'lifecycle')) as { data: { account: string; updatedAt: string } }
    expect(stored.data).toEqual({
      account: 'verified',
      updatedAt: '2026-09-25T20:01:00Z',
    })
  })

  it('is idempotent for an already verified account', async () => {
    const adapter = storage()
    adapter.values.set(tenantKey({ userId: 'user-1', tenantId: 'workspace-1' }, 'lifecycle'), {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      tenantId: 'workspace-1',
      updatedAt: '2026-09-25T20:00:00Z',
      data: { account: 'verified', updatedAt: '2026-09-25T20:00:00Z' },
    })

    await expect(completeVerifiedLifecycle('user-1', workspaceRepository, adapter)).resolves.toEqual({
      userId: 'user-1',
      tenantId: 'workspace-1',
    })
  })

  it('fails closed when the lifecycle has not been initialized', async () => {
    await expect(completeVerifiedLifecycle('user-1', workspaceRepository, storage()))
      .rejects.toThrow('LIFECYCLE_NOT_INITIALIZED')
  })
})
