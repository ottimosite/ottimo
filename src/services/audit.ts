import type { AuditResult, AuditStandard, Category } from '../types/domain'
import { wikipediaAudit } from '../data/fixtures/wikipedia'

export interface AuditProvider { runAudit(url:string): Promise<AuditResult> }

export const auditStandards: { name: AuditStandard; description: string }[] = [
  { name: 'WCAG 2.2 AA', description: 'Accessibility signals mapped to perceivable, operable, understandable and robust content.' },
  { name: 'Core Web Vitals', description: 'Performance checks oriented around loading, responsiveness and visual stability.' },
  { name: 'Technical SEO', description: 'Search fundamentals covering page meaning, metadata, crawl paths and mobile readiness.' },
]

export class MockAuditProvider implements AuditProvider {
  async runAudit(url:string):Promise<AuditResult> {
    await new Promise(resolve => setTimeout(resolve, 650))
    if (url.replace(/\/$/, '') === wikipediaAudit.url.replace(/\/$/, '')) {
      return {
        score: wikipediaAudit.score,
        scores: wikipediaAudit.scores,
        issues: wikipediaAudit.issues,
        durationMs: wikipediaAudit.durationMs,
        stats: wikipediaAudit.stats,
        standards: auditStandards.map(standard => standard.name),
      }
    }

    return {
      score: undefined,
      scores: [
            { category: 'performance', measurement: 'unavailable' },
            { category: 'accessibility', measurement: 'unavailable' },
            { category: 'seo', measurement: 'unavailable' },
            { category: 'usability', measurement: 'unavailable' },
            { category: 'technical', measurement: 'unavailable' },
            { category: 'ai', measurement: 'unavailable' },
          ],
      issues: [],
      durationMs: 0,
      standards: auditStandards.map(standard => standard.name),
    }
  }
}

export function scoreCategory(scores:AuditResult['scores'], category:Category){ return scores.find(s=>s.category===category)?.score ?? 0 }
