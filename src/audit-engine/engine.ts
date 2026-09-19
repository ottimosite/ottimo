import { PlaywrightPageCollector, type PageCollector } from './collector'
import { AuditSecurityError } from './security'
import { runAuditRules } from './rules'
import type { AuditCheck, AuditErrorCode, AuditEvidence, AuditFinding, AuditMeasurement, AuditReport, AuditRequest } from './types'

export const AUDIT_ENGINE_VERSION = '0.1.0'

const errorCode = (error: unknown): AuditErrorCode => {
  if (error instanceof AuditSecurityError) return 'security_blocked'
  if (error instanceof Error && /timeout/i.test(error.message)) return 'timeout'
  if (error instanceof Error && /HTTP [45][0-9][0-9]/i.test(error.message)) return 'http_error'
  if (error instanceof Error && /browser|chromium|page/i.test(error.message)) return 'browser_error'
  return 'audit_failed'
}

export class AuditEngine {
  constructor(private readonly collector: PageCollector = new PlaywrightPageCollector()) {}

  async audit(request: AuditRequest): Promise<AuditReport> {
    const startedAt = new Date().toISOString()
    const started = performance.now()
    const runId = crypto.randomUUID()

    try {
      const page = await this.collector.collect(request)
      const evidence: AuditEvidence[] = []
      const measurements: AuditMeasurement[] = []
      const checks: AuditCheck[] = []
      const findings: AuditFinding[] = []
      runAuditRules(
        { page, evidence, measurements, checks, findings },
        request.categories ?? ['performance', 'accessibility', 'seo', 'technical'],
      )
      return {
        engineVersion: AUDIT_ENGINE_VERSION,
        run: { id: runId, status: 'completed', startedAt, completedAt: new Date().toISOString(), durationMs: Math.round(performance.now() - started) },
        page,
        evidence,
        measurements,
        checks,
        findings,
      }
    } catch (error) {
      return {
        engineVersion: AUDIT_ENGINE_VERSION,
        run: { id: runId, status: 'failed', startedAt, completedAt: new Date().toISOString(), durationMs: Math.round(performance.now() - started) },
        evidence: [],
        measurements: [],
        checks: [],
        findings: [],
        error: {
          code: errorCode(error),
          message: error instanceof Error ? error.message : 'Audit failed.',
          recoverable: true,
        },
      }
    }
  }
}
