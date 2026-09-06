import type { Audit, AuditIssue, AuditScore, Website } from '../types/domain'
import { kingdomCoffeeAudit, kingdomCoffeeWebsite } from './fixtures/kingdomCoffee'

export const categoryLabels = { performance:'Performance', accessibility:'Accessibility', seo:'SEO', usability:'Usability', technical:'Technical', ai:'AI readiness' } as const
export const seedWebsites: Website[] = [
  kingdomCoffeeWebsite,
  { id:'site-1', name:'Demo Business', url:'https://example.com', createdAt:'2026-08-30T10:00:00Z', lastAuditId:'audit-3' },
  { id:'site-2', name:'Ottimo Labs', url:'https://ottimo.test', createdAt:'2026-08-31T12:00:00Z', lastAuditId:'audit-2' }
]
const baseIssues: AuditIssue[] = [
  { id:'issue-1', category:'performance', severity:'high', title:'Largest image is not efficiently delivered', summary:'The primary visual is heavier than necessary and can delay LCP.', impact:'Visitors wait longer for the main content to appear, especially on mobile networks.', solution:'Serve a responsive AVIF/WebP image, reserve its dimensions, and preload only the critical asset.', effort:'low', priority:92, status:'open' },
  { id:'issue-2', category:'accessibility', severity:'high', title:'Form controls need programmatic labels', summary:'Two inputs rely on nearby text instead of explicit labels.', impact:'Screen-reader users may not understand what information each field requires.', solution:'Associate every form control with a visible label using for/id or an equivalent accessible name.', effort:'low', priority:88, status:'open' },
  { id:'issue-3', category:'seo', severity:'medium', title:'Several pages have weak title tags', summary:'Titles are duplicated or too generic across key pages.', impact:'Search engines and users get less useful context for choosing a result.', solution:'Write unique, descriptive titles aligned to each page intent.', effort:'low', priority:71, status:'in_progress' },
  { id:'issue-4', category:'technical', severity:'medium', title:'Third-party scripts add unnecessary main-thread work', summary:'Non-critical scripts run before the main content is interactive.', impact:'Extra JavaScript can reduce responsiveness and increase INP.', solution:'Defer non-critical scripts and load only the capabilities that are actually used.', effort:'medium', priority:76, status:'open' },
  { id:'issue-5', category:'usability', severity:'low', title:'Primary action is visually competing with secondary links', summary:'The page has multiple controls with similar visual weight.', impact:'Users take longer to identify the intended next step.', solution:'Strengthen one primary action per decision point and reduce secondary contrast.', effort:'low', priority:55, status:'resolved' },
  { id:'issue-6', category:'ai', severity:'medium', title:'Content structure is difficult for machine interpretation', summary:'Important business facts are presented inconsistently.', impact:'AI systems and assistive tools have less reliable access to key facts.', solution:'Use structured, semantic content and consistent entity terminology.', effort:'medium', priority:66, status:'open' }
]
export const auditScores: AuditScore[] = [
  { category:'performance', score:91, previous:87 }, { category:'accessibility', score:84, previous:80 }, { category:'seo', score:89, previous:86 }, { category:'usability', score:86, previous:82 }, { category:'technical', score:90, previous:85 }, { category:'ai', score:81, previous:76 }
]
export const seedAudits: Audit[] = [
  { id:'audit-1', websiteId:'site-1', url:'https://example.com', createdAt:'2026-08-20T09:15:00Z', score:78, durationMs:1840, scores:auditScores.map((s,i)=>({...s,score:Math.max(70,s.score-9+i)})), issues:baseIssues.map(i=>({...i,status:i.status==='resolved'?'resolved':'open'})) },
  { id:'audit-2', websiteId:'site-2', url:'https://ottimo.test', createdAt:'2026-08-29T13:40:00Z', score:83, durationMs:1720, scores:auditScores.map((s,i)=>({...s,score:Math.max(75,s.score-4+i%2)})), issues:baseIssues.slice(0,5).map(i=>({...i,id:`a2-${i.id}`})) },
  { id:'audit-3', websiteId:'site-1', url:'https://example.com', createdAt:'2026-09-05T16:30:00Z', score:87, durationMs:1510, scores:auditScores, issues:baseIssues },
  kingdomCoffeeAudit
]
