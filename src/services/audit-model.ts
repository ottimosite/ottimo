import type { AuditIssue, AuditResult, AuditScore, AuditStandard, Category, MeasurementStatus } from '../types/domain'

export type AuditRunPhase = 'queued' | 'discovering' | 'auditing' | 'analysing' | 'completed' | 'failed' | 'cancelled'
export type AuditRunStatus = 'pending' | 'running' | 'partial' | 'completed' | 'failed' | 'cancelled'

export interface AuditRun {
  id: string
  url: string
  startedAt: string
  completedAt?: string
  phase: AuditRunPhase
  status: AuditRunStatus
  categories?: Category[]
  maxPages?: number
  discovery?: SiteDiscovery
  pages: AuditPage[]
  evidence: AuditEvidenceRecord[]
  checks: AuditCheckResult[]
  findings: AuditFinding[]
  measurements: AuditMeasurement[]
  error?: AuditRunError
}

export interface SiteDiscovery {
  requestedUrl: string
  finalUrl?: string
  reachable: boolean
  https?: boolean
  robotsFound?: boolean
  sitemapFound?: boolean
  sitemapPageCount?: number
  discoveredPageCount: number
  technologies: string[]
}

export interface AuditPage {
  id: string
  url: string
  status: 'discovered' | 'queued' | 'auditing' | 'audited' | 'failed' | 'skipped'
  httpStatus?: number
  contentType?: string
  title?: string
  canonicalUrl?: string
  wordCount?: number
}

export interface AuditEvidenceRecord {
  id: string
  auditRunId: string
  pageId?: string
  checkId: string
  observedAt: string
  source: 'browser-fetch' | 'rendered-browser' | 'discovery' | 'fixture' | 'manual'
  value?: string | number | boolean | null
  expected?: string
  selector?: string
  resource?: string
  details?: string
  measurement: MeasurementStatus
}

export interface AuditMeasurement {
  id: string
  auditRunId: string
  pageId?: string
  metric: string
  value?: number
  unit?: string
  status: MeasurementStatus
  source?: string
  evidenceIds: string[]
}

export interface AuditCheckResult {
  id: string
  auditRunId: string
  pageId?: string
  category: Category
  criterion: string
  status: 'pass' | 'fail' | 'not_applicable' | 'unavailable'
  evidenceIds: string[]
  confidence: 'high' | 'medium' | 'low'
  message?: string
}

export interface AuditFinding {
  id: string
  auditRunId: string
  category: Category
  criterion?: string
  severity: AuditIssue['severity']
  title: string
  summary: string
  evidenceIds: string[]
  impact: string
  recommendation: string
  remediation: string
  scope: 'site' | 'page' | 'resource'
  affectedPages: string[]
  confidence: 'high' | 'medium' | 'low'
  measurement: MeasurementStatus
}

export interface AuditRunError {
  code: string
  message: string
  phase: AuditRunPhase
  recoverable: boolean
}

const stableId = (...parts: string[]) => parts.map(part => encodeURIComponent(part)).join(':')

export const evidence = (input: Omit<AuditEvidenceRecord, 'id'>): AuditEvidenceRecord => ({
  ...input,
  id: stableId(input.auditRunId, input.pageId ?? 'site', input.checkId, input.observedAt),
})

export const measurement = (input: Omit<AuditMeasurement, 'id'>): AuditMeasurement => ({
  ...input,
  id: stableId(input.auditRunId, input.pageId ?? 'site', input.metric),
})

export const check = (input: Omit<AuditCheckResult, 'id'>): AuditCheckResult => ({
  ...input,
  id: stableId(input.auditRunId, input.pageId ?? 'site', input.criterion),
})

export const finding = (input: Omit<AuditFinding, 'id'>): AuditFinding => ({
  ...input,
  id: stableId(input.auditRunId, input.affectedPages[0] ?? 'site', input.category, input.title),
})

export interface AuditEvidenceBundle {
  scores: AuditScore[]
  issues: AuditIssue[]
  standards: AuditStandard[]
  evidence: AuditEvidenceRecord[]
  checks: AuditCheckResult[]
  findings: AuditFinding[]
  measurements: AuditMeasurement[]
}
