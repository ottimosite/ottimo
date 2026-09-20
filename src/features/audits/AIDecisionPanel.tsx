import { useMemo, useState } from 'react'
import type { Audit } from '../../types/domain'
import { analyseWithSafeguards, buildAIContext, MockAIProvider, type AIAnalysis } from '../../services/ai'
import { Card } from '../../components/ui'

export function AIDecisionPanel({ audit }: { audit: Audit }) {
  const candidates = useMemo(() => audit.issues.filter(issue => issue.status !== 'resolved'), [audit.issues])
  const [issueId, setIssueId] = useState(candidates[0]?.id ?? '')
  const [analysis, setAnalysis] = useState<AIAnalysis>()
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'unavailable'>('idle')
  const selectedIssue = candidates.find(issue => issue.id === issueId)

  async function requestGuidance() {
    if (!selectedIssue) return
    setState('loading')
    setAnalysis(undefined)
    const result = await analyseWithSafeguards(new MockAIProvider(), buildAIContext(audit))
    if (!result) { setState('unavailable'); return }
    setAnalysis(result)
    setState('ready')
  }

  return <Card className="ai-decision-panel" aria-labelledby="ai-decision-heading">
    <div className="section-head"><div><span className="eyebrow">Evidence-grounded AI</span><h2 id="ai-decision-heading">Understand the next step</h2></div><span className="standard-tag">Bounded guidance</span></div>
    <p className="performance-intro">Ottimo can explain an existing finding using supplied audit evidence. Guidance is a proposal, not a new measurement or acquisition claim.</p>
    {candidates.length ? <div className="ai-decision-controls">
      <label htmlFor="ai-finding">Finding to explain</label>
      <select id="ai-finding" value={issueId} onChange={event => { setIssueId(event.target.value); setAnalysis(undefined); setState('idle') }}>
        {candidates.map(issue => <option value={issue.id} key={issue.id}>{issue.title}</option>)}
      </select>
      <button className="btn btn-primary" type="button" onClick={requestGuidance} disabled={state === 'loading'}>{state === 'loading' ? 'Preparing guidance…' : 'Explain with evidence'}</button>
    </div> : <p className="muted">There are no unresolved findings available for AI guidance.</p>}
    {selectedIssue && <p className="ai-decision-context"><strong>Selected finding:</strong> {selectedIssue.title}</p>}
    {state === 'unavailable' && <p className="ai-decision-status" role="status">AI guidance is unavailable for this evidence set. The audit itself remains fully usable.</p>}
    {analysis && state === 'ready' && <div className="ai-decision-result" aria-live="polite">
      <div className="ai-decision-block"><span className="ai-decision-label">Evidence-backed explanation</span><p>{analysis.explanation.text}</p><small>{analysis.explanation.evidenceIds.length} evidence reference{analysis.explanation.evidenceIds.length === 1 ? '' : 's'} supplied</small></div>
      <div className="ai-decision-block ai-decision-proposal"><span className="ai-decision-label">Proposal</span><p>{analysis.nextStep.text}</p><small>Proposal only · verify against the audit evidence before implementation.</small></div>
    </div>}
  </Card>
}
