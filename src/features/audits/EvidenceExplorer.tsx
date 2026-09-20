import { useState } from 'react'
import { categoryLabels } from '../../data/mock'
import { Card, Badge } from '../../components/ui'
import type { Audit, AuditIssue } from '../../types/domain'

function EvidenceItem({ issue, audit }: { issue: AuditIssue; audit: Audit }) {
  const pages = issue.affectedPages ?? []
  const resources = issue.affectedResources ?? []
  const evidence = issue.evidence
  const observations = audit.healthModel?.observations.filter(observation => typeof observation.pageUrl === 'string' && pages.includes(observation.pageUrl)).slice(0, 6) ?? []
  return <article className="evidence-explorer__item">
    <div className="evidence-explorer__item-head">
      <div>
        <Badge tone={issue.severity}>{issue.severity}</Badge>
        <span className="muted"> {categoryLabels[issue.category]}</span>
        <h3>{issue.title}</h3>
      </div>
      <span className={`evidence-status evidence-status--${evidence?.status ?? 'unavailable'}`}>{evidence?.status ?? 'unavailable'}</span>
    </div>
    <p>{issue.summary}</p>
    <div className="evidence-explorer__facts">
      <span><strong>{pages.length}</strong> affected page{pages.length === 1 ? '' : 's'}</span>
      <span><strong>{resources.length}</strong> affected resource{resources.length === 1 ? '' : 's'}</span>
      <span><strong>{issue.evidenceCount ?? 0}</strong> evidence item{issue.evidenceCount === 1 ? '' : 's'}</span>
    </div>
    <details>
      <summary>Inspect supporting evidence</summary>
      <div className="evidence-explorer__detail">
        {evidence?.status === 'measured' && <div><strong>Observed value</strong><span>{evidence.value === undefined ? 'Value recorded without a scalar value' : `${evidence.value}${evidence.unit ? ` ${evidence.unit}` : ''}`}</span></div>}
        <div><strong>Source</strong><span>{evidence?.source ?? 'Unavailable'}</span></div>
        <div><strong>Observed</strong><span>{evidence?.observedAt ?? 'Timestamp unavailable'}</span></div>
        <div><strong>Detail</strong><span>{evidence?.details ?? 'Supporting evidence details were not retained in this audit record.'}</span></div>
        {pages.length > 0 && <div><strong>Affected pages</strong><ul>{pages.slice(0, 8).map(page => <li key={page}><code>{page}</code></li>)}</ul>{pages.length > 8 && <small>+ {pages.length - 8} more pages</small>}</div>}
        {resources.length > 0 && <div><strong>Affected resources</strong><ul>{resources.slice(0, 8).map(resource => <li key={resource}><code>{resource}</code></li>)}</ul>{resources.length > 8 && <small>+ {resources.length - 8} more resources</small>}</div>}
        {observations.length > 0 && <div><strong>Related site observations</strong><ul>{observations.map(observation => <li key={observation.id}><span>{observation.kind}: {observation.value === undefined ? 'unavailable' : String(observation.value)}{observation.unit ? ` ${observation.unit}` : ''}</span> · {observation.provenance.source}</li>)}</ul></div>}
      </div>
    </details>
  </article>
}

export function EvidenceExplorer({ audit }: { audit: Audit }) {
  const [scope, setScope] = useState<'all' | 'resource' | 'page'>('all')
  const issues = audit.issues.filter(issue => scope === 'all' || (scope === 'resource' ? (issue.affectedResources?.length ?? 0) > 0 : (issue.affectedPages?.length ?? 0) > 0))
  const measured = issues.filter(issue => issue.evidence?.status === 'measured').length
  const inferred = issues.filter(issue => issue.evidence?.status === 'inferred').length
  const unavailable = issues.filter(issue => !issue.evidence || issue.evidence.status === 'unavailable').length
  return <section className="card evidence-explorer" id="evidence-explorer">
    <div className="section-head">
      <div><span className="eyebrow">Evidence explorer</span><h2>Why was this finding reported?</h2><p className="section-subtitle">Trace a finding to its recorded evidence, affected pages and resources. Ottimo only shows what the audit actually retained.</p></div>
      <span className="standard-tag">{measured} measured</span>
    </div>
    <div className="evidence-explorer__toolbar" role="group" aria-label="Evidence scope">
      {(['all', 'page', 'resource'] as const).map(value => <button key={value} className={scope === value ? 'active' : ''} onClick={() => setScope(value)}>{value === 'all' ? 'All findings' : `${value}-scoped`}</button>)}
    </div>
    <div className="evidence-explorer__summary"><span><strong>{measured}</strong> measured</span><span><strong>{inferred}</strong> inferred</span><span><strong>{unavailable}</strong> unavailable</span></div>
    <div className="evidence-explorer__list">
      {issues.length ? issues.slice(0, 10).map(issue => <EvidenceItem key={issue.id} issue={issue} audit={audit} />) : <p className="muted">No findings match this evidence scope.</p>}
    </div>
    {issues.length > 10 && <small className="muted">Showing the first 10 findings. Use Full findings below for the complete audit list.</small>}
  </section>
}
