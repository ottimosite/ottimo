import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export interface ClientAuthSession {
  authenticated: boolean
  userId?: string
  tenantId?: string
  expiresAt?: string
}

interface AuthContextValue {
  session: ClientAuthSession
  loading: boolean
  error?: string
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const demoSession: ClientAuthSession = {
  authenticated: true,
  userId: 'demo-user',
  tenantId: 'demo-tenant',
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const authRequired = import.meta.env.VITE_AUTH_REQUIRED === 'true'
const authLoginUrl = import.meta.env.VITE_AUTH_LOGIN_URL as string | undefined ?? '/.netlify/functions/auth-login'

async function readSession(): Promise<ClientAuthSession> {
  if (!authRequired) return demoSession
  const response = await fetch('/.netlify/functions/auth-session', {
    credentials: 'include',
    headers: { accept: 'application/json' },
  })
  if (response.status === 401) return { authenticated: false }
  if (!response.ok) throw new Error('AUTH_SESSION_UNAVAILABLE')
  return await response.json() as ClientAuthSession
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ClientAuthSession>({ authenticated: !authRequired })
  const [loading, setLoading] = useState(authRequired)
  const [error, setError] = useState<string>()

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(undefined)
    try {
      setSession(await readSession())
    } catch {
      setSession({ authenticated: false })
      setError('We could not confirm your session. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authRequired) return
    void refresh()
    const timer = window.setInterval(() => void refresh(), 60_000)
    return () => window.clearInterval(timer)
  }, [refresh])

  const signOut = useCallback(async () => {
    if (!authRequired) {
      setSession({ authenticated: false })
      return
    }
    await fetch('/.netlify/functions/auth-signout', { method: 'POST', credentials: 'include' })
    setSession({ authenticated: false })
  }, [])

  const value = useMemo(() => ({ session, loading, error, refresh, signOut }), [session, loading, error, refresh, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export function ProtectedWorkspace({ children }: { children: ReactNode }) {
  const { session, loading, error, refresh } = useAuth()

  if (loading) {
    return <main className="auth-state"><span className="eyebrow">Ottimo workspace</span><h1>Checking your session…</h1><p>We are confirming access before loading workspace data.</p></main>
  }

  if (!session.authenticated) {
    return <main className="auth-state"><span className="eyebrow">Authentication required</span><h1>Sign in to your Ottimo workspace.</h1><p>{error ?? 'Your session is missing or has expired. Your website data remains protected until access is restored.'}</p><div className="hero-actions">{authLoginUrl ? <a className="btn btn-primary" href={authLoginUrl}>Sign in</a> : <button className="btn btn-primary" type="button" onClick={() => void refresh()}>Try again</button>}</div></main>
  }

  return <>{children}</>
}
