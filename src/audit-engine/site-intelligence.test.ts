import { describe, expect, it } from 'vitest'
import { summariseSearchVisibility, summariseSocial, summariseTechnology } from './site-intelligence'

describe('site intelligence', () => {
  it('aggregates search readiness across measured pages', () => {
    const result = summariseSearchVisibility([
      { titlePresent: true, metaDescriptionPresent: true, canonicalPresent: true, h1Count: 1, structuredDataCount: 1, openGraphPresent: true, twitterCardPresent: false, sitemapLinked: true },
      { titlePresent: true, metaDescriptionPresent: false, canonicalPresent: true, h1Count: 2, structuredDataCount: 0, openGraphPresent: false, twitterCardPresent: false, sitemapLinked: true },
    ])

    expect(result.pagesMeasured).toBe(2)
    expect(result.titleCoverage).toBe(100)
    expect(result.metaDescriptionCoverage).toBe(50)
    expect(result.pagesWithMultipleH1).toBe(1)
  })

  it('keeps stronger technology evidence when signals repeat', () => {
    const result = summariseTechnology([
      [{ name: 'React', category: 'framework', confidence: 'low', evidence: 'marker' }],
      [{ name: 'React', category: 'framework', confidence: 'high', evidence: 'bundle marker' }],
    ])

    expect(result.signals[0].confidence).toBe('high')
  })

  it('deduplicates social profiles across pages', () => {
    const result = summariseSocial([
      { profiles: ['https://x.com/example'], shareMetadata: ['og:title'], socialScripts: [] },
      { profiles: ['https://x.com/example', 'https://linkedin.com/company/example'], shareMetadata: [], socialScripts: ['script'] },
    ])

    expect(result.profileCount).toBe(2)
    expect(result.shareMetadataPages).toBe(1)
    expect(result.socialScriptPages).toBe(1)
  })
})
