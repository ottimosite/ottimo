import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { InsightsPage } from './PlatformPages'

vi.mock('../../services/storage', () => ({
  storage: {
    websites: () => [{ id: 'site-test', name: 'Example site', url: 'https://example.com' }],
    audits: () => [{
      id: 'audit-test',
      websiteId: 'site-test',
      url: 'https://example.com',
      createdAt: '2026-09-20T10:00:00.000Z',
      score: 82,
      durationMs: 500,
      scores: [
        { category: 'performance', score: 82 },
        { category: 'seo', score: 74 },
        { category: 'technical' },
      ],
      issues: [
        { id: 'issue-performance', category: 'performance', severity: 'high', title: 'Slow resource', summary: 'A resource is slowing useful work.', status: 'open' },
      ],
      healthModel: {
        version: '1',
        pages: [{ url: 'https://example.com/', archetype: 'homepage' }],
        journeys: [],
        categoryCoverage: { performance: 'measured', accessibility: 'partial', seo: 'measured', usability: 'unavailable', technical: 'unavailable', ai: 'unavailable' },
        siteIntelligence: {
          search: { titleCoverage: 1, metaDescriptionCoverage: 0.5, canonicalCoverage: 1, structuredDataPages: 0 },
          technology: { signals: [{ name: 'React', category: 'framework', confidence: 'high' }] },
        },
      },
    }],
  },
}))

describe('InsightsPage', () => {
  it('keeps website insights contextual and evidence-bound', () => {
    render(<MemoryRouter initialEntries={['/app/insights?website=site-test']}><InsightsPage /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: /turn audit evidence into useful understanding/i })).toBeInTheDocument()
    expect(screen.getByText(/Insights · Example site/i)).toBeInTheDocument()
    expect(screen.getByText('Slow resource')).toBeInTheDocument()

    const measured = screen.getByText('measured domains').parentElement
    const inferred = screen.getByText('partially inferred').parentElement
    expect(measured).not.toBeNull()
    expect(inferred).not.toBeNull()
    expect(within(measured as HTMLElement).getByText('2')).toBeInTheDocument()
    expect(within(inferred as HTMLElement).getByText('1')).toBeInTheDocument()

    expect(screen.getAllByText('Unavailable').length).toBeGreaterThan(0)
    expect(screen.getByText(/do not establish rankings or organic acquisition/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Insight decision brief')).toBeInTheDocument()

    const performance = screen.getByText('Slow resource').closest('article')
    expect(performance).not.toBeNull()
    expect(within(performance as HTMLElement).getByRole('link', { name: /explore performance/i })).toHaveAttribute('href', '/app/performance?website=site-test')
    expect(screen.getByRole('link', { name: /review findings/i })).toHaveAttribute('href', '/app/audits/audit-test#findings')
  })
})
