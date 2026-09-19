import { Link, useNavigate, useParams } from 'react-router-dom'
import { categoryLabels, seedAudits, seedWebsites } from '../../data/mock'
import { storage } from '../../services/storage'
import { auditStandards } from '../../services/audit'
import { Badge, Button, Card, Progress, Score } from '../../components/ui'
import { formatDate } from '../../lib/format'
import { IssueTable } from './Audits'

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

export function AuditOverview() {
  const { id } = useParams(); const navigate = useNavigate(); const audit = [...seedAudits, ...storage.audits()].find(item => item.id === id)
  if (!audit) return <Card><h1>Audit not found</h1><p>This audit may have been cleared from local browser storage.</p><Link to="/app/audits">Back to audits</Link></Card>
  const website = [...seedWebsites, ...storage.websites()].find(item => item.id === audit.websiteId)
  const stats = audit.stats; const openIssues = audit.issues.filter(issue => issue.status !== 'resolved')
  const severityCounts = audit.issues.reduce<Record<string, number>>((counts, issue) => ({ ...counts, [issue.severity]: (counts[issue.severity] ?? 0) + 1 }), {})
  const topIssues = openIssues.slice().sort((a, b) => b.priority - a.priority).slice(0, 3)
  const screenshotUrl = stats?.screenshotUrl ?? screenshotFor(audit.url)
  return <div className="stack audit-overview">
    <div className="page-heading"><div><span className="eyebrow">Audit result · {stats?.source === 'live' ? 'Live page inspection' : 'Saved local audit'}</span><h1>{website?.name ?? audit.url}</h1><p className="audit-url">{audit.url}</p><p>{formatDate(audit.createdAt)} · {audit.durationMs}ms analysis · {audit.issues.length} findings</p></div><div className="audit-actions"><Button variant="secondary" onClick={() => window.print()}>Print report</Button><Button onClick={() => navigate(`/app/audits/new?url=${encodeURIComponent(audit.url)}`)}>Run again</Button></div></div>
    <Card className="standards-card"><div><span className="eyebrow">Audit basis</span><h2>Standards applied</h2></div><div className="standards-list">{(audit.standards ?? auditStandards.map(standard => standard.name)).map(standard => <span className="standard-tag" key={standard}>{standard}</span>)}</div></Card>
    <Card className="audit-interpretation"><div className="section-head"><div><span className="eyebrow">Start with the meaning</span><h2>What should you take away?</h2></div><span className="muted">{openIssues.length} open issue{openIssues.length === 1 ? '' : 's'}</span></div><div className="interpretation-grid">
      <div className="interpretation-item"><span className="interpretation-number">{openIssues.length}</span><div><strong>Things that need action</strong><p>Findings Ottimo has enough evidence to turn into a concrete task.</p></div></div>
      <div className="interpretation-item"><span className="interpretation-number">{topIssues.length}</span><div><strong>Priority actions surfaced</strong><p>Start with the actions that combine meaningful impact with available evidence.</p></div></div>
      <div className="interpretation-item"><span className="interpretation-number">{audit.issues.filter(issue => issue.evidence?.status === 'measured').length}</span><div><strong>Findings backed by evidence</strong><p>Measured observations stay separate from assumptions so the report does not invent certainty.</p></div></div>
    </div></Card>
    <div className="audit-summary-grid"><Card className="audit-health"><div><span className="muted">Overall health</span>{audit.health?.score === undefined ? <div className="score"><strong>—</strong><span>Not measured</span></div> : <Score value={audit.health.score} label={audit.health.status === 'good' ? 'Good' : audit.health.status === 'needs-improvement' ? 'Needs improvement' : 'Needs attention'} />} {audit.health?.score !== undefined && <small className="muted">{audit.health.checks} measured checks · {audit.health.passed} passed · {audit.health.failed} failed</small>} {audit.health?.excludedCategories.length ? <small className="muted">Not scored: {audit.health.excludedCategories.join(', ')}</small> : null}</div><div><span className="eyebrow">How the score works</span><p>{audit.health?.methodology ?? 'Health is shown only when the audit has enough measured evidence.'}</p><span className="eyebrow">Priority focus</span><p>{openIssues.length ? openIssues.length + ' open issues need a decision.' : 'All recorded issues are resolved.'}</p><Link to="/app/recommendations">Open action queue →</Link></div></Card><Card><span className="muted">Open issues</span><strong className="big-number">{openIssues.length}</strong><div className="severity-list">{Object.entries(severityCounts).map(([severity, count]) => <span key={severity}><Badge tone={severity}>{severity}</Badge> {count}</span>)}</div></Card></div>
    <PerformancePanel metrics={stats?.performance} />
    <div className="audit-evidence-grid"><Card className="screenshot-card"><div className="section-head"><div><span className="eyebrow">Visual evidence</span><h2>Page snapshot</h2></div><a href={screenshotUrl} target="_blank" rel="noreferrer">Open full image ↗</a></div><div className="screenshot-frame"><img src={screenshotUrl} alt={`Screenshot preview of ${audit.url}`} loading="lazy" /></div><small>Generated through the optional screenshot adapter. It may take a moment to appear.</small></Card><Card><span className="eyebrow">Page profile</span><h2>What we found</h2><div className="profile-list"><span><strong>{stats?.language || '—'}</strong> document language</span><span><strong>{formatStat(stats?.wordCount)}</strong> visible words</span><span><strong>{stats?.title ? 'Present' : '—'}</strong> page title</span><span><strong>{stats?.source === 'live' ? 'Fetched' : 'Fixture'}</strong> evidence source</span></div></Card></div>
    <section className="audit-stat-grid" aria-label="Website statistics"><Card><span className="stat-icon">Aa</span><strong>{formatStat(stats?.htmlBytes, ' bytes')}</strong><small>Fetched HTML size</small></Card><Card><span className="stat-icon">◈</span><strong>{formatStat(stats?.imageCount)}</strong><small>Images detected</small></Card><Card><span className="stat-icon">↗</span><strong>{formatStat(stats?.linkCount)}</strong><small>Links detected</small></Card><Card><span className="stat-icon">↗</span><strong>{formatStat(stats?.externalLinkCount)}</strong><small>External links</small></Card><Card><span className="stat-icon">H</span><strong>{formatStat(stats?.headingCount)}</strong><small>Headings detected</small></Card><Card><span className="stat-icon">JS</span><strong>{formatStat(stats?.scriptCount)}</strong><small>Scripts detected</small></Card><Card><span className="stat-icon">▣</span><strong>{formatStat(stats?.formCount)}</strong><small>Forms detected</small></Card><Card><span className="stat-icon">✓</span><strong>{formatStat(stats?.buttonCount)}</strong><small>Buttons detected</small></Card></section>
    <div className="grid-2"><Card><div className="section-head"><div><span className="eyebrow">Health by domain</span><h2>Where the experience stands</h2></div><span className="muted">/100</span></div><div className="score-list">{audit.scores.map(score => <div className="score-row" key={score.category}><span>{categoryLabels[score.category]}</span>{score.score === undefined ? <span className="muted">Not measured</span> : <><Progress value={score.score} /><strong>{score.score}</strong></>}</div>)}</div></Card><Card><div className="section-head"><div><span className="eyebrow">Start here</span><h2>Highest-impact actions</h2></div></div><div className="action-list">{topIssues.map(issue => <Link className="action" to="/app/recommendations" key={issue.id}><span><strong>{issue.title}</strong><small>{issue.effort} effort · {categoryLabels[issue.category]}</small></span><span>→</span></Link>)}</div></Card></div>
    <Card><div className="section-head"><div><span className="eyebrow">Full findings</span><h2>Evidence, meaning and recommendations</h2></div><span className="muted">Search, filter and sort the audit</span></div><IssueTable issues={audit.issues} /></Card>
  </div>
}