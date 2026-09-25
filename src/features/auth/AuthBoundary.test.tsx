import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider, ProtectedWorkspace, requiresAuthentication } from './AuthBoundary'

describe('authentication boundary', () => {
  it('requires authentication for production builds even when the feature flag is absent', () => {
    expect(requiresAuthentication({ production: true, configured: undefined, mode: 'production' })).toBe(true)
    expect(requiresAuthentication({ production: true, configured: 'false', mode: 'production' })).toBe(true)
    expect(requiresAuthentication({ production: false, configured: 'true', mode: 'development' })).toBe(true)
    expect(requiresAuthentication({ production: false, configured: undefined, mode: 'development' })).toBe(false)
    expect(requiresAuthentication({ production: true, configured: undefined, mode: 'e2e' })).toBe(false)
  })

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
