import { Card } from '../../components/ui'
import type { Audit } from '../../types/domain'

const formatBytes = (value: number) => value < 1024 ? value + ' B' : value < 1024 * 1024 ? (value / 1024).toFixed(1) + ' KB' : (value / (1024 * 1024)).toFixed(2) + ' MB'
const shortUrl = (value: string) => { try { return new URL(value).pathname || '/' } catch { return value } }

export function ResourcePerformancePanel({ audit }: { audit: Audit }) {
  const summary = audit.stats?.resourcePerformance
  if (!summary) return null
  return <Card className="resource-performance-panel">
    <div className="section-head"><div><span className="eyebrow">Resource intelligence</span><h2>Where the page weight and delay come from</h2><p className="section-subtitle">Ottimo shows the resources it observed. This is attribution evidence, not a claim that one resource alone caused a Core Web Vital.</p></div><span className="standard-tag">Observed only · {summary.resourceCount} resources</span></div>
    {summary.resourceCount === 0 ? <p className="muted">No browser resource data was retained for this audit.</p> : <>
      <div className="audit-command-stats"><div><strong>{formatBytes(summary.totalTransferBytes)}</strong><span>Observed transfer</span></div><div><strong>{summary.resourceCount}</strong><span>Resources</span></div><div><strong>{summary.largest.length}</strong><span>Largest retained</span></div><div><strong>{summary.slowest.length}</strong><span>Slowest retained</span></div></div>
      <div className="resource-performance-grid">
        <section aria-labelledby="resource-weight-heading"><h3 id="resource-weight-heading">Observed weight by resource type</h3><div className="profile-list">{summary.byType.slice(0, 6).map(item => <span key={item.type}><strong>{item.type}</strong> · {item.count} resources · {formatBytes(item.transferBytes)}</span>)}</div></section>
        <section aria-labelledby="largest-resources-heading"><h3 id="largest-resources-heading">Largest observed resources</h3><div className="resource-list">{summary.largest.slice(0, 5).map(item => <div key={item.url}><code title={item.url}>{shortUrl(item.url)}</code><span>{formatBytes(item.transferBytes ?? 0)} · {item.type}</span></div>)}</div></section>
        <section aria-labelledby="slowest-resources-heading"><h3 id="slowest-resources-heading">Slowest observed resources</h3><div className="resource-list">{summary.slowest.slice(0, 5).map(item => <div key={item.url}><code title={item.url}>{shortUrl(item.url)}</code><span>{Math.round(item.durationMs ?? 0)} ms · {item.type}</span></div>)}</div></section>
      </div>
    </>}
  </Card>
}
