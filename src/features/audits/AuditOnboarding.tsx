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
  const location = useLocation(), navigate = useNavigate()
  const queryUrl = new URLSearchParams(location.search).get('url') ?? ''
  const [step, setStep] = useState<1 | 2>(1), [url, setUrl] = useState(queryUrl), [goals, setGoals] = useState<Goal[]>(['everything']), [error, setError] = useState('')
  const selectedCategories = useMemo<Category[] | undefined>(() => goals.includes('everything') ? undefined : goals as Category[], [goals])
  const toggleGoal = (goal: Goal) => {
    if (goal === 'everything') return setGoals(['everything'])
    setGoals(current => {
      const withoutEverything = current.filter(item => item !== 'everything')
      const next = withoutEverything.includes(goal) ? withoutEverything.filter(item => item !== goal) : [...withoutEverything, goal]
      return next.length ? next : ['everything']
    })
  }
  const continueToGoals = () => {
    const normalised = normaliseUrl(url)
    if (!isValidUrl(normalised)) return setError('Enter a valid website address, such as https://example.com.')
    setError(''); setUrl(normalised); setStep(2)
  }
  const startAudit = () => {
    const params = new URLSearchParams({ url })
    if (selectedCategories) params.set('categories', selectedCategories.join(','))
    navigate(`/app/audits/new/run?${params.toString()}`)
  }
  return <div className="onboarding">
    <div className="onboarding-intro"><span className="eyebrow">New audit</span><p className="onboarding-step">Step {step} of 2</p>
      <h1>{step === 1 ? 'Start with your website.' : 'What are you trying to improve?'}</h1>
      <p>{step === 1 ? 'Give Ottimo a public URL. We will use it as the starting point for discovery and analysis.' : 'Choose the areas that matter most right now. You can always run a broader audit later.'}</p>
    </div>
    <div className="onboarding-progress" aria-label="Onboarding progress"><span className="active">1 <span>Website</span></span><i aria-hidden="true" /><span className={step === 2 ? 'active' : ''}>2 <span>Priorities</span></span></div>
    {step === 1 ? <Card className="onboarding-card"><label htmlFor="website-url">Website URL</label>
      <input id="website-url" autoFocus inputMode="url" autoComplete="url" placeholder="https://example.com" value={url} onChange={event => { setUrl(event.target.value); setError('') }} onKeyDown={event => { if (event.key === 'Enter') continueToGoals() }} aria-invalid={Boolean(error)} aria-describedby={error ? 'url-error' : 'url-help'} />
      {error ? <p id="url-error" className="error" role="alert">{error}</p> : <p id="url-help" className="muted">You can enter a domain without https:// and Ottimo will normalise it.</p>}
      <div className="onboarding-actions"><Button onClick={continueToGoals}>Continue</Button></div>
    </Card> : <Card className="onboarding-card">
      <div className="onboarding-site"><span className="onboarding-site-mark" aria-hidden="true">↗</span><div><small>Website</small><strong>{url}</strong></div><button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>Change</button></div>
      <fieldset className="goal-grid"><legend className="sr-only">Audit priorities</legend>{goalOptions.map(goal => {
        const selected = goals.includes(goal.id)
        return <button type="button" key={goal.id} className={selected ? 'goal-card selected' : 'goal-card'} aria-pressed={selected} onClick={() => toggleGoal(goal.id)}><span className="goal-check" aria-hidden="true">{selected ? '✓' : ''}</span><strong>{goal.label}</strong><span>{goal.description}</span></button>
      })}</fieldset>
      <div className="onboarding-summary" aria-live="polite"><strong>{goals.includes('everything') ? 'Broad audit selected' : \`\${goals.length} audit \${goals.length === 1 ? 'area' : 'areas'} selected\`}</strong><span>{goals.includes('everything') ? 'Performance, accessibility, SEO, usability and technical health.' : goals.map(id => goalOptions.find(goal => goal.id === id)?.label).filter(Boolean).join(' · ')}</span></div>
      <div className="onboarding-actions"><Button variant="secondary" onClick={() => setStep(1)}>Back</Button><Button onClick={startAudit}>Start discovery</Button></div>
    </Card>}
  </div>
}
