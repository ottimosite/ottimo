import type { AuditResult, AuditIssue, AuditStandard, Category } from '../types/domain'
import { auditScores } from '../data/mock'
import { harbourPineAudit } from '../data/fixtures/harbourPine'
export interface AuditProvider { runAudit(url:string): Promise<AuditResult> }
export const auditStandards: { name: AuditStandard; description: string }[] = [
  { name: 'WCAG 2.2 AA', description: 'Accessibility signals mapped to perceivable, operable, understandable and robust content.' },
  { name: 'Core Web Vitals', description: 'Performance checks oriented around loading, responsiveness and visual stability.' },
  { name: 'Technical SEO', description: 'Search fundamentals covering page meaning, metadata, crawl paths and mobile readiness.' },
]
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
