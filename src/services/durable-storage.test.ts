import { describe, expect, it } from 'vitest'
import { DurableServerStorageAdapter, type DurableObjectStore } from './durable-storage'

class MemoryStore implements DurableObjectStore {
  private readonly values = new Map<string, unknown>()

  async get<T>(key: string): Promise<T | null> {
    return (this.values.get(key) as T | undefined) ?? null
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.values.set(key, value)
  }
}

describe('DurableServerStorageAdapter', () => {
  it('round-trips a tenant envelope through the durable store', async () => {
    const adapter = new DurableServerStorageAdapter(new MemoryStore())
    const envelope = {
      schemaVersion: 1 as const,
      tenantId: 'tenant-1',
      updatedAt: '2026-09-20T12:00:00.000Z',
      data: [{ id: 'website-1' }],
    }

    await adapter.write('tenant/tenant-1/websites', envelope)

    await expect(adapter.read('tenant/tenant-1/websites')).resolves.toEqual(envelope)
  })

  it('rejects keys that do not belong to the tenant storage namespace', async () => {
    const adapter = new DurableServerStorageAdapter(new MemoryStore())

    await expect(adapter.read('tenant/tenant-1/../../other')).rejects.toThrow('INVALID_STORAGE_KEY')
    await expect(adapter.write('audits', {
      schemaVersion: 1,
      tenantId: 'tenant-1',
      updatedAt: '2026-09-20T12:00:00.000Z',
      data: [],
    })).rejects.toThrow('INVALID_STORAGE_KEY')
  })

  it('rejects future schema versions and malformed envelopes', async () => {
    const store = new MemoryStore()
    await store.set('tenant/tenant-1/websites', {
      schemaVersion: 2,
      tenantId: 'tenant-1',
      updatedAt: '2026-09-20T12:00:00.000Z',
      data: [],
    })
    const adapter = new DurableServerStorageAdapter(store)

    await expect(adapter.read('tenant/tenant-1/websites')).rejects.toThrow('UNSUPPORTED_STORAGE_SCHEMA')
    await expect(adapter.write('tenant/tenant-1/websites', {
      schemaVersion: 1,
      tenantId: '',
      updatedAt: 'not-a-date',
      data: [],
    })).rejects.toThrow('INVALID_STORAGE_ENVELOPE')
  })

  it('propagates durable store failures without writing a partial envelope', async () => {
    const failingStore: DurableObjectStore = {
      async get() {
        throw new Error('STORAGE_UNAVAILABLE')
      },
      async set() {
        throw new Error('STORAGE_UNAVAILABLE')
      },
    }
    const adapter = new DurableServerStorageAdapter(failingStore)

    await expect(adapter.read('tenant/tenant-1/audits')).rejects.toThrow('STORAGE_UNAVAILABLE')
    await expect(adapter.write('tenant/tenant-1/audits', {
      schemaVersion: 1,
      tenantId: 'tenant-1',
      updatedAt: '2026-09-20T12:00:00.000Z',
      data: [],
    })).rejects.toThrow('STORAGE_UNAVAILABLE')
  })
})
