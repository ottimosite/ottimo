import { getDeployStore, getStore, type Store } from '@netlify/blobs'
import type { DurableObjectStore } from './durable-storage'
import { DurableServerStorageAdapter } from './durable-storage'

const STORE_NAME = 'ottimo-tenant-state'

export function createNetlifyBlobStore(context = process.env.CONTEXT): Store {
  if (context === 'production') {
    return getStore({ name: STORE_NAME, consistency: 'strong' })
  }

  return getDeployStore({ name: STORE_NAME, consistency: 'strong' })
}

export class NetlifyBlobObjectStore implements DurableObjectStore {
  constructor(private readonly store: Pick<Store, 'get' | 'setJSON'>) {}

  async get<T>(key: string): Promise<T | null> {
    return this.store.get(key, { type: 'json' }) as Promise<T | null>
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.store.setJSON(key, value)
  }
}

export function createNetlifyStorageAdapter(context = process.env.CONTEXT): DurableServerStorageAdapter {
  return new DurableServerStorageAdapter(new NetlifyBlobObjectStore(createNetlifyBlobStore(context)))
}

export function getNetlifyStorageScope(context = process.env.CONTEXT): 'production' | 'deploy' {
  return context === 'production' ? 'production' : 'deploy'
}
