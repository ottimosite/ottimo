import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

describe('app', () => {
  it('renders the product landing page', () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /know what your website is doing\. know what to fix first/i })).toBeInTheDocument()
    const auditLinks = screen.getAllByRole('link', { name: /analyse (my )?website/i })
    expect(auditLinks).toHaveLength(1)
    expect(auditLinks[0]).toHaveAttribute('href', '#start')
    expect(screen.getByRole('button', { name: /analyse my website/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /six lenses\. one view of the digital experience/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /measure first\. explain clearly\. improve progressively/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /unknown.*made-up number/i })).toBeInTheDocument()
    expect(screen.getByText('AI readiness')).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('shows a useful error when the audit form has an invalid URL', () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
    fireEvent.change(screen.getByPlaceholderText('yourbusiness.co.uk'), { target: { value: '%%%' } })
    fireEvent.click(screen.getByRole('button', { name: /analyse my website/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/invalid url/i)
  })

  it('renders dashboard route', () => {
    render(<MemoryRouter initialEntries={['/app/dashboard']}><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /your digital presence at a glance/i })).toBeInTheDocument()
  })
})
