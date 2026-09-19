import type { PerformanceMetrics } from '../types/domain'
import type { SearchVisibilityProfile, SocialPresenceProfile, TechnologySignal } from './types'

export interface PerformanceSiteSummary {
  pagesMeasured: number
  lcpMs?: { median: number; worst: number; worstPage?: string }
  fcpMs?: { median: number; worst: number; worstPage?: string }
  ttfbMs?: { median: number; worst: number; worstPage?: string }
  cls?: { median: number; worst: number; worstPage?: string }
  inpMs?: { median: number; worst: number; worstPage?: string }
}

export interface SiteIntelligenceSummary {
  performance: PerformanceSiteSummary
  search: SearchVisibilitySummary
  technology: TechnologySummary
  social: SocialSummary
}

const numericSummary = (values: Array<{ value: number; page: string }>) => {
  if (!values.length) return undefined
  const sorted = [...values].sort((a, b) => a.value - b.value)
  const median = sorted.length % 2
    ? sorted[Math.floor(sorted.length / 2)].value
    : Math.round((sorted[sorted.length / 2 - 1].value + sorted[sorted.length / 2].value) / 2)
  const worst = sorted[sorted.length - 1]
  return { median, worst: worst.value, worstPage: worst.page }
}

export function summarisePerformance(pages: Array<{ url: string; performance?: PerformanceMetrics }>): PerformanceSiteSummary {
  const metric = (key: keyof Pick<PerformanceMetrics, 'lcpMs' | 'fcpMs' | 'ttfbMs' | 'cls' | 'inpMs'>) =>
    numericSummary(pages.flatMap(page => typeof page.performance?.[key] === 'number' ? [{ value: page.performance[key] as number, page: page.url }] : []))
  return {
    pagesMeasured: pages.filter(page => page.performance && Object.values(page.performance).some(value => typeof value === 'number')).length,
    lcpMs: metric('lcpMs'), fcpMs: metric('fcpMs'), ttfbMs: metric('ttfbMs'), cls: metric('cls'), inpMs: metric('inpMs'),
  }
}

export function buildSiteIntelligence(input: {
  pages: Array<{ url: string; performance?: PerformanceMetrics; searchVisibility?: SearchVisibilityProfile; technology?: TechnologySignal[]; socialPresence?: SocialPresenceProfile }>
}): SiteIntelligenceSummary {
  return {
    performance: summarisePerformance(input.pages),
    search: summariseSearchVisibility(input.pages.map(page => page.searchVisibility)),
    technology: summariseTechnology(input.pages.map(page => page.technology)),
    social: summariseSocial(input.pages.map(page => page.socialPresence)),
  }
}

export interface SearchVisibilitySummary {
  pagesMeasured: number
  titleCoverage: number
  metaDescriptionCoverage: number
  canonicalCoverage: number
  openGraphCoverage: number
  twitterCardCoverage: number
  structuredDataPages: number
  pagesWithMultipleH1: number
  indexabilityObserved: 'indexable' | 'blocked' | 'mixed' | 'unavailable'
}

export interface TechnologySummary {
  signals: TechnologySignal[]
  categories: string[]
}

export interface SocialSummary {
  profileCount: number
  shareMetadataPages: number
  socialScriptPages: number
  profiles: string[]
}

const percentage = (count: number, total: number) => total ? Math.round((count / total) * 100) : 0

export function summariseSearchVisibility(profiles: Array<SearchVisibilityProfile | undefined>): SearchVisibilitySummary {
  const measured = profiles.filter(Boolean) as SearchVisibilityProfile[]
  const indexability = measured.map(profile => profile.robotsIndexable)
  const indexabilityObserved = indexability.every(value => value === undefined)
    ? 'unavailable'
    : indexability.every(value => value === true || value === undefined)
      ? 'indexable'
      : indexability.every(value => value === false || value === undefined)
        ? 'blocked'
        : 'mixed'

  return {
    pagesMeasured: measured.length,
    titleCoverage: percentage(measured.filter(profile => profile.titlePresent).length, measured.length),
    metaDescriptionCoverage: percentage(measured.filter(profile => profile.metaDescriptionPresent).length, measured.length),
    canonicalCoverage: percentage(measured.filter(profile => profile.canonicalPresent).length, measured.length),
    openGraphCoverage: percentage(measured.filter(profile => profile.openGraphPresent).length, measured.length),
    twitterCardCoverage: percentage(measured.filter(profile => profile.twitterCardPresent).length, measured.length),
    structuredDataPages: measured.filter(profile => profile.structuredDataCount > 0).length,
    pagesWithMultipleH1: measured.filter(profile => profile.h1Count > 1).length,
    indexabilityObserved,
  }
}

export function summariseTechnology(signals: Array<TechnologySignal[] | undefined>): TechnologySummary {
  const unique = new Map<string, TechnologySignal>()
  for (const pageSignals of signals) {
    if (!pageSignals) continue
    for (const signal of pageSignals) {
      const existing = unique.get(signal.name)
      if (!existing || (existing.confidence === 'low' && signal.confidence !== 'low')) unique.set(signal.name, signal)
    }
  }
  const result = [...unique.values()].sort((a, b) => a.name.localeCompare(b.name))
  return { signals: result, categories: [...new Set(result.map(signal => signal.category))].sort() }
}

export function summariseSocial(profiles: Array<SocialPresenceProfile | undefined>): SocialSummary {
  const measured = profiles.filter(Boolean) as SocialPresenceProfile[]
  const profilesFound = [...new Set(measured.flatMap(profile => profile.profiles))].sort()
  return {
    profileCount: profilesFound.length,
    shareMetadataPages: measured.filter(profile => profile.shareMetadata.length > 0).length,
    socialScriptPages: measured.filter(profile => profile.socialScripts.length > 0).length,
    profiles: profilesFound,
  }
}
