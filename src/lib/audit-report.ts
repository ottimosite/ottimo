import type { Audit, AuditIssue } from '../types/domain'
import { formatDateTime } from './format'

const escapeHtml = (value: string | number | undefined) =>
  String(value ?? '—')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const severityRank: Record<AuditIssue['severity'], number> = { critical: 4, high: 3, medium: 2, low: 1 }

export function buildAuditReportHtml(audit: Audit, websiteName?: string): string {
  const issues = [...audit.issues].sort((a, b) => b.priority - a.priority || severityRank[b.severity] - severityRank[a.severity])
  const actions = [...(audit.actions ?? [])].sort((a, b) => b.priorityScore - a.priorityScore)
  const comparison = audit.comparison
  const title = websiteName ?? audit.url
  const health = audit.health?.score === undefined ? 'Not measured' : `${audit.health.score}/100`
  const issueRows = issues.map(issue => `
    <article class="finding">
      <div><span class="pill ${escapeHtml(issue.severity)}">${escapeHtml(issue.severity)}</span> <span class="muted">${escapeHtml(issue.category)}</span></div>
      <h3>${escapeHtml(issue.title)}</h3>
      <p>${escapeHtml(issue.summary)}</p>
      <p><strong>Why it matters:</strong> ${escapeHtml(issue.impact)}</p>
      <p><strong>Recommended action:</strong> ${escapeHtml(issue.solution)}</p>
      <p class="evidence"><strong>Evidence:</strong> ${escapeHtml(issue.evidence?.status ?? 'unavailable')}${issue.evidence?.details ? ` · ${escapeHtml(issue.evidence.details)}` : ''}</p>
    </article>`).join('')
  const actionRows = actions.map(action => `
    <tr><td><strong>${escapeHtml(action.title)}</strong><br><span class="muted">${escapeHtml(action.category)}</span></td><td>${escapeHtml(action.priorityScore)}</td><td>${escapeHtml(action.impact)}</td><td>${escapeHtml(action.effort)}</td><td>${escapeHtml(action.lifecycleStatus)}</td></tr>`).join('')
  const changeRows = comparison?.changes.filter(change => change.type !== 'unchanged').map(change => `
    <tr><td>${escapeHtml(change.type)}</td><td>${escapeHtml(change.title)}</td><td>${escapeHtml(change.category)}</td><td>${escapeHtml(change.previousSeverity)} → ${escapeHtml(change.currentSeverity)}</td></tr>`).join('') ?? ''
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ottimo audit report — ${escapeHtml(title)}</title>
<style>:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#18221d;background:#f5f7ef}body{margin:0;padding:40px;background:#f5f7ef;line-height:1.55}main{max-width:980px;margin:auto;background:#fff;padding:48px;border:1px solid rgba(18,61,46,.16);border-radius:20px}h1,h2,h3{line-height:1.1;color:#123d2e}h1{font:normal 46px Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:8px 0 12px}h2{font:normal 28px Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin-top:42px}.eyebrow{text-transform:uppercase;letter-spacing:.1em;font-size:11px;font-weight:900;color:#b83b26}.meta,.muted{color:#6c776f}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:30px 0}.metric{padding:18px;background:#f5f7ef;border-radius:12px}.metric strong{display:block;font-size:24px;color:#123d2e}.finding{padding:22px 0;border-top:1px solid #dfe5df}.pill{display:inline-block;padding:4px 8px;border-radius:999px;background:#e4f1df;font-size:12px;font-weight:800}.pill.critical,.pill.high{background:#fbe1db}.evidence{font-size:13px;color:#526158}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{text-align:left;padding:11px;border-bottom:1px solid #dfe5df;vertical-align:top}th{color:#526158;font-size:12px;text-transform:uppercase;letter-spacing:.05em}.note{padding:16px;background:#e4f1df;border-radius:12px;margin-top:20px}footer{margin-top:48px;padding-top:20px;border-top:1px solid #dfe5df;font-size:12px;color:#6c776f}@media(max-width:700px){body{padding:12px}main{padding:26px}.summary{grid-template-columns:repeat(2,1fr)}h1{font-size:36px}}@media print{body{padding:0;background:#fff}main{border:0;padding:24px;max-width:none}.finding{break-inside:avoid}}</style></head>
<body><main><span class="eyebrow">Ottimo audit report</span><h1>${escapeHtml(title)}</h1><p class="meta">${escapeHtml(audit.url)} · Audited ${escapeHtml(formatDateTime(audit.createdAt))}</p>
<div class="summary"><div class="metric"><span class="muted">Health</span><strong>${escapeHtml(health)}</strong></div><div class="metric"><span class="muted">Findings</span><strong>${audit.issues.length}</strong></div><div class="metric"><span class="muted">Open findings</span><strong>${audit.issues.filter(issue => issue.status !== 'resolved').length}</strong></div><div class="metric"><span class="muted">Analysis</span><strong>${escapeHtml(audit.durationMs)} ms</strong></div></div>
<h2>Executive summary</h2><p>Ottimo interprets the evidence collected during this audit and separates measured observations from unavailable data. This report reflects the saved audit state at the time it was generated.</p>
<div class="note"><strong>Audit basis:</strong> ${escapeHtml((audit.standards ?? []).join(' · ') || 'Standards not recorded')}</div>
<h2>Priority actions</h2>${actions.length ? `<table><thead><tr><th>Action</th><th>Priority</th><th>Impact</th><th>Effort</th><th>Lifecycle</th></tr></thead><tbody>${actionRows}</tbody></table>` : '<p class="muted">No optimisation actions were recorded for this audit.</p>'}
<h2>Key findings</h2>${issueRows || '<p class="muted">No findings were recorded.</p>'}
${comparison ? `<h2>What changed since the previous audit?</h2><div class="summary"><div class="metric"><span class="muted">Resolved</span><strong>${comparison.resolved}</strong></div><div class="metric"><span class="muted">New</span><strong>${comparison.newFindings}</strong></div><div class="metric"><span class="muted">Improved</span><strong>${comparison.improved}</strong></div><div class="metric"><span class="muted">Regressed</span><strong>${comparison.regressed}</strong></div></div>${changeRows ? `<table><thead><tr><th>Change</th><th>Finding</th><th>Category</th><th>Severity</th></tr></thead><tbody>${changeRows}</tbody></table>` : '<p class="muted">No material changes were detected.</p>'}` : ''}
${audit.verifications?.length ? `<h2>Verification</h2><p>${audit.verifications.filter(item => item.status === 'verified').length} verified · ${audit.verifications.filter(item => item.status === 'failed').length} failed · ${audit.verifications.filter(item => item.status === 'inconclusive').length} inconclusive.</p>` : ''}
<footer>Generated by Ottimo from the saved audit evidence. Measurements are not supplemented with traffic, conversion or other external data unless those data are explicitly present in the audit.</footer></main></body></html>`
}

export function downloadAuditReport(audit: Audit, websiteName?: string): void {
  const html = buildAuditReportHtml(audit, websiteName)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const safeName = (websiteName ?? audit.url).replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'ottimo-audit'
  anchor.href = url
  anchor.download = `${safeName}-ottimo-audit.html`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
