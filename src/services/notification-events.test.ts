import { describe, expect, it, vi } from 'vitest'
import {
  MemoryEventRepository,
  NotificationEventDispatcher,
  createPlatformEventId,
  type AuditChangedEvent,
  type AuditCompletedEvent,
  type PlatformEvent,
} from './notification-events'

const completedEvent = (overrides: Partial<AuditCompletedEvent> = {}): AuditCompletedEvent => ({
  id: createPlatformEventId('audit.completed', 'audit-1', '2026-09-20T12:00:00.000Z'),
  type: 'audit.completed',
  tenantId: 'tenant-1',
  websiteId: 'website-1',
  occurredAt: '2026-09-20T12:00:00.000Z',
  sourceId: 'audit-1',
  payload: {
    auditId: 'audit-1',
    url: 'https://example.com',
    categoriesMeasured: ['performance', 'seo'],
    evidenceStatus: 'measured',
  },
  ...overrides,
})

const changedEvent = (overrides: Partial<AuditChangedEvent> = {}): AuditChangedEvent => ({
  id: createPlatformEventId('audit.changed', 'audit-3', '2026-09-20T14:00:00.000Z'),
  type: 'audit.changed',
  tenantId: 'tenant-1',
  websiteId: 'website-1',
  occurredAt: '2026-09-20T14:00:00.000Z',
  sourceId: 'audit-3',
  payload: {
    auditId: 'audit-3',
    previousAuditId: 'audit-2',
    changeCount: 1,
    changedCategories: ['performance'],
  },
  ...overrides,
})

describe('notification event architecture', () => {
  it('stores and filters tenant and website events without cross-tenant leakage', () => {
    const repository = new MemoryEventRepository()
    repository.append(completedEvent())
    repository.append(completedEvent({
      id: 'audit.completed:audit-2:2026-09-20T13:00:00.000Z',
      sourceId: 'audit-2',
      occurredAt: '2026-09-20T13:00:00.000Z',
      websiteId: 'website-2',
    }))
    repository.append(changedEvent())

    expect(repository.list({ tenantId: 'tenant-1', websiteId: 'website-1' })).toHaveLength(2)
    expect(repository.list({ tenantId: 'tenant-1', websiteId: 'website-1', types: ['audit.changed'] })).toHaveLength(1)
    expect(repository.list({ tenantId: 'tenant-2' })).toHaveLength(0)
  })

  it('rejects duplicate event identifiers', () => {
    const repository = new MemoryEventRepository()
    repository.append(completedEvent())
    expect(() => repository.append(completedEvent())).toThrow('EVENT_ID_ALREADY_EXISTS')
  })

  it('dispatches events to replaceable delivery subscribers', async () => {
    const email = vi.fn()
    const webhook = vi.fn()
    const dispatcher = new NotificationEventDispatcher([
      { channel: 'email', publish: email },
      { channel: 'webhook', publish: webhook },
    ])

    await dispatcher.dispatch(completedEvent())

    expect(email).toHaveBeenCalledWith(expect.objectContaining({ type: 'audit.completed' }))
    expect(webhook).toHaveBeenCalledWith(expect.objectContaining({ type: 'audit.completed' }))
  })

  it('creates deterministic ids from event type, source and occurrence', () => {
    expect(createPlatformEventId('audit.regressed', 'audit-7', '2026-09-20T15:00:00.000Z'))
      .toBe('audit.regressed:audit-7:2026-09-20T15:00:00.000Z')
  })

  it('keeps the event union type available to repository consumers', () => {
    const events: PlatformEvent[] = [completedEvent(), changedEvent()]
    expect(events.map(({ type }) => type)).toEqual(['audit.completed', 'audit.changed'])
  })
})
