import { Link } from 'react-router-dom'

type ConceptTheme = 'reliability' | 'speed' | 'friendly'

const concepts: Record<ConceptTheme, { name: string; eyebrow: string; title: string; intro: string; promise: string; lessons: string[]; accent: string }> = {
  reliability: {
    name: 'The Trust Desk',
    eyebrow: 'Direction 01 · Reliability',
    title: 'Your website should feel dependable before anyone has to think about it.',
    intro: 'A calm, confident direction for owners who want fewer surprises, clearer evidence and a website that earns trust every day.',
    promise: 'Know what is healthy, what is fragile and what deserves attention next.',
    lessons: ['Reliability is more than uptime. It is a page that loads, a form that works and an answer that is easy to find.', 'Small technical failures become expensive when they interrupt a customer at the exact moment they are ready to act.', 'Ottimo turns a technical audit into a plain-language maintenance plan your team can actually use.'],
    accent: 'No drama. Just dependable digital infrastructure.',
  },
  speed: {
    name: 'The Green Light',
    eyebrow: 'Direction 02 · Speed',
    title: 'Make every useful moment arrive sooner.',
    intro: 'A more kinetic direction built around momentum: quick signals, sharp decisions and a website that never makes customers wait around.',
    promise: 'Find the drag, remove the drag and keep the experience moving.',
    lessons: ['Speed is a business signal. A slow first impression makes every later promise harder to believe.', 'The fastest win is rarely “make everything faster.” It is finding the one delay that blocks the next important action.', 'Ottimo connects Core Web Vitals to real business moments: discovery, confidence, enquiry and checkout.'],
    accent: 'Less waiting. More doing.',
  },
  friendly: {
    name: 'The Web Gardener',
    eyebrow: 'Direction 03 · Friendliness',
    title: 'A better website gives people a little help at exactly the right time.',
    intro: 'A warmer, more playful direction with a guide-like voice for owners who want digital advice without the jargon or the intimidation.',
    promise: 'Understand what your website is saying, who it helps and where it leaves people behind.',
    lessons: ['Accessibility is not a compliance box. It is the difference between “I can do this” and “I am stuck.”', 'Clear headings, useful forms and honest page speed make a business feel more thoughtful.', 'Ottimo explains the fix in two languages: what it means for customers and what a developer should change.'],
    accent: 'A little more care in every click.',
  },
}

export function ConceptsIndex() {
  return <div className="concept-index"><div className="concept-index-intro"><span className="eyebrow">Ottimo creative directions</span><h1>Three ways to make the web easier to care about.</h1><p>These are three visual and editorial routes for the Ottimo marketing experience. Each one explains technical quality in a way a business owner can feel.</p></div><div className="concept-grid">{(Object.keys(concepts) as ConceptTheme[]).map(theme => <Link className={`concept-card concept-card-${theme}`} to={`/concepts/${theme}`} key={theme}><span className="concept-number">0{theme === 'reliability' ? 1 : theme === 'speed' ? 2 : 3}</span><span className="eyebrow">{concepts[theme].eyebrow}</span><h2>{concepts[theme].name}</h2><p>{concepts[theme].accent}</p><span className="concept-arrow">Explore direction <span aria-hidden="true">↗</span></span></Link>)}</div><div className="concept-index-footer"><Link className="btn btn-primary" to="/app/dashboard">See the working platform</Link><Link className="btn btn-secondary" to="/">Back to Ottimo home</Link></div></div>
}

export function ConceptPage({ theme }: { theme: ConceptTheme }) {
  const concept = concepts[theme]
  return <div className={`concept-page theme-${theme}`}><header className="concept-nav"><Link className="brand" to="/">OTTIMO<span>.</span></Link><Link className="concept-back" to="/concepts">All directions <span aria-hidden="true">↗</span></Link></header><main><section className="concept-hero"><div className="concept-hero-copy"><span className="eyebrow">{concept.eyebrow}</span><h1>{concept.title}</h1><p>{concept.intro}</p><div className="hero-actions"><Link className="btn btn-primary" to="/app/audits/new">Check my website</Link><Link className="text-link" to="#learn">What does this mean? ↓</Link></div></div>{theme === 'friendly' ? <div className="concept-mascot" aria-label="Ottimo's friendly leaf guide"><div className="mascot-leaf"><i /><i /></div><div className="mascot-face"><b /><b /><span /></div><div className="mascot-shadow" /></div> : <div className="concept-art" aria-hidden="true"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><strong>{theme === 'speed' ? '0.8s' : '99.9'}</strong><span>{theme === 'speed' ? 'first useful moment' : 'signals you can trust'}</span></div>}</section><section className="concept-promise"><span className="eyebrow">The promise</span><h2>{concept.promise}</h2></section><section className="concept-lessons" id="learn"><div><span className="eyebrow">For busy owners</span><h2>Good digital work should make decisions easier.</h2></div><div className="lesson-list">{concept.lessons.map((lesson, index) => <article key={lesson}><span>0{index + 1}</span><p>{lesson}</p></article>)}</div></section><section className="concept-cta"><span className="eyebrow">Start with a signal</span><h2>You do not need to know every technical term to know what better feels like.</h2><Link className="btn btn-primary" to="/app/audits/new">Run a local demo audit</Link></section></main></div>
}