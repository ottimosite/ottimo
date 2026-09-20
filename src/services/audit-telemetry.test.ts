import { describe, expect, it } from 'vitest'
import { MemoryTelemetrySink, createTelemetry, safeTelemetryTarget } from './audit-telemetry'

describe('audit telemetry', () => {
  it('records structured events without retaining full target URLs', () => {
    const sink = new MemoryTelemetrySink()
    sink.record(createTelemetry('audit.started', { targetHost: safeTelemetryTarget('https://example.com/private?customer=secret') }))
    expect(sink.events[0].targetHost).toBe('example.com')
    expect(JSON.stringify(sink.events[0])).not.toContain('customer=secret')
  })

  it('keeps malformed targets out of telemetry', () => {
    expect(safeTelemetryTarget('not-a-url')).toBeUndefined()
  })
})
