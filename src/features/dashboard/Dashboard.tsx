import { Link } from 'react-router-dom'
import { auditScores, seedAudits, seedWebsites, categoryLabels } from '../../data/mock'
import { storage } from '../../services/storage'
import { Card, Score, Progress } from '../../components/ui'
import { formatDate } from '../../lib/format'

export function Dashboard() {
  const storedAudits = storage.audits()
  const storedWebsites = storage.websites()
  const audits = storedAudits.length ? storedAudits : seedAudits
  const websites = storedWebsites.length ? storedWebsites : seedWebsites
  const audit = audits[audits.length - 1]!
  const website = websites.find(item => item.id === audit.websiteId) ?? websites[0]

  return <div className="stack">
    <div className="page-heading">
      <div><span className="eyebrow">Overview</span><h1>Your digital presence at a glance.</h1><p>See what matters most, fix the highest-impact issues and track progress over time.</p></div>
      <Link className="btn btn-primary" to="/app/audits/new">Run an audit</Link>
    </div>

    <div className="hero-metrics">
      <Card className="score-card">
        <div><span className="muted">Overall health</span>{audit.score === undefined ? <div className="score"><strong>—</strong><span>Not measured</span></div> : <Score value={audit.score} label="Measured" />}</div>
        <div className="metric-copy"><span className="eyebrow">Latest audit</span><strong>{website?.name ?? audit.url}</strong><p>{formatDate(audit.createdAt)} · {audit.durationMs}ms audit runtime.</p><Link to={`/app/audits/${audit.id}`}>View audit →</Link></div>
      </Card>
      <Card><span className="muted">Websites</span><strong className="big-number">{websites.length}</strong><p>{websites.length === 1 ? '1 property' : `${websites.length} properties`} under care.</p><Link to="/app/websites">Manage websites →</Link></Card>
      <Card><span className="muted">Open actions</span><strong className="big-number">{audit.issues.filter(i => i.status !== 'resolved').length}</strong><p>Prioritised by impact and effort</p><Link to="/app/recommendations">View actions →</Link></Card>
    </div>

    <div className="grid-2">
      <Card>
        <div className="section-head"><div><span className="eyebrow">Health by domain</span><h2>Scores that mean something</h2></div><Link to="/app/performance">Details →</Link></div>
        <div className="score-list">{audit.scores.map(s => <div className="score-row" key={s.category}><span>{categoryLabels[s.category]}</span>{s.score === undefined ? <span className="muted">Not measured</span> : <><Progress value={s.score} /><strong>{s.score}</strong></>}</div>)}</div>
      </Card>
      <Card>
        <div className="section-head"><div><span className="eyebrow">Next actions</span><h2>Start with the biggest wins</h2></div><Link to="/app/recommendations">All actions →</Link></div>
        <div className="action-list">{audit.issues.filter(i => i.status !== 'resolved').sort((a, b) => b.priority - a.priority).slice(0, 4).map(i => <Link className="action" key={i.id} to="/app/recommendations"><span className={`dot ${i.severity}`} /><span><strong>{i.title}</strong><small>{i.category} · {i.effort} effort · priority {i.priority}</small></span><span>→</span></Link>)}</div>
      </Card>
    </div>
  </div>
}
