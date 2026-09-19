import { useMemo, useState } from 'react'
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
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const run = async () => {
    if (!isValidUrl(url)) { setError('Enter a valid HTTP or HTTPS URL.'); return }
    setRunning(true); setError(''); setProgress([])
    const auditStarted = performance.now()
    try {
      const result = await new ServerAuditProvider().runAudit(url, categories)
      const website: typeof seedWebsites[number] = {
        id: `site-${Date.now()}`,
        name: new URL(url).hostname,
        url,
        createdAt: new Date().toISOString(),
      }
      const audit: Audit = {
        id: `audit-${Date.now()}`,
        websiteId: website.id,
        url,
        createdAt: new Date().toISOString(),
        ...result,
        stats: {
          ...result.stats,
          discovery: {
            finalUrl: url,
            https: new URL(url).protocol === 'https:',
            robotsFound: false,
            sitemapFound: false,
            discoveredPageCount: 1,
            technologies: [],
          },
          pageScope: 'single-page',
          source: 'live',
        },
        durationMs: Math.round(performance.now() - auditStarted),
      }
      storage.saveWebsites([...seedWebsites, website])
      storage.saveAudits([...seedAudits, audit])
      void categories
      navigate(`/app/audits/${audit.id}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Ottimo could not complete discovery.')
    } finally {
      setRunning(false)
    }
  }

  return <div className="narrow stack">
    <div className="page-heading"><div><span className="eyebrow">Website audit</span><h1>Understand the rendered page before prioritising improvements.</h1><p>Ottimo runs the server-side audit engine against the website so browser, accessibility, SEO and technical evidence are collected outside the React client.</p></div></div>
    <Card>
      <label>Website URL<input disabled value={url} aria-describedby="url-help" /></label>
      <p id="url-help" className="muted">Discovery starts from the URL you selected during onboarding.</p>
      {error && <p className="error" role="alert">{error}</p>}
      <Button disabled={running} onClick={run}>{running ? 'Discovering...' : 'Start discovery'}</Button>
      {running && <div className="audit-progress" aria-live="polite"><div>◌ · Running the rendered audit engine</div><div>· Collecting browser, accessibility, SEO and technical evidence</div></div>}
    </Card>
  </div>
}

export function AuditDetail() { const { id } = useParams(); const audit = [...seedAudits, ...storage.audits()].find(item => item.id === id); if (!audit) return <Card><h1>Audit not found</h1><Link to="/app/audits">Back to audits</Link></Card>; return <div className="stack"><div className="page-heading"><div><span className="eyebrow">Audit result</span><h1>{audit.url}</h1><p>{formatDate(audit.createdAt)} · completed in {audit.durationMs}ms</p></div><div className="result-score"><strong>{audit.score ?? "—"}</strong><span>{audit.score === undefined ? "not measured" : "/ 100"}</span></div></div><div className="grid-3">{audit.scores.map(score => <Card key={score.category}><span className="muted">{categoryLabels[score.category]}</span><div className="mini-score"><strong>{score.score ?? "—"}</strong>{score.score === undefined ? <small>Not measured</small> : <Progress value={score.score} />}</div></Card>)}</div><Card><div className="section-head"><div><span className="eyebrow">Findings</span><h2>What needs attention</h2></div><span className="muted">{audit.issues.length} findings</span></div><IssueTable issues={audit.issues} /></Card></div> }

export function IssueTable({ issues }: { issues: Audit['issues'] }) { const [search, setSearch] = useState(''); const [severity, setSeverity] = useState('all'); const [status, setStatus] = useState('all'); const shown = useMemo(() => issues.filter(issue => (severity === 'all' || issue.severity === severity) && (status === 'all' || issue.status === status) && `${issue.title} ${issue.summary}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => b.priority - a.priority), [issues, search, severity, status]); return <><div className="filters"><input aria-label="Search issues" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search issues..." /><select aria-label="Filter severity" value={severity} onChange={event => setSeverity(event.target.value as Severity | 'all')}><option value="all">All severity</option><option>critical</option><option>high</option><option>medium</option><option>low</option></select><select aria-label="Filter status" value={status} onChange={event => setStatus(event.target.value as Status | 'all')}><option value="all">All status</option><option value="open">open</option><option value="in_progress">in progress</option><option value="resolved">resolved</option></select></div><div className="issue-list">{shown.map(issue => <article className="issue" key={issue.id}><div className="issue-top"><div><Badge tone={issue.severity}>{issue.severity}</Badge> <span className="muted">{categoryLabels[issue.category as Category]}</span><h3>{issue.title}</h3></div><strong>#{issue.priority}</strong></div><p>{issue.summary}</p>{issue.criterion && <p className="criterion"><strong>Standard:</strong> {issue.criterion}</p>}<div className="impact-grid"><div><small>Business impact</small><p>{issue.impact}</p></div><div><small>Recommendation</small><p>{issue.solution}</p></div></div><div className="issue-foot"><span>{issue.effort} effort</span><Badge tone={issue.status}>{issue.status.replace('_', ' ')}</Badge>{issue.standards?.map(standard => <span className="standard-tag" key={standard}>{standard}</span>)}</div></article>)}</div></> }
