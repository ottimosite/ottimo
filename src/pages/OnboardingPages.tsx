import { FormEvent, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Card } from '../components/ui'
import { isValidUrl, normaliseUrl } from '../lib/validation'

export function OnboardingPage() {
  const location = useLocation()
  const initialUrl = new URLSearchParams(location.search).get('url') ?? ''
  const [websiteUrl, setWebsiteUrl] = useState(normaliseUrl(initialUrl))
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const url = normaliseUrl(websiteUrl)
    const normalisedEmail = email.trim().toLowerCase()
    if (!isValidUrl(url)) {
      setError('Enter a valid website address, such as https://example.com.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalisedEmail)) {
      setError('Enter a valid email address.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await fetch('/.netlify/functions/onboarding-start', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ websiteUrl: url, email: normalisedEmail }),
      })
      const body = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) throw new Error(body.error ?? 'We could not start onboarding.')
      setSubmittedEmail(normalisedEmail)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not start onboarding.')
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    if (!submittedEmail) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/.netlify/functions/auth-resend', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ email: submittedEmail }),
      })
      if (!response.ok) throw new Error('We could not resend the email. Please try again shortly.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not resend the email.')
    } finally {
      setLoading(false)
    }
  }

  if (submittedEmail) {
    return <main className="onboarding-page" aria-labelledby="onboarding-success-title">
      <div className="onboarding-page-intro">
        <span className="eyebrow">Check your email</span>
        <h1 id="onboarding-success-title">Your audit starts with one confirmation.</h1>
        <p>We sent a verification email to <strong>{submittedEmail}</strong>. Confirm the address to establish your secure Ottimo session and continue to your website audit.</p>
      </div>
      <Card className="onboarding-card">
        <div className="onboarding-success" role="status" aria-live="polite">
          <strong>Waiting for confirmation</strong>
          <span>The audit stays unavailable until your email is confirmed.</span>
          <div className="hero-actions">
            <button className="btn btn-secondary" type="button" onClick={() => void resend()} disabled={loading}>{loading ? 'Sending…' : 'Resend verification'}</button>
            <Link className="btn btn-ghost" to="/start">Use another email</Link>
          </div>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
      </Card>
    </main>
  }

  return <main className="onboarding-page" aria-labelledby="onboarding-title">
    <div className="onboarding-page-intro">
      <span className="eyebrow">Start with your website</span>
      <h1 id="onboarding-title">Give Ottimo a website. We’ll take it from there.</h1>
      <p>No profile forms or unnecessary setup. Enter the website you want to understand and the email address you want to use for your secure workspace.</p>
    </div>
    <Card className="onboarding-card">
      <form onSubmit={submit} noValidate>
        <div className="onboarding-section">
          <label htmlFor="onboarding-url">Website URL</label>
          <input id="onboarding-url" autoFocus inputMode="url" autoComplete="url" value={websiteUrl} onChange={event => { setWebsiteUrl(event.target.value); setError('') }} placeholder="https://example.com" aria-describedby="onboarding-url-help" />
          <p id="onboarding-url-help" className="muted">Ottimo analyses publicly accessible website evidence. You can review the audit before acting on its findings.</p>
        </div>
        <div className="onboarding-section">
          <label htmlFor="onboarding-email">Email address</label>
          <input id="onboarding-email" type="email" autoComplete="email" value={email} onChange={event => { setEmail(event.target.value); setError('') }} placeholder="you@example.com" />
          <p className="muted">We’ll use this address for verification and future workspace access.</p>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="onboarding-reassurance" role="note"><strong>What happens next</strong><span>We create your secure workspace and website record, send a verification email, and keep audit data locked until confirmation.</span></div>
        <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Starting…' : 'Create my workspace'} <span aria-hidden="true">→</span></button>
      </form>
    </Card>
  </main>
}

export function AuthErrorPage() {
  return <main className="auth-state"><span className="eyebrow">Email verification</span><h1>That verification link could not be completed.</h1><p>The link may be invalid, expired, or already used. Start again or request another verification email from the onboarding screen.</p><div className="hero-actions"><Link className="btn btn-primary" to="/start">Return to onboarding</Link></div></main>
}
