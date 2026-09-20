import { describe, expect, it, vi } from 'vitest'
import { createProductionRepository } from './production-repository'

vi.mock('./netlify-storage', () => ({
  createNetlifyStorageAdapter: () => ({ read: vi.fn(), write: vi.fn() }),
}))

describe('production repository composition', () => {
  it('requires an explicit server session secret', () => {
    expect(() => createProductionRepository('short')).toThrow('SESSION_SECRET_TOO_SHORT')
    expect(() => createProductionRepository(undefined)).toThrow('SESSION_SECRET_NOT_CONFIGURED')
  })

  it('creates the authenticated tenant repository with a valid secret', () => {
    expect(createProductionRepository('0123456789abcdef0123456789abcdef')).toBeDefined()
  })
})
