import { describe, expect, it, vi } from 'vitest'
import { NetlifyBlobObjectStore, getNetlifyStorageScope } from './netlify-storage'

describe('Netlify storage integration', () => {
  it('isolates production and non-production storage scopes', () => {
    expect(getNetlifyStorageScope('production')).toBe('production')
    expect(getNetlifyStorageScope('deploy-preview')).toBe('deploy')
    expect(getNetlifyStorageScope('branch-deploy')).toBe('deploy')
    expect(getNetlifyStorageScope(undefined)).toBe('deploy')
  })

  it('maps the provider API to the provider-independent object store contract', async () => {
    const get = vi.fn().mockResolvedValue({ schemaVersion: 1, tenantId: 'tenant-1', data: [] })
    const setJSON = vi.fn().mockResolvedValue(undefined)
    const adapter = new NetlifyBlobObjectStore({ get, setJSON })

    await expect(adapter.get('tenant/tenant-1/websites')).resolves.toEqual({
      schemaVersion: 1,
      tenantId: 'tenant-1',
      data: [],
    })
    await adapter.set('tenant/tenant-1/websites', { schemaVersion: 1 })

    expect(get).toHaveBeenCalledWith('tenant/tenant-1/websites', {
      type: 'json',
    })
    expect(setJSON).toHaveBeenCalledWith('tenant/tenant-1/websites', { schemaVersion: 1 })
  })
})
