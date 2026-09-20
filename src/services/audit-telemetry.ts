export type AuditTelemetryEvent =
  | 'audit.requested'
  | 'audit.rejected'
  | 'audit.started'
  | 'audit.completed'
  | 'audit.failed'
  | 'audit.timeout'

export interface AuditTelemetry {
  event: AuditTelemetryEvent
  auditId?: string
  targetHost?: string
  durationMs?: number
  pageCount?: number
  errorCode?: string
  reason?: string
  timestamp: string
}

export interface TelemetrySink {
  record(event: AuditTelemetry): void
}

export class MemoryTelemetrySink implements TelemetrySink {
  readonly events: AuditTelemetry[] = []
  record(event: AuditTelemetry): void {
    this.events.push(event)
  }
}

export function safeTelemetryTarget(rawUrl: string): string | undefined {
  try {
    return new URL(rawUrl).hostname
  } catch {
    return undefined
  }
}

export function createTelemetry(event: AuditTelemetryEvent, input: Omit<AuditTelemetry, 'event' | 'timestamp'> = {}): AuditTelemetry {
  return {
    event,
    ...input,
    timestamp: new Date().toISOString(),
  }
}
