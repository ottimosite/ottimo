import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card } from '../components/ui'
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
    intro: 'Ottimo connects performance, search, accessibility, experience and technical quality so your team can work from the same evidence.',
    sections: [
      ['Performance engineering', 'Find the resources, rendering work and bottlenecks that slow down important journeys.', 'Measure the cost of delay before deciding what to optimise.'],
      ['Search & discovery', 'Improve the technical foundations that help search systems find, understand and trust important content.', 'Connect crawlability, structure and content signals instead of chasing a single score.'],
      ['Accessibility & experience', 'Make important journeys usable by more people and easier for everyone to understand.', 'Treat accessibility and usability as product quality, not compliance theatre.'],
      ['AI-ready foundations', 'Structure useful information so people and future interfaces can discover and use it with confidence.', 'Build from authoritative content and evidence rather than adding AI for its own sake.'],
    ],
  },
  '/performance': {
    eyebrow: 'Performance',
    title: 'Speed is part of the product.',
    intro: 'A fast website is not a vanity metric. It gives people a quicker path to the information, confidence and action they came for.',
    sections: [
      ['Find the bottleneck', 'Separate asset weight, rendering work, network delay and page structure so optimisation starts with evidence.', 'Measure what can be measured and label the rest honestly.'],
      ['Prioritise the journey', 'Focus on the pages and moments that matter instead of optimising every byte equally.', 'Tie technical work to customer-facing outcomes without inventing business causation.'],
      ['Verify the change', 'Re-run comparable audits and make improvement visible over time.', 'Keep previous evidence so a faster page can be distinguished from a different test.'],
    ],
  },
  '/seo': {
    eyebrow: 'Search visibility',
    title: 'Make the important pages easier to find and understand.',
    intro: 'Technical SEO should give search systems a reliable map of your website and give people useful answers when they arrive.',
    sections: [
      ['Discoverability', 'Check crawl paths, indexing signals, sitemaps, links and canonical relationships.', 'Find structural blockers before changing content blindly.'],
      ['Understanding', 'Use headings, metadata, structured information and clear page identity to reduce ambiguity.', 'Make the page understandable to both people and machines.'],
      ['Evidence over folklore', 'Separate observed technical signals from assumptions about rankings or traffic.', 'Ottimo never turns an audit finding into an unsupported promise of search performance.'],
    ],
  },
  '/accessibility': {
    eyebrow: 'Accessibility',
    title: 'Build an experience more people can actually use.',
    intro: 'Accessibility is product quality: clear structure, usable controls, sufficient contrast, keyboard access and content that does not depend on one way of interacting.',
    sections: [
      ['Structure', 'Use semantic landmarks, headings, names and relationships that make the interface understandable.', 'Give assistive technology the same useful structure a visual user receives.'],
      ['Interaction', 'Check focus, keyboard paths, forms, controls and predictable behaviour.', 'A successful interaction should not depend on a mouse, touch gesture or perfect vision.'],
      ['Sustainable quality', 'Turn findings into concrete fixes and verify them after implementation.', 'Accessibility improves when it is part of the engineering loop rather than a final audit.'],
    ],
  },
  '/ai': {
    eyebrow: 'AI readiness',
    title: 'Use AI where it creates leverage, not noise.',
    intro: 'AI becomes useful when the underlying website is clear, structured and trustworthy. Ottimo treats AI readiness as an extension of good digital foundations.',
    sections: [
      ['Useful knowledge', 'Identify the information your business needs people and machines to understand.', 'Start with authoritative facts, services, policies and relationships.'],
      ['Structured context', 'Improve page identity, semantics and machine-readable signals that make information easier to consume.', 'Good structure benefits search, accessibility and AI interfaces at the same time.'],
      ['Responsible integration', 'Use AI for investigation, explanation and workflow assistance without presenting guesses as evidence.', 'Keep generated guidance traceable to the observations that support it.'],
    ],
  },
  '/methodology': {
    eyebrow: 'Methodology',
    title: 'Measure first. Explain clearly. Improve progressively.',
    intro: 'Ottimo is designed around an evidence loop: discover what exists, understand what matters, act on the strongest opportunities and verify what changed.',
    sections: [
      ['01 · Discover', 'Map the website and capture the signals that can actually be observed.', 'Unknown stays unknown.'],
      ['02 · Understand', 'Connect findings to affected pages, evidence, impact and implementation context.', 'A developer and a decision-maker should be able to trace the same conclusion.'],
      ['03 · Prioritise', 'Turn findings into an ordered set of actions based on impact, effort, dependencies and evidence.', 'The goal is a useful next step, not a longer dashboard.'],
      ['04 · Verify', 'Compare later audits and retain the history of what changed.', 'Improvement is only useful when it can be checked.'],
    ],
  },
  '/pricing': {
    eyebrow: 'Plans',
    title: 'Start with evidence. Scale when the work demands it.',
    intro: 'Ottimo is being designed around progressive adoption: understand your website first, then add the workflow and monitoring capabilities your team actually needs.',
    sections: [
      ['Explore', 'Use the audit experience to understand the current state of a website and identify useful next steps.', 'Designed for discovery and evaluation.'],
      ['Improve', 'Build a repeatable workflow around findings, actions, verification and longitudinal history.', 'Designed for teams actively improving a website.'],
      ['Partner', 'Bring integrations, scheduled audits, reporting and ongoing intelligence into one operating rhythm.', 'Designed for sustained optimisation programmes.'],
    ],
  },
  '/about': {
    eyebrow: 'About Ottimo',
    title: 'Make the web work better.',
    intro: 'Ottimo exists to make digital improvement less noisy: faster experiences, clearer evidence, more inclusive interfaces and better decisions.',
    sections: [
      ['Fast', 'The product itself should respect your time.', 'Lightweight interfaces are part of the promise.'],
      ['Accessible', 'Quality should include people who navigate the web differently.', 'Accessibility belongs in the engineering loop.'],
      ['Clear', 'Technical findings should become understandable decisions.', 'Explain the evidence, the impact and the next action.'],
      ['Useful', 'An audit is only valuable if it changes what someone does next.', 'Ottimo is built around improvement, not reporting for its own sake.'],
    ],
  },
  '/case-studies': {
    eyebrow: 'Evidence library',
    title: 'Proof should be earned, not invented.',
    intro: 'The current public experience uses deterministic fixtures and clearly labelled examples. Real client outcomes belong here only when they can be verified and attributed responsibly.',
    sections: [
      ['What we show', 'Observed evidence, implementation changes and comparable before/after measurements.', 'No invented traffic, conversion or revenue claims.'],
      ['How we verify', 'Use repeatable audits and retain the evidence behind the conclusion.', 'A result should remain understandable after the campaign or project ends.'],
      ['What comes next', 'As the platform matures, verified client stories can connect technical improvements with measured outcomes.', 'Evidence first, storytelling second.'],
    ],
  },
  '/contact': {
    eyebrow: 'Contact',
    title: 'Bring us the website problem you can actually see.',
    intro: 'Tell us what is slow, difficult to use, hard to find or difficult for your team to understand. Start with the evidence and we can work from there.',
    sections: [
      ['Website review', 'Share the website and the journey or problem you want to understand.', 'Useful context beats a generic “make it better” brief.'],
      ['Technical improvement', 'Bring a known performance, accessibility, SEO or engineering problem.', 'Ottimo can help turn it into an evidence-led action plan.'],
      ['Ongoing optimisation', 'For teams improving continuously, the platform is designed around history, actions and verification.', 'The operating model grows with the website.'],
    ],
  },
} as const

type PublicPath = keyof typeof pageContent

function usePublicMetadata(title: string, description: string) {
  useEffect(() => {
    document.title = `${title} — Ottimo`
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (meta) meta.content = description
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
      <h2>See what needs attention first.</h2>
      <p>Enter your website address. Ottimo will take you straight into the audit setup so you can choose the scope before anything runs.</p>
    </div>
    <div className="lead-fields">
      <label>Website URL<input required value={url} onChange={event => { setUrl(event.target.value); setError('') }} placeholder="yourbusiness.co.uk" /></label>
      <button className="btn btn-primary" type="submit">Analyse my website <span aria-hidden="true">↗</span></button>
    </div>
    {error && <p className="error" role="alert">{error}</p>}
    <small>No account is required to start. Ottimo only presents evidence it can support; unavailable measurements stay unavailable.</small>
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
  usePublicMetadata('Find what is holding your website back.', 'Ottimo audits the technical foundations of your website and turns the evidence into a prioritised improvement plan.')

  return <div className="public-home lead-home">
    <section className="hero lead-hero">
      <div className="hero-kicker">Website performance · search · accessibility · UX · technical quality · AI readiness</div>
      <div className="lead-hero-grid">
        <div>
          <span className="eyebrow">Website optimisation, without the guesswork</span>
          <h1>Find what is holding your website back.</h1>
          <p className="hero-copy">Ottimo checks the parts of your website that affect speed, discoverability, accessibility, usability and technical quality — then turns the evidence into a clear list of what to fix next.</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#start">Analyse my website <span aria-hidden="true">↗</span></a>
            <a className="text-link" href="#method">See how it works ↓</a>
          </div>
          <div className="ethos"><strong>Find the problems.</strong><strong>Understand the impact.</strong><strong>Fix what matters.</strong><strong>Verify the change.</strong></div>
        </div>
        <div className="audit-preview" aria-label="Illustrative Ottimo audit summary">
          <div className="audit-preview-top"><span className="eyebrow">Illustrative audit view</span><span className="preview-status">Evidence first</span></div>
          <div className="preview-score"><strong>Evidence</strong><span>before scores, promises or recommendations</span></div>
          <div className="preview-lines"><div><span>Performance</span><b>Measured</b></div><div><span>Accessibility</span><b>Measured</b></div><div><span>Search visibility</span><b>Evidence</b></div></div>
          <p className="preview-note">Every finding is labelled as measured, inferred or unavailable. Unknown is a valid result.</p>
          <Link className="preview-link" to="/methodology">Read the methodology →</Link>
        </div>
      </div>
    </section>

    <TrustRow />

    <section className="education-strip">
      <div><span className="eyebrow">The problem with isolated scores</span><h2>A website is one experience, even when the tools are not.</h2><p>Performance, search, accessibility and usability overlap. Ottimo gives teams a shared evidence layer so improvement can happen in the right order.</p></div>
      <div className="education-steps">
        <article><b>01</b><h3>Discover</h3><p>Map the website and record what can actually be observed.</p></article>
        <article><b>02</b><h3>Decide</h3><p>Connect evidence to impact, effort and the next useful action.</p></article>
        <article><b>03</b><h3>Verify</h3><p>Re-audit, compare and retain the history of improvement.</p></article>
      </div>
    </section>

    <section className="method-section" id="method">
      <div className="method-lead"><span className="eyebrow">The Ottimo loop</span><h2>From website signal to verified improvement.</h2><p>Ottimo is deliberately built around a repeatable operating loop rather than a one-off report.</p></div>
      <ol className="method-steps">
        <li><span>01</span><div><h3>Discover</h3><p>Map pages, resources, structure and supported technical signals.</p></div></li>
        <li><span>02</span><div><h3>Understand</h3><p>Trace important conclusions back to the evidence that supports them.</p></div></li>
        <li><span>03</span><div><h3>Prioritise</h3><p>Turn findings into actions with impact, effort and dependency context.</p></div></li>
        <li><span>04</span><div><h3>Verify</h3><p>Compare later audits so improvement is measurable rather than assumed.</p></div></li>
      </ol>
    </section>

    <section className="coverage-section" id="coverage">
      <div className="section-intro"><span className="eyebrow">What Ottimo covers</span><h2>Six lenses. One digital experience.</h2><p>Use the areas independently when you need depth, or together when you need to understand the website as a whole.</p></div>
      <div className="coverage-grid">{coverage.map(([title, body], index) => <article className="coverage-item" key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{body}</p><Link to={`/app/${title === 'Search visibility' ? 'seo' : title === 'Experience' ? 'usability' : title === 'Technical quality' ? 'technical' : title.toLowerCase()}`}>Explore in the platform →</Link></article>)}</div>
    </section>

    <section className="case-study-lead">
      <div><span className="eyebrow">See the product, not a mockup</span><h2>Explore the working audit experience.</h2><p>The public site is backed by the same application architecture as the product. The deterministic Wikipedia fixture gives the platform a real-site structure without pretending fixture data is a live measurement.</p><Link className="text-link" to="/app/audits/audit-wikipedia">Explore the working audit →</Link></div>
      <div className="case-score"><span>Fixture status</span><strong>Live</strong><small>working product · deterministic evidence</small><div className="case-bars">{wikipediaAudit.scores.slice(0, 4).map(score => <div key={score.category}><span>{score.category}</span><i style={{ width: `${score.score}%` }} /></div>)}</div></div>
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

    <section className="lead-start"><LeadCapture /></section>
  </div>
}

export function InfoPage({ path }: { path: PublicPath }) {
  const content = pageContent[path]
  usePublicMetadata(content.title, content.intro)

  return <div className="content-page public-info-page">
    <div className="content-hero">
      <span className="eyebrow">{content.eyebrow}</span>
      <h1>{content.title}</h1>
      <p>{content.intro}</p>
      <div className="hero-actions"><Link className="btn btn-primary" to="/#start">Analyse my website</Link><Link className="text-link" to="/methodology">How we work →</Link></div>
    </div>
    <div className="public-info-grid">
      {content.sections.map(([title, body, proof], index) => <article key={title}><span>0{index + 1}</span><h2>{title}</h2><p>{body}</p><strong>{proof}</strong></article>)}
    </div>
    <section className="public-info-proof">
      <div><span className="eyebrow">What you can expect</span><h2>Evidence that leads somewhere.</h2><p>Ottimo keeps observations, inference and unavailable evidence separate, then connects supported findings to actions and later verification.</p></div>
      <div className="public-info-proof-list"><span>Measure what can be measured.</span><span>Explain what the evidence means.</span><span>Prioritise the next useful action.</span><span>Verify the change.</span></div>
    </section>
    <section className="callout"><span className="eyebrow">Start with a website</span><h2>See what Ottimo can actually find.</h2><p>Explore the working audit experience and decide what deserves attention next.</p><Link className="btn btn-primary" to="/app/audits/new">Start a demo audit</Link></section>
  </div>
}
