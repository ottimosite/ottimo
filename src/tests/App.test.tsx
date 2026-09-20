import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

describe('app', () => {
  it('renders the product landing page around a clear improvement proposition', () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /make your website easier to find, use and improve/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /analyse my website/i }).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: /six lenses\. one digital experience/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /from website signal to verified improvement/i })).toBeInTheDocument()
    expect(screen.getByText('Evidence-led')).toBeInTheDocument()
    expect(screen.getByText('AI readiness')).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('shows a useful error when the audit form has an invalid URL', () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
    fireEvent.change(screen.getByPlaceholderText('yourbusiness.co.uk'), { target: { value: '%%%' } })
    fireEvent.click(screen.getAllByRole('button', { name: /analyse my website/i })[0])
    expect(screen.getByRole('alert')).toHaveTextContent(/invalid url/i)
  })

  it('gives public information pages distinct, useful content', () => {
    render(<MemoryRouter initialEntries={['/performance']}><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /speed is part of the product/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /find the bottleneck/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /prioritise the journey/i })).toBeInTheDocument()
  })

  it('uses grouped application navigation and a streamlined audit start surface', () => {
    render(<MemoryRouter initialEntries={['/app/audits/new']}><App /></MemoryRouter>)
    const applicationNavigation = screen.getByRole('navigation', { name: /application/i })
    expect(within(applicationNavigation).getByText('Workspace')).toBeInTheDocument()
    expect(within(applicationNavigation).getByRole('link', { name: 'Insights' })).toBeInTheDocument()
    expect(within(applicationNavigation).getByText('Reporting')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /start with your website/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /run audit/i })).toBeInTheDocument()
    expect(screen.queryByText(/step 1 of 2/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument()
  })

  it('prepares a saved website for a direct audit action', () => {
    render(<MemoryRouter initialEntries={['/app/websites/site-wikipedia']}><App /></MemoryRouter>)
    const runAudit = screen.getByRole('link', { name: /run audit/i })
    expect(runAudit.getAttribute('href')).toMatch(/\/app\/audits\/new\/run\?url=/)
  })

  it('provides website-context navigation for the primary workspace', () => {
    render(<MemoryRouter initialEntries={['/app/websites/site-wikipedia']}><App /></MemoryRouter>)
    const websiteNavigation = screen.getByRole('navigation', { name: /website navigation/i })
    expect(websiteNavigation).toBeInTheDocument()
    expect(within(websiteNavigation).getByRole('link', { name: 'Health' })).toHaveAttribute('href', '/app/websites/site-wikipedia')
    expect(within(websiteNavigation).getByRole('link', { name: 'Audits' })).toHaveAttribute('href', '/app/audits?website=site-wikipedia')
    expect(within(websiteNavigation).getByRole('link', { name: 'Actions' })).toHaveAttribute('href', '/app/recommendations?website=site-wikipedia')
    expect(within(websiteNavigation).getByRole('link', { name: 'Performance' })).toHaveAttribute('href', '/app/performance?website=site-wikipedia')
  })

  it('renders dashboard route', () => {
    render(<MemoryRouter initialEntries={['/app/dashboard']}><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /your digital presence at a glance/i })).toBeInTheDocument()
  })

  it('presents the audit as an evidence-to-verification workflow', () => {
    render(<MemoryRouter initialEntries={['/app/audits/audit-wikipedia']}><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /know what matters\. know what to do next/i })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /audit workflow/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /review action queue/i })).toBeInTheDocument()
    expect(screen.getAllByText(/measured findings/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: /know what ottimo actually observed/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /did anything change/i })).toBeInTheDocument()
  })

  it('exposes an evidence explorer with page and resource scope filters', () => {
    render(<MemoryRouter initialEntries={['/app/audits/audit-wikipedia']}><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /why was this finding reported/i })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /evidence scope/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /resource-scoped/i })).toBeInTheDocument()
    expect(screen.getAllByText(/measured findings/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/inspect supporting evidence/i).length).toBeGreaterThan(0)
  })
})
