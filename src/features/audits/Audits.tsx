import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { categoryLabels, seedAudits, seedWebsites } from '../../data/mock'
import { ServerAuditProvider } from '../../services/server-audit'
import { storage } from '../../services/storage'
import type { Audit, Category, Severity, Status } from '../../types/domain'
import { Badge, Button, Card, Progress } from '../../components/ui'
import { formatDate } from '../../lib/format'
import { isValidUrl, normaliseUrl } from '../../lib/validation'

export function AuditList() { const [audits] = useState(() => storage.audits().length ? storage.audits() : seedAudits); return <div className="stack"><div className="page-heading"><div><span className="eyebrow">Audits</span><h1>Turn a URL into a clear action plan.</h1><p>Run the live audit engine against the rendered website and turn its evidence into an action plan.</p></div><Link className="btn btn-primary" to="/app/audits/new">New audit</Link></div><Card><div className="audit-list">{audits.map(audit => <Link className="audit-item" key={audit.id} to={`/app/audits/${audit.id}`}><span className="audit-score">{audit.score ?? "—"}</span><span><strong>{seedWebsites.find(website => website.id === audit.websiteId)?.name ?? audit.url}</strong><small>{formatDate(audit.createdAt)} · {audit.issues.filter(issue => issue.status !== 'resolved').length} open issues</small></span><span>→</span></Link>)}</div></Card></div> }

export function NewAudit() {
  const location = useLocation()
  const initialUrl = new URLSearchParams(location.search).get('url') ?? 'https://example.com'
  const categories = new URLSearchParams(location.search).get('categories')?.split(',').filter(Boolean) ?? []
  const [url] = useState(normaliseUrl(initialUrl))
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const run = async () => {
      if (!isValidUrl(url)) {
        setError('The website address is not valid.')
        return
      }

      const auditStarted = performance.now()
      try {
        const result = await new ServerAuditProvider().runAudit(url, categories)
        const website: typeof seedWebsites[number] = {
          id: 'site-' + Date.now(),
          name: new URL(url).hostname,
          url,
          createdAt: new Date().toISOString(),
        }
        const audit: Audit = {
          id: 'audit-' + Date.now(),
          websiteId: website.id,
          url,
          createdAt: new Date().toISOString(),
          ...result,
          stats: { ...result.stats, pageScope: 'site-crawl', source: 'live' },
          durationMs: Math.round(performance.now() - auditStarted),
        }
        storage.saveWebsites([...seedWebsites, website])
        storage.saveAudits([...seedAudits, audit])
        navigate('/app/audits/' + audit.id, { replace: true })
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Ottimo could not complete the audit.')
      }
    }

    void run()
  }, [categories, navigate, url])

  return <div className="audit-loading">
    <div className="audit-loading-copy">
      <span className="eyebrow">Ottimo audit</span>
      <h1>{error ? 'We could not complete the audit.' : 'Your report is being built.'}</h1>
      <p>{error ? 'The audit service returned an error. You can retry without starting the onboarding process again.' : 'We are rendering the site, collecting evidence and turning it into a useful report. You do not need to do anything else.'}</p>
    </div>
    <Card className="audit-loading-card">
      <div className="audit-loading-site">
        <span className="onboarding-site-mark" aria-hidden="true">↗</span>
        <div><small>Analysing</small><strong>{url}</strong></div>
      </div>
      {error ? <div className="audit-loading-error" role="alert"><p>{error}</p><Button onClick={() => window.location.reload()}>Try again</Button></div> : <div className="audit-loading-steps" aria-live="polite">
        <div className="audit-loading-step active"><span>01</span><div><strong>Discovering the rendered site</strong><small>Checking the page and its internal paths.</small></div><i aria-hidden="true">✓</i></div>
        <div className="audit-loading-step active"><span>02</span><div><strong>Collecting evidence</strong><small>Performance, accessibility, SEO and technical signals.</small></div><i aria-hidden="true">✓</i></div>
        <div className="audit-loading-step current"><span>03</span><div><strong>Building your report</strong><small>Turning observations into findings and recommendations.</small></div><i aria-hidden="true">◌</i></div>
      </div>}
    </Card>
  </div>
}

export function AuditDetail() { const { id } = useParams(); const audit = [...seedAudits, ...storage.audits()].find(item => item.id === id); if (!audit) return <Card><h1>Audit not found</h1><Link to="/app/audits">Back to audits</Link></Card>; return <div className="stack"><div className="page-heading"><div><span className="eyebrow">Audit result</span><h1>{audit.url}</h1><p>{formatDate(audit.createdAt)} · completed in {audit.durationMs}ms</p></div><div className="result-score"><strong>{audit.score ?? "—"}</strong><span>{audit.score === undefined ? "not measured" : "/ 100"}</span></div></div><div className="grid-3">{audit.scores.map(score => <Card key={score.category}><span className="muted">{categoryLabels[score.category]}</span><div className="mini-score"><strong>{score.score ?? "—"}</strong>{score.score === undefined ? <small>Not measured</small> : <Progress value={score.score} />}</div></Card>)}</div><Card><div className="section-head"><div><span className="eyebrow">Findings</span><h2>What needs attention</h2></div><span className="muted">{audit.issues.length} findings</span></div><IssueTable issues={audit.issues} /></Card></div> }

export function IssueTable({ issues }: { issues: Audit['issues'] }) { const [search, setSearch] = useState(''); const [severity, setSeverity] = useState('all'); const [status, setStatus] = useState('all'); const shown = useMemo(() => issues.filter(issue => (severity === 'all' || issue.severity === severity) && (status === 'all' || issue.status === status) && `${issue.title} ${issue.summary}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => b.priority - a.priority), [issues, search, severity, status]); return <><div className="filters"><input aria-label="Search issues" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search issues..." /><select aria-label="Filter severity" value={severity} onChange={event => setSeverity(event.target.value as Severity | 'all')}><option value="all">All severity</option><option>critical</option><option>high</option><option>medium</option><option>low</option></select><select aria-label="Filter status" value={status} onChange={event => setStatus(event.target.value as Status | 'all')}><option value="all">All status</option><option value="open">open</option><option value="in_progress">in progress</option><option value="resolved">resolved</option></select></div><div className="issue-list">{shown.map(issue => <article className="issue" key={issue.id}><div className="issue-top"><div><Badge tone={issue.severity}>{issue.severity}</Badge> <span className="muted">{categoryLabels[issue.category as Category]}</span><h3>{issue.title}</h3></div><strong>#{issue.priority}</strong></div><p>{issue.summary}</p>{issue.criterion && <p className="criterion"><strong>Standard:</strong> {issue.criterion}</p>}<div className="impact-grid"><div><small>Business impact</small><p>{issue.impact}</p></div><div><small>Recommendation</small><p>{issue.solution}</p></div></div><div className="issue-foot"><span>{issue.effort} effort</span><Badge tone={issue.status}>{issue.status.replace('_', ' ')}</Badge>{issue.standards?.map(standard => <span className="standard-tag" key={standard}>{standard}</span>)}</div></article>)}</div></> }
