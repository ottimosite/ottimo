import { Link, useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { categoryLabels, seedAudits, seedWebsites } from '../../data/mock'
import { storage } from '../../services/storage'
import { auditStandards } from '../../services/audit'
import { Badge, Button, Card, Progress, Score } from '../../components/ui'
import { formatDate } from '../../lib/format'
import { downloadAuditReport } from '../../lib/audit-report'
import { IssueTable } from './Audits'
import type { Audit, OptimizationAction } from '../../types/domain'
import { buildOptimizationActions } from '../../audit-engine/actions'
import { blockingDependencies } from '../../audit-engine/action-dependencies'

type MetricState = 'good' | 'needs-improvement' | 'poor' | 'unavailable'

interface MetricDefinition {
  label: string
  unit: string
  value?: number
  state: MetricState
  meaning: string
  impact: string
  action: string
  benchmark: string
}

const stateLabel: Record<MetricState, string> = { good: 'Good', 'needs-improvement': 'Needs improvement', poor: 'Needs attention', unavailable: 'Not measured' }
const stateClass: Record<MetricState, string> = { good: 'metric-good', 'needs-improvement': 'metric-needs-improvement', poor: 'metric-poor', unavailable: 'metric-unavailable' }
const formatStat = (value: number | undefined, suffix = '') => value === undefined ? '—' : `${value.toLocaleString()}${suffix}`
const screenshotFor = (url: string) => `https://image.thum.io/get/width/1200/fullpage/${url}`

function classifyThreshold(value: number | undefined, good: number, improvement: number): MetricState {
  if (value === undefined) return 'unavailable'
  return value <= good ? 'good' : value <= improvement ? 'needs-improvement' : 'poor'
}

function MetricCard({ metric }: { metric: MetricDefinition }) {
  const value = metric.value === undefined ? '—' : metric.unit === 'ms' ? `${Math.round(metric.value)} ms` : metric.value.toFixed(3)
  return <article className={`performance-metric-explained ${stateClass[metric.state]}`}>
    <div className="metric-card-top"><div><span className="metric-label">{metric.label}</span><strong className="metric-value">{value}</strong></div><span className={`metric-state ${stateClass[metric.state]}`}>{stateLabel[metric.state]}</span></div>
    <p><strong>What it means:</strong> {metric.meaning}</p>
    <p><strong>Why it matters:</strong> {metric.impact}</p>
    <p><strong>What to do:</strong> {metric.action}</p>
    <small className="metric-benchmark">{metric.benchmark}</small>
  </article>
}

function PerformancePanel({ metrics }: { metrics: NonNullable<NonNullable<typeof seedAudits[number]['stats']>['performance']> | undefined }) {
  const definitions: MetricDefinition[] = [
    { label: 'Time to first byte', unit: 'ms', value: metrics?.ttfbMs, state: classifyThreshold(metrics?.ttfbMs, 800, 1800), meaning: 'How long the browser waited before the server started responding.', impact: 'A slow response delays everything that follows, especially on slower networks.', action: 'Check server processing time, caching, CDN coverage and backend requests.', benchmark: 'Good ≤ 800 ms · Needs improvement 801–1,800 ms · Poor > 1,800 ms' },
    { label: 'First contentful paint', unit: 'ms', value: metrics?.fcpMs, state: classifyThreshold(metrics?.fcpMs, 1800, 3000), meaning: 'How quickly the first piece of page content becomes visible.', impact: 'Earlier visible content makes a page feel faster and gives visitors immediate feedback.', action: 'Reduce render-blocking work, improve server response and prioritise above-the-fold assets.', benchmark: 'Good ≤ 1.8 s · Needs improvement 1.8–3 s · Poor > 3 s' },
    { label: 'Largest contentful paint', unit: 'ms', value: metrics?.lcpMs, state: classifyThreshold(metrics?.lcpMs, 2500, 4000), meaning: 'How quickly the main or largest visible content finishes rendering.', impact: 'LCP is a Core Web Vital and strongly affects whether the page feels ready to use.', action: 'Optimise the LCP element, prioritise its resource and reduce server/rendering delays.', benchmark: 'Good ≤ 2.5 s · Needs improvement 2.5–4 s · Poor > 4 s' },
    { label: 'Cumulative layout shift', unit: '', value: metrics?.cls, state: classifyThreshold(metrics?.cls, 0.1, 0.25), meaning: 'How much visible content unexpectedly moves while the page loads.', impact: 'Unexpected movement causes mis-clicks, frustration and accessibility problems.', action: 'Reserve space for images, ads and embeds and avoid inserting content above existing content.', benchmark: 'Good ≤ 0.10 · Needs improvement 0.10–0.25 · Poor > 0.25' },
    { label: 'Interaction to next paint', unit: 'ms', value: metrics?.inpMs, state: classifyThreshold(metrics?.inpMs, 200, 500), meaning: 'How quickly the page responds visually after a user interaction.', impact: 'Slow INP makes buttons, menus and forms feel unresponsive even when the page has loaded.', action: 'Reduce long JavaScript tasks, split expensive work and keep the main thread available for interaction.', benchmark: 'Good ≤ 200 ms · Needs improvement 200–500 ms · Poor > 500 ms' },
    { label: 'DOM content loaded', unit: 'ms', value: metrics?.domContentLoadedMs, state: metrics?.domContentLoadedMs === undefined ? 'unavailable' : 'good', meaning: 'When the initial HTML has been parsed and the document is ready for DOM-dependent work.', impact: 'It is a diagnostic signal rather than a Core Web Vital; unusually long times can reveal heavy parsing or blocking work.', action: 'Use it alongside FCP and LCP to locate where loading time is being spent rather than treating it as a pass/fail score.', benchmark: 'Diagnostic metric · compare against your own pages and changes over time' },
  ]
  return <Card className="performance-panel">
    <div className="section-head"><div><span className="eyebrow">Performance translated</span><h2>What these numbers actually mean</h2></div><span className="standard-tag">Core Web Vitals</span></div>
    <p className="performance-intro">Ottimo does not expect you to know what a millisecond or a layout-shift score means. Each measurement is translated into a plain-language status, its user impact and the practical next step.</p>
    <div className="metric-legend" aria-label="Performance status legend"><span className="metric-state metric-good">Good</span><span className="metric-state metric-needs-improvement">Needs improvement</span><span className="metric-state metric-poor">Needs attention</span></div>
    <div className="performance-explained-grid">{definitions.map(metric => <MetricCard key={metric.label} metric={metric} />)}</div>
  </Card>
}

function AuditModeSwitch({ mode, setMode }: { mode: 'customer' | 'engineer'; setMode: (mode: 'customer' | 'engineer') => void }) {
  return <div className="audit-mode-switch" role="group" aria-label="Audit output mode">
    <button className={mode === 'customer' ? 'active' : ''} onClick={() => setMode('customer')}>Customer view</button>
    <button className={mode === 'engineer' ? 'active' : ''} onClick={() => setMode('engineer')}>Engineer view</button>
  </div>
}

function IntelligencePanel({ stats }: { stats: Audit['stats'] }) {
  const technologies = stats?.discovery?.technologySignals ?? []
  const search = stats?.discovery?.searchVisibility
  const social = stats?.discovery?.socialPresence
  const searchSummary = stats?.discovery?.searchSummary
  const socialSummary = stats?.discovery?.socialSummary
  const technologySummary = stats?.discovery?.technologySummary
  return <div className="audit-intelligence-grid">
    <Card><span className="eyebrow">Technology fingerprint</span><h2>What powers this site</h2>{technologies.length ? <div className="signal-list">{technologies.map(t => <span key={t.name}><strong>{t.name}</strong><small>{t.category} · {t.confidence} confidence · {t.evidence}</small></span>)}</div> : <p className="muted">No technology could be identified confidently from the rendered pages.</p>}{technologySummary && <small className="muted">{technologySummary.signals.length} unique signals across the audited pages.</small>}</Card>
    <Card><span className="eyebrow">Search visibility</span><h2>Can search engines understand it?</h2>{searchSummary ? <div className="profile-list"><span><strong>{searchSummary.titleCoverage}%</strong> pages with titles</span><span><strong>{searchSummary.metaDescriptionCoverage}%</strong> pages with meta descriptions</span><span><strong>{searchSummary.canonicalCoverage}%</strong> pages with canonicals</span><span><strong>{searchSummary.openGraphCoverage}%</strong> pages with Open Graph</span><span><strong>{searchSummary.structuredDataPages}</strong> pages with structured data</span><span><strong>{searchSummary.pagesWithMultipleH1}</strong> pages with multiple H1s</span></div> : search ? <div className="profile-list"><span><strong>{search.titlePresent ? 'Present' : 'Missing'}</strong> title</span><span><strong>{search.metaDescriptionPresent ? 'Present' : 'Missing'}</strong> meta description</span><span><strong>{search.canonicalPresent ? 'Present' : 'Missing'}</strong> canonical</span><span><strong>{search.h1Count}</strong> H1 headings</span></div> : <p className="muted">Search visibility signals were not collected.</p>}</Card>
    <Card><span className="eyebrow">Social discovery</span><h2>How visitors can share it</h2>{socialSummary ? <div className="profile-list"><span><strong>{socialSummary.profileCount}</strong> social profiles detected</span><span><strong>{socialSummary.shareMetadataPages}</strong> pages with share metadata</span><span><strong>{socialSummary.socialScriptPages}</strong> pages with social scripts</span></div> : social ? <div className="profile-list"><span><strong>{social.profiles.length}</strong> social profiles detected</span><span><strong>{social.shareMetadata.length}</strong> share metadata signals</span><span><strong>{social.socialScripts.length}</strong> social scripts</span></div> : <p className="muted">Social signals were not collected.</p>}</Card>
  </div>
}

function EvidenceCoveragePanel({ audit }: { audit: Audit }) {
  const issues = audit.issues
  const measured = issues.filter(issue => issue.evidence?.status === 'measured').length
  const inferred = issues.filter(issue => issue.evidence?.status === 'inferred').length
  const unavailable = issues.filter(issue => issue.evidence?.status === 'unavailable').length
  const pages = audit.healthModel?.pages.length ?? 0
  const coverage = audit.healthModel?.categoryCoverage
  return <Card className="audit-evidence-coverage">
    <div className="section-head"><div><span className="eyebrow">Evidence coverage</span><h2>Know what Ottimo actually observed</h2></div><span className="standard-tag">{measured} measured</span></div>
    <p className="performance-intro">Ottimo keeps measured observations separate from inference and unavailable data. This is the evidence boundary behind the audit.</p>
    <div className="audit-command-stats">
      <div><strong>{measured}</strong><span>Measured findings</span></div>
      <div><strong>{inferred}</strong><span>Inferred findings</span></div>
      <div><strong>{unavailable}</strong><span>Unavailable</span></div>
      <div><strong>{pages || '—'}</strong><span>Pages modelled</span></div>
    </div>
    {coverage && <div className="coverage-list" aria-label="Audit category evidence coverage">{Object.entries(coverage).map(([category, status]) => <span key={category}><strong>{categoryLabels[category as keyof typeof categoryLabels]}</strong><em className={`coverage-${status}`}>{status}</em></span>)}</div>}
  </Card>
}

function ActionPreview({ audit, actions }: { audit: Audit; actions: OptimizationAction[] }) {
  const visible = actions.slice().sort((a, b) => b.priorityScore - a.priorityScore || a.title.localeCompare(b.title)).slice(0, 4)
  const blocked = (action: OptimizationAction) => blockingDependencies(actions, action).some(item => item.lifecycleStatus !== 'resolved')
  const ready = actions.filter(action => action.lifecycleStatus === 'planned' && !blocked(action)).length
  const active = actions.filter(action => action.lifecycleStatus === 'in_progress' || action.lifecycleStatus === 'verification').length
  const verified = audit.verifications?.filter(item => item.status === 'verified').length ?? 0
  return <Card className="audit-action-centre">
    <div className="section-head"><div><span className="eyebrow">Act</span><h2>Your optimisation queue</h2></div><Link className="inline-action" to="/app/recommendations">Open full queue <span aria-hidden="true">→</span></Link></div>
    <div className="audit-command-stats">
      <div><strong>{ready}</strong><span>Ready to act</span></div>
      <div><strong>{active}</strong><span>In progress</span></div>
      <div><strong>{actions.filter(action => blocked(action)).length}</strong><span>Blocked</span></div>
      <div><strong>{verified}</strong><span>Verified</span></div>
    </div>
    <div className="audit-action-list">{visible.length ? visible.map(action => <Link className="audit-action-item" to="/app/recommendations" key={action.id}>
      <span><Badge tone={action.severity}>{action.severity}</Badge><strong>{action.title}</strong><small>{action.priorityScore}/100 · {action.effort} effort · {blocked(action) ? 'Blocked by prerequisite' : action.lifecycleStatus.replace('_', ' ')}</small></span><span aria-hidden="true">→</span>
    </Link>) : <p className="muted">No optimisation actions were generated for this audit.</p>}</div>
  </Card>
}

function AuditCommandCentre({ audit, openIssues, actions }: { audit: Audit; openIssues: Audit['issues']; actions: OptimizationAction[] }) {
  const health = audit.health?.score
  const changed = audit.comparison ? audit.comparison.newFindings + audit.comparison.regressed : 0
  const verified = audit.verifications?.filter(item => item.status === 'verified').length ?? 0
  return <section className="audit-command-centre" aria-labelledby="audit-command-heading">
    <div className="audit-command-lead">
      <div><span className="eyebrow">Audit command centre</span><h2 id="audit-command-heading">From evidence to action.</h2><p>Ottimo turns what it observed into a clear sequence: understand the site, decide what matters, make the change, then verify it.</p></div>
      <div className="audit-command-actions"><Link className="primary-action" to="/app/recommendations">Start with actions <span aria-hidden="true">→</span></Link><a className="secondary-action" href="#findings">Explore findings</a></div>
    </div>
    <div className="audit-command-grid">
      <article><span>Health</span><strong>{health === undefined ? '—' : `${health}/100`}</strong><small>{audit.health?.status === 'not-measured' ? 'Not measured' : audit.health?.status ?? 'Evidence available'}</small></article>
      <article><span>Open issues</span><strong>{openIssues.length}</strong><small>{openIssues.length ? 'Need a decision' : 'No unresolved findings'}</small></article>
      <article><span>Priority actions</span><strong>{actions.length}</strong><small>{actions.length ? 'Evidence-led work' : 'No actions generated'}</small></article>
      <article><span>Changed</span><strong>{audit.comparison ? changed : '—'}</strong><small>{audit.comparison ? 'New or regressed' : 'No comparison available'}</small></article>
      <article><span>Verified</span><strong>{verified}</strong><small>{audit.verifications?.length ? 'Post-fix results' : 'No verification history'}</small></article>
    </div>
  </section>
}

function EngineerDiagnostics({ audit }: { audit: Audit }) {
  return <Card className="engineer-diagnostics"><div className="section-head"><div><span className="eyebrow">Engineer diagnostics</span><h2>Trace the audit</h2></div><span className="standard-tag">Technical detail</span></div>{audit.diagnostics ? <div className="diagnostic-grid"><span><small>Stage</small><strong>{audit.diagnostics.stage}</strong></span><span><small>Code</small><strong>{audit.diagnostics.code}</strong></span><span><small>Retryable</small><strong>{audit.diagnostics.retryable ? 'Yes' : 'No'}</strong></span><span><small>Target</small><strong>{audit.diagnostics.targetUrl ?? audit.url}</strong></span></div> : <p>No audit failure diagnostics were recorded for this completed audit.</p>}{audit.diagnostics?.technicalDetails && <details><summary>Technical trace</summary><pre>{audit.diagnostics.technicalDetails}</pre></details>}</Card>
}


function HealthModelPanel({ audit }: { audit: Audit }) {
  const model = audit.healthModel
  if (!model) return null
  const archetypes = model.pages.reduce<Record<string, number>>((counts: Record<string, number>, page: { archetype: string }) => ({ ...counts, [page.archetype]: (counts[page.archetype] ?? 0) + 1 }), {})
  return <Card className="health-model-panel">
    <div className="section-head"><div><span className="eyebrow">Website intelligence</span><h2>How Ottimo understands this site</h2></div><span className="standard-tag">{model.pages.length} pages modelled</span></div>
    <p className="performance-intro">This is the persistent interpretation layer behind the audit: page types, evidence and inferred journeys. Journey data describes structure only; traffic and conversion data require an external integration.</p>
    <div className="audit-summary-grid">
      <div><span className="muted">Page types</span><div className="profile-list">{Object.entries(archetypes).map(([type, count]: [string, number]) => <span key={type}><strong>{count}</strong> {type}</span>)}</div></div>
      <div><span className="muted">Journeys</span><div className="profile-list">{model.journeys.map((journey: Audit['healthModel'] extends infer M ? M extends { journeys: (infer J)[] } ? J : never : never) => <span key={journey.id}><strong>{journey.name}</strong> · {journey.pageUrls.length} pages · {journey.issueIds.length} findings</span>)}</div></div>
    </div>
  </Card>
}


function ChangePanel({ audit }: { audit: Audit }) {
  const comparison = audit.comparison
  if (!comparison) return null
  const changes = comparison.changes.filter(change => change.type !== 'unchanged').slice(0, 8)
  const labels = { resolved: 'Resolved', new: 'New', improved: 'Improved', regressed: 'Regressed' } as const
  return <Card className="change-panel">
    <div className="section-head"><div><span className="eyebrow">Since the previous audit</span><h2>What changed?</h2></div><span className="muted">Compared with {formatDate(comparison.previousCreatedAt)}</span></div>
    <div className="interpretation-grid"><div className="interpretation-item"><span className="interpretation-number">{comparison.resolved}</span><div><strong>Resolved</strong><p>Findings no longer present in the latest audit.</p></div></div><div className="interpretation-item"><span className="interpretation-number">{comparison.newFindings}</span><div><strong>New</strong><p>Findings that were not present in the previous audit.</p></div></div><div className="interpretation-item"><span className="interpretation-number">{comparison.improved}</span><div><strong>Improved</strong><p>Findings or measured category scores that moved in a positive direction.</p></div></div><div className="interpretation-item"><span className="interpretation-number">{comparison.regressed}</span><div><strong>Regressed</strong><p>Findings or measured category scores that moved in a negative direction.</p></div></div></div>
    {changes.length ? <div className="issue-list">{changes.map((change: NonNullable<Audit['comparison']>['changes'][number]) => <article className="issue issue-explained" key={change.fingerprint}><div className="issue-top"><div><Badge tone={change.type === 'regressed' ? 'high' : change.type === 'new' ? 'medium' : 'low'}>{labels[change.type as keyof typeof labels]}</Badge><span className="muted"> {categoryLabels[change.category]}</span><h3>{change.title}</h3></div></div><p>{change.previousSeverity && change.currentSeverity ? `Severity changed from ${change.previousSeverity} to ${change.currentSeverity}.` : change.previousScore !== undefined && change.currentScore !== undefined ? `Score changed from ${change.previousScore} to ${change.currentScore}.` : `This change affects ${change.affectedPages.length} page${change.affectedPages.length === 1 ? '' : 's'}.`}</p></article>)}</div> : <p className="muted">No material changes were detected between these audits.</p>}
    {audit.verifications?.length ? <div className="profile-list"><span><strong>{audit.verifications.filter((item: NonNullable<Audit['verifications']>[number]) => item.status === 'verified').length}</strong> actions verified</span><span><strong>{audit.verifications.filter(item => item.status === 'failed').length}</strong> actions still failing</span><span><strong>{audit.verifications.filter(item => item.status === 'inconclusive').length}</strong> inconclusive</span></div> : null}
  </Card>
}

export function AuditOverview() {
  const { id } = useParams(); const navigate = useNavigate(); const [mode, setMode] = useState<'customer' | 'engineer'>('customer'); const audit = [...seedAudits, ...storage.audits()].find(item => item.id === id)
  if (!audit) return <Card><h1>Audit not found</h1><p>This audit may have been cleared from local browser storage.</p><Link to="/app/audits">Back to audits</Link></Card>
  const website = [...seedWebsites, ...storage.websites()].find(item => item.id === audit.websiteId)
  const stats = audit.stats; const openIssues = audit.issues.filter(issue => issue.status !== 'resolved')
  const severityCounts = audit.issues.reduce<Record<string, number>>((counts, issue) => ({ ...counts, [issue.severity]: (counts[issue.severity] ?? 0) + 1 }), {})
  const topIssues = openIssues.slice().sort((a, b) => b.priority - a.priority).slice(0, 3)
  const actions = audit.actions?.length ? audit.actions : buildOptimizationActions(audit.issues)
  const screenshotUrl = stats?.screenshotUrl ?? screenshotFor(audit.url)
  return <div className="stack audit-overview">
    <header className="audit-hero">
      <div className="audit-breadcrumb"><Link to="/app/audits">Audits</Link><span aria-hidden="true">/</span><span>Result</span></div>
      <div className="audit-hero-main">
        <div className="audit-title-block">
          <span className="eyebrow">Audit result · {stats?.source === 'live' ? 'Live page inspection' : 'Saved local audit'}</span>
          <h1>{website?.name ?? audit.url}</h1>
          <a className="audit-url" href={audit.url} target="_blank" rel="noreferrer">{audit.url}<span aria-hidden="true"> ↗</span></a>
          <div className="audit-meta" aria-label="Audit details"><span>{formatDate(audit.createdAt)}</span><span>{audit.durationMs}ms analysis</span><span>{audit.issues.length} finding{audit.issues.length === 1 ? '' : 's'}</span></div>
        </div>
        <div className="audit-actions">
          <AuditModeSwitch mode={mode} setMode={setMode} />
          <Button onClick={() => navigate(`/app/audits/new?url=${encodeURIComponent(audit.url)}`)}>Run again</Button>
          <Button variant="secondary" onClick={() => downloadAuditReport(audit, website?.name)}>Export report</Button>
          <Button variant="ghost" onClick={() => window.print()}>Print</Button>
        </div>
      </div>
    </header>

    <AuditCommandCentre audit={audit} openIssues={openIssues} actions={actions} />
    <Card className="standards-card audit-standards">
      <div><span className="eyebrow">Audit basis</span><h2>Standards applied</h2><p>These are the lenses used to interpret this audit.</p></div>
      <div className="standards-list">{(audit.standards ?? auditStandards.map(standard => standard.name)).map(standard => <span className="standard-tag" key={standard}>{standard}</span>)}</div>
    </Card>

    <section className="audit-interpretation" aria-labelledby="takeaway-heading">
      <div className="section-head">
        <div><span className="eyebrow">Start with the meaning</span><h2 id="takeaway-heading">What should you take away?</h2><p className="section-subtitle">A quick reading of this audit before you dive into the technical detail.</p></div>
        <span className="audit-open-count">{openIssues.length} open issue{openIssues.length === 1 ? '' : 's'}</span>
      </div>
      <div className="interpretation-grid">
        <article className="interpretation-item"><span className="interpretation-number" aria-hidden="true">{openIssues.length}</span><div><span className="interpretation-label">Open issues</span><strong>{openIssues.length ? 'Things that need action' : 'Nothing currently needs action'}</strong><p>{openIssues.length ? 'Findings Ottimo has enough evidence to turn into a concrete task.' : 'No unresolved findings were recorded in this audit.'}</p></div></article>
        <article className="interpretation-item"><span className="interpretation-number" aria-hidden="true">{topIssues.length}</span><div><span className="interpretation-label">Priority actions</span><strong>{topIssues.length ? 'Actions surfaced' : 'No priority actions'}</strong><p>{topIssues.length ? 'Start with the actions that combine meaningful impact with available evidence.' : 'There is no open action to prioritise right now.'}</p></div></article>
        <article className="interpretation-item"><span className="interpretation-number" aria-hidden="true">{audit.issues.filter(issue => issue.evidence?.status === 'measured').length}</span><div><span className="interpretation-label">Measured findings</span><strong>Backed by evidence</strong><p>Measured observations stay separate from assumptions so the report does not invent certainty.</p></div></article>
      </div>
    </section>

    <div className="audit-summary-grid audit-health-row">
      <Card className="audit-health">
        <div className="health-score-block"><span className="muted">Overall health</span>{audit.health?.score === undefined ? <div className="score"><strong>—</strong><span>Not measured</span></div> : <Score value={audit.health.score} label={audit.health.status === 'good' ? 'Good' : audit.health.status === 'needs-improvement' ? 'Needs improvement' : 'Needs attention'} />} {audit.health?.score !== undefined && <small className="muted">{audit.health.checks} measured checks · {audit.health.passed} passed · {audit.health.failed} failed</small>} {audit.health?.excludedCategories.length ? <small className="muted">Not scored: {audit.health.excludedCategories.join(', ')}</small> : null}</div>
        <div className="health-explanation"><span className="eyebrow">How the score works</span><p>{audit.health?.methodology ?? 'Health is shown only when the audit has enough measured evidence.'}</p><span className="eyebrow">Priority focus</span><p>{openIssues.length ? `${openIssues.length} open issue${openIssues.length === 1 ? '' : 's'} need a decision.` : 'All recorded issues are resolved.'}</p><Link className="inline-action" to="/app/recommendations">Open action queue <span aria-hidden="true">→</span></Link></div>
      </Card>
      <Card className="open-issues-card"><span className="muted">Open issues</span><strong className="big-number">{openIssues.length}</strong><div className="severity-list">{Object.entries(severityCounts).map(([severity, count]) => <span key={severity}><Badge tone={severity}>{severity}</Badge> {count}</span>)}</div></Card>
    </div>
    <div className="audit-insight-grid"><EvidenceCoveragePanel audit={audit} /><ActionPreview audit={audit} actions={actions} /></div>
    <PerformancePanel metrics={stats?.performance} />
    <IntelligencePanel stats={stats} />
    <HealthModelPanel audit={audit} />
    <ChangePanel audit={audit} />
    {mode === 'engineer' && <EngineerDiagnostics audit={audit} />}
    <div className="audit-evidence-grid"><Card className="screenshot-card"><div className="section-head"><div><span className="eyebrow">Visual evidence</span><h2>Page snapshot</h2></div><a href={screenshotUrl} target="_blank" rel="noreferrer">Open full image ↗</a></div><div className="screenshot-frame"><img src={screenshotUrl} alt={`Screenshot preview of ${audit.url}`} loading="lazy" /></div><small>Generated through the optional screenshot adapter. It may take a moment to appear.</small></Card><Card><span className="eyebrow">Page profile</span><h2>What we found</h2><div className="profile-list"><span><strong>{stats?.language || '—'}</strong> document language</span><span><strong>{formatStat(stats?.wordCount)}</strong> visible words</span><span><strong>{stats?.title ? 'Present' : '—'}</strong> page title</span><span><strong>{stats?.source === 'live' ? 'Fetched' : 'Fixture'}</strong> evidence source</span></div></Card></div>
    <section className="audit-stat-grid" aria-label="Website statistics"><Card><span className="stat-icon">Aa</span><strong>{formatStat(stats?.htmlBytes, ' bytes')}</strong><small>Fetched HTML size</small></Card><Card><span className="stat-icon">◈</span><strong>{formatStat(stats?.imageCount)}</strong><small>Images detected</small></Card><Card><span className="stat-icon">↗</span><strong>{formatStat(stats?.linkCount)}</strong><small>Links detected</small></Card><Card><span className="stat-icon">↗</span><strong>{formatStat(stats?.externalLinkCount)}</strong><small>External links</small></Card><Card><span className="stat-icon">H</span><strong>{formatStat(stats?.headingCount)}</strong><small>Headings detected</small></Card><Card><span className="stat-icon">JS</span><strong>{formatStat(stats?.scriptCount)}</strong><small>Scripts detected</small></Card><Card><span className="stat-icon">▣</span><strong>{formatStat(stats?.formCount)}</strong><small>Forms detected</small></Card><Card><span className="stat-icon">✓</span><strong>{formatStat(stats?.buttonCount)}</strong><small>Buttons detected</small></Card></section>
    <div className="grid-2"><Card><div className="section-head"><div><span className="eyebrow">Health by domain</span><h2>Where the experience stands</h2></div><span className="muted">/100</span></div><div className="score-list">{audit.scores.map(score => <div className="score-row" key={score.category}><span>{categoryLabels[score.category]}</span>{score.score === undefined ? <span className="muted">Not measured</span> : <><Progress value={score.score} /><strong>{score.score}</strong></>}</div>)}</div></Card><Card><div className="section-head"><div><span className="eyebrow">Start here</span><h2>Highest-impact actions</h2></div></div><div className="action-list">{topIssues.map(issue => <Link className="action" to="/app/recommendations" key={issue.id}><span><strong>{issue.title}</strong><small>{issue.effort} effort · {categoryLabels[issue.category]}</small></span><span>→</span></Link>)}</div></Card></div>
    <Card id="findings"><div className="section-head"><div><span className="eyebrow">Full findings</span><h2>Evidence, meaning and recommendations</h2></div><span className="muted">Search, filter and sort the audit</span></div><IssueTable issues={audit.issues} /></Card>
  </div>
}