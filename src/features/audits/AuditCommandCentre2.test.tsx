import { render, screen, within } from '@testing-library/react'
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
    { id: 'issue-2', status: 'open', evidence: { status: 'inferred' } },
  ],
  health: { score: 82, status: 'good' },
  healthModel: { pages: [], categoryCoverage: { performance: 'measured', seo: 'unavailable' } },
  comparison: { newFindings: 1, regressed: 1, resolved: 0, improved: 0, changes: [], previousCreatedAt: '2026-09-19T10:00:00.000Z' },
  verifications: [{ status: 'verified' }, { status: 'failed' }],
} as unknown as Audit

const actions = [
  { id: 'action-1', title: 'Optimise the page', lifecycleStatus: 'planned', status: 'open', severity: 'high', priorityScore: 80, dependencies: [] },
] as unknown as OptimizationAction[]

describe('AuditCommandCentre2', () => {
  it('presents a concise decision cockpit with canonical navigation targets', () => {
    render(
      <MemoryRouter>
        <AuditCommandCentre2 audit={audit} openIssues={audit.issues} actions={actions} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /know what matters/i })).toBeInTheDocument()

    const workflow = screen.getByRole('navigation', { name: /Audit stages/i })
    expect(within(workflow).getByRole('link', { name: /1 Understand/i })).toHaveAttribute('href', '#audit-evidence')
    expect(within(workflow).getByRole('link', { name: /2 Decide/i })).toHaveAttribute('href', '#audit-action-queue')
    expect(within(workflow).getByRole('link', { name: /3 Act/i })).toHaveAttribute('href', '#audit-action-queue')
    expect(within(workflow).getByRole('link', { name: /4 Verify/i })).toHaveAttribute('href', '#audit-changes')
    expect(within(workflow).getByRole('link', { name: /5 Compare/i })).toHaveAttribute('href', '#audit-changes')

    expect(screen.getByRole('link', { name: /Inspect evidence/i })).toHaveAttribute('href', '#audit-evidence')
    expect(screen.getByRole('link', { name: /Review actions/i })).toHaveAttribute('href', '#audit-action-queue')
    expect(screen.getByRole('link', { name: /Check verification/i })).toHaveAttribute('href', '#audit-changes')
    const summary = screen.getByLabelText('Audit decision summary')
    expect(within(summary).getByRole('link', { name: /Evidence/i })).toHaveAttribute('href', '#audit-evidence')
    expect(within(summary).getByRole('link', { name: /Change/i })).toHaveAttribute('href', '#audit-changes')
    expect(within(summary).getByText('1 inferred · 0 unavailable')).toBeInTheDocument()
    expect(within(summary).getByText('New or regressed')).toBeInTheDocument()
  })
})
