import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { WebsiteDetail } from './PlatformPages'

vi.mock('../../services/storage', () => ({
  storage: {
    websites: () => [{
      id: 'site-test',
      name: 'Example site',
      url: 'https://example.com',
      createdAt: '2026-09-20T10:00:00.000Z',
      healthModel: {
        version: '1',
        generatedAt: '2026-09-20T10:00:00.000Z',
        websiteUrl: 'https://example.com',
        pages: [{ url: 'https://example.com/', archetype: 'homepage', observations: [], issueIds: [], actionIds: [] }],
        journeys: [{ id: 'journey-1', name: 'Primary journey', pageUrls: ['https://example.com/'], issueIds: [], actionIds: [], confidence: 'high', rationale: 'Observable internal structure.' }],
        observations: [],
        issueCount: 1,
        actionCount: 1,
        categoryCoverage: { performance: 'measured', accessibility: 'partial', seo: 'measured', usability: 'unavailable', technical: 'measured', ai: 'unavailable' },
        siteIntelligence: {
          performance: { pagesMeasured: 1 },
          search: { pagesMeasured: 1, titleCoverage: 1, metaDescriptionCoverage: 1, canonicalCoverage: 1, openGraphCoverage: 1, twitterCardCoverage: 0, structuredDataPages: 0, pagesWithMultipleH1: 0, indexabilityObserved: 'indexable' },
          technology: { signals: [{ name: 'React', category: 'framework', confidence: 'high', evidence: 'fixture' }], categories: ['framework'] },
          social: { profileCount: 0, shareMetadataPages: 0, socialScriptPages: 0, profiles: [] },
        },
      },
    }],
    audits: () => [{
      id: 'audit-test',
      websiteId: 'site-test',
      url: 'https://example.com',
      createdAt: '2026-09-20T10:00:00.000Z',
      score: 82,
      durationMs: 500,
      scores: [],
      issues: [
        { id: 'issue-test', category: 'performance', severity: 'medium', title: 'Slow resource', summary: 'A resource is slow.', impact: 'It can delay useful work.', solution: 'Optimise it.', effort: 'medium', priority: 65, status: 'open', evidence: { status: 'measured' } },
      ],
      actions: [{
        id: 'action-test',
        issueId: 'issue-test',
        fingerprint: 'resource',
        title: 'Optimise slow resource',
        category: 'performance',
        severity: 'medium',
        impact: 'medium',
        confidence: 'high',
        effort: 'medium',
        priorityScore: 65,
        status: 'open',
        lifecycleStatus: 'planned',
        affectedPages: ['https://example.com/'],
        affectedResources: [],
        evidenceCount: 1,
        dependencies: [],
        implementationSteps: ['Optimise the resource.'],
        verification: [{ description: 'Resource improves.', affectedPages: ['https://example.com/'] }],
        expectedOutcome: 'Faster loading.',
        priority: { impact: 60, severity: 60, confidence: 90, effort: 50, evidence: 80, score: 65 },
      }],
      health: { score: 82, status: 'good', measuredCategories: ['performance'], excludedCategories: [], checks: 1, passed: 0, failed: 1, unavailable: 0, methodology: 'Evidence-backed.' },
      comparison: { previousAuditId: 'audit-old', previousCreatedAt: '2026-09-19T10:00:00.000Z', comparedAt: '2026-09-20T10:00:00.000Z', changes: [], resolved: 1, newFindings: 0, improved: 1, regressed: 0, unchanged: 0 },
      verifications: [{ actionId: 'action-old', status: 'verified', verifiedAt: '2026-09-20T10:00:00.000Z', previousAuditId: 'audit-old', currentAuditId: 'audit-test', evidence: 'Observed improvement.', affectedPages: [] }],
    }],
  },
}))

describe('WebsiteDetail', () => {
  it('makes the website health model the primary workspace', () => {
    render(<MemoryRouter initialEntries={['/app/websites/site-test']}><Routes><Route path="/app/websites/:id" element={<WebsiteDetail />} /></Routes></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'What needs attention now' })).toBeInTheDocument()
    expect(screen.getByText('Optimise slow resource')).toBeInTheDocument()
    expect(screen.getByText('What changed')).toBeInTheDocument()
    expect(screen.getByText('Where attention is concentrated')).toBeInTheDocument()
    const healthDomains = screen.getByRole('heading', { name: 'Where attention is concentrated' }).closest('.card')
    expect(healthDomains).not.toBeNull()
    expect(within(healthDomains as HTMLElement).getByText('Performance', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText('Partial')).toBeInTheDocument()
    expect(screen.getByText('Is the work proving itself?')).toBeInTheDocument()
    const verification = screen.getByRole('heading', { name: 'Is the work proving itself?' }).closest('.card')
    expect(verification).not.toBeNull()
    expect(within(verification as HTMLElement).getByText('1', { selector: 'strong' })).toBeInTheDocument()
    expect(within(verification as HTMLElement).getByText('verified improvements')).toBeInTheDocument()
    expect(screen.getByText('Observed search readiness')).toBeInTheDocument()
    expect(screen.getByText(/not a measure of traffic/i)).toBeInTheDocument()
  })
})
