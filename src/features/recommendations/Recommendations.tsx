import { useMemo, useState } from 'react'
import { seedAudits, categoryLabels } from '../../data/mock'
import { storage } from '../../services/storage'
import type { Status } from '../../types/domain'
import { buildOptimizationActions } from '../../audit-engine/actions'
import { Badge, Card } from '../../components/ui'

export function Recommendations() {
  const [audits, setAudits] = useState(() => storage.audits().length ? storage.audits() : seedAudits)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('priority')
  const all = audits.flatMap(audit => (audit.actions ?? buildOptimizationActions(audit.issues)).map(action => ({ ...action, auditId: audit.id })))
  const shown = useMemo(() => [...all]
    .filter(issue => (category === 'all' || issue.category === category) && (status === 'all' || issue.status === status) && `${issue.title} ${issue.expectedOutcome} ${issue.implementationSteps.join(' ')}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => sort === 'priority' ? b.priorityScore - a.priorityScore : a.title.localeCompare(b.title)), [all, category, query, sort, status])

  const updateStatus = (auditId: string, issueId: string, nextStatus: Status) => {
    const next = audits.map(audit => audit.id === auditId ? { ...audit, issues: audit.issues.map(issue => issue.id === issueId ? { ...issue, status: nextStatus } : issue) } : audit)
    setAudits(next)
    storage.saveAudits(next)
  }

  return <div className="stack"><div className="page-heading"><div><span className="eyebrow">Recommendations</span><h1>Fix the things that matter most.</h1><p>Prioritised findings turn technical detail into a practical queue. Status changes are saved in this browser.</p></div></div><Card><div className="filters"><input aria-label="Search recommendations" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search recommendations..."/><select aria-label="Filter category" value={category} onChange={event => setCategory(event.target.value)}><option value="all">All categories</option>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select aria-label="Filter status" value={status} onChange={event => setStatus(event.target.value)}><option value="all">All status</option><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select><select aria-label="Sort recommendations" value={sort} onChange={event => setSort(event.target.value)}><option value="priority">Highest priority</option><option value="title">Title</option></select></div><div className="recommendations">{shown.length ? shown.map(issue => <article className="recommendation" key={`${issue.auditId}-${issue.id}`}><div><Badge tone={issue.severity}>{issue.severity}</Badge><span className="muted"> {categoryLabels[issue.category]}</span><h3>{issue.title}</h3><p>{issue.implementationSteps[1]}</p><p><strong>Why it matters:</strong> {issue.expectedOutcome}</p><p><strong>Verification:</strong> {issue.verification[0]?.description}</p><small>{issue.affectedPages.length} affected page{issue.affectedPages.length === 1 ? '' : 's'} · {issue.evidenceCount} evidence item{issue.evidenceCount === 1 ? '' : 's'}</small></div><div className="rec-meta"><strong>{issue.priorityScore}</strong><small>action priority</small><span>{issue.impact} impact · {issue.effort} effort</span><label className="sr-only" htmlFor={`status-${issue.auditId}-${issue.id}`}>Status for {issue.title}</label><select id={`status-${issue.auditId}-${issue.id}`} value={issue.status} onChange={event => updateStatus(issue.auditId, issue.id, event.target.value as Status)}><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select></div></article>) : <p className="muted">No recommendations match these filters.</p>}</div></Card></div>
}
