import { describe, expect, it } from 'vitest'
import { createAcquisitionSnapshot, matchAcquisitionPage, acquisitionDataIsUsable } from './acquisition'

const provenance = {
  provider: 'search-console' as const,
  sourceId: 'property-1',
  observedAt: '2026-09-20T08:00:00Z',
  retrievedAt: '2026-09-20T08:05:00Z',
}

describe('acquisition integration boundary', () => {
  it('matches external page identity explicitly and safely', () => {
    expect(matchAcquisitionPage('https://example.com/about/', ['https://example.com/about'])).toEqual({
      sourceUrl: 'https://example.com/about/',
      auditUrl: 'https://example.com/about',
      method: 'normalised-url',
      confidence: 'medium',
    })
    expect(matchAcquisitionPage('not-a-url', ['https://example.com/about'])).toBeUndefined()
  })

  it('keeps provider provenance attached to every imported observation', () => {
    const snapshot = createAcquisitionSnapshot({
      generatedAt: '2026-09-20T08:05:00Z',
      statuses: [{ provider: 'search-console', state: 'connected', lastSuccessfulSyncAt: '2026-09-20T08:05:00Z' }],
      auditedUrls: ['https://example.com/'],
      observations: [{
        id: 'sc-1',
        provider: 'search-console',
        metric: 'clicks',
        value: 42,
        unit: 'count',
        periodStart: '2026-09-13',
        periodEnd: '2026-09-19',
        pageUrl: 'https://example.com/',
        provenance,
        confidence: 'high',
      }],
    })

    expect(snapshot.observations[0].provenance.provider).toBe('search-console')
    expect(snapshot.pageMatches).toHaveLength(1)
    expect(snapshot.availability.find(item => item.metric === 'clicks')?.status).toBe('measured')
  })

  it('does not turn missing provider data into zero', () => {
    const snapshot = createAcquisitionSnapshot({
      generatedAt: '2026-09-20T08:05:00Z',
      statuses: [{ provider: 'analytics', state: 'disconnected' }],
      auditedUrls: ['https://example.com/'],
      observations: [],
    })

    expect(snapshot.availability.find(item => item.metric === 'sessions')).toMatchObject({
      status: 'unavailable',
    })
    expect(snapshot.availability.find(item => item.metric === 'sessions')).not.toHaveProperty('value')
  })

  it('distinguishes stale and usable integration states', () => {
    expect(acquisitionDataIsUsable({ provider: 'analytics', state: 'stale' })).toBe(true)
    expect(acquisitionDataIsUsable({ provider: 'analytics', state: 'disconnected' })).toBe(false)
  })
})
