import type { TenantPrincipal } from './persistence'

export interface AuthenticatedSession extends TenantPrincipal {
  sessionId: string
  expiresAt: string
}

export interface SessionVerifier {
  verify(request: Request): Promise<AuthenticatedSession | undefined>
}

export function requireSession(session: AuthenticatedSession | undefined): AuthenticatedSession {
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) {
    throw new Error('AUTHENTICATION_REQUIRED')
  }
  return session
}

export function assertSessionTenant(session: AuthenticatedSession, tenantId: string): void {
  requireSession(session)
  if (session.tenantId !== tenantId) throw new Error('TENANT_ACCESS_DENIED')
}
