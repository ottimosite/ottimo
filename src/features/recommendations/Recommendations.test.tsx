import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Recommendations } from './Recommendations'

const { saveAudits } = vi.hoisted(() => ({ saveAudits: vi.fn() }))
vi.mock('../../services/storage', () => ({
  storage: {
    audits: () => [{
      id: 'audit-1',
      websiteId: 'site-1',
      url: 'https://example.com',
      createdAt: '2026-09-20T07:00:00Z',
      durationMs: 100,
      scores: [],
      issues: [],
      actions: [{
        id: 'action-1',
        issueId: 'issue-1',
        fingerprint: 'performance|test|fix',
        title: 'Improve test performance',
        category: 'performance',
        severity: 'high',
        impact: 'high',
        confidence: 'high',
        effort: 'low',
        priorityScore: 90,
        status: 'open',
        lifecycleStatus: 'planned',
        affectedPages: ['https://example.com'],
        affectedResources: [],
        evidenceCount: 1,
        dependencies: [],
        implementationSteps: ['Review evidence', 'Apply the performance fix', 'Re-run the audit'],
        verification: [{ description: 'The finding is no longer reported.', affectedPages: ['https://example.com'] }],
        expectedOutcome: 'Faster page experience.',
        priority: { impact: 80, severity: 80, confidence: 1, effort: 1, evidence: 2, score: 90 },
      }],
    }],
    saveAudits,
  },
}))

describe('Recommendations lifecycle UX', () => {
  it('exposes lifecycle state and only offers valid next states', () => {
    render(<MemoryRouter><Recommendations /></MemoryRouter>)

    expect(screen.getByText('Planned')).toBeInTheDocument()
    const select = screen.getByRole('combobox', { name: /lifecycle status/i })
    expect(screen.getAllByRole('option')).toHaveLength(5)
    fireEvent.change(select, { target: { value: 'in_progress' } })

    expect(saveAudits).toHaveBeenCalled()
    expect(screen.getByRole('combobox', { name: /lifecycle status/i })).toHaveValue('in_progress')
  })
})
