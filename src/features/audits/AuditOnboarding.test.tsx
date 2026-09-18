import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuditOnboarding } from './AuditOnboarding'
function renderOnboarding(url = '') { return render(<MemoryRouter initialEntries={[url ? `/app/audits/new?url=${encodeURIComponent(url)}` : '/app/audits/new']}><AuditOnboarding /></MemoryRouter>) }
describe('AuditOnboarding', () => {
  it('starts with a focused URL-first experience', () => { renderOnboarding(); expect(screen.getByRole('heading', { name: 'Start with your website.' })).toBeInTheDocument(); expect(screen.getByLabelText('Website URL')).toHaveFocus() })
  it('rejects invalid URLs before moving to priorities', () => { renderOnboarding(); fireEvent.change(screen.getByLabelText('Website URL'), { target: { value: 'not a url' } }); fireEvent.click(screen.getByRole('button', { name: 'Continue' })); expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid website address') })
  it('normalises a domain and lets the user choose priorities', () => { renderOnboarding('example.com'); fireEvent.click(screen.getByRole('button', { name: 'Continue' })); expect(screen.getByRole('heading', { name: 'What are you trying to improve?' })).toBeInTheDocument(); expect(screen.getByText('https://example.com')).toBeInTheDocument(); const speed = screen.getByRole('button', { name: /Website speed/ }); expect(speed).toHaveAttribute('aria-pressed', 'false'); fireEvent.click(speed); expect(speed).toHaveAttribute('aria-pressed', 'true'); expect(screen.getByText('1 audit area selected')).toBeInTheDocument() })
})