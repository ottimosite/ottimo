import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuditCommandCentre2 } from './AuditCommandCentre2'
import type { Audit, OptimizationAction } from '../../types/domain'

const audit = {
  id: 'audit-1',
  url: 'https://example.com',
  createdAt: '2026-09-20T10:00:00.000Z',
  durationMs: 1000,
  issues: [
    { id: 'issue-1', status: 'open', evidence: { status: 'measured' } },
  ],
  health: { score: 82, status: 'good' },
  healthModel: { pages: [], categoryCoverage: { performance: 'measured' } },
  comparison: { newFindings: 1, regressed: 0, resolved: 0, improved: 0, changes: [], previousCreatedAt: '2026-09-19T10:00:00.000Z' },
  verifications: [],
} as unknown as Audit

const actions = [
  { id: 'action-1', title: 'Optimise the page', lifecycleStatus: 'planned', status: 'open', severity: 'high', priorityScore: 80, dependencies: [] },
] as unknown as OptimizationAction[]

describe('AuditCommandCentre2', () => {
  it('presents the audit as an Understand → Decide → Act → Verify → Compare flow', () => {
    render(
      <MemoryRouter>
        <AuditCommandCentre2 audit={audit} openIssues={audit.issues} actions={actions} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /know what matters/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /understand/i })).toHaveAttribute('href', '#audit-evidence')
    expect(screen.getByRole('link', { name: /decide/i })).toHaveAttribute('href', '#audit-decisions')
    expect(within(screen.getByRole('navigation', { name: /Audit workflow/i })).getByRole('link', { name: /^Act$/i })).toHaveAttribute('href', '#audit-actions')
    expect(screen.getByRole('link', { name: /verify/i })).toHaveAttribute('href', '#audit-verification')
    expect(screen.getByRole('link', { name: /compare/i })).toHaveAttribute('href', '#audit-changes')
  })
})
