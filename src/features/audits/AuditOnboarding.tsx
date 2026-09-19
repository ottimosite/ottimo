import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Card } from '../../components/ui'
import { isValidUrl, normaliseUrl } from '../../lib/validation'
import type { Category } from '../../types/domain'

type Goal = Exclude<Category, 'ai'> | 'everything'
const goalOptions: { id: Goal; label: string; description: string }[] = [
  { id: 'performance', label: 'Website speed', description: 'Loading, responsiveness and Core Web Vitals.' },
  { id: 'seo', label: 'Search visibility', description: 'Crawlability, metadata, structure and indexability.' },
  { id: 'accessibility', label: 'Accessibility', description: 'Inclusive structure, navigation and content.' },
  { id: 'usability', label: 'User experience', description: 'Clear journeys, mobile behaviour and interaction signals.' },
  { id: 'technical', label: 'Technical health', description: 'Links, resources, redirects and site integrity.' },
  { id: 'everything', label: 'Everything', description: 'Run the broadest audit across every available domain.' },
]
export function AuditOnboarding() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryUrl = new URLSearchParams(location.search).get('url') ?? ''
  const queryCategories = new URLSearchParams(location.search).get('categories')?.split(',').filter(Boolean) ?? []
  const [url, setUrl] = useState(queryUrl)
  const [goals, setGoals] = useState<Goal[]>(queryCategories.length ? queryCategories as Goal[] : ['everything'])
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const selectedCategories = useMemo<Category[] | undefined>(
    () => goals.includes('everything') ? undefined : goals as Category[],
    [goals],
  )

  const toggleGoal = (goal: Goal) => {
    if (goal === 'everything') return setGoals(['everything'])
    setGoals(current => {
      const withoutEverything = current.filter(item => item !== 'everything')
      const next = withoutEverything.includes(goal)
        ? withoutEverything.filter(item => item !== goal)
        : [...withoutEverything, goal]
      return next.length ? next : ['everything']
    })
  }

  const startAudit = () => {
    const normalised = normaliseUrl(url)
    if (!isValidUrl(normalised)) {
      setError('Enter a valid website address, such as https://example.com.')
      return
    }

    setError('')
    setUrl(normalised)

    const params = new URLSearchParams({ url: normalised })
    if (selectedCategories) params.set('categories', selectedCategories.join(','))
    // Reserved for the future account/reporting flow. Nothing is submitted remotely yet.
    if (email.trim()) params.set('email', email.trim())

    navigate(\`/app/audits/new/run?\${params.toString()}\`)
  }

  return <div className="onboarding">
    <div className="onboarding-intro">
      <span className="eyebrow">New audit</span>
      <h1>Let's start with your website.</h1>
      <p>Give Ottimo a public URL. The essentials are above; optional details below help shape what you see without adding another step.</p>
    </div>

    <Card className="onboarding-card onboarding-card-single">
      <div className="onboarding-section">
        <div>
          <span className="eyebrow">01 · Website</span>
          <h2>Which website should we inspect?</h2>
          <p className="muted">Enter your public website. Ottimo will normalise the address before starting the audit.</p>
        </div>
        <label htmlFor="website-url" className="sr-only">Website URL</label>
        <input id="website-url" autoFocus inputMode="url" autoComplete="url" placeholder="https://example.com" value={url} onChange={event => { setUrl(event.target.value); setError('') }} aria-invalid={Boolean(error)} aria-describedby={error ? 'url-error' : 'url-help'} onKeyDown={event => { if (event.key === 'Enter') startAudit() }} />
        {error ? <p id="url-error" className="error" role="alert">{error}</p> : <p id="url-help" className="muted">No account is required to run the audit.</p>}
      </div>

      <div className="onboarding-divider" />

      <div className="onboarding-section">
        <div className="onboarding-section-heading">
          <div>
            <span className="eyebrow">02 · Optional</span>
            <h2>What matters most to you?</h2>
            <p className="muted">Choose a focus or leave it broad. You can change this later.</p>
          </div>
          <span className="optional-tag">Optional</span>
        </div>

        <fieldset className="goal-grid">
          <legend className="sr-only">Audit priorities</legend>
          <button type="button" className={goals.includes('everything') ? 'goal-card selected goal-card-wide' : 'goal-card goal-card-wide'} aria-pressed={goals.includes('everything')} onClick={() => toggleGoal('everything')}>
            <span className="goal-check" aria-hidden="true">{goals.includes('everything') ? '✓' : ''}</span>
            <strong>Everything</strong>
            <span>Performance, accessibility, SEO, usability and technical health.</span>
          </button>
          {goalOptions.map(goal => {
            const selected = goals.includes(goal.id)
            return <button type="button" key={goal.id} className={selected ? 'goal-card selected' : 'goal-card'} aria-pressed={selected} onClick={() => toggleGoal(goal.id)}>
              <span className="goal-check" aria-hidden="true">{selected ? '✓' : ''}</span>
              <strong>{goal.label}</strong>
              <span>{goal.description}</span>
            </button>
          })}
        </fieldset>
      </div>

      <div className="onboarding-divider" />

      <div className="onboarding-section onboarding-future">
        <div>
          <span className="eyebrow">03 · Optional</span>
          <h2>Want to save this for later?</h2>
          <p className="muted">Email registration will be added here later. For now, this field is optional and is not sent anywhere.</p>
        </div>
        <label htmlFor="audit-email">Email address <span className="muted">(optional)</span></label>
        <input id="audit-email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} />
      </div>

      <div className="onboarding-summary" aria-live="polite">
        <strong>{goals.includes('everything') ? 'Broad audit selected' : \`\${goals.length} audit \${goals.length === 1 ? 'area' : 'areas'} selected\`}</strong>
        <span>{goals.includes('everything') ? 'Ottimo will inspect the broadest available set of signals.' : goals.map(id => goalOptions.find(goal => goal.id === id)?.label).filter(Boolean).join(' · ')}</span>
      </div>

      <div className="onboarding-actions onboarding-actions-primary">
        <Button onClick={startAudit}>Analyse my website <span aria-hidden="true">↗</span></Button>
      </div>
    </Card>
  </div>
}
