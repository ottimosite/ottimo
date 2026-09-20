import { Link } from 'react-router-dom'
import { Card } from '../../components/ui'
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
  const ready = actions.filter(action => action.lifecycleStatus === 'planned' && !blockingDependencies(actions, action).some(item => item.lifecycleStatus !== 'resolved')).length
  const active = actions.filter(action => action.lifecycleStatus === 'in_progress' || action.lifecycleStatus === 'verification').length
  const blocked = actions.filter(action => blockingDependencies(actions, action).some(item => item.lifecycleStatus !== 'resolved')).length
  const verified = audit.verifications?.filter(item => item.status === 'verified').length ?? 0
  const changed = audit.comparison ? audit.comparison.newFindings + audit.comparison.regressed : 0
  const evidence = audit.issues.filter(issue => issue.evidence?.status === 'measured').length
  const coverage = audit.healthModel?.categoryCoverage
  const coverageValues = coverage ? Object.values(coverage) : []
  const measuredCategories = coverageValues.filter(value => value === 'measured').length
  const changedLabel = audit.comparison ? `${changed} new or regressed` : 'No previous audit'

  return <section className="audit-centre-v2" aria-labelledby="audit-centre-heading">
    <header className="audit-centre-v2__hero">
      <div>
        <span className="eyebrow">Command centre</span>
        <h2 id="audit-centre-heading">Know what matters. Know what to do next.</h2>
        <p>One view of the audit from evidence through to action and verification. Start with the decision, then open the technical detail when you need it.</p>
      </div>
      <div className="audit-centre-v2__health" aria-label="Audit health">
        <span>Health</span>
        <strong>{health === undefined ? '—' : `${health}/100`}</strong>
        <small>{audit.health?.status === 'not-measured' ? 'Not measured' : audit.health?.status ?? 'Evidence available'}</small>
      </div>
    </header>

    <nav className="audit-centre-v2__steps" aria-label="Audit workflow">
      {phaseLabels.map((phase, index) => <a href={index === 0 ? '#audit-evidence' : index === 1 ? '#audit-decisions' : index === 2 ? '#audit-actions' : index === 3 ? '#audit-verification' : '#audit-changes'} key={phase}>
        <span>{index + 1}</span><strong>{phase}</strong>
      </a>)}
    </nav>

    <div className="audit-centre-v2__summary">
      <article><span>Evidence</span><strong>{evidence}</strong><small>Measured findings</small></article>
      <article><span>Coverage</span><strong>{measuredCategories || '—'}</strong><small>{coverage ? `${measuredCategories} measured categories` : 'Category coverage unavailable'}</small></article>
      <article><span>Decisions</span><strong>{openIssues.length}</strong><small>{openIssues.length ? 'Open findings' : 'No unresolved findings'}</small></article>
      <article><span>Ready</span><strong>{ready}</strong><small>{blocked} blocked · {active} active</small></article>
      <article><span>Verified</span><strong>{verified}</strong><small>{audit.verifications?.length ? 'Post-fix results' : 'Awaiting verification'}</small></article>
      <article><span>Change</span><strong>{changed}</strong><small>{changedLabel}</small></article>
    </div>

    <div className="audit-centre-v2__grid">
      <section id="audit-evidence" className="card">
        <span className="eyebrow">01 · Understand</span>
        <h3>What did Ottimo actually observe?</h3>
        <p>Measured observations stay separate from inference and unavailable data. This keeps the audit evidence-led rather than implying certainty where none exists.</p>
        <div className="audit-centre-v2__facts">
          <span><strong>{evidence}</strong> measured findings</span>
          <span><strong>{audit.issues.filter(issue => issue.evidence?.status === 'inferred').length}</strong> inferred findings</span>
          <span><strong>{audit.issues.filter(issue => issue.evidence?.status === 'unavailable').length}</strong> unavailable</span>
          <span><strong>{audit.healthModel?.pages.length ?? '—'}</strong> pages modelled</span>
        </div>
        <a className="audit-centre-v2__link" href="#findings">Open evidence and findings →</a>
      </section>

      <section id="audit-decisions" className="card">
        <span className="eyebrow">02 · Decide</span>
        <h3>What needs attention first?</h3>
        <p>{openIssues.length ? `${openIssues.length} unresolved finding${openIssues.length === 1 ? '' : 's'} are available for a decision. Ottimo's action queue applies impact, severity, confidence, effort and dependencies.` : 'No unresolved findings were recorded for this audit.'}</p>
        <div className="audit-centre-v2__facts">
          <span><strong>{actions.length}</strong> actions</span>
          <span><strong>{ready}</strong> ready</span>
          <span><strong>{blocked}</strong> blocked</span>
        </div>
        <Link className="audit-centre-v2__link" to="/app/recommendations">Open decision queue →</Link>
      </section>

      <section id="audit-actions" className="card">
        <span className="eyebrow">03 · Act</span>
        <h3>Make the change with the right context.</h3>
        <p>Actions carry lifecycle state and prerequisites so implementation does not stop at a recommendation.</p>
        <div className="audit-centre-v2__status"><span><strong>{ready}</strong> ready to act</span><span><strong>{active}</strong> in progress</span><span><strong>{blocked}</strong> blocked by dependencies</span></div>
        <Link className="audit-centre-v2__link" to="/app/recommendations">Continue to actions →</Link>
      </section>

      <section id="audit-verification" className="card">
        <span className="eyebrow">04 · Verify</span>
        <h3>Did the fix work?</h3>
        <p>Verification compares later audit evidence against the action's expected outcome instead of treating completion as proof.</p>
        <div className="audit-centre-v2__facts">
          <span><strong>{verified}</strong> verified</span>
          <span><strong>{audit.verifications?.filter(item => item.status === 'failed').length ?? 0}</strong> failed</span>
          <span><strong>{audit.verifications?.filter(item => item.status === 'inconclusive').length ?? 0}</strong> inconclusive</span>
        </div>
        <a className="audit-centre-v2__link" href="#audit-changes">Review verification context →</a>
      </section>

      <section id="audit-changes" className="card">
        <span className="eyebrow">05 · Compare</span>
        <h3>What changed since the last audit?</h3>
        {audit.comparison ? <div className="audit-centre-v2__facts">
          <span><strong>{audit.comparison.resolved}</strong> resolved</span>
          <span><strong>{audit.comparison.newFindings}</strong> new</span>
          <span><strong>{audit.comparison.improved}</strong> improved</span>
          <span><strong>{audit.comparison.regressed}</strong> regressed</span>
        </div> : <p className="muted">A comparison will appear after a subsequent audit of the same website.</p>}
        {audit.comparison && <Link className="audit-centre-v2__link" to="/app/history">Open audit history →</Link>}
      </section>
    </div>
  </section>
}
