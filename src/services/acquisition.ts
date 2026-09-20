export type AcquisitionProvider = 'search-console' | 'analytics' | 'social'
export type IntegrationState = 'connected' | 'disconnected' | 'stale' | 'partial' | 'unavailable' | 'error'
export type AcquisitionMetric = 'impressions' | 'clicks' | 'ctr' | 'sessions' | 'conversions' | 'reach' | 'social-clicks'
export type AcquisitionConfidence = 'high' | 'medium' | 'low'

export interface IntegrationProvenance {
  provider: AcquisitionProvider
  sourceId: string
  observedAt: string
  retrievedAt: string
  sourceUrl?: string
  accountLabel?: string
}

export interface IntegrationStatus {
  provider: AcquisitionProvider
  state: IntegrationState
  connectedAt?: string
  lastSuccessfulSyncAt?: string
  message?: string
}

export interface AcquisitionObservation {
  id: string
  provider: AcquisitionProvider
  metric: AcquisitionMetric
  value: number
  unit: 'count' | 'ratio'
  periodStart: string
  periodEnd: string
  pageUrl?: string
  query?: string
  socialNetwork?: string
  provenance: IntegrationProvenance
  confidence: AcquisitionConfidence
}

export interface AcquisitionMetricAvailability {
  metric: AcquisitionMetric
  status: 'measured' | 'unavailable' | 'stale' | 'partial'
  reason?: string
  provenance?: IntegrationProvenance
}

export interface PageIdentityMatch {
  sourceUrl: string
  auditUrl: string
  method: 'exact-url' | 'normalised-url'
  confidence: 'high' | 'medium'
}

export interface AcquisitionJourney {
  id: string
  pageUrl: string
  observations: string[]
  links: Array<'search' | 'landing-page' | 'conversion' | 'social'>
  confidence: AcquisitionConfidence
  rationale: string
}

export interface AcquisitionSnapshot {
  generatedAt: string
  statuses: IntegrationStatus[]
  observations: AcquisitionObservation[]
  availability: AcquisitionMetricAvailability[]
  pageMatches: PageIdentityMatch[]
  journeys: AcquisitionJourney[]
}

export interface AcquisitionProviderClient {
  readonly provider: AcquisitionProvider
  getStatus(): Promise<IntegrationStatus>
  fetchObservations(input: {
    websiteUrl: string
    pageUrls: string[]
    periodStart: string
    periodEnd: string
  }): Promise<AcquisitionObservation[]>
}

const normaliseUrl = (value: string) => {
  const url = new URL(value)
  url.hash = ''
  if (url.pathname !== '/' && url.pathname.endsWith('/')) url.pathname = url.pathname.slice(0, -1)
  return url.href
}

export function matchAcquisitionPage(sourceUrl: string, auditedUrls: string[]): PageIdentityMatch | undefined {
  try {
    const source = normaliseUrl(sourceUrl)
    const exact = auditedUrls.find(url => url === sourceUrl)
    if (exact) return { sourceUrl, auditUrl: exact, method: 'exact-url', confidence: 'high' }
    const normalised = auditedUrls.find(url => normaliseUrl(url) === source)
    return normalised
      ? { sourceUrl, auditUrl: normalised, method: 'normalised-url', confidence: 'medium' }
      : undefined
  } catch {
    return undefined
  }
}

export function createAcquisitionSnapshot(input: {
  statuses: IntegrationStatus[]
  observations: AcquisitionObservation[]
  auditedUrls: string[]
  generatedAt: string
}): AcquisitionSnapshot {
  const pageMatches = input.observations.flatMap(observation =>
    observation.pageUrl
      ? [matchAcquisitionPage(observation.pageUrl, input.auditedUrls)].filter((match): match is PageIdentityMatch => Boolean(match))
      : [],
  )

  const availability = (['impressions', 'clicks', 'ctr', 'sessions', 'conversions', 'reach', 'social-clicks'] as AcquisitionMetric[]).map(metric => {
    const relevant = input.observations.filter(observation => observation.metric === metric)
    if (!relevant.length) return { metric, status: 'unavailable' as const, reason: 'No imported provider observation exists for this metric.' }
    const stale = relevant.some(observation => Date.now() - new Date(observation.provenance.observedAt).getTime() > 1000 * 60 * 60 * 24 * 7)
    return stale
      ? { metric, status: 'stale' as const, reason: 'Imported observation is older than the seven-day freshness window.', provenance: relevant[0].provenance }
      : { metric, status: relevant.length > 1 ? 'partial' as const : 'measured' as const, provenance: relevant[0].provenance }
  })

  return {
    generatedAt: input.generatedAt,
    statuses: input.statuses,
    observations: input.observations,
    availability,
    pageMatches: [...new Map(pageMatches.map(match => [match.sourceUrl + '|' + match.auditUrl, match])).values()],
    journeys: [],
  }
}

export function acquisitionDataIsUsable(status: IntegrationStatus): boolean {
  return status.state === 'connected' || status.state === 'partial' || status.state === 'stale'
}
