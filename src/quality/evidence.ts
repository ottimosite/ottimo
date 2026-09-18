export type MeasurementStatus = 'measured' | 'inferred' | 'unavailable'

export interface Evidence {
  status: MeasurementStatus
  value?: string | number | boolean
  unit?: string
  source?: string
  observedAt?: string
  details?: string
}

export const measured = (value: Evidence['value'], options: Omit<Evidence, 'status'|'value'> = {}): Evidence => ({
  status:'measured',
  value,
  ...options,
})

export const inferred = (details: string, source?: string): Evidence => ({
  status:'inferred',
  details,
  source,
})

export const unavailable = (details: string): Evidence => ({
  status:'unavailable',
  details,
})
