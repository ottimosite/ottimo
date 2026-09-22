import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PageHeading } from './ui'

describe('PageHeading', () => {
  it('renders the shared heading structure and optional action', () => {
    render(<PageHeading eyebrow="Overview" title="A clear title" description="Supporting context." action={<button type="button">Run audit</button>} />)

    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'A clear title' })).toBeInTheDocument()
    expect(screen.getByText('Supporting context.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Run audit' })).toBeInTheDocument()
  })
})
