export type Category = 'performance' | 'accessibility' | 'seo' | 'usability' | 'technical' | 'ai'
export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type Status = 'open' | 'in_progress' | 'resolved'
export type Effort = 'low' | 'medium' | 'high'
export type AuditStandard = 'WCAG 2.2 AA' | 'Core Web Vitals' | 'Technical SEO'
export type MeasurementStatus = 'measured' | 'inferred' | 'unavailable'

export interface PerformanceMetrics {
  collectionMs?: number
  fetchMs?: number
  htmlParseMs?: number
  firstResponseMs?: number
  fcpMs?: number
  lcpMs?: number
  domContentLoadedMs?: number
  cls?: number
  inpMs?: number
  ttfbMs?: number
  mode: 'browser-fetch' | 'rendered-page' | 'unavailable'
}

export interface TechnologySignal { name: string; category: 'cms' | 'framework' | 'analytics' | 'hosting' | 'cdn' | 'library' | 'commerce'; confidence: 'high' | 'medium' | 'low'; evidence: string }
export interface SearchVisibilityProfile { titlePresent: boolean; titleLength?: number; metaDescriptionPresent: boolean; metaDescriptionLength?: number; canonicalPresent: boolean; h1Count: number; structuredDataCount: number; openGraphPresent: boolean; twitterCardPresent: boolean; sitemapLinked: boolean }
export interface SocialPresenceProfile { profiles: string[]; shareMetadata: string[]; socialScripts: string[] }

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

export interface DiscoverySummary {
  finalUrl: string
  https: boolean
  robotsFound: boolean
  sitemapFound: boolean
  sitemapPageCount?: number
  discoveredPageCount: number
  technologies: string[]
  technologySignals?: TechnologySignal[]
  searchVisibility?: SearchVisibilityProfile
  socialPresence?: SocialPresenceProfile
}

export interface ActionVerification {
  actionId: string
  status: 'verified' | 'failed' | 'inconclusive'
  verifiedAt: string
  previousAuditId: string
  currentAuditId: string
  evidence: string
  affectedPages: string[]
}

export interface AuditComparison {
  previousAuditId: string
  previousCreatedAt: string
  comparedAt: string
  changes: Array<{
    type: 'resolved' | 'new' | 'improved' | 'regressed' | 'unchanged'
    fingerprint: string
    title: string
    category: Category
    previousSeverity?: Severity
    currentSeverity?: Severity
    previousScore?: number
    currentScore?: number
    affectedPages: string[]
  }>
  resolved: number
  newFindings: number
  improved: number
  regressed: number
  unchanged: number
}

export interface WebsiteHealthModel {\n  version: string\n  generatedAt: string\n  websiteUrl: string\n  pages: Array<{ url: string; archetype: string; title?: string; observations: Array<{ id: string; kind: string; value?: string | number | boolean; unit?: string; status: MeasurementStatus; pageUrl?: string; provenance: { source: string; observedAt: string; sourceId?: string; confidence?: 'high' | 'medium' | 'low'; description?: string } }>; issueIds: string[]; actionIds: string[] }>\n  journeys: Array<{ id: string; name: string; pageUrls: string[]; issueIds: string[]; actionIds: string[]; confidence: 'high' | 'medium' | 'low'; rationale: string }>\n  observations: Array<{ id: string; kind: string; value?: string | number | boolean; unit?: string; status: MeasurementStatus; pageUrl?: string; provenance: { source: string; observedAt: string; sourceId?: string; confidence?: 'high' | 'medium' | 'low'; description?: string } }>\n  issueCount: number\n  actionCount: number\n  categoryCoverage: Record<Category, 'measured' | 'partial' | 'unavailable'>\n}\n\nexport interface Website {
  id: string
  name: string
  url: string
  createdAt: string
  lastAuditId?: string
}

export interface AuditHealthSummary { score?: number; status: 'good' | 'needs-improvement' | 'needs-attention' | 'not-measured'; measuredCategories: Category[]; excludedCategories: Category[]; checks: number; passed: number; failed: number; unavailable: number; methodology: string }

export interface AuditScore {
  category: Category
  score?: number
  previous?: number
  measurement?: MeasurementStatus
}

export interface AuditEvidence {
  status: MeasurementStatus
  value?: string | number | boolean
  unit?: string
  source?: string
  observedAt?: string
  details?: string
}

export interface AuditIssue {
  id: string
  category: Category
  severity: Severity
  title: string
  summary: string
  impact: string
  solution: string
  effort: Effort
  priority: number
  status: Status
  standards?: AuditStandard[]
  criterion?: string
  evidence?: AuditEvidence
  confidence?: 'high' | 'medium' | 'low'
  affectedPages?: string[]
  affectedResources?: string[]
  occurrenceCount?: number
  evidenceCount?: number
  fingerprint?: string
}

export interface ActionImpactSummary {
  critical: number
  high: number
  medium: number
  low: number
}

export interface ActionDependency {
  id: string
  description: string
  blocking: boolean
}

export interface VerificationCriterion {
  description: string
  affectedPages: string[]
}

export interface OptimizationAction {
  id: string
  issueId: string
  title: string
  category: Category
  severity: Severity
  impact: 'critical' | 'high' | 'medium' | 'low'
  confidence: 'high' | 'medium' | 'low'
  effort: Effort
  priorityScore: number
  status: Status
  affectedPages: string[]
  affectedResources: string[]
  evidenceCount: number
  dependencies: ActionDependency[]
  implementationSteps: string[]
  verification: VerificationCriterion[]
  expectedOutcome: string
}

export interface Audit {
  health?: AuditHealthSummary
  id: string
  websiteId: string
  url: string
  createdAt: string
  score?: number
  durationMs: number
  scores: AuditScore[]
  issues: AuditIssue[]
  actions?: OptimizationAction[]
  stats?: AuditStats
  standards?: AuditStandard[]
  diagnostics?: { code: string; stage: string; message: string; technicalDetails?: string; targetUrl?: string; pageUrl?: string; retryable: boolean }
}

export interface AuditStats {
  htmlBytes?: number
  imageCount?: number
  linkCount?: number
  externalLinkCount?: number
  headingCount?: number
  scriptCount?: number
  formCount?: number
  buttonCount?: number
  wordCount?: number
  title?: string
  language?: string
  screenshotUrl?: string
  screenshotMode?: 'full-page' | 'viewport'
  pageScope?: 'single-page' | 'site-crawl'
  performance?: PerformanceMetrics
  discovery?: DiscoverySummary
  source: 'live' | 'local'
  technologySignals?: TechnologySignal[]
  searchVisibility?: SearchVisibilityProfile
  socialPresence?: SocialPresenceProfile
}

export interface Recommendation extends AuditIssue {
  auditId: string
  websiteId: string
}

export interface Report {
  id: string
  auditId: string
  createdAt: string
  title: string
}

export interface Project {
  id: string
  name: string
  websiteIds: string[]
}

export interface User {
  id: string
  name: string
  email: string
}

export interface AuditResult {
  health?: AuditHealthSummary
  score?: number
  scores: AuditScore[]
  issues: AuditIssue[]
  actions?: OptimizationAction[]
  durationMs: number
  stats?: AuditStats
  standards?: AuditStandard[]
  diagnostics?: { code: string; stage: string; message: string; technicalDetails?: string; targetUrl?: string; pageUrl?: string; retryable: boolean }
}
