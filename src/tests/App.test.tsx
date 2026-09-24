import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

describe('app', () => {
  it('renders the product landing page around a clear improvement proposition', () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /make your website work better\. know what to fix next\./i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /analyse your website/i }).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: /six lenses\. one website/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /turn website evidence into verified improvement/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /a report you can understand/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /see how ottimo turns evidence into the next action/i })).toBeInTheDocument()
    expect(screen.getByText(/This working example uses a deterministic fixture/i)).toBeInTheDocument()
    expect(screen.getByText(/snapshot coverage is limited to the public portal/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /useful answers before you start/i })).toBeInTheDocument()
    expect(screen.getByText(/unavailable evidence is a valid result/i)).toBeInTheDocument()
    expect(screen.getByText('Evidence-led')).toBeInTheDocument()
    expect(screen.getByText('AI readiness')).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('shows a useful error when the audit form has an invalid URL', () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
    fireEvent.change(screen.getByPlaceholderText('yourbusiness.co.uk'), { target: { value: '%%%' } })
    fireEvent.click(screen.getAllByRole('button', { name: /start my website check/i })[0])
    expect(screen.getByRole('alert')).toHaveTextContent(/invalid url/i)
  })

  it('gives public information pages distinct, useful content', () => {
    render(<MemoryRouter initialEntries={['/performance']}><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /make important pages faster for real people/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /start with the signal, not the story/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /useful outcomes, not vanity metrics/i })).toBeInTheDocument()
    expect(screen.getByText(/resource and asset analysis/i)).toBeInTheDocument()
  })

  it('uses grouped application navigation and a streamlined audit start surface', () => {
    render(<MemoryRouter initialEntries={['/app/audits/new']}><App /></MemoryRouter>)
    const applicationNavigation = screen.getByRole('navigation', { name: /application/i })
    expect(within(applicationNavigation).getByText('Workspace')).toBeInTheDocument()
    expect(within(applicationNavigation).getByRole('link', { name: 'Insights' })).toBeInTheDocument()
    expect(within(applicationNavigation).getByText('Reporting')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /start with your website/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue to audit/i })).toBeInTheDocument()
    expect(screen.getByText(/1 of 2/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /run audit/i })).not.toBeInTheDocument()
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

  it('keeps the website context when entering a website-scoped insight', () => {
    render(<MemoryRouter initialEntries={['/app/performance?website=site-wikipedia']}><App /></MemoryRouter>)
    const websiteNavigation = screen.getByRole('navigation', { name: /website navigation/i })
    expect(screen.getByText('site-wikipedia')).toBeInTheDocument()
    expect(within(websiteNavigation).getByRole('link', { name: 'Health' })).toHaveAttribute('href', '/app/websites/site-wikipedia')
    expect(screen.getByRole('heading', { name: /performance you can feel/i })).toBeInTheDocument()
  })

  it('keeps website context alongside the audit workflow', () => {
    render(<MemoryRouter initialEntries={['/app/audits/audit-wikipedia']}><App /></MemoryRouter>)
    expect(screen.getByRole('navigation', { name: /website navigation/i })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /audit workflow/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /know what matters\. know what to do next/i })).toBeInTheDocument()
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
