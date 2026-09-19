import { Link, useParams } from 'react-router-dom'
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
  const audit = currentAudits().at(-1) ?? seedAudits.at(-1)!
  const score = audit.scores.find(item => item.category === category) ?? auditScores.find(item => item.category === category)!
  const issues = audit.issues.filter(issue => issue.category === category).sort((a, b) => b.priority - a.priority)
  const copy = categoryCopy[category]
  return <div className="stack">
    <div className="page-heading"><div><span className="eyebrow">{categoryLabels[category]}</span><h1>{copy.title}</h1><p>{copy.body}</p></div><Link className="btn btn-primary" to="/app/audits/new">Run another audit</Link></div>
    <div className="grid-2"><Card className="score-card"><div><span className="muted">Latest score</span>{score.score === undefined ? <div className="score"><strong>—</strong><span>Not measured</span></div> : <Score value={score.score} label={titleCase(category)} />}</div><div className="metric-copy"><span className="eyebrow">What next</span><p>{copy.next}</p><Link to="/app/recommendations">Open recommendations →</Link></div></Card><Card><span className="muted">Open findings</span><strong className="big-number">{issues.filter(issue => issue.status !== 'resolved').length}</strong><p>{issues.length} findings in the latest audit.</p></Card></div>
    <Card><div className="section-head"><div><span className="eyebrow">Latest signals</span><h2>Issues in this domain</h2></div>{score.score === undefined ? <span className="muted">Not measured</span> : <Progress value={score.score} />}</div><div className="issue-list">{issues.length ? issues.map(issue => <article className="issue" key={issue.id}><div className="issue-top"><div><Badge tone={issue.severity}>{issue.severity}</Badge><h3>{issue.title}</h3></div><strong>#{issue.priority}</strong></div><p>{issue.summary}</p><div className="issue-foot"><span>{issue.effort} effort</span><Badge tone={issue.status}>{titleCase(issue.status)}</Badge></div></article>) : <p className="muted">No findings are recorded for this category yet.</p>}</div></Card>
  </div>
}

export function WebsiteDetail() {
  const { id } = useParams()
  const websites = storage.websites().length ? storage.websites() : seedWebsites
  const website = websites.find(item => item.id === id)
  const audits = currentAudits().filter(audit => audit.websiteId === id)
  if (!website) return <Card><h1>Website not found</h1><p>The local demo could not find that property.</p><Link to="/app/websites">Back to websites</Link></Card>
  return <div className="stack"><div className="page-heading"><div><span className="eyebrow">Website</span><h1>{website.name}</h1><p>{website.url}</p></div><Link className="btn btn-primary" to="/app/audits/new">Run audit</Link></div><div className="grid-2"><Card><span className="muted">Audits recorded</span><strong className="big-number">{audits.length}</strong><p>Local history for this website.</p></Card><Card><span className="muted">Latest health</span><strong className="big-number">{audits.at(-1)?.score ?? '—'}</strong><p>{audits.at(-1) ? formatDate(audits.at(-1)!.createdAt) : 'Not audited yet'}</p></Card></div><Card><div className="section-head"><h2>Audit history</h2><Link to="/app/history">Compare all history →</Link></div>{audits.length ? <div className="audit-list">{audits.map(audit => <Link className="audit-item" to={`/app/audits/${audit.id}`} key={audit.id}><span className="audit-score">{audit.score}</span><span><strong>{formatDate(audit.createdAt)}</strong><small>{audit.issues.length} findings · {audit.durationMs}ms</small></span><span>→</span></Link>)}</div> : <p className="muted">Run the first audit to create a baseline.</p>}</Card></div>
}

export function ReportsPage() {
  const audit = currentAudits().at(-1) ?? seedAudits.at(-1)!
  return <div className="stack"><div className="page-heading"><div><span className="eyebrow">Reports</span><h1>A clear briefing for the next decision.</h1><p>Summarise the latest audit for a business owner, product team or developer.</p></div><Button variant="secondary" onClick={() => window.print()}>Print report</Button></div><Card className="report-header"><div><span className="eyebrow">Ottimo audit report</span><h2>{audit.url}</h2><p>Generated {formatDate(audit.createdAt)} from deterministic local demo data.</p></div>{audit.score === undefined ? <div className="score"><strong>—</strong><span>Not measured</span></div> : <Score value={audit.score} label="Overall health" />}</Card><div className="grid-3">{audit.scores.map(item => <Card key={item.category}><span className="muted">{categoryLabels[item.category]}</span><strong className="big-number">{item.score ?? "—"}</strong>{item.score === undefined ? <small>Not measured</small> : <Progress value={item.score} />}</Card>)}</div><Card><span className="eyebrow">Priority queue</span><h2>Three actions to take next</h2><div className="action-list">{audit.issues.filter(issue => issue.status !== 'resolved').sort((a, b) => b.priority - a.priority).slice(0, 3).map(issue => <Link className="action" to="/app/recommendations" key={issue.id}><span><strong>{issue.title}</strong><small>{issue.solution}</small></span><span>#{issue.priority} →</span></Link>)}</div></Card></div>
}

export function HistoryPage() {
  const audits = currentAudits()
  return <div className="stack"><div className="page-heading"><div><span className="eyebrow">History</span><h1>Progress you can explain.</h1><p>Compare audit scores over time and keep improvements connected to the work that caused them.</p></div></div><Card><div className="history-chart" aria-label="Audit score history">{audits.map((audit, index) => <div className="history-point" key={audit.id}><strong>{audit.score}</strong><span style={{ height: `${Math.max(20, audit.score)}%` }} /><small>{formatDate(audit.createdAt)}</small><em>{index ? `${audit.score - audits[index - 1].score >= 0 ? '+' : ''}${audit.score - audits[index - 1].score}` : 'Baseline'}</em></div>)}</div></Card><Card><div className="section-head"><h2>Audit timeline</h2><span className="muted">{audits.length} audits</span></div><div className="audit-list">{audits.slice().reverse().map(audit => <Link className="audit-item" to={`/app/audits/${audit.id}`} key={audit.id}><span className="audit-score">{audit.score}</span><span><strong>{audit.url}</strong><small>{formatDate(audit.createdAt)} · {audit.issues.filter(issue => issue.status !== 'resolved').length} open issues</small></span><span>→</span></Link>)}</div></Card></div>
}

export function SettingsPage() { return <div className="narrow stack"><div className="page-heading"><div><span className="eyebrow">Settings</span><h1>Keep the demo aligned to your work.</h1><p>These controls stay in this browser. No account or external service is required.</p></div></div><Card><h2>Workspace</h2><label>Workspace name<input defaultValue="Ottimo demo workspace" /></label><label>Default website<select defaultValue="example.com"><option>example.com</option><option>ottimo.test</option></select></label><p className="muted">Local audit data is stored in your browser and can be cleared through browser storage controls.</p><Button variant="secondary" onClick={() => window.alert('Demo settings are already saved locally.')}>Save settings</Button></Card></div> }