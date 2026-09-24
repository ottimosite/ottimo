import { FormEvent, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Card } from '../components/ui'
import { categoryLabels } from '../data/mock'
import { wikipediaAudit } from '../data/fixtures/wikipedia'

const coverage = [
  ['Performance', 'Find the weight, rendering work and delay that keep people from the useful part of the page.', 'performance'],
  ['Search visibility', 'Make important pages easier for search systems to discover, understand and represent.', 'seo'],
  ['Accessibility', 'Identify barriers across keyboard use, structure, content and assistive technology.', 'accessibility'],
  ['Experience', 'Find friction in navigation, content hierarchy, forms and the moments where visitors need to act.', 'usability'],
  ['Technical quality', 'Surface crawl, security, resource and implementation signals that can undermine the experience.', 'technical'],
  ['AI readiness', 'Turn useful facts, services and policies into clearer structured knowledge for emerging interfaces.', 'ai'],
] as const

const pageContent = {
  '/services': {
    eyebrow: 'Services',
    title: 'One website. One improvement system.',
    intro: 'Ottimo connects performance, search, accessibility, experience, technical quality and AI-ready foundations so your team can work from the same evidence.',
  },
  '/methodology': {
    eyebrow: 'Methodology',
    title: 'Measure first. Explain clearly. Improve progressively.',
    intro: 'Ottimo follows an evidence loop: discover what exists, understand what matters, prioritise the useful next action and verify what changed.',
  },
  '/pricing': {
    eyebrow: 'Plans',
    title: 'Start with evidence. Scale when the work demands it.',
    intro: 'Ottimo is designed for progressive adoption: understand the current state first, then add the workflow and monitoring capabilities your team actually needs.',
  },
} as const

type PublicPath = keyof typeof pageContent

function usePublicMetadata(title: string, description: string) {
  useEffect(() => {
    document.title = `${title} — Ottimo`

    const upsertMeta = (attribute: 'name' | 'property', key: string, content: string) => {
      let meta = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute(attribute, key)
        document.head.appendChild(meta)
      }
      meta.content = content
    }

    upsertMeta('name', 'description', description)
    upsertMeta('property', 'og:title', `${title} — Ottimo`)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:type', 'website')
    upsertMeta('name', 'twitter:card', 'summary')
    upsertMeta('name', 'twitter:title', `${title} — Ottimo`)
    upsertMeta('name', 'twitter:description', description)

    const canonicalUrl = new URL(window.location.pathname || '/', window.location.origin).toString()
    upsertMeta('property', 'og:url', canonicalUrl)
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = canonicalUrl
  }, [title, description])
}

function LeadCapture() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    try {
      const normalised = url.startsWith('http') ? url : `https://${url}`
      const parsed = new URL(normalised)
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Enter a valid website address.')
      navigate(`/app/audits/new?url=${encodeURIComponent(normalised)}`)
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Enter a valid website address.')
    }
  }

  return <form className="lead-form" id="start" onSubmit={submit}>
    <div className="lead-form-heading">
      <span className="eyebrow">Start with your website</span>
      <h2>Analyse your website.</h2>
      <p>Enter your website address and start the audit setup. You can review the scope before anything runs.</p>
    </div>
    <div className="lead-fields">
      <label>Website URL<input required value={url} onChange={event => { setUrl(event.target.value); setError('') }} placeholder="yourbusiness.co.uk" /></label>
      <button className="btn btn-primary" type="submit">Analyse your website <span aria-hidden="true">↗</span></button>
    </div>
    {error && <p className="error" role="alert">{error}</p>}
    <small>Start with the website. Review the scope before running anything. Evidence that cannot be supported stays unavailable.</small>
  </form>
}

function TrustRow() {
  return <section className="public-trust-row" aria-label="Ottimo product principles">
    <div><strong>Evidence-led</strong><span>Observed, inferred and unavailable stay distinct.</span></div>
    <div><strong>Decision-first</strong><span>Findings become prioritised work, not dashboard noise.</span></div>
    <div><strong>Built for teams</strong><span>Business context and technical detail share the same evidence.</span></div>
    <div><strong>Progressive</strong><span>Re-audit, compare and verify what actually changed.</span></div>
  </section>
}

export function Home() {
  usePublicMetadata('Make your website work better. Know what to fix next.', 'Ottimo audits performance, search, accessibility, experience, technical quality and AI-ready foundations, then turns supported evidence into a prioritised improvement plan.')

  return <div className="public-home lead-home">
    <section className="hero lead-hero">
      <div className="hero-kicker">Performance · visibility · accessibility · experience · technical quality · AI-ready foundations</div>
      <div className="lead-hero-grid">
        <div>
          <span className="eyebrow">Website intelligence & optimisation</span>
          <h1>Make your website work better.<br /><em>Know what to fix next.</em></h1>
          <p className="hero-copy">Ottimo brings performance, search, accessibility, experience, technical quality and AI-ready foundations into one evidence-led view — so your team can understand the problem, decide what matters and act on it.</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#start">Analyse your website <span aria-hidden="true">↗</span></a>
            <a className="text-link" href="#method">See how it works →</a>
          </div>
          <div className="ethos"><strong>Find the problems.</strong><strong>Understand the impact.</strong><strong>Fix what matters.</strong><strong>Verify the change.</strong></div>
        </div>
        <div className="audit-preview audit-preview-product" aria-label="Illustrative Ottimo audit finding">
          <div className="audit-preview-top"><span className="eyebrow">Illustrative finding</span><span className="preview-status">Measured</span></div>
          <div className="preview-finding">
            <span className="preview-domain">Performance · Home page</span>
            <strong>Largest content element loads late.</strong>
            <p>The main page content is waiting on a resource that can be reduced or deferred.</p>
          </div>
          <div className="preview-evidence"><span>Evidence</span><b>Observed resource</b><small>Support: page + resource timing</small></div>
          <div className="preview-action"><span>Next action</span><strong>Inspect the blocking resource →</strong></div>
          <p className="preview-note">Findings are labelled as measured, inferred or unavailable. Unavailable is a valid result.</p>
          <Link className="preview-link" to="/methodology">See how Ottimo explains findings →</Link>
        </div>
      </div>
    </section>

    <TrustRow />

    <section className="education-strip">
      <div><span className="eyebrow">The problem with isolated signals</span><h2>Your website is one system, even when the signals are not.</h2><p>Performance, search, accessibility and usability overlap. Ottimo connects those signals so your team can see what is happening, understand why it matters and work on the right thing next.</p></div>
      <div className="education-steps">
        <article><b>01</b><h3>Discover</h3><p>Map the website and record what can actually be observed.</p></article>
        <article><b>02</b><h3>Decide</h3><p>Connect evidence to impact, effort and the next useful action.</p></article>
        <article><b>03</b><h3>Verify</h3><p>Re-audit, compare and retain the history of improvement.</p></article>
      </div>
    </section>

    <section className="method-section" id="method">
      <div className="method-lead"><span className="eyebrow">Measure → Understand → Improve → Prove</span><h2>Turn website evidence into verified improvement.</h2><p>Ottimo is built around a repeatable loop: measure what can be observed, explain what it means, improve what matters and prove what changed.</p></div>
      <ol className="method-steps">
        <li><span>01</span><div><h3>Discover</h3><p>Map pages, resources, structure and supported technical signals.</p></div></li>
        <li><span>02</span><div><h3>Understand</h3><p>Trace important conclusions back to the evidence that supports them.</p></div></li>
        <li><span>03</span><div><h3>Prioritise</h3><p>Turn findings into actions with impact, effort and dependency context.</p></div></li>
        <li><span>04</span><div><h3>Verify</h3><p>Compare later audits so improvement is measurable rather than assumed.</p></div></li>
      </ol>
    </section>

    <section className="coverage-section" id="coverage">
      <div className="section-intro"><span className="eyebrow">What Ottimo covers</span><h2>Six lenses. One website.</h2><p>Look at one area when you need depth, or connect them when you need to understand the website as a whole.</p></div>
      <div className="coverage-grid">{coverage.map(([title, body], index) => <article className="coverage-item" key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{body}</p><Link to="/example-audit">See the sample audit →</Link></article>)}</div>
    </section>

    <section className="case-study-lead" aria-labelledby="audit-example-title">
      <div>
        <span className="eyebrow">See the product, not a mockup</span>
        <h2 id="audit-example-title">See how Ottimo turns evidence into the next action.</h2>
        <p>This working example uses a deterministic fixture. It shows how Ottimo connects a finding, its evidence and its next action without presenting the snapshot as a live customer measurement.</p>
        <Link className="text-link" to="/example-audit">Open the sample audit →</Link>
      </div>
      <div className="case-score audit-example-card">
        <div className="audit-example-header"><span>Illustrative audit</span><strong>Deterministic fixture</strong></div>
        <div className="audit-example-finding">
          <span>SEO · Site scope</span>
          <h3>{wikipediaAudit.issues[1].title}</h3>
          <p>{wikipediaAudit.issues[1].summary}</p>
        </div>
        <div className="audit-example-meta">
          <div><span>Evidence</span><b>Measured</b></div>
          <div><span>Confidence</span><b>{wikipediaAudit.issues[1].confidence}</b></div>
          <div><span>Next action</span><b>{wikipediaAudit.issues[1].solution}</b></div>
        </div>
        <div className="audit-domain-states">
          {wikipediaAudit.scores.slice(0, 6).map(score => <span key={score.category}><b>{score.category}</b><em>{score.measurement}</em></span>)}
        </div>
      </div>
    </section>

    <section className="audit-output-section" aria-labelledby="audit-output-title">
      <div className="landing-section-inner">
        <div className="section-intro">
        <span className="eyebrow">What you receive</span>
        <h2 id="audit-output-title">A report you can understand — with the evidence underneath.</h2>
        <p>Ottimo is designed to give decision-makers a clear starting point without hiding the technical detail that developers need.</p>
        </div>
        <div className="audit-output-grid">
        <article><span>01</span><h3>Executive summary</h3><p>See the most important observations first, including what is measured, inferred and unavailable.</p></article>
        <article><span>02</span><h3>Priority findings</h3><p>Understand which issues deserve attention and why, instead of working through an undifferentiated list.</p></article>
        <article><span>03</span><h3>Evidence</h3><p>Trace findings back to the pages, resources or signals that support them where evidence is available.</p></article>
        <article><span>04</span><h3>Next actions</h3><p>Turn supported findings into practical work and define how an improvement can be checked later.</p></article>
        </div>
      </div>
    </section>

    <section className="principles-section">
      <div><span className="eyebrow">The Ottimo standard</span><h2>We would rather say “unknown” than give you a made-up number.</h2></div>
      <div className="principles-grid">
        <article><strong>Fast</strong><p>The product itself should respect your time, with focused interfaces and lightweight delivery.</p></article>
        <article><strong>Accessible</strong><p>Accessibility is part of the engineering, not a final checkbox.</p></article>
        <article><strong>Clear</strong><p>Every important finding should explain what happened, why it matters and what can be done.</p></article>
        <article><strong>Useful</strong><p>Audit output should lead to action, verification and learning.</p></article>
      </div>
    </section>

    <section className="faq-section" aria-labelledby="faq-title">
      <div className="landing-section-inner">
        <div className="section-intro">
        <span className="eyebrow">Frequently asked</span>
        <h2 id="faq-title">Useful answers before you start.</h2>
        </div>
        <div className="faq-list">
        <details><summary>Does Ottimo need access to my website?</summary><p>The initial audit is designed around publicly accessible website evidence. Ottimo should only request additional access when a later capability genuinely requires it.</p></details>
        <details><summary>Will Ottimo give me a single website score?</summary><p>The primary experience is evidence and prioritisation, not an opaque score. Where a score is useful, its methodology and evidence should be explainable.</p></details>
        <details><summary>Can an audit prove my rankings or conversions will improve?</summary><p>No. Technical observations can identify conditions worth addressing, but they do not by themselves prove future rankings, traffic, conversions or revenue.</p></details>
        <details><summary>What happens when Ottimo cannot measure something?</summary><p>It should say so. Unavailable evidence is a valid result and is preferable to presenting an invented number as fact.</p></details>
        <details><summary>Who is the audit for?</summary><p>The summary is designed for decision-makers and website owners, while the underlying evidence and technical detail are intended to help developers and specialists act on the findings.</p></details>
        </div>
      </div>
    </section>

    <section className="lead-start"><LeadCapture /></section>
  </div>
}

export function PublicAuditExample() {
  usePublicMetadata('Working audit example', 'Explore a deterministic Ottimo audit example showing evidence, uncertainty, prioritisation and verification without presenting fictional customer results as live measurements.')

  return <div className="public-audit-example content-page">
    <div className="content-hero">
      <span className="eyebrow">Working audit example</span>
      <h1>See the evidence before you run your own audit.</h1>
      <p>This example uses Ottimo's captured Wikipedia fixture. It is deliberately labelled as a deterministic snapshot so you can see the product model without mistaking fixture data for a live customer measurement.</p>
      <div className="hero-actions">
        <Link className="btn btn-primary" to="/app/audits/audit-wikipedia">Open the working audit</Link>
        <Link className="text-link" to="/methodology">Read the methodology →</Link>
      </div>
    </div>

    <section className="public-example-summary" aria-labelledby="example-summary-title">
      <div>
        <span className="eyebrow">Executive summary</span>
        <h2 id="example-summary-title">What the snapshot can actually tell us</h2>
        <p>The fixture gives us structural evidence about the public Wikipedia portal. Browser timing and several other measurements are intentionally unavailable.</p>
      </div>
      <div className="public-example-state-grid">
        <div><span>Source</span><strong>Deterministic fixture</strong><small>Captured {wikipediaAudit.createdAt.slice(0, 10)}</small></div>
        <div><span>Scope</span><strong>1 snapshot page</strong><small>Public Wikipedia portal</small></div>
        <div><span>Performance</span><strong>Unavailable</strong><small>No browser timing retained</small></div>
      </div>
    </section>

    <section className="public-example-findings" aria-labelledby="example-findings-title">
      <div className="section-intro"><span className="eyebrow">Priority findings</span><h2 id="example-findings-title">Finding → evidence → action.</h2><p>Each finding explains what was observed, what it means, what evidence supports it and what could happen next.</p></div>
      <div className="public-example-finding-list">
        {wikipediaAudit.issues.map(issue => <article key={issue.id}>
          <div className="public-example-finding-top"><Badge tone={issue.severity}>{issue.severity}</Badge><span>{categoryLabels[issue.category as keyof typeof categoryLabels]}</span></div>
          <h3>{issue.title}</h3>
          <p>{issue.summary}</p>
          <dl>
            <div><dt>Evidence</dt><dd>{issue.evidence?.status ?? 'unavailable'} · {issue.evidence?.details ?? 'No additional evidence detail is available.'}</dd></div>
            <div><dt>Why it matters</dt><dd>{issue.impact}</dd></div>
            <div><dt>Next action</dt><dd>{issue.solution}</dd></div>
          </dl>
          <details><summary>Show technical context</summary><p>Confidence: {issue.confidence}. Priority: {issue.priority}. {issue.affectedPages?.length ? `Affected page: ${issue.affectedPages[0]}` : 'No affected-page list is available in this fixture.'}</p></details>
        </article>)}
      </div>
    </section>

    <section className="public-example-coverage" aria-labelledby="example-coverage-title">
      <div className="section-intro"><span className="eyebrow">Six lenses</span><h2 id="example-coverage-title">Coverage stays explicit.</h2><p>Ottimo does not turn unavailable measurements into scores just to fill a dashboard.</p></div>
      <div className="public-example-coverage-grid">
        {wikipediaAudit.scores.map(score => <div key={score.category}><span>{categoryLabels[score.category as keyof typeof categoryLabels]}</span><strong>{score.measurement === 'measured' ? 'Measured' : 'Unavailable'}</strong></div>)}
      </div>
    </section>

    <section className="public-example-verification" aria-labelledby="example-verification-title">
      <div><span className="eyebrow">Verification</span><h2 id="example-verification-title">Improvement needs a second piece of evidence.</h2><p>The fixture does not claim an optimisation was completed. In the real product, a later comparable audit can show whether a finding was resolved, improved, regressed or remains inconclusive.</p></div>
      <Link className="btn btn-primary" to="/app/audits/audit-wikipedia">Explore the audit workflow</Link>
    </section>

    <section className="callout"><span className="eyebrow">Ready to use your website</span><h2>Start with a Website Check.</h2><p>Enter a public website and review the audit setup before the live browser inspection runs.</p><Link className="btn btn-primary" to="/#start">Analyse your website <span aria-hidden="true">↗</span></Link></section>
  </div>
}

function PublicPageHero({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children?: ReactNode }) {
  return <div className="public-page-hero">
    <span className="eyebrow">{eyebrow}</span>
    <h1>{title}</h1>
    <p>{intro}</p>
    {children}
  </div>
}

function PublicPageCta({ label = 'Analyse your website' }: { label?: string }) {
  return <section className="public-page-cta">
    <div>
      <span className="eyebrow">Start with your website</span>
      <h2>See what Ottimo can actually find.</h2>
      <p>Enter a public website, review the audit scope and decide what to investigate before anything runs.</p>
    </div>
    <Link className="btn btn-primary" to="/#start">{label} <span aria-hidden="true">↗</span></Link>
  </section>
}

function ServicesPage() {
  usePublicMetadata(pageContent['/services'].title, pageContent['/services'].intro)

  return <div className="public-focused-page services-page">
    <PublicPageHero eyebrow="Services" title={pageContent['/services'].title} intro={pageContent['/services'].intro}>
      <div className="hero-actions">
        <Link className="btn btn-primary" to="/#start">Analyse your website <span aria-hidden="true">↗</span></Link>
        <Link className="text-link" to="/example-audit">See a sample audit →</Link>
      </div>
    </PublicPageHero>

    <section className="focused-section">
      <div className="focused-section-heading">
        <span className="eyebrow">What Ottimo examines</span>
        <h2>Six lenses. One website.</h2>
        <p>These are not six disconnected products. They are different ways of understanding the same digital property and deciding what deserves attention next.</p>
      </div>
      <div className="lens-grid">
        {coverage.map(([title, body], index) => <article key={title}>
          <span className="lens-number">0{index + 1}</span>
          <h3>{title}</h3>
          <p>{body}</p>
        </article>)}
      </div>
    </section>

    <section className="focused-section services-flow">
      <div className="focused-section-heading">
        <span className="eyebrow">From signal to decision</span>
        <h2>Find the problem. Explain it. Decide what happens next.</h2>
      </div>
      <ol className="flow-grid">
        <li><span>01</span><div><h3>Discover</h3><p>Map pages, resources, structure and the technical signals Ottimo can actually observe.</p></div></li>
        <li><span>02</span><div><h3>Understand</h3><p>Connect findings to evidence, affected scope, impact and implementation context.</p></div></li>
        <li><span>03</span><div><h3>Prioritise</h3><p>Turn supported findings into an ordered set of useful actions rather than an undifferentiated list.</p></div></li>
        <li><span>04</span><div><h3>Verify</h3><p>Compare later audits so improvement is measured rather than assumed.</p></div></li>
      </ol>
    </section>

    <section className="services-evidence-band">
      <div>
        <span className="eyebrow">The output</span>
        <h2>A report that gives the decision-maker the answer and the developer the evidence.</h2>
        <p>Ottimo starts with a clear summary, then lets people move progressively into findings, evidence, affected pages, technical context and verification.</p>
      </div>
      <div className="evidence-output-list">
        <span>Executive summary</span>
        <span>Priority findings</span>
        <span>Evidence and confidence</span>
        <span>Next actions and verification</span>
      </div>
    </section>

    <PublicPageCta />
  </div>
}

function MethodologyPage() {
  usePublicMetadata(pageContent['/methodology'].title, pageContent['/methodology'].intro)

  return <div className="public-focused-page methodology-page">
    <PublicPageHero eyebrow="Methodology" title={pageContent['/methodology'].title} intro={pageContent['/methodology'].intro}>
      <div className="hero-actions">
        <Link className="btn btn-primary" to="/example-audit">See the evidence <span aria-hidden="true">↗</span></Link>
        <Link className="text-link" to="/#start">Analyse your website →</Link>
      </div>
    </PublicPageHero>

    <section className="focused-section">
      <div className="focused-section-heading">
        <span className="eyebrow">The evidence model</span>
        <h2>Ottimo tells you what it knows — and what it does not.</h2>
        <p>A trustworthy audit does not fill every empty space with a number. Evidence has a state, and the state stays visible.</p>
      </div>
      <div className="evidence-state-grid">
        <article><span>Measured</span><h3>Directly observed.</h3><p>The audit collected or calculated evidence that supports the statement.</p></article>
        <article><span>Inferred</span><h3>Derived from evidence.</h3><p>The conclusion is useful, but Ottimo makes clear that it is an interpretation rather than a direct measurement.</p></article>
        <article><span>Unavailable</span><h3>Not safely observable.</h3><p>The evidence could not be obtained or retained, so Ottimo does not pretend that absence is a zero.</p></article>
      </div>
    </section>

    <section className="focused-section methodology-loop">
      <div className="focused-section-heading">
        <span className="eyebrow">The improvement loop</span>
        <h2>Every finding should lead somewhere.</h2>
      </div>
      <ol className="methodology-steps">
        <li><span>01</span><h3>Discover</h3><p>Capture what exists and what can actually be observed.</p></li>
        <li><span>02</span><h3>Understand</h3><p>Explain why a finding matters and trace it back to its evidence.</p></li>
        <li><span>03</span><h3>Prioritise</h3><p>Choose the next useful action using impact, effort, dependencies and confidence.</p></li>
        <li><span>04</span><h3>Verify</h3><p>Re-audit and compare so a claimed improvement can be checked.</p></li>
      </ol>
    </section>

    <section className="focused-section finding-contract">
      <div className="focused-section-heading">
        <span className="eyebrow">A useful finding</span>
        <h2>What should an Ottimo conclusion contain?</h2>
      </div>
      <div className="finding-contract-grid">
        <article><span>01</span><strong>What was observed?</strong><p>State the concrete signal rather than starting with a recommendation.</p></article>
        <article><span>02</span><strong>Why does it matter?</strong><p>Explain the relevance without claiming an outcome the evidence cannot prove.</p></article>
        <article><span>03</span><strong>What should happen next?</strong><p>Turn the supported finding into a practical investigation or implementation step.</p></article>
        <article><span>04</span><strong>How can it be verified?</strong><p>Define the evidence that should change when the work is complete.</p></article>
      </div>
    </section>

    <section className="methodology-trust">
      <div>
        <span className="eyebrow">The Ottimo standard</span>
        <h2>We would rather say “unknown” than give you a made-up number.</h2>
      </div>
      <p>That principle applies to measurements, rankings, traffic, conversions, user behaviour and any other conclusion the audit cannot support.</p>
    </section>

    <PublicPageCta label="Analyse your website" />
  </div>
}

function PlansPage() {
  usePublicMetadata(pageContent['/pricing'].title, pageContent['/pricing'].intro)

  return <div className="public-focused-page plans-page">
    <PublicPageHero eyebrow="Plans" title={pageContent['/pricing'].title} intro={pageContent['/pricing'].intro}>
      <div className="hero-actions">
        <Link className="btn btn-primary" to="/#start">Analyse your website <span aria-hidden="true">↗</span></Link>
        <Link className="text-link" to="/methodology">How the evidence works →</Link>
      </div>
    </PublicPageHero>

    <section className="focused-section">
      <div className="focused-section-heading">
        <span className="eyebrow">Progressive adoption</span>
        <h2>Start with understanding. Add workflow when you need it.</h2>
        <p>Ottimo's product model is deliberately progressive. The stages below describe how capability expands; they are not final commercial prices or promises of features that are not yet released.</p>
      </div>
      <div className="plan-grid">
        <article><span>01 · Explore</span><h3>Understand the current state.</h3><p>Use the audit experience to see what Ottimo can observe, what remains unavailable and which findings deserve attention.</p><strong>For discovery and evaluation.</strong></article>
        <article><span>02 · Improve</span><h3>Turn findings into repeatable work.</h3><p>Build a workflow around recommendations, actions, re-audits, verification and the history of what changed.</p><strong>For teams actively improving a website.</strong></article>
        <article><span>03 · Partner</span><h3>Make optimisation an operating rhythm.</h3><p>Add integrations, scheduled audits, reporting and ongoing intelligence as the website and team demand them.</p><strong>For sustained optimisation programmes.</strong></article>
      </div>
    </section>

    <section className="plans-expectations">
      <div>
        <span className="eyebrow">Whatever the stage</span>
        <h2>The evidence model does not change.</h2>
      </div>
      <div className="expectation-list">
        <span>Observed evidence stays distinguishable from inference.</span>
        <span>Unavailable evidence stays unavailable.</span>
        <span>Recommendations remain connected to findings.</span>
        <span>Improvement is verified rather than assumed.</span>
      </div>
    </section>

    <section className="plans-status">
      <span className="eyebrow">Current product status</span>
      <h2>The audit experience comes first.</h2>
      <p>Ottimo is currently focused on making the public audit experience and evidence model useful before introducing a full commercial lifecycle. This page intentionally does not invent prices, entitlements or availability that have not been finalised.</p>
      <Link className="text-link" to="/example-audit">See the working audit example →</Link>
    </section>

    <PublicPageCta label="Start with an audit" />
  </div>
}

export function InfoPage({ path }: { path: PublicPath }) {
  if (path === '/services') return <ServicesPage />
  if (path === '/methodology') return <MethodologyPage />
  return <PlansPage />
}