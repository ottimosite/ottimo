import type { AuditIssue, AuditStats, Category, OptimizationAction } from '../types/domain'
import type { SiteIntelligenceSummary } from './site-intelligence'

export type PageArchetype = 'homepage' | 'landing' | 'product' | 'service' | 'category' | 'article' | 'contact' | 'utility' | 'unknown'

export interface Provenance {
  source: 'browser' | 'rule' | 'integration' | 'user' | 'derived'
  observedAt: string
  sourceId?: string
  confidence?: 'high' | 'medium' | 'low'
  description?: string
}

export interface Observation {
  id: string
  kind: string
  value?: string | number | boolean
  unit?: string
  status: 'measured' | 'inferred' | 'unavailable'
  provenance: Provenance
  pageUrl?: string
}

export interface PageHealth {
  url: string
  archetype: PageArchetype
  title?: string
  observations: Observation[]
  issueIds: string[]
  actionIds: string[]
}

export interface Journey {
  id: string
  name: string
  pageUrls: string[]
  issueIds: string[]
  actionIds: string[]
  confidence: 'high' | 'medium' | 'low'
  rationale: string
}

export interface WebsiteHealthModel {
  version: string
  generatedAt: string
  websiteUrl: string
  pages: PageHealth[]
  journeys: Journey[]
  observations: Observation[]
  issueCount: number
  actionCount: number
  categoryCoverage: Record<Category, 'measured' | 'partial' | 'unavailable'>
  siteIntelligence: SiteIntelligenceSummary
}

const normalisePath = (url: string) => {
  try {
    return new URL(url).pathname.replace(/\/$/, '') || '/'
  } catch {
    return url
  }
}

export function inferPageArchetype(url: string, title = ''): PageArchetype {
  const path = normalisePath(url).toLowerCase()
  const text = `${path} ${title}`.toLowerCase()

  if (path === '/') return 'homepage'
  if (/contact|enquir|quote|book|signup|sign-up|register|login/.test(text)) return 'contact'
  if (/blog|article|news|journal|guide|insight/.test(text)) return 'article'
  if (/product|item|sku|shop\//.test(text)) return 'product'
  if (/service|services|solution|solutions/.test(text)) return 'service'
  if (/category|categories|collection|collections|products$/.test(text)) return 'category'
  if (/landing|campaign|offer|promo/.test(text)) return 'landing'
  if (/privacy|terms|cookie|sitemap|robots|search/.test(text)) return 'utility'
  return 'unknown'
}

function categoryCoverage(
  pages: Array<{ measuredCategories?: Category[] }>,
  issues: AuditIssue[],
): WebsiteHealthModel['categoryCoverage'] {
  const categories: Category[] = ['performance', 'accessibility', 'seo', 'usability', 'technical', 'ai']
  const measured = new Set(pages.flatMap(page => page.measuredCategories ?? []))

  return Object.fromEntries(categories.map(category => {
    const hasMeasurement = measured.has(category)
    const hasIssue = issues.some(issue => issue.category === category)
    return [category, hasMeasurement ? (hasIssue ? 'partial' : 'measured') : hasIssue ? 'partial' : 'unavailable']
  })) as WebsiteHealthModel['categoryCoverage']
}

function journeyForPages(pages: PageHealth[], issues: AuditIssue[], actions: OptimizationAction[]): Journey[] {
  const candidates = [
    { id: 'discovery-to-contact', name: 'Discovery → enquiry', types: new Set<PageArchetype>(['homepage', 'landing', 'service', 'contact']) },
    { id: 'content-discovery', name: 'Search/content discovery', types: new Set<PageArchetype>(['homepage', 'category', 'article', 'service']) },
    { id: 'commerce', name: 'Browse → purchase', types: new Set<PageArchetype>(['homepage', 'category', 'product', 'contact']) },
  ]

  return candidates.map(candidate => {
    const selected = pages.filter(page => candidate.types.has(page.archetype))
    const urls = new Set(selected.map(page => page.url))
    const issueIds = issues.filter(issue => (issue.affectedPages ?? []).some(url => urls.has(url))).map(issue => issue.id)
    const actionIds = actions.filter(action => action.affectedPages.some(url => urls.has(url))).map(action => action.id)
    return {
      id: candidate.id,
      name: candidate.name,
      pageUrls: selected.map(page => page.url),
      issueIds: [...new Set(issueIds)],
      actionIds: [...new Set(actionIds)],
      confidence: (selected.length >= 2 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      rationale: selected.length
        ? 'Inferred from observed URL structure and page archetypes; no conversion analytics are assumed.'
        : 'No matching page archetypes were observed.',
    }
  }).filter(journey => journey.pageUrls.length)
}

export function buildWebsiteHealthModel(input: {
  websiteUrl: string
  pages: Array<{ url: string; title?: string; stats?: AuditStats; measuredCategories?: Category[] }>
  issues: AuditIssue[]
  actions: OptimizationAction[]
  generatedAt?: string
  siteIntelligence: SiteIntelligenceSummary
}): WebsiteHealthModel {
  const generatedAt = input.generatedAt ?? new Date().toISOString()
  const pageHealth = input.pages.map(page => {
    const observations: Observation[] = []
    if (page.stats?.performance?.lcpMs !== undefined) {
      observations.push({
        id: `obs-${encodeURIComponent(page.url)}-lcp`,
        kind: 'performance.lcp',
        value: page.stats.performance.lcpMs,
        unit: 'ms',
        status: 'measured',
        pageUrl: page.url,
        provenance: { source: 'browser', observedAt: generatedAt, confidence: 'high', description: 'Browser-rendered performance measurement.' },
      })
    }
    if (page.stats?.searchVisibility) {
      observations.push({
        id: `obs-${encodeURIComponent(page.url)}-search`,
        kind: 'search.readiness',
        value: page.stats.searchVisibility.titlePresent,
        status: 'measured',
        pageUrl: page.url,
        provenance: { source: 'browser', observedAt: generatedAt, confidence: 'high', description: 'Rendered document metadata and structure.' },
      })
    }

    const issueIds = input.issues.filter(issue => (issue.affectedPages ?? []).includes(page.url)).map(issue => issue.id)
    const actionIds = input.actions.filter(action => action.affectedPages.includes(page.url)).map(action => action.id)

    return {
      url: page.url,
      archetype: inferPageArchetype(page.url, page.title),
      title: page.title,
      observations,
      issueIds,
      actionIds,
    }
  })

  const observations = pageHealth.flatMap(page => page.observations)
  return {
    version: '2.1.0',
    generatedAt,
    websiteUrl: input.websiteUrl,
    pages: pageHealth,
    journeys: journeyForPages(pageHealth, input.issues, input.actions),
    observations,
    issueCount: input.issues.length,
    actionCount: input.actions.length,
    categoryCoverage: categoryCoverage(input.pages, input.issues),
    siteIntelligence: input.siteIntelligence,
  }
}
