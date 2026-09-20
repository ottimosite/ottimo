import { describe, expect, it } from 'vitest'
import {
  assertSearchConsoleSyncRequest,
  assertSearchConsoleTenant,
  createErrorSyncResult,
  createSearchConsoleConnection,
  createUnavailableSyncResult,
  markSearchConsoleConnected,
  markSearchConsoleSyncSuccess,
  selectSearchConsoleSite,
} from './search-console'

const sites = [
  { id: 'site-1', property: 'sc-domain:example.com', siteUrl: 'https://example.com/', permission: 'owner' as const },
  { id: 'site-2', property: 'sc-domain:other.example', siteUrl: 'https://other.example/', permission: 'full' as const },
]

describe('Search Console integration boundary', () => {
  it('models connection lifecycle without storing credentials', () => {
    const disconnected = createSearchConsoleConnection('tenant-a', 'connection-1')
    expect(disconnected).toMatchObject({
      tenantId: 'tenant-a',
      state: 'disconnected',
      provider: 'search-console',
    })
    expect(disconnected).not.toHaveProperty('accessToken')

    const connected = markSearchConsoleConnected(disconnected, '2026-09-20T10:00:00Z')
    expect(connected.state).toBe('connected')

    const synced = markSearchConsoleSyncSuccess(connected, '2026-09-20T10:05:00Z')
    expect(synced.lastSuccessfulSyncAt).toBe('2026-09-20T10:05:00Z')
  })

  it('requires an explicitly available site before selection', () => {
    const connection = markSearchConsoleConnected(
      createSearchConsoleConnection('tenant-a', 'connection-1'),
      '2026-09-20T10:00:00Z',
    )

    expect(selectSearchConsoleSite(connection, 'site-1', sites).selectedSiteId).toBe('site-1')
    expect(() => selectSearchConsoleSite(connection, 'missing', sites)).toThrow('SEARCH_CONSOLE_SITE_NOT_AVAILABLE')
  })

  it('enforces tenant isolation at the integration boundary', () => {
    const connection = createSearchConsoleConnection('tenant-a', 'connection-1')

    expect(() => assertSearchConsoleTenant(connection, 'tenant-b')).toThrow('TENANT_ACCESS_DENIED')
    expect(() => assertSearchConsoleSyncRequest(
      markSearchConsoleConnected({ ...connection, selectedSiteId: 'site-1' }, '2026-09-20T10:00:00Z'),
      {
        tenantId: 'tenant-b',
        connectionId: 'connection-1',
        siteId: 'site-1',
        periodStart: '2026-09-01',
        periodEnd: '2026-09-20',
      },
    )).toThrow('TENANT_ACCESS_DENIED')
  })

  it('requires the selected site and connected state for synchronisation', () => {
    const connection = markSearchConsoleConnected(
      createSearchConsoleConnection('tenant-a', 'connection-1'),
      '2026-09-20T10:00:00Z',
    )

    expect(() => assertSearchConsoleSyncRequest(connection, {
      tenantId: 'tenant-a',
      connectionId: 'connection-1',
      siteId: 'site-1',
      periodStart: '2026-09-01',
      periodEnd: '2026-09-20',
    })).toThrow('SEARCH_CONSOLE_SITE_NOT_SELECTED')

    expect(() => assertSearchConsoleSyncRequest(
      { ...connection, selectedSiteId: 'site-1' },
      {
        tenantId: 'tenant-a',
        connectionId: 'connection-1',
        siteId: 'site-1',
        periodStart: '2026-09-01',
        periodEnd: '2026-09-20',
      },
    )).not.toThrow()
  })

  it('represents unavailable and provider errors without fabricating observations', () => {
    const request = {
      tenantId: 'tenant-a',
      connectionId: 'connection-1',
      siteId: 'site-1',
      periodStart: '2026-09-01',
      periodEnd: '2026-09-20',
    }

    expect(createUnavailableSyncResult(request, '2026-09-20T10:00:00Z', '2026-09-20T10:01:00Z', 'No provider credentials are configured.')).toMatchObject({
      state: 'unavailable',
      observations: [],
      errorCode: 'SEARCH_CONSOLE_UNAVAILABLE',
    })

    expect(createErrorSyncResult(request, '2026-09-20T10:00:00Z', '2026-09-20T10:01:00Z', 'PROVIDER_TIMEOUT', 'The provider did not respond.')).toMatchObject({
      state: 'error',
      observations: [],
      errorCode: 'PROVIDER_TIMEOUT',
    })
  })
})
