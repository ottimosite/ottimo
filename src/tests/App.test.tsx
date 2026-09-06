import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

describe('app', () => {
  it('renders the product landing page', () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /your website is already part of your sales team/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /start a free audit/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /enough technical depth to act/i })).toBeInTheDocument()
    expect(screen.getByText('AI readiness')).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('shows a useful error when the audit form has an invalid URL', () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
    fireEvent.change(screen.getByPlaceholderText('yourbusiness.co.uk'), { target: { value: '%%%' } })
    fireEvent.change(screen.getByPlaceholderText('you@yourbusiness.co.uk'), { target: { value: 'team@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /start my free audit/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/invalid url/i)
  })

  it('renders dashboard route', () => {
    render(<MemoryRouter initialEntries={['/app/dashboard']}><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /your digital presence at a glance/i })).toBeInTheDocument()
  })
})
