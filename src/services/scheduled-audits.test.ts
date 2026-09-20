import { describe, expect, it } from 'vitest'
import type { Audit } from '../types/domain'
import {
  createScheduledAuditRun,
  isScheduledAuditDue,
  nextScheduledAuditRun,
  validateScheduledAudit,
} from './scheduled-audits'

const schedule = {
  id: 'schedule-1',
  tenantId: 'tenant-1',
  websiteId: 'site-1',
  frequency: 'weekly' as const,
  nextRunAt: '2026-09-20T10:00:00.000Z',
  state: 'active' as const,
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-20T09:00:00.000Z',
}

const audit: Audit = {
  id: 'audit-1',
  websiteId: 'site-1',
  url: 'https://example.com/',
  createdAt: '2026-09-20T10:00:00.000Z',
  durationMs: 1,
  score: 80,
  scores: [],
  issues: [],
}

describe('scheduled audits', () => {
  it('validates tenant and website scheduling metadata', () => {
    expect(() => validateScheduledAudit(schedule)).not.toThrow()
    expect(isScheduledAuditDue(schedule, '2026-09-20T10:01:00.000Z')).toBe(true)
    expect(isScheduledAuditDue({ ...schedule, state: 'paused' }, '2026-09-20T10:01:00.000Z')).toBe(false)
  })

  it('calculates deterministic next runs', () => {
    expect(nextScheduledAuditRun(schedule)).toBe('2026-09-27T10:00:00.000Z')
  })

  it('records successful and failed provider execution without fabricating an audit', async () => {
    const success = await createScheduledAuditRun(schedule, async () => audit, '2026-09-20T10:01:00.000Z')
    expect(success).toEqual(expect.objectContaining({
      status: 'completed',
      auditId: 'audit-1',
      scheduleId: 'schedule-1',
      websiteId: 'site-1',
    }))

    const failure = await createScheduledAuditRun(
      schedule,
      async () => { throw new Error('AUDIT_PROVIDER_UNAVAILABLE') },
      '2026-09-20T10:01:00.000Z',
    )
    expect(failure).toEqual(expect.objectContaining({
      status: 'failed',
      errorCode: 'AUDIT_PROVIDER_UNAVAILABLE',
      auditId: undefined,
    }))
  })
})
