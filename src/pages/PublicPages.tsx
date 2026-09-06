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
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    try {
      const normalised = url.startsWith('http') ? url : `https://${url}`
      const parsed = new URL(normalised)
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Enter a valid website address.')
      if (!email.includes('@')) throw new Error('Add a work email so we know where to send your first action plan.')
      navigate(`/app/audits/new?url=${encodeURIComponent(normalised)}&email=${encodeURIComponent(email)}`)
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Enter a valid website address.')
    }
  }

  return <form className="lead-form" id="start" onSubmit={submit}>
    <div className="lead-form-heading">
      <span className="eyebrow">Start with your website</span>
      <h2>Get your first useful answer in minutes.</h2>
      <p>No sales call. No API key. Just a focused starting point for your next improvement.</p>
    </div>
    <div className="lead-fields">
      <label>Website URL<input required value={url} onChange={event => setUrl(event.target.value)} placeholder="yourbusiness.co.uk" /></label>
      <label>Work email<input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@yourbusiness.co.uk" /></label>
      <button className="btn btn-primary" type="submit">Start my free audit <span aria-hidden="true">↗</span></button>
    </div>
    {error && <p className="error" role="alert">{error}</p>}
    <small>We use your details only to set up this local demo journey.</small>
  </form>
}

export function Home() {
  return <div className="public-home lead-home">
    <section className="hero lead-hero">
      <div className="hero-kicker">A clearer read on what your website is doing for the business.</div>
      <div className="lead-hero-grid">
        <div>
          <h1>Your website is already part of your sales team.</h1>
          <p className="hero-copy">Ottimo shows you where it is helping customers, where it is losing them and what to fix first. Faster pages, clearer journeys and more trust, explained without the technical fog.</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="#start">Start a free audit <span aria-hidden="true">↗</span></Link>
            <Link className="text-link" to="#coverage">See what we measure ↓</Link>
          </div>
          <div className="ethos"><strong>More found.</strong><strong>More understood.</strong><strong>More acted on.</strong></div>
        </div>
        <div className="audit-preview" aria-label="Example audit summary">
          <div className="audit-preview-top"><span className="eyebrow">Ottimo audit / example</span><span className="preview-status">Ready to act</span></div>
          <div className="preview-score"><strong>78</strong><span>overall site health</span></div>
          <div className="preview-lines"><div><span>Performance</span><b>76</b></div><div><span>Accessibility</span><b>78</b></div><div><span>Technical SEO</span><b>82</b></div></div>
          <p className="preview-note">Six signals, one prioritised starting point.</p>
        </div>
      </div>
    </section>

    <section className="education-strip" id="learn">
      <div><span className="eyebrow">The simple model</span><h2>People need to find you, trust you and finish what they came to do.</h2></div>
      <div className="education-steps">
        <article><b>01</b><h3>Find</h3><p>SEO and clear content help the right people discover your business.</p></article>
        <article><b>02</b><h3>Trust</h3><p>Speed, accessibility and useful information make a good first impression believable.</p></article>
        <article><b>03</b><h3>Act</h3><p>Simple journeys, strong calls to action and working forms turn interest into progress.</p></article>
      </div>
    </section>

    <section className="coverage-section" id="coverage">
      <div className="section-intro"><span className="eyebrow">One platform, six useful lenses</span><h2>Enough technical depth to act. Enough clarity to know why.</h2><p>Ottimo turns a website review into a practical queue of improvements for owners, marketers and developers.</p></div>
      <div className="coverage-grid">{coverage.map(([title, body], index) => <article className="coverage-item" key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
    </section>

    <section className="case-study-lead">
      <div><span className="eyebrow">Demo evidence / Kingdom Coffee</span><h2>A score is only useful when it points to the next decision.</h2><p>Our saved example looks at a coffee supplier through the same customer and technical lens: delivery promises, category paths, accessibility, page weight and structured business facts.</p><Link className="text-link" to="/app/audits/audit-kingdom-coffee">Explore the example audit →</Link></div>
      <div className="case-score"><span>Overall health</span><strong>{kingdomCoffeeAudit.score}</strong><small>six categories reviewed</small><div className="case-bars">{kingdomCoffeeAudit.scores.slice(0, 4).map(score => <div key={score.category}><span>{score.category}</span><i style={{ width: `${score.score}%` }} /></div>)}</div></div>
    </section>

    <section className="lead-start"><LeadCapture /></section>
  </div>
}

export function InfoPage({ path }: { path: keyof typeof info }) {
  const [title, body] = info[path]
  return <div className="content-page"><div className="content-hero"><span className="eyebrow">Ottimo</span><h1>{title}</h1><p>{body}</p></div><div className="content-grid"><Card><span className="eyebrow">Our approach</span><h2>Make the important obvious.</h2><p>Every recommendation should explain the problem in language a business owner can understand, then provide enough technical detail for a developer to act.</p></Card><Card><span className="eyebrow">Proof through practice</span><h2>Less theatre. More signal.</h2><p>We prefer small bundles, semantic HTML, stable layouts, sensible defaults and measurable improvements over visual complexity that slows the experience down.</p></Card></div><div className="callout"><h2>Ready to inspect a website?</h2><p>The local Ottimo platform works without API keys or external services.</p><Link className="btn btn-primary" to="/app/audits/new">Start a demo audit</Link></div></div>
}