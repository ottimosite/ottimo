import { Link, useLocation, useParams } from 'react-router-dom'
import { auditScores, categoryLabels, seedAudits, seedWebsites } from '../../data/mock'
import { storage } from '../../services/storage'
import type { Category } from '../../types/domain'
import { Badge, Button, Card, Progress, Score } from '../../components/ui'
import { formatDate, titleCase } from '../../lib/format'

const categoryCopy: Record<Category, { title: string; body: string; next: string }> = {
  performance: { title: 'Performance you can feel', body: 'Find the rendering, asset and main-thread costs that slow down useful work.', next: 'Start with the largest contentful paint and the work that blocks interaction.' },
  accessibility: { title: 'Accessibility by default', body: 'Track the small implementation details that make a product usable by more people.', next: 'Resolve labels, focus order and contrast issues before polishing edge cases.' },
  seo: { title: 'Search health with context', body: 'Make pages easier for people and search systems to discover, understand and trust.', next: 'Improve page intent first, then strengthen the technical signals around it.' },
  usability: { title: 'Usability that moves work forward', body: 'See whether users can quickly understand the next useful action.', next: 'Reduce competing actions and make the primary decision obvious.' },
  technical: { title: 'A healthier technical foundation', body: 'Keep the implementation dependable, maintainable and ready to evolve.', next: 'Remove unnecessary work before adding another layer of tooling.' },
  ai: { title: 'AI readiness without the hype', body: 'Structure useful business knowledge so both people and machines can interpret it.', next: 'Start with consistent entities, semantic content and reliable source data.' },
}

function currentAudits() { return storage.audits().length ? storage.audits() : seedAudits }

export function CategoryPage({ category }: { category: Category }) {
  const location = useLocation()
  const websiteId = new URLSearchParams(location.search).get('website')
  const audits = websiteId ? currentAudits().filter(item => item.websiteId === websiteId) : currentAudits()
  const audit = audits.at(-1) ?? seedAudits.at(-1)!
  const score = audit.scores.find(item => item.category === category) ?? auditScores.find(item => item.category === category)!
  const issues = audit.issues.filter(issue => issue.category === category).sort((a, b) => b.priority - a.priority)
  const copy = categoryCopy[category]
  return <div className="stack">
    <div className="page-heading"><div><span className="eyebrow">{categoryLabels[category]}</span><h1>{copy.title}</h1><p>{copy.body}</p></div><Link className="btn btn-primary" to={`/app/audits/new/run?url=${encodeURIComponent(audit.url)}`}>Run another audit</Link></div>
    <div className="grid-2"><Card className="score-card"><div><span className="muted">Latest score</span>{score.score === undefined ? <div className="score"><strong>—</strong><span>Not measured</span></div> : <Score value={score.score} label={titleCase(category)} />}</div><div className="metric-copy"><span className="eyebrow">What next</span><p>{copy.next}</p><Link to="/app/recommendations">Open recommendations →</Link></div></Card><Card><span className="muted">Open findings</span><strong className="big-number">{issues.filter(issue => issue.status !== 'resolved').length}</strong><p>{issues.length} findings in the latest audit.</p></Card></div>
    <Card><div className="section-head"><div><span className="eyebrow">Latest signals</span><h2>Issues in this domain</h2></div>{score.score === undefined ? <span className="muted">Not measured</span> : <Progress value={score.score} />}</div><div className="issue-list">{issues.length ? issues.map(issue => <article className="issue" key={issue.id}><div className="issue-top"><div><Badge tone={issue.severity}>{issue.severity}</Badge><h3>{issue.title}</h3></div><strong>#{issue.priority}</strong></div><p>{issue.summary}</p><div className="issue-foot"><span>{issue.effort} effort</span><Badge tone={issue.status}>{titleCase(issue.status)}</Badge></div></article>) : <p className="muted">No findings are recorded for this category yet.</p>}</div></Card>
  </div>
}

export function WebsiteDetail() {
  const { id } = useParams()
  const websites = storage.websites().length ? storage.websites() : seedWebsites
  const website = websites.find(item => item.id === id)
  const audits = currentAudits().filter(audit => audit.websiteId === id).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  if (!website) return <Card><h1>Website not found</h1><p>The local demo could not find that property.</p><Link to="/app/websites">Back to websites</Link></Card>

  const latestAudit = audits.at(-1)
  const previousAudit = audits.at(-2)
  const health = latestAudit?.health
  const actions = latestAudit?.actions ?? []
  const activeActions = actions.filter(action => !['resolved', 'failed'].includes(action.lifecycleStatus))
  const blockedActions = actions.filter(action => action.dependencies.some(dependency => dependency.blocking && !actions.some(candidate => candidate.id === dependency.id && candidate.lifecycleStatus === 'resolved')))
  const verified = latestAudit?.verifications?.filter(item => item.status === 'verified').length ?? 0
  const changes = latestAudit?.comparison
  const model = website.healthModel
  const intelligence = model?.siteIntelligence

  return <div className="stack website-workspace">
    <div className="page-heading">
      <div><span className="eyebrow">Website workspace</span><h1>{website.name}</h1><p>{website.url}</p></div>
      <Link className="btn btn-primary" to={`/app/audits/new/run?url=${encodeURIComponent(website.url)}`}>Run audit</Link>
    </div>

    {!latestAudit ? <Card className="empty-state">
      <span className="eyebrow">Baseline needed</span>
      <h2>Start with an audit of this website.</h2>
      <p>Ottimo will build the persistent health model from observed evidence. Until then, traffic, acquisition and outcome data remain unavailable.</p>
      <Link className="btn btn-primary" to={`/app/audits/new/run?url=${encodeURIComponent(website.url)}`}>Create baseline</Link>
    </Card> : <>
      <Card className="website-health-primary">
        <div className="section-head"><div><span className="eyebrow">Current health</span><h2 id="website-health-heading">What needs attention now</h2></div><span className="standard-tag">{health?.status?.replace('-', ' ') ?? 'Not measured'}</span></div>
        <div className="website-health-score">
          <div className="result-score"><strong>{health?.score ?? '—'}</strong><span>{health?.score === undefined ? 'not measured' : '/ 100'}</span></div>
          <div><strong>{activeActions.length}</strong><span>active actions</span><small>{blockedActions.length} blocked · {verified} verified</small></div>
          <div><strong>{latestAudit.issues.filter(issue => issue.status !== 'resolved').length}</strong><span>open findings</span><small>{formatDate(latestAudit.createdAt)}</small></div>
        </div>
        <p className="performance-intro">This is the latest observed state of the website. It is not a measure of traffic, search acquisition, revenue or conversion performance.</p>
        <div className="hero-actions"><Link className="btn btn-primary" to={`/app/audits/${latestAudit.id}`}>Open latest audit</Link><Link className="text-link" to="/app/recommendations">View action queue →</Link></div>
      </Card>

      <div className="grid-2">
        <Card>
          <div className="section-head"><div><span className="eyebrow">Change</span><h2>What changed</h2></div>{changes && <Link to={`/app/audits/${latestAudit.id}`}>See audit detail →</Link>}</div>
          {changes ? <div className="website-change-grid"><div><strong>{changes.resolved}</strong><span>resolved</span></div><div><strong>{changes.improved}</strong><span>improved</span></div><div><strong>{changes.regressed}</strong><span>regressed</span></div><div><strong>{changes.newFindings}</strong><span>new findings</span></div></div> : <p className="muted">{previousAudit ? 'No comparison was recorded for the latest audit.' : 'This is the baseline audit. Future audits will show what changed.'}</p>}
        </Card>
        <Card>
          <div className="section-head"><div><span className="eyebrow">Evidence</span><h2>What Ottimo knows</h2></div><span className="standard-tag">{model?.pages.length ?? 0} pages</span></div>
          <div className="audit-command-stats"><div><strong>{latestAudit.issues.filter(issue => issue.evidence?.status === 'measured').length}</strong><span>measured findings</span></div><div><strong>{latestAudit.issues.filter(issue => issue.evidence?.status === 'inferred').length}</strong><span>inferred findings</span></div><div><strong>{latestAudit.issues.filter(issue => issue.evidence?.status === 'unavailable').length}</strong><span>unavailable</span></div></div>
          <p className="muted">Observed website readiness is kept separate from acquisition and business outcomes.</p>
        </Card>
      </div>

      <Card>
        <div className="section-head"><div><span className="eyebrow">Health by domain</span><h2>Where attention is concentrated</h2></div><span className="muted">Latest audit</span></div>
        <div className="health-domain-grid">
          {(['performance', 'accessibility', 'seo', 'usability', 'technical', 'ai'] as Category[]).map(category => {
            const categoryScore = latestAudit.scores.find(item => item.category === category)
            const coverage = model?.categoryCoverage[category] ?? (categoryScore?.score === undefined ? 'unavailable' : 'measured')
            const scoreLabel = categoryScore?.score === undefined ? '—' : categoryScore.score
            const href = `/app/${category === 'seo' ? 'search' : category === 'ai' ? 'ai-readiness' : category}?website=${encodeURIComponent(website.id)}`
            return <div className="health-domain" key={category}>
              <div className="health-domain__head"><span>{categoryLabels[category]}</span><strong>{scoreLabel}</strong></div>
              <div className="progress" aria-label={`${categoryLabels[category]} score`}><span style={{ width: `${categoryScore?.score ?? 0}%` }} /></div>
              <div className="health-domain__foot"><span className={`evidence-status evidence-status--${coverage}`}>{titleCase(coverage)}</span><Link to={href}>Open →</Link></div>
            </div>
          })}
        </div>
        <p className="muted">Scores and coverage describe observed audit evidence. Unavailable domains are not treated as zero.</p>
      </Card>

      <Card>
        <div className="section-head"><div><span className="eyebrow">Verification</span><h2>Is the work proving itself?</h2></div><Link to={`/app/audits/${latestAudit.id}`}>Review evidence →</Link></div>
        <div className="verification-summary">
          <div><strong>{verified}</strong><span>verified improvements</span></div>
          <div><strong>{actions.filter(action => action.lifecycleStatus === 'in_progress').length}</strong><span>in progress</span></div>
          <div><strong>{actions.filter(action => action.lifecycleStatus === 'planned').length}</strong><span>planned</span></div>
          <div><strong>{actions.filter(action => action.lifecycleStatus === 'failed').length}</strong><span>failed</span></div>
        </div>
        <p className="muted">Verification is based on subsequent audit evidence. A planned action is not presented as completed work.</p>
      </Card>

      <Card>
        <div className="section-head"><div><span className="eyebrow">Optimisation</span><h2>Work that can move the website forward</h2></div><Link to="/app/recommendations">Open all actions →</Link></div>
        {actions.length ? <div className="action-list">{actions.slice().sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 6).map(action => <Link className="action" to="/app/recommendations" key={action.id}><span><strong>{action.title}</strong><small>{action.affectedPages.length} affected page{action.affectedPages.length === 1 ? '' : 's'} · {action.effort} effort · {action.confidence} confidence</small></span><Badge tone={action.lifecycleStatus === 'resolved' ? 'resolved' : action.lifecycleStatus === 'in_progress' ? 'in_progress' : 'open'}>{titleCase(action.lifecycleStatus.replace('_', ' '))}</Badge></Link>)}</div> : <p className="muted">No optimisation actions have been generated by the latest audit.</p>}
      </Card>

      {model && <Card className="health-model-panel">
        <div className="section-head"><div><span className="eyebrow">Website model</span><h2>How Ottimo understands this website</h2></div><span className="standard-tag">v{model.version}</span></div>
        <p className="performance-intro">Page structure and journeys are inferred from observable site evidence. They are not claims about actual user behaviour.</p>
        <div className="audit-summary-grid">
          <div><span className="muted">Page types</span><div className="profile-list">{Object.entries(model.pages.reduce<Record<string, number>>((counts, page) => ({ ...counts, [page.archetype]: (counts[page.archetype] ?? 0) + 1 }), {})).map(([type, count]) => <span key={type}><strong>{count}</strong> {type}</span>)}</div></div>
          <div><span className="muted">Journeys</span><div className="profile-list">{model.journeys.length ? model.journeys.map(journey => <span key={journey.id}><strong>{journey.name}</strong> · {journey.pageUrls.length} pages · {journey.confidence} confidence</span>) : <span>No journeys inferred</span>}</div></div>
        </div>
        <div className="profile-list">{Object.entries(model.categoryCoverage).map(([category, status]) => <span key={category}><strong>{categoryLabels[category as Category] ?? titleCase(category)}</strong> · {status}</span>)}</div>
      </Card>}

      {intelligence && <div className="grid-2">
        <Card><span className="eyebrow">Search visibility</span><h2>Observed search readiness</h2><div className="profile-list"><span><strong>{Math.round(intelligence.search.titleCoverage * 100)}%</strong> title coverage</span><span><strong>{Math.round(intelligence.search.metaDescriptionCoverage * 100)}%</strong> meta description coverage</span><span><strong>{Math.round(intelligence.search.canonicalCoverage * 100)}%</strong> canonical coverage</span><span><strong>{intelligence.search.structuredDataPages}</strong> pages with structured data</span></div><p className="muted">These are technical observations, not search rankings or organic traffic.</p></Card>
        <Card><span className="eyebrow">Technology</span><h2>Observed technology signals</h2><div className="profile-list">{intelligence.technology.signals.length ? intelligence.technology.signals.slice(0, 8).map(signal => <span key={signal.name}><strong>{signal.name}</strong> · {signal.confidence} confidence</span>) : <span>No technology signals observed</span>}</div></Card>
      </div>}

      <Card>
        <div className="section-head"><div><span className="eyebrow">History</span><h2>Audit timeline</h2></div><Link to="/app/history">Compare all history →</Link></div>
        <div className="audit-list">{audits.slice().reverse().map(audit => <Link className="audit-item" to={`/app/audits/${audit.id}`} key={audit.id}><span className="audit-score">{audit.score ?? '—'}</span><span><strong>{formatDate(audit.createdAt)}</strong><small>{audit.issues.filter(issue => issue.status !== 'resolved').length} open findings · {audit.durationMs}ms</small></span><span>{audit.id === latestAudit.id ? 'Latest →' : 'Open →'}</span></Link>)}</div>
      </Card>
    </>}
  </div>
}
export function InsightsPage() {
  const location = useLocation()
  const websiteId = new URLSearchParams(location.search).get('website')
  const audits = websiteId ? currentAudits().filter(item => item.websiteId === websiteId) : currentAudits()
  const audit = audits.at(-1)
  const website = websiteId ? (storage.websites().length ? storage.websites() : seedWebsites).find(item => item.id === websiteId) : undefined

  if (!audit) return <div className="stack">
    <div className="page-heading"><div><span className="eyebrow">Insights</span><h1>Understand what matters.</h1><p>Insights need an audit baseline. Ottimo will keep observed evidence separate from inference and unavailable data.</p></div></div>
    <Card className="insights-empty"><h2>Start with a website audit.</h2><p>No audit evidence is available for this context yet.</p><Link className="btn btn-primary" to="/app/audits/new">Create an audit</Link></Card>
  </div>

  const model = audit.healthModel ?? website?.healthModel
  const intelligence = model?.siteIntelligence
  const openIssues = audit.issues.filter(issue => issue.status !== 'resolved')
  const categories = (['performance', 'accessibility', 'seo', 'usability', 'technical', 'ai'] as Category[]).map(category => {
    const score = audit.scores.find(item => item.category === category)?.score
    const coverage = model?.categoryCoverage?.[category] ?? (score === undefined ? 'unavailable' : 'measured')
    const issue = openIssues.filter(item => item.category === category).sort((a, b) => b.priority - a.priority)[0]
    return { category, score, coverage, issue }
  })
  const measured = categories.filter(item => item.coverage === 'measured').length
  const inferred = categories.filter(item => item.coverage === 'partial').length
  const unavailable = categories.filter(item => item.coverage === 'unavailable').length

  return <div className="stack insights-workspace">
    <div className="page-heading">
      <div><span className="eyebrow">Insights{website ? ` · ${website.name}` : ''}</span><h1>Turn audit evidence into useful understanding.</h1><p>One website context, one evidence boundary. These insights interpret the latest audit without pretending to know traffic, rankings, conversions or user behaviour.</p></div>
      <Link className="btn btn-primary" to={`/app/audits/${audit.id}`}>Open latest audit</Link>
    </div>

    <Card className="insights-hero">
      <div className="section-head"><div><span className="eyebrow">Decision context</span><h2>What Ottimo knows right now</h2></div><span className="standard-tag">{formatDate(audit.createdAt)}</span></div>
      <div className="insights-evidence-summary">
        <div><strong>{measured}</strong><span>measured domains</span></div>
        <div><strong>{inferred}</strong><span>partially inferred</span></div>
        <div><strong>{unavailable}</strong><span>unavailable</span></div>
        <div><strong>{openIssues.length}</strong><span>open findings</span></div>
      </div>
      <p className="muted">Measured observations are evidence. Partially inferred signals describe structure or interpretation. Unavailable domains are not treated as zero.</p>
    </Card>

    <Card>
      <div className="section-head"><div><span className="eyebrow">Website insights</span><h2>Where attention is concentrated</h2></div><Link to={`/app/audits/${audit.id}#audit-evidence`}>Inspect evidence →</Link></div>
      <div className="insight-grid">
        {categories.map(({ category, score, coverage, issue }) => <article className="insight-card" key={category}>
          <div className="insight-card__top"><span className="eyebrow">{categoryLabels[category]}</span><span className={`evidence-status evidence-status--${coverage}`}>{titleCase(coverage)}</span></div>
          <strong className="insight-score">{score === undefined ? '—' : score}<small>{score === undefined ? 'not measured' : '/100'}</small></strong>
          <p>{issue ? issue.summary : categoryCopy[category].body}</p>
          {issue && <div className="insight-card__finding"><Badge tone={issue.severity}>{issue.severity}</Badge><span>{issue.title}</span></div>}
          <div className="insight-card__links"><Link to={`/app/${category === 'seo' ? 'seo' : category === 'ai' ? 'ai' : category}?website=${encodeURIComponent(audit.websiteId ?? websiteId ?? '')}`}>Explore {categoryLabels[category]} →</Link>{issue && <Link to={`/app/audits/${audit.id}?finding=${encodeURIComponent(issue.id)}#ai-decision`}>Explain with evidence →</Link>}</div>
        </article>)}
      </div>
    </Card>

    <div className="grid-2">
      <Card>
        <div className="section-head"><div><span className="eyebrow">Search</span><h2>Can search systems understand the site?</h2></div><Link to={`/app/seo?website=${encodeURIComponent(audit.websiteId ?? websiteId ?? '')}`}>Open search insight →</Link></div>
        {intelligence?.search ? <div className="insight-stat-list">
          <span><strong>{Math.round(intelligence.search.titleCoverage * 100)}%</strong> title coverage</span>
          <span><strong>{Math.round(intelligence.search.metaDescriptionCoverage * 100)}%</strong> meta description coverage</span>
          <span><strong>{Math.round(intelligence.search.canonicalCoverage * 100)}%</strong> canonical coverage</span>
          <span><strong>{intelligence.search.structuredDataPages}</strong> pages with structured data</span>
        </div> : <p className="muted">Search intelligence was not measured in this audit.</p>}
        <p className="muted">Technical search signals describe page readiness; they do not establish rankings or organic acquisition.</p>
      </Card>
      <Card>
        <div className="section-head"><div><span className="eyebrow">Technology</span><h2>What implementation signals were observed?</h2></div><Link to={`/app/technical?website=${encodeURIComponent(audit.websiteId ?? websiteId ?? '')}`}>Open technical insight →</Link></div>
        {intelligence?.technology?.signals?.length ? <div className="insight-signal-list">{intelligence.technology.signals.slice(0, 8).map(signal => <span key={signal.name}><strong>{signal.name}</strong><small>{signal.category} · {signal.confidence} confidence</small></span>)}</div> : <p className="muted">No technology signals were confidently observed.</p>}
      </Card>
    </div>

    <Card className="insight-handoff">
      <div><span className="eyebrow">From insight to action</span><h2>Keep the evidence attached to the decision.</h2><p>Insights are interpretation, not a second source of truth. Use the audit for canonical evidence and the action queue for implementation and verification.</p></div>
      <div className="hero-actions"><Link className="btn btn-primary" to={`/app/audits/${audit.id}#findings`}>Review findings</Link><Link className="text-link" to="/app/recommendations">Open action queue →</Link></div>
    </Card>
  </div>
}

export function ReportsPage() {
  const audit = currentAudits().at(-1) ?? seedAudits.at(-1)!
  return <div className="stack"><div className="page-heading"><div><span className="eyebrow">Reports</span><h1>A clear briefing for the next decision.</h1><p>Summarise the latest audit for a business owner, product team or developer.</p></div><Button variant="secondary" onClick={() => window.print()}>Print report</Button></div><Card className="report-header"><div><span className="eyebrow">Ottimo audit report</span><h2>{audit.url}</h2><p>Generated {formatDate(audit.createdAt)} from deterministic local demo data.</p></div>{audit.score === undefined ? <div className="score"><strong>—</strong><span>Not measured</span></div> : <Score value={audit.score} label="Overall health" />}</Card><div className="grid-3">{audit.scores.map(item => <Card key={item.category}><span className="muted">{categoryLabels[item.category]}</span><strong className="big-number">{item.score ?? "—"}</strong>{item.score === undefined ? <small>Not measured</small> : <Progress value={item.score} />}</Card>)}</div><Card><span className="eyebrow">Priority queue</span><h2>Three actions to take next</h2><div className="action-list">{audit.issues.filter(issue => issue.status !== 'resolved').sort((a, b) => b.priority - a.priority).slice(0, 3).map(issue => <Link className="action" to="/app/recommendations" key={issue.id}><span><strong>{issue.title}</strong><small>{issue.solution}</small></span><span>#{issue.priority} →</span></Link>)}</div></Card></div>
}

export function HistoryPage() {
  const audits = currentAudits()
  return <div className="stack"><div className="page-heading"><div><span className="eyebrow">History</span><h1>Progress you can explain.</h1><p>Compare audit scores over time and keep improvements connected to the work that caused them.</p></div></div><Card><div className="history-chart" aria-label="Audit score history">{audits.map((audit, index) => {
    const previous = index ? audits[index - 1] : undefined
    const delta = audit.score !== undefined && previous?.score !== undefined ? audit.score - previous.score : undefined
    return <div className="history-point" key={audit.id}><strong>{audit.score ?? '—'}</strong><span style={{ height: audit.score === undefined ? '20%' : `${Math.max(20, audit.score)}%` }} /><small>{formatDate(audit.createdAt)}</small><em>{delta === undefined ? (audit.score === undefined ? 'Not measured' : 'Baseline') : `${delta >= 0 ? '+' : ''}${delta}`}</em></div>
  })}</div></Card><Card><div className="section-head"><h2>Audit timeline</h2><span className="muted">{audits.length} audits</span></div><div className="audit-list">{audits.slice().reverse().map(audit => <Link className="audit-item" to={`/app/audits/${audit.id}`} key={audit.id}><span className="audit-score">{audit.score}</span><span><strong>{audit.url}</strong><small>{formatDate(audit.createdAt)} · {audit.issues.filter(issue => issue.status !== 'resolved').length} open issues</small></span><span>→</span></Link>)}</div></Card></div>
}

export function SettingsPage() { return <div className="narrow stack"><div className="page-heading"><div><span className="eyebrow">Settings</span><h1>Keep the demo aligned to your work.</h1><p>These controls stay in this browser. No account or external service is required.</p></div></div><Card><h2>Workspace</h2><label>Workspace name<input defaultValue="Ottimo demo workspace" /></label><label>Default website<select defaultValue="example.com"><option>example.com</option><option>ottimo.test</option></select></label><p className="muted">Local audit data is stored in your browser and can be cleared through browser storage controls.</p><Button variant="secondary" onClick={() => window.alert('Demo settings are already saved locally.')}>Save settings</Button></Card></div> }