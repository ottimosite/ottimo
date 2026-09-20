import type { PersistedEnvelope, ServerStorageAdapter } from './persistence'

export interface DurableObjectStore {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
}

const KEY_PATTERN = /^tenant\/[^/]+\/(websites|audits)$/

export class DurableServerStorageAdapter implements ServerStorageAdapter {
  constructor(private readonly store: DurableObjectStore) {}

  async read<T>(key: string): Promise<PersistedEnvelope<T> | undefined> {
    assertStorageKey(key)
    const value = await this.store.get<PersistedEnvelope<T>>(key)
    if (value === null) return undefined
    return validateEnvelope(value)
  }

  async write<T>(key: string, value: PersistedEnvelope<T>): Promise<void> {
    assertStorageKey(key)
    const envelope = validateEnvelope(value)
    await this.store.set(key, envelope)
  }
}

function assertStorageKey(key: string): void {
  if (!KEY_PATTERN.test(key)) throw new Error('INVALID_STORAGE_KEY')
}

function validateEnvelope<T>(value: PersistedEnvelope<T>): PersistedEnvelope<T> {
  if (!value || typeof value !== 'object') throw new Error('INVALID_STORAGE_ENVELOPE')
  if (value.schemaVersion !== 1) throw new Error('UNSUPPORTED_STORAGE_SCHEMA')
  if (!value.tenantId || !value.updatedAt || !('data' in value)) {
    throw new Error('INVALID_STORAGE_ENVELOPE')
  }
  if (!Number.isFinite(new Date(value.updatedAt).getTime())) {
    throw new Error('INVALID_STORAGE_ENVELOPE')
  }
  return value
}
