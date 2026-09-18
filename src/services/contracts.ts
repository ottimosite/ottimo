import type { AuditResult, Category } from '../types/domain'

export type AuditPhase =
  | 'queued'
  | 'discovering'
  | 'auditing'
  | 'analysing'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface AuditRequest {
  url: string
  categories?: Category[]
  maxPages?: number
}

export interface AuditProgress {
  phase: AuditPhase
  message: string
  completedSteps: number
  totalSteps: number
}

export interface AuditProviderContext {
  onProgress?: (progress: AuditProgress) => void
  signal?: AbortSignal
}

export interface AuditProviderV2 {
  run(request: AuditRequest, context?: AuditProviderContext): Promise<AuditResult>
}
