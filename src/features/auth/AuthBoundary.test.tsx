import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider, ProtectedWorkspace } from './AuthBoundary'

describe('authentication boundary', () => {
  it('keeps the local demo workspace available without production auth enabled', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ProtectedWorkspace><div>Protected workspace</div></ProtectedWorkspace>
        </AuthProvider>
      </MemoryRouter>,
    )
    expect(screen.getByText('Protected workspace')).toBeInTheDocument()
  })
})
