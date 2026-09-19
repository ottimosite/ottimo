import { describe, expect, it } from 'vitest'
import { buildWebsiteHealthModel, inferPageArchetype } from './health-model'

describe('website health model', () => {
  it('classifies common page archetypes from observable URL structure', () => {
    expect(inferPageArchetype('https://example.com/')).toBe('homepage')
    expect(inferPageArchetype('https://example.com/services/accounting')).toBe('service')
    expect(inferPageArchetype('https://example.com/blog/how-to')).toBe('article')
    expect(inferPageArchetype('https://example.com/contact')).toBe('contact')
  })

  it('builds pages, observations and inferred journeys without inventing acquisition data', () => {
    const model = buildWebsiteHealthModel({
      websiteUrl: 'https://example.com',
      pages: [
        {
          url: 'https://example.com/',
          title: 'Example',
          stats: {
            source: 'live',
            performance: { lcpMs: 1800, mode: 'rendered-page' },
            searchVisibility: {
              titlePresent: true,
              metaDescriptionPresent: true,
              canonicalPresent: true,
              h1Count: 1,
              structuredDataCount: 1,
              openGraphPresent: true,
              twitterCardPresent: true,
              sitemapLinked: true,
            },
          },
        },
        { url: 'https://example.com/services/accounting', title: 'Accounting services' },
        { url: 'https://example.com/contact', title: 'Contact us' },
      ],
      issues: [],
      actions: [],
      generatedAt: '2026-09-19T20:00:00.000Z',
    })

    expect(model.pages).toHaveLength(3)
    expect(model.observations.map(item => item.kind)).toEqual(['performance.lcp', 'search.readiness'])
    expect(model.journeys[0].pageUrls).toContain('https://example.com/services/accounting')
    expect(model.journeys[0].rationale).toContain('no conversion analytics')
  })
})
