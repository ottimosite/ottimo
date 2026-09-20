import type { Audit, OptimizationAction } from '../../types/domain'
import { blockingDependencies } from '../../audit-engine/action-dependencies'

interface Props {
  audit: Audit
  openIssues: Audit['issues']
  actions: OptimizationAction[]
}

const phaseLabels = ['Understand', 'Decide', 'Act', 'Verify', 'Compare'] as const

export function AuditCommandCentre2({ audit, openIssues, actions }: Props) {
  const health = audit.health?.score
  const coverage = audit.healthModel?.categoryCoverage
  const coverageValues = coverage ? Object.values(coverage) : []
  const measuredCategories = coverageValues.filter(value => value === 'measured').length
  const evidenceMeasured = audit.issues.filter(issue => issue.evidence?.status === 'measured').length
  const evidenceInferred = audit.issues.filter(issue => issue.evidence?.status === 'inferred').length
  const evidenceUnavailable = audit.issues.filter(issue => !issue.evidence || issue.evidence.status === 'unavailable').length
  const ready = actions.filter(action => action.lifecycleStatus === 'planned' && !blockingDependencies(actions, action).some(item => item.lifecycleStatus !== 'resolved')).length
  const active = actions.filter(action => action.lifecycleStatus === 'in_progress' || action.lifecycleStatus === 'verification').length
  const blocked = actions.filter(action => blockingDependencies(actions, action).some(item => item.lifecycleStatus !== 'resolved')).length
  const verified = audit.verifications?.filter(item => item.status === 'verified').length ?? 0
  const verificationFailed = audit.verifications?.filter(item => item.status === 'failed').length ?? 0
  const changed = audit.comparison ? audit.comparison.newFindings + audit.comparison.regressed : undefined

  const phaseTargets = ['audit-evidence', 'audit-action-queue', 'audit-action-queue', 'audit-changes', 'audit-changes']

  return <section className="audit-centre-v2" aria-labelledby="audit-centre-heading">
    <header className="audit-centre-v2__hero">
      <div>
        <span className="eyebrow">Command centre</span>
        <h2 id="audit-centre-heading">Know what matters. Know what to do next.</h2>
        <p>Use this cockpit to orient yourself in the audit. Summary values come only from recorded evidence, actions, verification results and audit comparison data.</p>
      </div>
      <div className="audit-centre-v2__health" aria-label="Current audit health">
        <span>Health</span>
        <strong>{health === undefined ? '—' : health + '/100'}</strong>
        <small>{audit.health?.status === 'not-measured' ? 'Not measured' : audit.health?.status ?? 'Evidence available'}</small>
      </div>
    </header>

    <nav className="audit-centre-v2__steps" aria-label="Audit workflow">
      {phaseLabels.map((phase, index) => <a href={`#${phaseTargets[index]}`} key={phase}>
        <span>{index + 1}</span><strong>{phase}</strong>
      </a>)}
    </nav>

    <div className="audit-centre-v2__summary" aria-label="Audit decision summary">
      <a href="#audit-evidence"><span>Evidence</span><strong>{evidenceMeasured}</strong><small>{evidenceInferred} inferred · {evidenceUnavailable} unavailable</small></a>
      <a href="#audit-evidence"><span>Coverage</span><strong>{measuredCategories || '—'}</strong><small>{coverage ? measuredCategories + ' measured categories' : 'Category coverage unavailable'}</small></a>
      <a href="#audit-action-queue"><span>Decisions</span><strong>{openIssues.length}</strong><small>{openIssues.length ? 'Open findings' : 'No unresolved findings'}</small></a>
      <a href="#audit-action-queue"><span>Ready</span><strong>{ready}</strong><small>{blocked} blocked · {active} active</small></a>
      <a href="#audit-changes"><span>Verified</span><strong>{verified}</strong><small>{verificationFailed} failed · {audit.verifications?.length ?? 0} results</small></a>
      <a href="#audit-changes"><span>Change</span><strong>{changed === undefined ? '—' : changed}</strong><small>{audit.comparison ? 'New or regressed' : 'No previous audit'}</small></a>
    </div>

    <div className="audit-centre-v2__guidance">
      <div>
        <span className="eyebrow">Decision path</span>
        <h3>Start with evidence, then move the highest-value work forward.</h3>
      </div>
      <div className="audit-centre-v2__guidance-links">
        <a className="audit-centre-v2__link" href="#audit-evidence">Inspect evidence →</a>
        <a className="audit-centre-v2__link" href="#audit-action-queue">Review actions →</a>
        <a className="audit-centre-v2__link" href="#audit-changes">Check verification →</a>
      </div>
    </div>
  </section>
}
