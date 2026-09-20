import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppErrorBoundary } from './AppErrorBoundary'

function ThrowingView() {
  throw new Error('test render failure')
}

describe('AppErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('contains render failures in an accessible recovery surface', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(
      <AppErrorBoundary>
        <ThrowingView />
      </AppErrorBoundary>,
    )

    expect(screen.getByRole('heading', { name: /could not finish loading this view/i })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(/unexpected runtime error/i)
    expect(screen.getByRole('button', { name: /reload ottimo/i })).toBeInTheDocument()
  })
})
