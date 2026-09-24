/* global process */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const shell = await readFile(join(dist, 'index.html'), 'utf8')
const site = process.env.SITE_URL ?? 'https://ottimo-site.netlify.app'

const escapeHtml = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;')

const routes = {
  '/': {
    title: 'Make your website work better. Know what to fix next. — Ottimo',
    description: 'Ottimo audits performance, search, accessibility, experience, technical quality and AI-ready foundations, then turns supported evidence into a prioritised improvement plan.',
    h1: 'Make your website work better. Know what to fix next.',
    intro: 'Ottimo brings performance, search, accessibility, experience, technical quality and AI-ready foundations into one evidence-led view — so your team can understand the problem, decide what matters and act on it.',
    body: '<section><p class="eyebrow">One website. One improvement system.</p><h2>Your website is one system, even when the signals are not.</h2><p>Ottimo connects the signals that describe the same digital property, then turns supported findings into useful next actions.</p></section><section><p class="eyebrow">What Ottimo covers</p><h2>Six lenses. One website.</h2><ul><li>Performance</li><li>Search visibility</li><li>Accessibility</li><li>Experience</li><li>Technical quality</li><li>AI-ready foundations</li></ul><p><a href="/example-audit">See the sample audit →</a></p></section><section><p class="eyebrow">The standard</p><h2>We would rather say “unknown” than give you a made-up number.</h2><p>Measured, inferred and unavailable evidence stays distinguishable.</p></section>'
  },
  '/services': {
    title: 'Services — Ottimo',
    description: 'Ottimo connects performance, search, accessibility, experience, technical quality and AI-ready foundations into one evidence-led website improvement system.',
    h1: 'One website. One improvement system.',
    intro: 'Ottimo examines six connected areas of a website so your team can work from the same evidence instead of isolated scores.',
    body: '<section><h2>Six lenses. One website.</h2><p>Performance, search visibility, accessibility, experience, technical quality and AI-ready foundations describe different aspects of the same digital property.</p></section><section><h2>From signal to decision.</h2><ol><li>Discover what can be observed.</li><li>Understand the evidence and why it matters.</li><li>Prioritise the next useful action.</li><li>Verify what changed.</li></ol></section><section><h2>A report with the evidence underneath.</h2><p>Start with the decision-maker summary, then move into findings, evidence, affected scope, technical context and verification.</p></section>'
  },
  '/example-audit': {
    title: 'Sample audit — Ottimo',
    description: 'Explore a deterministic Ottimo audit example showing evidence, uncertainty, prioritisation and verification without presenting fixture data as a live customer measurement.',
    h1: 'See the evidence before you analyse your own website.',
    intro: 'This working example uses a deterministic fixture so you can see how Ottimo connects findings, evidence, uncertainty and next actions.',
    body: '<section><h2>Finding → evidence → action.</h2><p>The sample audit shows how a finding is explained, what evidence supports it and what could happen next.</p></section><section><h2>Coverage stays explicit.</h2><p>Measured and unavailable evidence remain distinguishable. Ottimo does not turn missing evidence into a zero just to complete a dashboard.</p></section><section><h2>Improvement needs a second piece of evidence.</h2><p>A later comparable audit can show whether a finding was resolved, improved, regressed or remains inconclusive.</p></section>'
  },
  '/methodology': {
    title: 'Methodology — Ottimo',
    description: 'Understand how Ottimo distinguishes measured, inferred and unavailable evidence and turns findings into prioritised, verifiable improvement.',
    h1: 'Measure first. Explain clearly. Improve progressively.',
    intro: 'Ottimo follows an evidence loop: discover what exists, understand what matters, prioritise the useful next action and verify what changed.',
    body: '<section><h2>Measured, inferred and unavailable.</h2><p>Direct observations, derived conclusions and unavailable evidence are kept distinct.</p></section><section><h2>Every finding should lead somewhere.</h2><ol><li>Discover.</li><li>Understand.</li><li>Prioritise.</li><li>Verify.</li></ol></section><section><h2>We would rather say “unknown” than give you a made-up number.</h2><p>Ottimo does not invent rankings, traffic, conversions, user behaviour or certainty the audit cannot support.</p></section>'
  },
  '/pricing': {
    title: 'Plans — Ottimo',
    description: 'See how Ottimo is designed for progressive adoption: explore the audit experience first, then add workflow and ongoing optimisation capabilities as the work demands them.',
    h1: 'Start with evidence. Scale when the work demands it.',
    intro: 'Ottimo is designed around progressive adoption rather than inventing commercial promises before the product lifecycle is ready.',
    body: '<section><h2>Explore</h2><p>Understand the current state of a website and identify useful next steps.</p></section><section><h2>Improve</h2><p>Build a repeatable workflow around findings, actions, verification and history.</p></section><section><h2>Partner</h2><p>Add integrations, scheduled audits, reporting and ongoing intelligence as the website and team demand them.</p></section><section><h2>The evidence model does not change.</h2><p>Observed evidence stays distinguishable from inference, unavailable evidence stays unavailable, and improvement is verified rather than assumed.</p></section>'
  }
}

const nav = '<header><a href="/" aria-label="Ottimo home"><strong>OTTIMO.</strong></a><nav aria-label="Primary"><a href="/services">Services</a><a href="/example-audit">Sample audit</a><a href="/methodology">Methodology</a><a href="/pricing">Plans</a></nav><a class="cta" href="/app/audits/new">Analyse your website</a></header>'
const footer = '<footer><strong>OTTIMO.</strong><p>Fast. Accessible. Clear. Useful.</p><p>Digital presence, made measurable.</p><nav aria-label="Footer"><a href="/services">Services</a><a href="/example-audit">Sample audit</a><a href="/methodology">Methodology</a><a href="/pricing">Plans</a></nav></footer>'
const critical = '<style>body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#18221d;background:#f5f7ef;line-height:1.6}header,main,footer{max-width:1220px;margin:auto;padding:24px 30px}header{display:flex;justify-content:space-between;gap:24px;align-items:center;border-bottom:1px solid rgba(18,61,46,.16)}nav{display:flex;flex-wrap:wrap;gap:18px}a{color:#1f5a43;font-weight:800}header>a:first-child{color:#123d2e;text-decoration:none;letter-spacing:.12em}main{padding-top:82px;padding-bottom:100px}article{max-width:920px}h1{max-width:900px;font-size:clamp(3.2rem,7vw,6.5rem);line-height:.92;letter-spacing:-.065em;margin:0 0 28px;color:#123d2e}h2{font-size:clamp(2rem,4vw,3.6rem);line-height:.98;letter-spacing:-.05em;margin:0 0 14px;color:#123d2e}p,li{max-width:760px;font-size:1.05rem}.eyebrow{margin:0 0 12px;color:#1f5a43;font-size:.72rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase}section{margin-top:72px;padding-top:28px;border-top:1px solid rgba(18,61,46,.16)}section:first-of-type{margin-top:56px}.cta{display:inline-block;padding:13px 18px;border-radius:9px;background:#123d2e;color:#fff;text-decoration:none}footer{margin-top:0;padding-top:52px;padding-bottom:48px;border-top:1px solid rgba(18,61,46,.16);background:#123d2e;color:#d9e7d6}footer strong{color:#d8f36b;letter-spacing:.12em}footer a{color:#d9e7d6}@media(max-width:760px){header{align-items:flex-start;flex-direction:column}header nav{order:3}header .cta{order:2}main{padding-top:56px}h1{font-size:clamp(3rem,14vw,5rem)}} </style>'

function render(path, page) {
  const canonical = site.replace(/\/$/, '') + (path === '/' ? '/' : path)
  let html = shell
  html = html.replace(/<title>.*?<\/title>/, '<title>' + escapeHtml(page.title) + '</title>')
  html = html.replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + escapeHtml(page.description) + '">')
  html = html.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="index,follow">')
  const og = '<link rel="canonical" href="' + canonical + '"><meta property="og:title" content="' + escapeHtml(page.title) + '"><meta property="og:description" content="' + escapeHtml(page.description) + '"><meta property="og:type" content="website"><meta property="og:url" content="' + canonical + '">'
  const structuredData = path === '/' ? '<script type="application/ld+json">' + JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Ottimo',
    url: site
  }) + '</script>' : ''
  html = html.replace('</head>', og + structuredData + critical + '</head>')
  html = html.replace('<div id="root"></div>', '<div id="root">' + nav + '<main id="main" tabindex="-1"><article><p class="eyebrow">Website intelligence & optimisation</p><h1>' + page.h1 + '</h1><p>' + page.intro + '</p><a class="cta" href="/app/audits/new">Analyse your website</a>' + page.body + '</article></main>' + footer + '</div>')
  return html
}

for (const [path, page] of Object.entries(routes)) {
  const target = path === '/' ? join(dist, 'index.html') : join(dist, path.slice(1), 'index.html')
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, render(path, page), 'utf8')
}

process.stdout.write('Generated active public HTML: ' + Object.keys(routes).join(', ') + '\n')