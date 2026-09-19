import type { AuditResult, AuditIssue, AuditStandard, Category } from '../types/domain'
import { auditScores } from '../data/mock'
import { harbourPineAudit } from '../data/fixtures/harbourPine'
import { collectPage } from './collection'
export interface AuditProvider { runAudit(url:string): Promise<AuditResult> }
export const auditStandards: { name: AuditStandard; description: string }[] = [
  { name: 'WCAG 2.2 AA', description: 'Accessibility signals mapped to perceivable, operable, understandable and robust content.' },
  { name: 'Core Web Vitals', description: 'Performance checks oriented around loading, responsiveness and visual stability.' },
  { name: 'Technical SEO', description: 'Search fundamentals covering page meaning, metadata, crawl paths and mobile readiness.' },
]
export class BrowserAuditProvider implements AuditProvider {
 async runAudit(url:string):Promise<AuditResult>{
   const started = performance.now()
  const response = await fetch(url, { headers: { Accept: 'text/html' } })
  const responseMs = performance.now() - started
   if (!response.ok) throw new Error(`The website returned HTTP ${response.status}.`)
   const html = await response.text()
  const parseStarted = performance.now()
  const document = new DOMParser().parseFromString(html, 'text/html')
  const htmlParseMs = performance.now() - parseStarted
   const issues: AuditIssue[] = []
  const add = (issue: Omit<AuditIssue, 'id'>) => issues.push({ ...issue, id: `live-${issues.length + 1}` })
   const title = document.title.trim()
   const description = document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ?? ''
   const headings = [...document.querySelectorAll('h1')]
   const images = [...document.images]
   const missingAlt = images.filter(image => !image.hasAttribute('alt')).length
  const links = [...document.querySelectorAll<HTMLAnchorElement>('a[href]')]
   const buttons = [...document.querySelectorAll('button, input[type="button"], input[type="submit"]')]
   const labelledControls = [...document.querySelectorAll('input, select, textarea')].filter(control => control.getAttribute('aria-label') || control.getAttribute('aria-labelledby') || (control.id && document.querySelector(`label[for="${control.id}"]`)))
  if (!title) add({ category:'seo', severity:'high', title:'Page is missing a title', summary:'The fetched document does not expose a document title.', impact:'Search engines and browser users get less context about the page.', solution:'Add one concise, descriptive title that matches the page intent.', effort:'low', priority:90, status:'open', standards:['Technical SEO'], criterion:'Title element' })
  if (!description) add({ category:'seo', severity:'medium', title:'Page is missing a meta description', summary:'No meta description was found in the fetched HTML.', impact:'Search results may use less useful page text when presenting this business.', solution:'Add a specific description that explains the page value and audience.', effort:'low', priority:70, status:'open', standards:['Technical SEO'], criterion:'Search snippet metadata' })
  if (headings.length !== 1) add({ category:'accessibility', severity:'medium', title:`Page has ${headings.length} H1 headings`, summary:'A page should normally have one clear top-level heading.', impact:'People using headings to navigate may find the page structure unclear.', solution:'Keep one descriptive H1 and use H2/H3 headings for the sections beneath it.', effort:'low', priority:76, status:'open', standards:['WCAG 2.2 AA', 'Technical SEO'], criterion:'WCAG 1.3.1 · Info and Relationships' })
  if (missingAlt) add({ category:'accessibility', severity:'high', title:`${missingAlt} image${missingAlt === 1 ? '' : 's'} missing alt text`, summary:'The fetched page contains images without an alt attribute.', impact:'Screen-reader users may miss important product or business context.', solution:'Add concise alt text for informative images and empty alt text for decorative ones.', effort:'low', priority:86, status:'open', standards:['WCAG 2.2 AA'], criterion:'WCAG 1.1.1 · Non-text Content' })
  if (buttons.length && labelledControls.length < buttons.length) add({ category:'accessibility', severity:'medium', title:'Interactive controls need accessible names', summary:'Some controls do not have a visible label or accessible naming relationship.', impact:'Assistive-technology users may not know what an action does.', solution:'Add visible labels or aria-label/aria-labelledby values to every control.', effort:'low', priority:82, status:'open', standards:['WCAG 2.2 AA'], criterion:'WCAG 4.1.2 · Name, Role, Value' })
  if (!document.documentElement.lang) add({ category:'technical', severity:'low', title:'Document language is not declared', summary:'The HTML element has no lang attribute.', impact:'Assistive technology may choose the wrong pronunciation rules.', solution:'Declare the primary content language on the html element.', effort:'low', priority:60, status:'open', standards:['WCAG 2.2 AA'], criterion:'WCAG 3.1.1 · Language of Page' })
  if (!document.querySelector('meta[name="viewport"]')) add({ category:'usability', severity:'medium', title:'Mobile viewport is not declared', summary:'No responsive viewport meta tag was found.', impact:'The page may render at an awkward scale on mobile devices.', solution:'Add a responsive viewport meta tag for predictable mobile layout.', effort:'low', priority:74, status:'open', standards:['Technical SEO', 'WCAG 2.2 AA'], criterion:'Mobile rendering baseline' })
  if (links.length < 3) add({ category:'usability', severity:'low', title:'Page has very few navigable links', summary:'The fetched document contains fewer than three links.', impact:'Visitors may have difficulty discovering the next useful page or action.', solution:'Provide clear links to key services, products, contact paths, or supporting information.', effort:'medium', priority:52, status:'open', standards:['Technical SEO'], criterion:'Crawlable internal paths' })
   // Live browser-fetch inspection produces evidence, not a synthetic performance score.
   // Rendered performance metrics and trustworthy cross-domain scoring belong to later audit providers.
   const scores = (['performance', 'accessibility', 'seo', 'usability', 'technical', 'ai'] as const).map(category => ({
     category,
     measurement: 'unavailable' as const,
   }))
   const score: AuditResult['score'] = undefined
  const externalLinkCount = links.filter(link => { try { return new URL(link.href, url).origin !== new URL(url).origin } catch { return false } }).length
  const wordCount = (document.body.textContent ?? '').trim().split(/\s+/).filter(Boolean).length
  return { score, scores, issues, durationMs: Math.round(performance.now() - started), standards: auditStandards.map(standard => standard.name), stats: { htmlBytes: new TextEncoder().encode(html).length, imageCount: images.length, linkCount: links.length, externalLinkCount, headingCount: document.querySelectorAll('h1,h2,h3').length, scriptCount: document.scripts.length, formCount: document.forms.length, buttonCount: buttons.length, wordCount, title, language: document.documentElement.lang || undefined, screenshotUrl: `https://image.thum.io/get/width/1200/fullpage/${url}`, screenshotMode: 'full-page', pageScope: 'single-page', performance: { collectionMs: Math.round(responseMs), htmlParseMs: Math.round(htmlParseMs), mode: 'unavailable' }, source: 'live' } }
 }
}
const issueTemplates: Omit<AuditIssue,'id'>[] = [
 { category:'performance', severity:'high', title:'Largest image is not efficiently delivered', summary:'The primary visual is heavier than necessary and can delay LCP.', impact:'Faster visual completion improves perceived speed and mobile experience.', solution:'Serve a responsive modern format, reserve dimensions and preload only the critical asset.', effort:'low', priority:92, status:'open' },
 { category:'accessibility', severity:'high', title:'Interactive controls need clearer accessible names', summary:'Some controls depend too heavily on visual context.', impact:'Assistive technology users may miss the purpose of a control.', solution:'Provide explicit accessible names and keep visible labels where possible.', effort:'low', priority:88, status:'open' },
 { category:'seo', severity:'medium', title:'Page titles need stronger intent matching', summary:'Titles should more closely reflect page purpose and search intent.', impact:'Clear titles improve search-result comprehension and relevance.', solution:'Create unique, concise titles for each indexable page.', effort:'low', priority:71, status:'open' },
 { category:'technical', severity:'medium', title:'Non-critical JavaScript blocks useful work', summary:'Third-party work competes with core page interaction.', impact:'Reducing main-thread work can improve responsiveness.', solution:'Defer non-essential scripts and remove unused code paths.', effort:'medium', priority:76, status:'open' },
 { category:'usability', severity:'low', title:'Primary actions could be more obvious', summary:'Several controls share similar visual emphasis.', impact:'Users may hesitate before choosing a next step.', solution:'Use one clear primary action at key decision points.', effort:'low', priority:55, status:'open' },
 { category:'ai', severity:'medium', title:'Important facts should be more structured', summary:'Core content could be expressed more consistently for machines and people.', impact:'Better structure makes important business information easier to interpret.', solution:'Use semantic sections, consistent entities and structured content patterns.', effort:'medium', priority:66, status:'open' }
]
export class MockAuditProvider implements AuditProvider {
 async runAudit(url:string):Promise<AuditResult>{
   await new Promise(r=>setTimeout(r,650))
   if (url.replace(/\/$/, '') === harbourPineAudit.url) {
    return { score: harbourPineAudit.score, scores: harbourPineAudit.scores, issues: harbourPineAudit.issues, durationMs: harbourPineAudit.durationMs, standards: auditStandards.map(standard => standard.name) }
   }
   const issues = issueTemplates.map((issue,i)=>({...issue,id:`generated-${i+1}`}))
  return { score:87, scores:auditScores, issues, durationMs:1480, standards: auditStandards.map(standard => standard.name) }
 }
}
export function scoreCategory(scores:AuditResult['scores'], category:Category){ return scores.find(s=>s.category===category)?.score ?? 0 }
