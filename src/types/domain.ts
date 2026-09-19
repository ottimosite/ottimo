export type Category = 'performance' | 'accessibility' | 'seo' | 'usability' | 'technical' | 'ai'
export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type Status = 'open' | 'in_progress' | 'resolved'
export type Effort = 'low' | 'medium' | 'high'
export type AuditStandard = 'WCAG 2.2 AA' | 'Core Web Vitals' | 'Technical SEO'
export type MeasurementStatus = 'measured' | 'inferred' | 'unavailable'

export interface PerformanceMetrics {
  fetchMs?: number
  htmlParseMs?: number
  firstResponseMs?: number
  fcpMs?: number
  lcpMs?: number
  cls?: number
  inpMs?: number
  ttfbMs?: number
  mode: 'browser-fetch' | 'rendered-page' | 'unavailable'
}

export interface DiscoverySummary {
  finalUrl: string
  https: boolean
  robotsFound: boolean
  sitemapFound: boolean
  sitemapPageCount?: number
  discoveredPageCount: number
  technologies: string[]
}

export interface Website {
  id: string
  name: string
  url: string
  createdAt: string
  lastAuditId?: string
}

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
}

export interface Audit {
  id: string
  websiteId: string
  url: string
  createdAt: string
  score: number
  durationMs: number
  scores: AuditScore[]
  issues: AuditIssue[]
  stats?: AuditStats
  standards?: AuditStandard[]
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
  score?: number
  scores: AuditScore[]
  issues: AuditIssue[]
  durationMs: number
  stats?: AuditStats
  standards?: AuditStandard[]
}
