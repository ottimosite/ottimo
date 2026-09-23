import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const shell = await readFile(join(dist, 'index.html'), 'utf8')

const routes = {
  '/': { title: 'Ottimo — Make your website work better.', description: 'Ottimo audits performance, search, accessibility, experience, technical quality and AI readiness, then turns evidence into a prioritised improvement plan.', h1: 'Make your website work better. Know what to fix next.', intro: 'Ottimo brings performance, search, accessibility, experience, technical quality and AI readiness into one evidence-led view — so your team can understand the problem, decide what matters and act on it.', body: '<section><h2>One website. One improvement system.</h2><p>Measure what can be observed, understand what it means, improve what matters and verify what changed.</p></section><section><h2>Six lenses. One website.</h2><ul><li><a href="/performance">Performance</a> — identify the work that slows important journeys.</li><li><a href="/seo">Search visibility</a> — make important pages easier to discover and understand.</li><li><a href="/accessibility">Accessibility</a> — identify barriers to using the experience.</li></ul></section>' },
  '/services': { title: 'Services — Ottimo', description: 'Ottimo connects performance, search, accessibility, experience, technical quality and AI readiness into one evidence-led website improvement system.', h1: 'One website. One improvement system.', intro: 'Ottimo connects performance, search, accessibility, experience and technical quality so your team can work from the same evidence.', body: '<section><h2>Performance engineering</h2><p>Find resources, rendering work and bottlenecks that slow important journeys.</p></section><section><h2>Search and discovery</h2><p>Improve the technical foundations that help search systems find, understand and trust important content.</p></section><section><h2>Accessibility and experience</h2><p>Make important journeys usable by more people and easier for everyone to understand.</p></section><section><h2>AI-ready foundations</h2><p>Structure useful information so people and future interfaces can discover and use it with confidence.</p></section>' },
  '/performance': { title: 'Performance — Ottimo', description: 'Ottimo performance engineering identifies measurable bottlenecks, prioritises important journeys and verifies changes over time.', h1: 'Speed is part of the product.', intro: 'A fast website is not a vanity metric. It gives people a quicker path to the information, confidence and action they came for.', body: '<section><h2>Find the bottleneck</h2><p>Separate asset weight, rendering work, network delay and page structure so optimisation starts with evidence.</p></section><section><h2>Prioritise the journey</h2><p>Focus on the pages and moments that matter instead of optimising every byte equally.</p></section><section><h2>Verify the change</h2><p>Re-run comparable audits and make improvement visible over time.</p></section>' }
}

const nav = '<header><a href="/" aria-label="Ottimo home"><strong>OTTIMO.</strong></a><nav aria-label="Primary"><a href="/services">Services</a><a href="/performance">Performance</a><a href="/methodology">Methodology</a><a href="/pricing">Plans</a><a href="/contact">Contact</a></nav></header>'
const footer = '<footer><strong>OTTIMO.</strong><p>Fast. Accessible. Clear. Useful.</p><p>Website performance, visibility and experience — connected by evidence.</p></footer>'
const critical = '<style>body{margin:0;font-family:system-ui,sans-serif;color:#17251c;background:#f5f7ef;line-height:1.6}header,main,footer{max-width:1100px;margin:auto;padding:24px}header{display:flex;justify-content:space-between;gap:24px;align-items:center}nav{display:flex;flex-wrap:wrap;gap:18px}a{color:#175c3b;font-weight:700}main{padding-top:72px;padding-bottom:90px}h1{max-width:850px;font-size:clamp(3rem,8vw,6.5rem);line-height:.95;letter-spacing:-.06em;margin:0 0 28px}h2{font-size:clamp(1.8rem,4vw,3rem);line-height:1.05;margin-top:56px}p,li{max-width:760px;font-size:1.08rem}section{border-top:1px solid #cbd6ca;padding-top:20px}footer{border-top:1px solid #cbd6ca}.cta{display:inline-block;margin-top:28px;padding:14px 20px;border-radius:999px;background:#173f2a;color:#fff;text-decoration:none}@media(max-width:700px){header{align-items:flex-start;flex-direction:column}}</style>'

function render(path, page) {
  const canonical = path === '/' ? '/' : path
  let html = shell
  html = html.replace(/<title>.*?<\\/title>/, '<title>' + page.title + '</title>')
  html = html.replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + page.description + '">')
  html = html.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="index,follow">')
  html = html.replace('</head>', '<link rel="canonical" href="' + canonical + '"><meta property="og:title" content="' + page.title + '"><meta property="og:description" content="' + page.description + '"><meta property="og:type" content="website"><meta property="og:url" content="' + canonical + '">' + critical + '</head>')
  html = html.replace('<div id="root"></div>', '<div id="root">' + nav + '<main id="main" tabindex="-1"><article><p><strong>Website intelligence and optimisation</strong></p><h1>' + page.h1 + '</h1><p>' + page.intro + '</p><a class="cta" href="/app/audits/new">Start my Website Check</a>' + page.body + '</article></main>' + footer + '</div>')
  return html
}

for (const [path, page] of Object.entries(routes)) {
  const target = path === '/' ? join(dist, 'index.html') : join(dist, path.slice(1), 'index.html')
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, render(path, page), 'utf8')
}
console.log('Generated public HTML:', Object.keys(routes).join(', '))