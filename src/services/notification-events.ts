import type { Category, MeasurementStatus } from '../types/domain'

export type PlatformEventType =
  | 'audit.completed'
  | 'audit.changed'
  | 'audit.regressed'
  | 'verification.completed'

export type EventDeliveryChannel = 'email' | 'slack' | 'webhook'

export interface PlatformEventBase {
  id: string
  type: PlatformEventType
  tenantId: string
  websiteId: string
  occurredAt: string
  sourceId?: string
  metadata?: Record<string, string>
}

export interface AuditCompletedEvent extends PlatformEventBase {
  type: 'audit.completed'
  payload: {
    auditId: string
    url: string
    categoriesMeasured: Category[]
    evidenceStatus: MeasurementStatus
  }
}

export interface AuditChangedEvent extends PlatformEventBase {
  type: 'audit.changed'
  payload: {
    auditId: string
    previousAuditId: string
    changeCount: number
    changedCategories: Category[]
  }
}

export interface AuditRegressedEvent extends PlatformEventBase {
  type: 'audit.regressed'
  payload: {
    auditId: string
    previousAuditId: string
    regressionCount: number
    categories: Category[]
    highestSeverity: 'low' | 'medium' | 'high'
  }
}

export interface VerificationCompletedEvent extends PlatformEventBase {
  type: 'verification.completed'
  payload: {
    actionId: string
    previousAuditId: string
    currentAuditId: string
    status: 'verified' | 'failed' | 'inconclusive'
    evidenceStatus: MeasurementStatus
  }
}

export type PlatformEvent =
  | AuditCompletedEvent
  | AuditChangedEvent
  | AuditRegressedEvent
  | VerificationCompletedEvent

export interface EventFilter {
  tenantId: string
  websiteId?: string
  types?: PlatformEventType[]
  since?: string
}

export interface EventRepository {
  append(event: PlatformEvent): void
  list(filter: EventFilter): PlatformEvent[]
}

export class MemoryEventRepository implements EventRepository {
  private readonly events: PlatformEvent[] = []

  append(event: PlatformEvent): void {
    if (this.events.some(existing => existing.id === event.id)) {
      throw new Error('EVENT_ID_ALREADY_EXISTS')
    }
    this.events.push(event)
  }

  list(filter: EventFilter): PlatformEvent[] {
    return this.events.filter(event =>
      event.tenantId === filter.tenantId &&
      (!filter.websiteId || event.websiteId === filter.websiteId) &&
      (!filter.types || filter.types.includes(event.type)) &&
      (!filter.since || event.occurredAt >= filter.since),
    )
  }
}

export interface EventSubscriber {
  readonly channel: EventDeliveryChannel
  publish(event: PlatformEvent): Promise<void> | void
}

export interface EventDispatcher {
  dispatch(event: PlatformEvent): Promise<void>
}

export class NotificationEventDispatcher implements EventDispatcher {
  constructor(private readonly subscribers: EventSubscriber[] = []) {}

  async dispatch(event: PlatformEvent): Promise<void> {
    await Promise.all(this.subscribers.map(subscriber => subscriber.publish(event)))
  }
}

export function createPlatformEventId(type: PlatformEventType, sourceId: string, occurredAt: string): string {
  return `${type}:${sourceId}:${occurredAt}`
}
