import type { Audit, AuditScore, Website } from '../types/domain'
import { wikipediaAudit, wikipediaWebsite } from './fixtures/wikipedia'

export const categoryLabels = { performance:'Performance', accessibility:'Accessibility', seo:'SEO', usability:'Usability', technical:'Technical', ai:'AI readiness' } as const

export const seedWebsites: Website[] = [wikipediaWebsite]

export const seedAudits: Audit[] = [wikipediaAudit]

export const auditScores: AuditScore[] = wikipediaAudit.scores
