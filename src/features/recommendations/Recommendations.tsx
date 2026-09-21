import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { categoryLabels } from '../../data/mock'
import { storage } from '../../services/storage'
import { localRepository } from '../../services/local-repository'
import type { ActionLifecycleStatus, Audit, OptimizationAction } from '../../types/domain'
import { buildOptimizationActions } from '../../audit-engine/actions'
import { prioritiseAction, type RegressionRisk } from '../../audit-engine/action-prioritisation'
import { buildInitialActionLifecycle } from '../../audit-engine/action-lifecycle'
import { blockingDependencies, canTransitionAction, normaliseActionDependencies } from '../../audit-engine/action-dependencies'
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

const regressionRiskFor = (audit: Audit, action: OptimizationAction): RegressionRisk => {
  const change = audit.comparison?.changes.find(item => item.fingerprint === action.fingerprint)
  if (!change || change.type !== 'regressed') return 'none'
  if (change.currentSeverity === 'critical' || change.currentSeverity === 'high') return 'high'
  return 'medium'
}

const hydrateAuditActions = (audit: Audit): Audit => {
  const actions = normaliseActionDependencies(audit.actions?.length
    ? buildInitialActionLifecycle(audit.actions)
    : buildInitialActionLifecycle(buildOptimizationActions(audit.issues)))
    .map(action => {
      const issue = audit.issues.find(item => item.id === action.issueId)
      if (!issue) return action
      const priority = prioritiseAction(issue, {
        dependencies: action.dependencies,
        lifecycleStatus: action.lifecycleStatus,
        regressionRisk: regressionRiskFor(audit, action),
      })
      return { ...action, priority, priorityScore: priority.score }
    })
    .map(action => ({
      ...action,
      work: action.work ?? {
        originatingFindingId: action.issueId,
        originatingAuditId: audit.id,
        evidenceLinks: [{ label: 'Originating finding', href: `/app/audits/${audit.id}#findings`, relation: 'finding' }],
      },
    }))

  return { ...audit, actions }
}

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

const isBlocked = (action: OptimizationAction, actions: OptimizationAction[]) =>
  action.lifecycleStatus !== 'resolved' &&
  blockingDependencies(actions, action).some(dependency => dependency.lifecycleStatus !== 'resolved')

const priorityLabel = (score: number) => score >= 80 ? 'High priority' : score >= 55 ? 'Medium priority' : 'Lower priority'

const verificationLabels = { observed: 'Verified by later audit', pending: 'Not yet observed', failed: 'Finding still present', inconclusive: 'Evidence inconclusive' } as const
const verificationTone = { observed: 'low', pending: 'neutral', failed: 'critical', inconclusive: 'medium' } as const
type VerificationViewState = keyof typeof verificationLabels
const verificationState = (audit: Audit | undefined, action: OptimizationAction): VerificationViewState => {
  const verification = audit?.verifications?.find(item => item.actionId === action.id)
  if (verification?.status === 'verified') return 'observed'
  if (verification?.status === 'failed') return 'failed'
  if (verification?.status === 'inconclusive') return 'inconclusive'
  return 'pending'
}

export function Recommendations() {
  const [audits, setAudits] = useState(() => {
    return localRepository.audits().map(hydrateAuditActions)
  })
  const websiteId = new URLSearchParams(useLocation().search).get('website') ?? undefined
  const websites = localRepository.websites()
  const website = websiteId ? websites.find(item => item.id === websiteId) : undefined
  const scopedAudits = websiteId ? audits.filter(audit => audit.websiteId === websiteId) : audits
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('priority')

  const all = scopedAudits.flatMap(audit => (audit.actions ?? []).map(action => ({ ...action, auditId: audit.id })))
  const blockedCount = all.filter(action => isBlocked(action, scopedAudits.find(audit => audit.id === action.auditId)?.actions ?? [])).length
  const readyCount = all.filter(action => action.lifecycleStatus === 'planned' && !isBlocked(action, scopedAudits.find(audit => audit.id === action.auditId)?.actions ?? [])).length
  const inProgressCount = all.filter(action => action.lifecycleStatus === 'in_progress' || action.lifecycleStatus === 'verification').length
  const verifiedCount = all.filter(action => verificationState(scopedAudits.find(audit => audit.id === action.auditId), action) === 'observed').length
  const pendingVerificationCount = all.filter(action => verificationState(scopedAudits.find(audit => audit.id === action.auditId), action) === 'pending').length

  const shown = useMemo(() => [...all]
    .filter(action =>
      (category === 'all' || action.category === category) &&
      (status === 'all' || action.lifecycleStatus === status) &&
      `${action.title} ${action.expectedOutcome} ${action.implementationSteps.join(' ')}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => sort === 'priority'
      ? b.priorityScore - a.priorityScore || a.title.localeCompare(b.title)
      : a.title.localeCompare(b.title)),
  [all, category, query, sort, status])

  const updateWork = (auditId: string, actionId: string, changes: { owner?: string; implementationNotes?: string }) => {
    const next = audits.map(audit => audit.id !== auditId ? audit : {
      ...audit,
      actions: audit.actions?.map(item => item.id !== actionId ? item : {
        ...item,
        work: {
          originatingFindingId: item.work?.originatingFindingId ?? item.issueId,
          originatingAuditId: item.work?.originatingAuditId ?? audit.id,
          evidenceLinks: item.work?.evidenceLinks ?? [],
          ...item.work,
          ...changes,
        },
      }),
    })
    setAudits(next)
    storage.saveAudits(next)
  }

  const updateLifecycle = (auditId: string, actionId: string, nextStatus: ActionLifecycleStatus) => {
    const next = audits.map(audit => {
      if (audit.id !== auditId) return audit
      const action = audit.actions?.find(item => item.id === actionId)
      if (!action || !transition(action.lifecycleStatus, nextStatus) || !canTransitionAction(action, nextStatus, audit.actions ?? [])) return audit
      return {
        ...audit,
        actions: audit.actions?.map(item => item.id === actionId
          ? {
              ...item,
              lifecycleStatus: nextStatus,
              status: nextStatus === 'resolved' ? 'resolved' : nextStatus === 'in_progress' ? 'in_progress' : item.status,
            }
          : item),
      }
    })
    setAudits(next)
    storage.saveAudits(next)
  }

  return <div className="stack">
    <div className="page-heading">
      <div>
        <span className="eyebrow">{website ? `Actions · ${website.name}` : 'Actions'}</span>
        <h1>Fix the things that matter most.</h1>
        <p>{website ? 'A website-specific execution queue keeps each recommendation connected to the evidence that created it and the verification needed to prove the change.' : 'Prioritised actions turn evidence into a practical execution queue. Work is ordered by deterministic priority, while dependencies prevent unsafe transitions.'}</p>
      </div>
    </div>

    <div className="action-summary" aria-label="Action queue summary">
      <Card className="action-summary-card"><strong>{all.length}</strong><span>Total actions</span></Card>
      <Card className="action-summary-card"><strong>{readyCount}</strong><span>Ready to act</span></Card>
      <Card className="action-summary-card"><strong>{blockedCount}</strong><span>Blocked</span></Card>
      <Card className="action-summary-card"><strong>{inProgressCount}</strong><span>In progress</span></Card>
      <Card className="action-summary-card"><strong>{verifiedCount}</strong><span>Verified</span></Card>
    </div>

    <Card className="action-verification-brief">
      <div>
        <span className="eyebrow">Action → verification</span>
        <h2>Implementation is not proof.</h2>
        <p>Changing a lifecycle state records workflow progress. Verification becomes observed only when a later audit supplies evidence that the associated finding changed.</p>
      </div>
      <div className="action-verification-status" aria-label="Verification summary">
        <span><strong>{verifiedCount}</strong> observed</span>
        <span><strong>{pendingVerificationCount}</strong> awaiting evidence</span>
      </div>
    </Card>

    <Card>
      <div className="queue-intro">
        <div>
          <span className="eyebrow">Execution queue</span>
          <h2>Start with the highest-value unblocked work.</h2>
        </div>
        <p className="muted">Priority is evidence-led. A blocked action stays visible so its prerequisite is never hidden.</p>
      </div>

      <div className="filters">
        <input aria-label="Search recommendations" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search recommendations..." />
        <select aria-label="Filter category" value={category} onChange={event => setCategory(event.target.value)}><option value="all">All categories</option>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select aria-label="Filter lifecycle status" value={status} onChange={event => setStatus(event.target.value)}><option value="all">All lifecycle states</option>{lifecycleOrder.map(value => <option key={value} value={value}>{lifecycleLabels[value]}</option>)}</select>
        <select aria-label="Sort recommendations" value={sort} onChange={event => setSort(event.target.value)}><option value="priority">Highest priority</option><option value="title">Title</option></select>
      </div>

      <div className="recommendations">
        {shown.length ? shown.map(action => {
          const audit = audits.find(item => item.id === action.auditId)
          const dependencies = blockingDependencies(audit?.actions ?? [], action)
          const blocked = isBlocked(action, audit?.actions ?? [])
          const verification = audit?.verifications?.find(item => item.actionId === action.id)
          const verificationView = verificationState(audit, action)
          const evidenceHref = audit ? `/app/audits/${audit.id}#findings` : '/app/audits'

          return <article className={`recommendation ${blocked ? 'recommendation-blocked' : ''}`} key={`${action.auditId}-${action.id}`}>
            <div className="recommendation-main">
              <div className="rec-labels">
                <Badge tone={action.severity}>{action.severity}</Badge>
                <Badge tone={lifecycleTone[action.lifecycleStatus]}>{lifecycleLabels[action.lifecycleStatus]}</Badge>
                {blocked && <Badge tone="critical">Blocked</Badge>}
                <span className="muted">{categoryLabels[action.category]}</span>
              </div>

              <h3>{action.title}</h3>
              <p className="recommendation-priority"><strong>{priorityLabel(action.priorityScore)}</strong> · {action.priorityScore}/100 · {action.severity} severity · {action.affectedPages.length} affected pages</p><div className="action-next-step" aria-label={`Next step for ${action.title}`}><strong>Next step</strong><span>{blocked ? 'Complete the prerequisite before implementation.' : action.lifecycleStatus === 'planned' ? 'Assign ownership and move into implementation.' : action.lifecycleStatus === 'in_progress' ? 'Complete implementation, then request verification.' : action.lifecycleStatus === 'verification' ? 'Run a verification audit and inspect the observed evidence.' : action.lifecycleStatus === 'failed' ? 'Review the failed evidence and return to implementation.' : action.lifecycleStatus === 'inconclusive' ? 'Collect stronger evidence before treating the change as verified.' : 'Review the verification evidence and decide what to address next.'}</span></div>
              <p>{action.implementationSteps[1]}</p>
              <p><strong>Why it matters:</strong> {action.expectedOutcome}</p><div className="action-evidence-chain" aria-label={`Evidence chain for ${action.title}`}><span>Finding</span><span>→</span><span>Action</span><span>→</span><span>Verification</span></div>

              {blocked && <div className="dependency-warning" role="status">
                <strong>Blocked by prerequisite{dependencies.length === 1 ? '' : 's'}:</strong>
                <ul>
                  {dependencies.filter(dependency => dependency.lifecycleStatus !== 'resolved').map(dependency =>
                    <li key={dependency.id}>{dependency.title} — {lifecycleLabels[dependency.lifecycleStatus]}</li>,
                  )}
                </ul>
              </div>}

              <div className="action-proof">
                <div className="action-proof__head"><div><span className="eyebrow">Proof of change</span><strong>{verificationLabels[verificationView]}</strong></div><Badge tone={verificationTone[verificationView]}>{verificationLabels[verificationView]}</Badge></div>
                <p><strong>Verify:</strong> {action.verification[0]?.description ?? 'A later audit must provide enough evidence to confirm the intended change.'}</p>
                {verification ? <p className="muted"><strong>Observed evidence:</strong> {verification.evidence}</p> : <p className="muted">No later-audit verification evidence is recorded yet. This is not treated as success or failure.</p>}
                <div className="action-proof__links"><Link to={evidenceHref}>Review originating evidence →</Link><Link to={`/app/audits/${action.auditId}?finding=${encodeURIComponent(action.issueId ?? '')}#ai-decision`}>Explain with evidence →</Link><Link to={`/app/audits/new/run?audit=${encodeURIComponent(action.auditId)}`}>Run verification audit →</Link></div>
              </div>

              <details>
                <summary>Work context and implementation detail</summary>
                <div className="action-details">
                  <p><strong>Originating finding:</strong> {action.work?.originatingFindingId ?? action.issueId}</p>
                  <label>Owner
                    <input aria-label={`Owner for ${action.title}`} value={action.work?.owner ?? ''} placeholder="Unassigned" onChange={event => updateWork(action.auditId, action.id, { owner: event.target.value })} />
                  </label>
                  <label>Implementation notes
                    <textarea aria-label={`Implementation notes for ${action.title}`} value={action.work?.implementationNotes ?? ''} placeholder="Capture implementation context for the next person working on this action." onChange={event => updateWork(action.auditId, action.id, { implementationNotes: event.target.value })} />
                  </label>
                  <p><strong>Evidence links:</strong> {action.work?.evidenceLinks.length ?? 0} attached</p>
                  {action.work?.evidenceLinks.map(link => <Link key={`${link.relation}-${link.href}`} to={link.href}>{link.label} →</Link>)}
                </div>
              </details>

              <details>
                <summary>Priority and implementation detail</summary>
                <div className="action-details">
                  <p><strong>Implementation:</strong> {action.implementationSteps.join(' → ')}</p>
                  <p><strong>Scope:</strong> {action.affectedPages.length} affected page{action.affectedPages.length === 1 ? '' : 's'} · {action.affectedResources.length} resource{action.affectedResources.length === 1 ? '' : 's'} · {action.evidenceCount} evidence item{action.evidenceCount === 1 ? '' : 's'}</p>
                  <dl>
                    <div><dt>Severity factor</dt><dd>{action.priority.severity}</dd></div>
                    <div><dt>Scope factor</dt><dd>{action.priority.scope}</dd></div>
                    <div><dt>Evidence factor</dt><dd>{action.priority.evidence}</dd></div>
                    <div><dt>Dependency factor</dt><dd>{action.priority.dependency}</dd></div>
                    <div><dt>Verification factor</dt><dd>{action.priority.verification}</dd></div>
                    <div><dt>Regression-risk factor</dt><dd>{action.priority.regressionRisk}</dd></div>
                  </dl>
                </div>
              </details>
            </div>

            <div className="rec-meta">
              <strong>{action.priorityScore}</strong>
              <small>action priority</small>
              <span>{blocked ? 'Prerequisite required' : 'Ready for next valid step'}</span>
              <label className="sr-only" htmlFor={`status-${action.auditId}-${action.id}`}>Lifecycle status for {action.title}</label>
              <select id={`status-${action.auditId}-${action.id}`} aria-label={`Lifecycle status for ${action.title}`} value={action.lifecycleStatus} onChange={event => updateLifecycle(action.auditId, action.id, event.target.value as ActionLifecycleStatus)}>
                {lifecycleOrder.filter(next => next === action.lifecycleStatus || transition(action.lifecycleStatus, next)).map(next => <option key={next} value={next}>{lifecycleLabels[next]}</option>)}
              </select>
            </div>
          </article>
        }) : <p className="muted">No recommendations match these filters.</p>}
      </div>
    </Card>
  </div>
}
