import { describe, expect, it } from 'vitest'
import { kingdomCoffeeAudit, kingdomCoffeeSnapshot } from '../data/fixtures/kingdomCoffee'
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
  it('returns deterministic scores', async () => {
    const first = await new MockAuditProvider().runAudit('https://example.com')
    const second = await new MockAuditProvider().runAudit('https://example.com')
    expect(first.score).toBe(87)
    expect(second.score).toBe(first.score)
    expect(first.issues.length).toBeGreaterThan(3)
    expect(scoreCategory(first.scores, 'performance')).toBe(91)
    expect(first.standards).toEqual(['WCAG 2.2 AA', 'Core Web Vitals', 'Technical SEO'])
  })

  it('returns the saved Kingdom Coffee case study', async () => {
    const result = await new MockAuditProvider().runAudit(kingdomCoffeeSnapshot.sourceUrl)
    expect(result.score).toBe(kingdomCoffeeAudit.score)
    expect(result.scores).toEqual(kingdomCoffeeAudit.scores)
    expect(result.issues).toEqual(kingdomCoffeeAudit.issues)
    expect(result.issues.some(issue => issue.title.toLowerCase().includes('delivery'))).toBe(true)
  })
})
