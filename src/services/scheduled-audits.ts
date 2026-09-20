import type { Audit } from '../types/domain'

export type ScheduledAuditFrequency = 'daily' | 'weekly' | 'monthly'

export type ScheduledAuditState = 'active' | 'paused'

export interface ScheduledAudit {
  id: string
  tenantId: string
  websiteId: string
  frequency: ScheduledAuditFrequency
  nextRunAt: string
  state: ScheduledAuditState
  createdAt: string
  updatedAt: string
}

export interface ScheduledAuditRun {
  scheduleId: string
  websiteId: string
  startedAt: string
  completedAt?: string
  status: 'completed' | 'failed'
  auditId?: string
  errorCode?: 'AUDIT_PROVIDER_UNAVAILABLE' | 'AUDIT_EXECUTION_FAILED'
}

export interface ScheduledAuditRunner {
  run(input: {
    schedule: ScheduledAudit
    audit: () => Promise<Audit>
    now: string
  }): Promise<ScheduledAuditRun>
}

const frequencyMs: Record<ScheduledAuditFrequency, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
}

export function validateScheduledAudit(schedule: ScheduledAudit): void {
  if (!schedule.id || !schedule.tenantId || !schedule.websiteId) {
    throw new Error('SCHEDULED_AUDIT_INVALID_IDENTITY')
  }

  if (!Number.isFinite(Date.parse(schedule.nextRunAt)) || !Number.isFinite(Date.parse(schedule.createdAt)) || !Number.isFinite(Date.parse(schedule.updatedAt))) {
    throw new Error('SCHEDULED_AUDIT_INVALID_TIMESTAMP')
  }

  if (!(schedule.frequency in frequencyMs)) {
    throw new Error('SCHEDULED_AUDIT_INVALID_FREQUENCY')
  }
}

export function isScheduledAuditDue(schedule: ScheduledAudit, now: string): boolean {
  validateScheduledAudit(schedule)
  return schedule.state === 'active' && Date.parse(schedule.nextRunAt) <= Date.parse(now)
}

export function nextScheduledAuditRun(schedule: ScheduledAudit, from = schedule.nextRunAt): string {
  validateScheduledAudit(schedule)
  return new Date(Date.parse(from) + frequencyMs[schedule.frequency]).toISOString()
}

export function createScheduledAuditRun(
  schedule: ScheduledAudit,
  audit: () => Promise<Audit>,
  now: string,
): Promise<ScheduledAuditRun> {
  validateScheduledAudit(schedule)

  return audit()
    .then(result => ({
      scheduleId: schedule.id,
      websiteId: schedule.websiteId,
      startedAt: now,
      completedAt: new Date().toISOString(),
      status: 'completed' as const,
      auditId: result.id,
    }))
    .catch(error => ({
      scheduleId: schedule.id,
      websiteId: schedule.websiteId,
      startedAt: now,
      completedAt: new Date().toISOString(),
      status: 'failed' as const,
      errorCode: error instanceof Error && error.message === 'AUDIT_PROVIDER_UNAVAILABLE'
        ? 'AUDIT_PROVIDER_UNAVAILABLE' as const
        : 'AUDIT_EXECUTION_FAILED' as const,
    }))
}

export function createScheduledAuditRunner(): ScheduledAuditRunner {
  return {
    run: ({ schedule, audit, now }) => createScheduledAuditRun(schedule, audit, now),
  }
}
