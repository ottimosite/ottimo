import { describe, expect, it } from 'vitest'
import {
  assertAnalyticsSyncRequest,
  assertAnalyticsTenant,
  createAnalyticsConnection,
  createAnalyticsErrorSyncResult,
  createUnavailableAnalyticsSyncResult,
  markAnalyticsConnected,
  markAnalyticsSyncSuccess,
  selectAnalyticsSite,
} from './analytics-integration'

const sites = [
  { id: 'property-1', name: 'Example', property: 'properties/123', measurementId: 'G-EXAMPLE' },
]

describe('analytics integration boundary', () => {
  it('models lifecycle without storing credentials', () => {
    const connection = createAnalyticsConnection('tenant-a', 'analytics-1')
    expect(connection).toMatchObject({ provider: 'analytics', state: 'disconnected' })
    expect(connection).not.toHaveProperty('accessToken')
    const connected = markAnalyticsConnected(connection, '2026-09-20T11:00:00Z')
    expect(connected.state).toBe('connected')
    expect(markAnalyticsSyncSuccess(connected, '2026-09-20T11:05:00Z').lastSuccessfulSyncAt)
      .toBe('2026-09-20T11:05:00Z')
  })

  it('requires an available property before selection', () => {
    const connection = markAnalyticsConnected(
      createAnalyticsConnection('tenant-a', 'analytics-1'),
      '2026-09-20T11:00:00Z',
    )
    expect(selectAnalyticsSite(connection, 'property-1', sites).selectedSiteId).toBe('property-1')
    expect(() => selectAnalyticsSite(connection, 'missing', sites))
      .toThrow('ANALYTICS_SITE_NOT_AVAILABLE')
  })

  it('enforces tenant isolation and request binding', () => {
    const connection = createAnalyticsConnection('tenant-a', 'analytics-1')
    expect(() => assertAnalyticsTenant(connection, 'tenant-b')).toThrow('TENANT_ACCESS_DENIED')

    const selected = { ...markAnalyticsConnected(connection, '2026-09-20T11:00:00Z'), selectedSiteId: 'property-1' }
    expect(() => assertAnalyticsSyncRequest(selected, {
      tenantId: 'tenant-b',
      connectionId: 'analytics-1',
      siteId: 'property-1',
      periodStart: '2026-09-01',
      periodEnd: '2026-09-20',
    })).toThrow('TENANT_ACCESS_DENIED')

    expect(() => assertAnalyticsSyncRequest(selected, {
      tenantId: 'tenant-a',
      connectionId: 'analytics-1',
      siteId: 'property-1',
      periodStart: '2026-09-01',
      periodEnd: '2026-09-20',
    })).not.toThrow()
  })

  it('represents unavailable and provider errors without fabricated observations', () => {
    const request = {
      tenantId: 'tenant-a',
      connectionId: 'analytics-1',
      siteId: 'property-1',
      periodStart: '2026-09-01',
      periodEnd: '2026-09-20',
    }
    expect(createUnavailableAnalyticsSyncResult(request, '2026-09-20T11:00:00Z', '2026-09-20T11:01:00Z', 'Analytics credentials are not configured.'))
      .toMatchObject({ state: 'unavailable', observations: [], errorCode: 'ANALYTICS_UNAVAILABLE' })
    expect(createAnalyticsErrorSyncResult(request, '2026-09-20T11:00:00Z', '2026-09-20T11:01:00Z', 'PROVIDER_TIMEOUT', 'The provider did not respond.'))
      .toMatchObject({ state: 'error', observations: [], errorCode: 'PROVIDER_TIMEOUT' })
  })

  it('keeps external analytics observations separate from Ottimo measurements', () => {
    const request = {
      tenantId: 'tenant-a',
      connectionId: 'analytics-1',
      siteId: 'property-1',
      periodStart: '2026-09-01',
      periodEnd: '2026-09-20',
    }
    const result = createUnavailableAnalyticsSyncResult(request, '2026-09-20T11:00:00Z', '2026-09-20T11:01:00Z', 'No external data available.')
    expect(result.observations).toEqual([])
    expect(result.provenance).toEqual([])
  })
})
