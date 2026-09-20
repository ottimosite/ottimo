        <div><strong>{openIssues.length}</strong><span>open findings</span></div>
      </div>
      <p className="muted">Measured observations are evidence. Partially inferred signals describe structure or interpretation. Unavailable domains are not treated as zero.</p>
    </Card>

    <Card>
      <div className="section-head"><div><span className="eyebrow">Website insights</span><h2>Where attention is concentrated</h2></div><Link to={`/app/audits/${audit.id}#audit-evidence`}>Inspect evidence →</Link></div>
      <div className="insight-grid">
        {categories.map(({ category, score, coverage, issue }) => <article className="insight-card" key={category}>
          <div className="insight-card__top"><span className="eyebrow">{categoryLabels[category]}</span><span className={`evidence-status evidence-status--${coverage}`}>{titleCase(coverage)}</span></div>
          <strong className="insight-score">{score === undefined ? '—' : score}<small>{score === undefined ? 'not measured' : '/100'}</small></strong>
          <p>{issue ? issue.summary : categoryCopy[category].body}</p>
          {issue && <div className="insight-card__finding"><Badge tone={issue.severity}>{issue.severity}</Badge><span>{issue.title}</span></div>}
          <div className="insight-card__links"><Link to={`/app/${category === 'seo' ? 'seo' : category === 'ai' ? 'ai' : category}?website=${encodeURIComponent(audit.websiteId ?? websiteId ?? '')}`}>Explore {categoryLabels[category]} →</Link>{issue && <Link to={`/app/audits/${audit.id}?finding=${encodeURIComponent(issue.id)}#ai-decision`}>Explain with evidence →</Link>}</div>
        </article>)}
      </div>
    </Card>

    <div className="grid-2">
      <Card>
        <div className="section-head"><div><span className="eyebrow">Search</span><h2>Can search systems understand the site?</h2></div><Link to={`/app/seo?website=${encodeURIComponent(audit.websiteId ?? websiteId ?? '')}`}>Open search insight →</Link></div>
        {intelligence?.search ? <div className="insight-stat-list">
          <span><strong>{Math.round(intelligence.search.titleCoverage * 100)}%</strong> title coverage</span>
          <span><strong>{Math.round(intelligence.search.metaDescriptionCoverage * 100)}%</strong> meta description coverage</span>
          <span><strong>{Math.round(intelligence.search.canonicalCoverage * 100)}%</strong> canonical coverage</span>
          <span><strong>{intelligence.search.structuredDataPages}</strong> pages with structured data</span>
        </div> : <p className="muted">Search intelligence was not measured in this audit.</p>}
        <p className="muted">Technical search signals describe page readiness; they do not establish rankings or organic acquisition.</p>
      </Card>
      <Card>
        <div className="section-head"><div><span className="eyebrow">Technology</span><h2>What implementation signals were observed?</h2></div><Link to={`/app/technical?website=${encodeURIComponent(audit.websiteId ?? websiteId ?? '')}`}>Open technical insight →</Link></div>
        {intelligence?.technology?.signals?.length ? <div className="insight-signal-list">{intelligence.technology.signals.slice(0, 8).map(signal => <span key={signal.name}><strong>{signal.name}</strong><small>{signal.category} · {signal.confidence} confidence</small></span>)}</div> : <p className="muted">No technology signals were confidently observed.</p>}
      </Card>
    </div>

    <Card className="insight-handoff">
      <div><span className="eyebrow">From insight to action</span><h2>Keep the evidence attached to the decision.</h2><p>Insights are interpretation, not a second source of truth. Use the audit for canonical evidence and the action queue for implementation and verification.</p></div>
      <div className="hero-actions"><Link className="btn btn-primary" to={`/app/audits/${audit.id}#findings`}>Review findings</Link><Link className="text-link" to="/app/recommendations">Open action queue →</Link></div>
    </Card>
  </div>
}

export function ReportsPage() {
  const audit = currentAudits().at(-1) ?? seedAudits.at(-1)!
  return <div className="stack"><div className="page-heading"><div><span className="eyebrow">Reports</span><h1>A clear briefing for the next decision.</h1><p>Summarise the latest audit for a business owner, product team or developer.</p></div><Button variant="secondary" onClick={() => window.print()}>Print report</Button></div><Card className="report-header"><div><span className="eyebrow">Ottimo audit report</span><h2>{audit.url}</h2><p>Generated {formatDate(audit.createdAt)} from deterministic local demo data.</p></div>{audit.score === undefined ? <div className="score"><strong>—</strong><span>Not measured</span></div> : <Score value={audit.score} label="Overall health" />}</Card><div className="grid-3">{audit.scores.map(item => <Card key={item.category}><span className="muted">{categoryLabels[item.category]}</span><strong className="big-number">{item.score ?? "—"}</strong>{item.score === undefined ? <small>Not measured</small> : <Progress value={item.score} />}</Card>)}</div><Card><span className="eyebrow">Priority queue</span><h2>Three actions to take next</h2><div className="action-list">{audit.issues.filter(issue => issue.status !== 'resolved').sort((a, b) => b.priority - a.priority).slice(0, 3).map(issue => <Link className="action" to="/app/recommendations" key={issue.id}><span><strong>{issue.title}</strong><small>{issue.solution}</small></span><span>#{issue.priority} →</span></Link>)}</div></Card></div>
}

export function HistoryPage() {
  const audits = currentAudits()
  return <div className="stack"><div className="page-heading"><div><span className="eyebrow">History</span><h1>Progress you can explain.</h1><p>Compare audit scores over time and keep improvements connected to the work that caused them.</p></div></div><Card><div className="history-chart" aria-label="Audit score history">{audits.map((audit, index) => {
    const previous = index ? audits[index - 1] : undefined