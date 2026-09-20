import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AIDecisionPanel } from './AIDecisionPanel'
import type { Audit } from '../../types/domain'

const audit: Audit = {
  id: 'audit-ai', websiteId: 'site-ai', url: 'https://example.com', createdAt: '2026-09-20T00:00:00Z',
  durationMs: 100, scores: [], issues: [{
    id: 'issue-ai', category: 'performance', severity: 'high', title: 'Slow LCP',
    summary: 'Observed LCP is above target.', impact: 'The page may feel slower.', solution: 'Investigate rendering work.',
    effort: 'medium', priority: 80, status: 'open',
    evidence: { status: 'measured', value: 2800, unit: 'ms', source: 'browser', observedAt: '2026-09-20T00:00:00Z' },
  }],
  actions: [],
}

describe('AIDecisionPanel', () => {
  it('keeps evidence-backed output and proposals visibly distinct', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><AIDecisionPanel audit={audit} /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: /explain with evidence/i }))
    expect(await screen.findByText(/evidence-backed explanation/i)).toBeInTheDocument()
    expect(screen.getByText('Proposal', { exact: true })).toBeInTheDocument()
    expect(screen.getByText(/evidence reference supplied/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /explain with evidence/i })).toBeInTheDocument()
    expect(screen.getByText(/inspect supplied evidence/i)).toBeInTheDocument()
  })

  it('does not offer guidance when there are no unresolved findings', () => {
    const resolvedAudit = { ...audit, issues: [{ ...audit.issues[0], status: 'resolved' as const }] }
    render(<MemoryRouter><AIDecisionPanel audit={resolvedAudit} /></MemoryRouter>)
    expect(screen.getByText(/no unresolved findings/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /explain with evidence/i })).not.toBeInTheDocument()
  })
})


describe('AIDecisionPanel context', () => {
  it('honours a finding query parameter so hand-offs keep decision context', () => {
    render(<MemoryRouter initialEntries={['/app/audits/audit-ai?finding=issue-ai#ai-decision']}><AIDecisionPanel audit={audit} /></MemoryRouter>)
    expect(screen.getByText('Selected finding:').parentElement!).toHaveTextContent('Slow LCP')
  })
})
