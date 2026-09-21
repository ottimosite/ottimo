import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime } from './format'

describe('date formatting', () => {
  const value = '2026-09-20T14:30:00.000Z'

  it('formats audit dates consistently in en-GB', () => {
    expect(formatDate(value)).toBe('20 Sept 2026')
  })

  it('formats audit date-times with the shared report contract', () => {
    expect(formatDateTime(value)).toMatch(/^20 Sept 2026, \d{2}:\d{2}$/)
  })
})
