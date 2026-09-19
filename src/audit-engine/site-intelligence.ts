import type { SearchVisibilityProfile, SocialPresenceProfile, TechnologySignal } from './types'

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

export function summariseTechnology(signals: Array<TechnologySignal | undefined>): TechnologySummary {
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
