import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import axe from 'axe-core'
import App from '../App'

afterEach(() => {
  cleanup()
  document.body.innerHTML = ''
})

async function expectNoCriticalA11yViolations() {
  const results = await axe.run(document.body, {
    rules: {
      'color-contrast': { enabled: false },
    },
  })
  const critical = results.violations.filter(violation => violation.impact === 'critical')
  expect(critical).toEqual([])
}

describe('critical product accessibility', () => {
  it('keeps the website health workspace free of critical accessibility violations', async () => {
    render(<MemoryRouter initialEntries={['/app/websites/site-wikipedia']}><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /current website decision/i })).toBeInTheDocument()
    await expectNoCriticalA11yViolations()
  })

  it('keeps insights free of critical accessibility violations and preserves named landmarks', async () => {
    render(<MemoryRouter initialEntries={['/app/insights?website=site-wikipedia']}><App /></MemoryRouter>)
    expect(screen.getByRole('navigation', { name: /application/i })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /website navigation/i })).toBeInTheDocument()
    await expectNoCriticalA11yViolations()
  })

  it('keeps actions free of critical accessibility violations and exposes workflow controls', async () => {
    render(<MemoryRouter initialEntries={['/app/recommendations?website=site-wikipedia']}><App /></MemoryRouter>)
    expect(screen.getByLabelText(/action queue summary/i)).toBeInTheDocument()
    expect(screen.getAllByRole('combobox', { name: /lifecycle status/i }).length).toBeGreaterThan(0)
    await expectNoCriticalA11yViolations()
  })

  it('supports keyboard-accessible mobile navigation', () => {
    render(<MemoryRouter initialEntries={['/app/websites/site-wikipedia']}><App /></MemoryRouter>)
    const toggle = screen.getByRole('button', { name: /open navigation/i })
    toggle.focus()
    expect(toggle).toHaveFocus()
    fireEvent.click(toggle)
    expect(screen.getByRole('button', { name: /close navigation/i })).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByRole('button', { name: /open navigation/i })).toHaveFocus()
    expect(screen.getByRole('button', { name: /open navigation/i })).toHaveAttribute('aria-expanded', 'false')
  })
})
