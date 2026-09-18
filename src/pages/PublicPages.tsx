import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card } from '../components/ui'
import { kingdomCoffeeAudit } from '../data/fixtures/kingdomCoffee'

const info = {
  '/services': ['Services', 'A practical optimisation partner for performance, visibility, accessibility and AI-ready digital products.'],
  '/performance': ['Performance', 'Speed is part of the product. Ottimo helps teams reduce expensive assets, main-thread work and rendering bottlenecks.'],
  '/seo': ['Technical SEO', 'Make important content easy for people and search systems to discover, understand and trust.'],
  '/accessibility': ['Accessibility', 'Inclusive interfaces are better engineered interfaces. Build for keyboard, screen readers, motion preferences and real people.'],
  '/ai': ['AI integration', 'Use AI where it creates genuine leverage: structured knowledge, automation, internal tools and workflows.'],
  '/methodology': ['Methodology', 'Measure first. Explain clearly. Prioritise by impact. Improve progressively. Re-measure what changed.'],
  '/pricing': ['Plans', 'Start with a local audit experience, then scale into monitored optimisation programmes as your needs grow.'],
  '/about': ['About Ottimo', 'Ottimo exists to make the web work better: faster, clearer, more inclusive and more useful.'],
  '/case-studies': ['Case studies', 'The demo platform uses illustrative data only. Real client outcomes are shown only when verified.'],
  '/contact': ['Contact', 'Tell us what is slowing your website down, confusing customers or getting in the way of growth.'],
} as const

const coverage = [
  ['Performance', 'Find the weight and delay keeping people from the useful part of the page.'],
  ['Accessibility', 'Make the same journey available to more people, devices and ways of navigating.'],
  ['Technical SEO', 'Help search systems understand the pages and paths that matter to your business.'],
  ['Usability', 'Spot the friction between interest and the action a visitor came to take.'],
  ['Technical quality', 'Surface reliability risks before they become customer-facing problems.'],
  ['AI readiness', 'Turn your useful facts, services and policies into clearer structured knowledge.'],
] as const

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
      <h2>Get your first useful answer in minutes.</h2>
      <p>No sales call. No account required to start. Put in your URL and see what Ottimo can actually find.</p>
    </div>
    <div className="lead-fields">
      <label>Website URL<input required value={url} onChange={event => setUrl(event.target.value)} placeholder="yourbusiness.co.uk" /></label>
      <button className="btn btn-primary" type="submit">Analyse my website <span aria-hidden="true">↗</span></button>
    </div>
    {error && <p className="error" role="alert">{error}</p>}
    <small>Start with a URL. You can choose what matters after Ottimo has discovered the site.</small>
  </form>
}

export function Home() {
  return <div className="public-home lead-home">
    <section className="hero lead-hero">
      <div className="hero-kicker">Website performance, visibility and accessibility — understood as one experience.</div>
      <div className="lead-hero-grid">
        <div>
          <h1>Know what your website is doing. Know what to fix first.</h1>
          <p className="hero-copy">Ottimo turns a website into a clear, evidence-led improvement plan. Discover the issues affecting speed, accessibility, search and usability — then understand why they matter and what to do next.</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/app/audits/new">Analyse my website <span aria-hidden="true">↗</span></Link>
            <a className="text-link" href="#coverage">See what we measure ↓</a>
          </div>
          <div className="ethos"><strong>Discover.</strong><strong>Understand.</strong><strong>Improve.</strong></div>
        </div>
        <div className="audit-preview" aria-label="Example audit summary">
          <div className="audit-preview-top"><span className="eyebrow">Ottimo audit / example</span><span className="preview-status">Ready to act</span></div>
          <div className="preview-score"><strong>78</strong><span>example audit score</span></div>
          <div className="preview-lines"><div><span>Performance</span><b>76</b></div><div><span>Accessibility</span><b>78</b></div><div><span>Technical SEO</span><b>82</b></div></div>
          <p className="preview-note">Example data only — real audits use evidence from the site being analysed.</p>
        </div>
      </div>
    </section>

    <section className="proof-strip" aria-label="What Ottimo helps teams understand">
      <div><strong>Performance</strong><span>Where time and weight go</span></div>
      <div><strong>Visibility</strong><span>How search systems find you</span></div>
      <div><strong>Accessibility</strong><span>Who can use the experience</span></div>
      <div><strong>Usability</strong><span>Where journeys create friction</span></div>
    </section>

    <section className="education-strip" id="learn">
      <div><span className="eyebrow">The simple model</span><h2>People need to find you, trust you and finish what they came to do.</h2></div>
      <div className="education-steps">
        <article><b>01</b><h3>Find</h3><p>SEO and clear content help the right people discover your business.</p></article>
        <article><b>02</b><h3>Trust</h3><p>Speed, accessibility and useful information make a good first impression believable.</p></article>
        <article><b>03</b><h3>Act</h3><p>Simple journeys, strong calls to action and working forms turn interest into progress.</p></article>
      </div>
    </section>

    <section className="method-section">
      <div className="method-lead"><span className="eyebrow">How Ottimo works</span><h2>Measure first. Explain clearly. Improve progressively.</h2><p>Ottimo is built around evidence rather than theatre. It discovers the site, records what it can actually observe, then turns those observations into useful decisions.</p></div>
      <ol className="method-steps">
        <li><span>01</span><div><h3>Discover</h3><p>Map the site, its pages, technical signals and public structure before drawing conclusions.</p></div></li>
        <li><span>02</span><div><h3>Understand</h3><p>Connect evidence to impact so a business owner and a developer can see the same problem from different angles.</p></div></li>
        <li><span>03</span><div><h3>Act</h3><p>Prioritise the work, explain the fix and make the next improvement obvious.</p></div></li>
      </ol>
    </section>

    <section className="coverage-section" id="coverage">
      <div className="section-intro"><span className="eyebrow">What Ottimo looks at</span><h2>Six lenses. One view of the digital experience.</h2><p>Go beyond a single performance score. Ottimo connects technical evidence with the customer journey, so teams can decide what deserves attention first.</p></div>
      <div className="coverage-grid">{coverage.map(([title, body], index) => <article className="coverage-item" key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
    </section>

    <section className="case-study-lead">
      <div><span className="eyebrow">Demo evidence / Kingdom Coffee</span><h2>A score is only useful when it points to the next decision.</h2><p>Our saved example looks at a coffee supplier through the same customer and technical lens: delivery promises, category paths, accessibility, page weight and structured business facts.</p><Link className="text-link" to="/app/audits/audit-kingdom-coffee">Explore the example audit →</Link></div>
      <div className="case-score"><span>Overall health</span><strong>{kingdomCoffeeAudit.score}</strong><small>six categories reviewed</small><div className="case-bars">{kingdomCoffeeAudit.scores.slice(0, 4).map(score => <div key={score.category}><span>{score.category}</span><i style={{ width: `${score.score}%` }} /></div>)}</div></div>
    </section>

    <section className="principles-section">
      <div><span className="eyebrow">The Ottimo standard</span><h2>We would rather tell you “unknown” than give you a made-up number.</h2></div>
      <div className="principles-grid">
        <article><strong>Fast</strong><p>The product itself should respect your time, with focused interfaces and lightweight delivery.</p></article>
        <article><strong>Accessible</strong><p>Accessibility is part of the engineering, not a final checkbox after the design is finished.</p></article>
        <article><strong>Clear</strong><p>Every finding should explain what happened, why it matters and what can be done about it.</p></article>
        <article><strong>Useful</strong><p>Audit output should lead to action, not another dashboard nobody knows how to use.</p></article>
      </div>
    </section>

    <section className="lead-start"><LeadCapture /></section>
  </div>
}

export function InfoPage({ path }: { path: keyof typeof info }) {
  const [title, body] = info[path]
  return <div className="content-page"><div className="content-hero"><span className="eyebrow">Ottimo</span><h1>{title}</h1><p>{body}</p></div><div className="content-grid"><Card><span className="eyebrow">Our approach</span><h2>Make the important obvious.</h2><p>Every recommendation should explain the problem in language a business owner can understand, then provide enough technical detail for a developer to act.</p></Card><Card><span className="eyebrow">Proof through practice</span><h2>Less theatre. More signal.</h2><p>We prefer small bundles, semantic HTML, stable layouts, sensible defaults and measurable improvements over visual complexity that slows the experience down.</p></Card></div><div className="callout"><h2>Ready to inspect a website?</h2><p>The local Ottimo platform works without API keys or external services.</p><Link className="btn btn-primary" to="/app/audits/new">Start a demo audit</Link></div></div>
}