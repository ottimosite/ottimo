import { describe, expect, it, vi } from 'vitest'
import { createProductionRepository, readProductionAuthConfig } from './production-repository'

vi.mock('./netlify-storage', () => ({
  createNetlifyStorageAdapter: () => ({ read: vi.fn(), write: vi.fn() }),
}))

describe('production repository composition', () => {
  it('requires all server-side Supabase authentication configuration', () => {
    expect(() => readProductionAuthConfig({
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_PUBLISHABLE_KEY: 'public-key',
    })).toThrow('SUPABASE_AUTH_NOT_CONFIGURED')
  })

  it('creates the authenticated tenant repository from Supabase configuration', () => {
    expect(createProductionRepository({
      supabaseUrl: 'https://example.supabase.co',
      supabasePublishableKey: 'public-key',
      supabaseSecretKey: 'service-role-key',
    })).toBeDefined()
  })
})
