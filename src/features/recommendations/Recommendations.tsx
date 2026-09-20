import { useMemo, useState } from 'react'
import { seedAudits, categoryLabels } from '../../data/mock'
import { storage } from '../../services/storage'
import type { ActionLifecycleStatus, Audit, OptimizationAction } from '../../types/domain'
import { buildOptimizationActions } from '../../audit-engine/actions'
import { buildInitialActionLifecycle } from '../../audit-engine/action-lifecycle'
import { Badge, Card } from '../../components/ui'

const lifecycleOrder: ActionLifecycleStatus[] = ['planned', 'in_progress', 'verification', 'resolved', 'failed', 'inconclusive']

const lifecycleLabels: Record<ActionLifecycleStatus, string> = {
  planned: 'Planned',
  in_progress: 'In progress',
  verification: 'Verification',
  resolved: 'Resolved',
  failed: 'Verification failed',
  inconclusive: 'Verification inconclusive',
}

const lifecycleTone: Record<ActionLifecycleStatus, string> = {
  planned: 'neutral',
  in_progress: 'high',
  verification: 'medium',
  resolved: 'low',
  failed: 'critical',
  inconclusive: 'medium',
}

const hydrateAuditActions = (audit: Audit): Audit => ({
  ...audit,
  actions: audit.actions?.length ? buildInitialActionLifecycle(audit.actions) : buildInitialActionLifecycle(buildOptimizationActions(audit.issues)),
})

const transition = (status: ActionLifecycleStatus, next: ActionLifecycleStatus): boolean => {
  const allowed: Record<ActionLifecycleStatus, ActionLifecycleStatus[]> = {
    planned: ['in_progress'],
    in_progress: ['verification', 'planned'],
    verification: ['resolved', 'failed', 'inconclusive'],
    resolved: ['in_progress'],
    failed: ['in_progress'],
    inconclusive: ['in_progress'],
  }
  return allowed[status].includes(next)
}

export function Recommendations() {
  const [audits, setAudits] = useState(() => {
    const stored = storage.audits()
    const source = stored.length ? stored : seedAudits
    return source.map(hydrateAuditActions)
  })
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('priority')

  const all = audits.flatMap(audit => (audit.actions ?? []).map(action => ({ ...action, auditId: audit.id })))
  const shown = useMemo(() => [...all]
    .filter(action =>
      (category === 'all' || action.category === category) &&
      (status === 'all' || action.lifecycleStatus === status) &&
      `${action.title} ${action.expectedOutcome} ${action.implementationSteps.join(' ')}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => sort === 'priority' ? b.priorityScore - a.priorityScore : a.title.localeCompare(b.title)),
  [all, category, query, sort, status])

  const updateLifecycle = (auditId: string, actionId: string, nextStatus: ActionLifecycleStatus) => {
    const next = audits.map(audit => {
      if (audit.id !== auditId) return audit
      const action = audit.actions?.find(item => item.id === actionId)
      if (!action || !transition(action.lifecycleStatus, nextStatus)) return audit
      return {
        ...audit,
        actions: audit.actions?.map(item => item.id === actionId
          ? { ...item, lifecycleStatus: nextStatus, status: nextStatus === 'resolved' ? 'resolved' : nextStatus === 'in_progress' ? 'in_progress' : item.status }
          : item),
      }
    })
    setAudits(next)
    storage.saveAudits(next)
  }

  return <div className="stack">
    <div className="page-heading">
      <div>
        <span className="eyebrow">Recommendations</span>
        <h1>Fix the things that matter most.</h1>
        <p>Prioritised actions turn evidence into a practical queue. Lifecycle state is saved in this browser.</p>
      </div>
    </div>
    <Card>
      <div className="filters">
        <input aria-label="Search recommendations" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search recommendations..." />
        <select aria-label="Filter category" value={category} onChange={event => setCategory(event.target.value)}><option value="all">All categories</option>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select aria-label="Filter lifecycle status" value={status} onChange={event => setStatus(event.target.value)}><option value="all">All lifecycle states</option>{lifecycleOrder.map(value => <option key={value} value={value}>{lifecycleLabels[value]}</option>)}</select>
        <select aria-label="Sort recommendations" value={sort} onChange={event => setSort(event.target.value)}><option value="priority">Highest priority</option><option value="title">Title</option></select>
      </div>
      <div className="recommendations">
        {shown.length ? shown.map(action => (
          <article className="recommendation" key={`${action.auditId}-${action.id}`}>
            <div>
              <div className="rec-labels"><Badge tone={action.severity}>{action.severity}</Badge><Badge tone={lifecycleTone[action.lifecycleStatus]}>{lifecycleLabels[action.lifecycleStatus]}</Badge><span className="muted">{categoryLabels[action.category]}</span></div>
              <h3>{action.title}</h3>
              <p>{action.implementationSteps[1]}</p>
              <p><strong>Why it matters:</strong> {action.expectedOutcome}</p>
              <p><strong>Verification:</strong> {action.verification[0]?.description}</p>
              <small>{action.affectedPages.length} affected page{action.affectedPages.length === 1 ? '' : 's'} · {action.evidenceCount} evidence item{action.evidenceCount === 1 ? '' : 's'} · audit {action.auditId}</small>
            </div>
            <div className="rec-meta">
              <strong>{action.priorityScore}</strong>
              <small>action priority</small>
              <span>{action.impact} impact · {action.effort} effort</span>
              <label className="sr-only" htmlFor={`status-${action.auditId}-${action.id}`}>Lifecycle status for {action.title}</label>
              <select id={`status-${action.auditId}-${action.id}`} aria-label={`Lifecycle status for ${action.title}`} value={action.lifecycleStatus} onChange={event => updateLifecycle(action.auditId, action.id, event.target.value as ActionLifecycleStatus)}>
                {lifecycleOrder.filter(next => next === action.lifecycleStatus || transition(action.lifecycleStatus, next)).map(next => <option key={next} value={next}>{lifecycleLabels[next]}</option>)}
              </select>
            </div>
          </article>
        )) : <p className="muted">No recommendations match these filters.</p>}
      </div>
    </Card>
  </div>
}
