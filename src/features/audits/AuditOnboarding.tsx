import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Card } from '../../components/ui'
import { isValidUrl, normaliseUrl } from '../../lib/validation'
import { seedAudits, seedWebsites } from '../../data/mock'
import { storage } from '../../services/storage'
import type { Category } from '../../types/domain'

type Goal = Exclude<Category, 'ai'> | 'everything'
const goalOptions: { id: Goal; label: string; description: string }[] = [
  { id: 'performance', label: 'Website speed', description: 'Loading, responsiveness and Core Web Vitals.' },
  { id: 'seo', label: 'Search visibility', description: 'Crawlability, metadata, structure and indexability.' },
  { id: 'accessibility', label: 'Accessibility', description: 'Inclusive structure, navigation and content.' },
  { id: 'usability', label: 'User experience', description: 'Clear journeys, mobile behaviour and interaction signals.' },
  { id: 'technical', label: 'Technical health', description: 'Links, resources, redirects and site integrity.' },
  { id: 'everything', label: 'Full audit', description: 'Run the broadest audit across every available domain.' },
]

export function AuditOnboarding() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const requestedUrl = params.get('url') ?? ''
  const requestedWebsiteId = params.get('website') ?? ''
  const requestedAuditId = params.get('audit') ?? ''

  const resolvedWebsite = useMemo(() => {
    const websites = [...seedWebsites, ...storage.websites()]
    if (requestedWebsiteId) return websites.find(site => site.id === requestedWebsiteId)
    if (requestedAuditId) {
      const audit = [...seedAudits, ...storage.audits()].find(item => item.id === requestedAuditId)
      return audit ? websites.find(site => site.id === audit.websiteId) : undefined
    }
    return undefined
  }, [requestedAuditId, requestedWebsiteId])

  const [url, setUrl] = useState(() => normaliseUrl(resolvedWebsite?.url ?? requestedUrl))
  const [goals, setGoals] = useState<Goal[]>(['everything'])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [error, setError] = useState('')

  const selectedCategories = useMemo<Category[] | undefined>(
    () => goals.includes('everything') ? undefined : goals as Category[],
    [goals],
  )

  const toggleGoal = (goal: Goal) => {
    if (goal === 'everything') return setGoals(['everything'])
    setGoals(current => {
      const withoutEverything = current.filter(item => item !== 'everything')
      const next = withoutEverything.includes(goal) ? withoutEverything.filter(item => item !== goal) : [...withoutEverything, goal]
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
    const query = new URLSearchParams({ url: normalised })
    if (selectedCategories) query.set('categories', selectedCategories.join(','))
    navigate('/app/audits/new/run?' + query.toString())
  }

  return <div className="onboarding">
    <div className="onboarding-intro">
      <span className="eyebrow">{resolvedWebsite ? 'Website audit' : 'New audit'}</span>
      <h1>{resolvedWebsite ? 'Run the next audit.' : 'Start with your website.'}</h1>
      <p>{resolvedWebsite ? 'Ottimo already knows this website. Review the target, then start the audit.' : 'Enter a public URL and Ottimo will discover, measure and explain what matters.'}</p>
    </div>

    <Card className="onboarding-card onboarding-card-single">
      <div className="onboarding-section">
        <div className="onboarding-section-heading">
          <div><span className="eyebrow">Step 1</span><h2>Website to audit</h2></div>
          {resolvedWebsite && <span className="optional-tag">Saved website</span>}
        </div>
        <label htmlFor="website-url" className="sr-only">Website URL</label>
        <input id="website-url" autoFocus={!resolvedWebsite} inputMode="url" autoComplete="url" placeholder="https://example.com" value={url} onChange={event => { setUrl(event.target.value); setError('') }} onKeyDown={event => { if (event.key === 'Enter') startAudit() }} aria-invalid={Boolean(error)} aria-describedby={error ? 'url-error' : 'url-help'} />
        {error ? <p id="url-error" className="error" role="alert">{error}</p> : <p id="url-help" className="muted">You can enter a domain without https:// and Ottimo will normalise it.</p>}
      </div>

      <div className="onboarding-divider" />

      <div className="onboarding-section">
        <div className="onboarding-section-heading">
          <div><span className="eyebrow">Step 2 · optional</span><h2>Focus the audit</h2></div>
          <button type="button" className="btn btn-ghost" aria-expanded={showAdvanced} onClick={() => setShowAdvanced(value => !value)}>{showAdvanced ? 'Hide options' : 'Advanced options'}</button>
        </div>
        <p className="muted onboarding-future">By default Ottimo runs the full audit. Open advanced options only if you want to focus on specific domains.</p>
        {showAdvanced && <fieldset className="goal-grid">
          <legend className="sr-only">Audit priorities</legend>
          {goalOptions.map(goal => {
            const selected = goals.includes(goal.id)
            return <button type="button" key={goal.id} className={selected ? 'goal-card selected' : 'goal-card'} aria-pressed={selected} onClick={() => toggleGoal(goal.id)}>
              <span className="goal-check" aria-hidden="true">{selected ? '✓' : ''}</span><strong>{goal.label}</strong><span>{goal.description}</span>
            </button>
          })}
        </fieldset>}
      </div>

      <div className="onboarding-summary">
        <strong>{goals.includes('everything') ? 'Full audit selected' : goals.length + ' audit ' + (goals.length === 1 ? 'area' : 'areas') + ' selected'}</strong>
        <span>{resolvedWebsite ? 'This audit will be added to the existing website history.' : 'Ottimo will create a website record if this is a new property.'}</span>
      </div>

      <div className="onboarding-actions onboarding-actions-primary">
        <Button onClick={startAudit}>Run audit <span aria-hidden="true">→</span></Button>
      </div>
    </Card>
  </div>
}
