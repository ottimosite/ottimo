import { describe, expect, it } from 'vitest'
import { wikipediaAudit, wikipediaSnapshot } from '../data/fixtures/wikipedia'
import { isValidUrl, normaliseUrl } from '../lib/validation'
import { MockAuditProvider, scoreCategory } from '../services/audit'

describe('validation', () => {
  it('accepts http and https', () => {
    expect(isValidUrl('https://example.com')).toBe(true)
    expect(isValidUrl('javascript:alert(1)')).toBe(false)
  })

  it('normalises a hostname', () => {
    expect(normaliseUrl('example.com')).toBe('https://example.com')
  })
})

describe('audit engine', () => {
  it('returns the deterministic Wikipedia snapshot without inventing health measurements', async () => {
    const first = await new MockAuditProvider().runAudit(wikipediaSnapshot.sourceUrl)
    const second = await new MockAuditProvider().runAudit(wikipediaSnapshot.sourceUrl)

    expect(first).toEqual(second)
    expect(first.score).toBeUndefined()
    expect(first.scores).toEqual(wikipediaAudit.scores)
    expect(first.issues).toEqual(wikipediaAudit.issues)
    expect(scoreCategory(first.scores, 'performance')).toBe(0)
    expect(first.stats?.source).toBe('local')
    expect(first.stats?.title).toBe(wikipediaSnapshot.title)
  })
})
