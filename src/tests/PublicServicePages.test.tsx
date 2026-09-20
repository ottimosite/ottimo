import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { PublicServicePage } from '../pages/PublicServicePages'

describe('public service pages', () => {
  it.each([
    ['performance', /make important pages faster/i, /resource and asset analysis/i],
    ['seo', /help search systems understand/i, /search console integration boundary/i],
    ['accessibility', /build journeys more people can use/i, /keyboard and focus evidence/i],
    ['usability', /remove friction from the journeys that matter/i, /action and verification workflow/i],
    ['technical', /make the foundations dependable/i, /technical site signals/i],
    ['ai', /make your website useful to people and machines/i, /structured information signals/i],
  ])('renders a differentiated %s service page', (slug, title, capability) => {
    render(<MemoryRouter><PublicServicePage slug={slug} /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    expect(screen.getByText(capability)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /observed findings stay distinct from inference/i })).toBeInTheDocument()
  })
})
