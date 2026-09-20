import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppLayout, PublicLayout } from './Layout'
import { AuthProvider } from '../features/auth/AuthBoundary'

describe('layout accessibility contract', () => {
  it('provides a skip link and keyboard-focusable main content on public routes', () => {
    render(<MemoryRouter initialEntries={['/']}><PublicLayout /></MemoryRouter>)

    expect(screen.getByRole('link', { name: /skip to main content/i })).toHaveAttribute('href', '#main')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main')
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1')
  })

  it('provides the same skip-to-content contract in the application shell', () => {
    render(<MemoryRouter initialEntries={['/app/dashboard']}><AuthProvider><AppLayout /></AuthProvider></MemoryRouter>)

    expect(screen.getByRole('link', { name: /skip to main content/i })).toHaveAttribute('href', '#main')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main')
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('navigation', { name: /application/i })).toBeInTheDocument()
  })
})
