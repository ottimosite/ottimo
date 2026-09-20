import type { AcquisitionObservation, IntegrationProvenance, IntegrationState } from './acquisition'

export type AnalyticsProvider = 'analytics'

export interface AnalyticsSite {
  id: string
  name: string
  property: string
  measurementId?: string
  timezone?: string
}

export interface AnalyticsConnection {
  id: string
  tenantId: string
  provider: AnalyticsProvider
  state: IntegrationState
  connectedAt?: string
  lastSuccessfulSyncAt?: string
  selectedSiteId?: string
  message?: string
}

export interface AnalyticsSyncRequest {
  tenantId: string
  connectionId: string
  siteId: string
  periodStart: string
  periodEnd: string
}

export interface AnalyticsSyncResult {
  state: 'idle' | 'syncing' | 'success' | 'partial' | 'unavailable' | 'error'
  connectionId: string
  siteId: string
  startedAt: string
  completedAt: string
  observations: AcquisitionObservation[]
  provenance: IntegrationProvenance[]
  message?: string
  errorCode?: string
}

export interface AnalyticsConnector {
  listSites(connection: AnalyticsConnection): Promise<AnalyticsSite[]>
  sync(request: AnalyticsSyncRequest): Promise<AnalyticsSyncResult>
}

export interface AnalyticsIntegration {
  getConnection(tenantId: string): Promise<AnalyticsConnection | undefined>
  connect(tenantId: string, connectionId: string): Promise<AnalyticsConnection>
  disconnect(tenantId: string, connectionId: string): Promise<AnalyticsConnection>
  selectSite(tenantId: string, connectionId: string, siteId: string): Promise<AnalyticsConnection>
  sync(request: AnalyticsSyncRequest): Promise<AnalyticsSyncResult>
}

export function createAnalyticsConnection(tenantId: string, connectionId: string): AnalyticsConnection {
  requireTenant(tenantId)
  if (!connectionId) throw new Error('ANALYTICS_CONNECTION_ID_REQUIRED')
  return { id: connectionId, tenantId, provider: 'analytics', state: 'disconnected' }
}

export function markAnalyticsConnected(connection: AnalyticsConnection, connectedAt: string): AnalyticsConnection {
  return { ...connection, state: 'connected', connectedAt, message: undefined }
}

export function markAnalyticsSyncSuccess(connection: AnalyticsConnection, completedAt: string): AnalyticsConnection {
  return { ...connection, state: 'connected', lastSuccessfulSyncAt: completedAt, message: undefined }
}

export function markAnalyticsUnavailable(connection: AnalyticsConnection, message: string): AnalyticsConnection {
  return { ...connection, state: 'unavailable', message }
}

export function markAnalyticsError(connection: AnalyticsConnection, message: string): AnalyticsConnection {
  return { ...connection, state: 'error', message }
}

export function selectAnalyticsSite(
  connection: AnalyticsConnection,
  siteId: string,
  sites: AnalyticsSite[],
): AnalyticsConnection {
  if (!siteId) throw new Error('ANALYTICS_SITE_ID_REQUIRED')
  if (connection.state !== 'connected') throw new Error('ANALYTICS_NOT_CONNECTED')
  const site = sites.find(item => item.id === siteId)
  if (!site) throw new Error('ANALYTICS_SITE_NOT_AVAILABLE')
  return { ...connection, selectedSiteId: site.id }
}

export function assertAnalyticsTenant(connection: AnalyticsConnection, tenantId: string): void {
  requireTenant(tenantId)
  if (connection.tenantId !== tenantId) throw new Error('TENANT_ACCESS_DENIED')
}

export function assertAnalyticsSyncRequest(
  connection: AnalyticsConnection,
  request: AnalyticsSyncRequest,
): void {
  assertAnalyticsTenant(connection, request.tenantId)
  if (connection.id !== request.connectionId) throw new Error('ANALYTICS_CONNECTION_MISMATCH')
  if (connection.state !== 'connected') throw new Error('ANALYTICS_NOT_CONNECTED')
  if (connection.selectedSiteId !== request.siteId) throw new Error('ANALYTICS_SITE_NOT_SELECTED')
  if (!request.periodStart || !request.periodEnd) throw new Error('ANALYTICS_SYNC_PERIOD_REQUIRED')
}

export function createUnavailableAnalyticsSyncResult(
  request: AnalyticsSyncRequest,
  startedAt: string,
  completedAt: string,
  message: string,
): AnalyticsSyncResult {
  return {
    state: 'unavailable',
    connectionId: request.connectionId,
    siteId: request.siteId,
    startedAt,
    completedAt,
    observations: [],
    provenance: [],
    message,
    errorCode: 'ANALYTICS_UNAVAILABLE',
  }
}

export function createAnalyticsErrorSyncResult(
  request: AnalyticsSyncRequest,
  startedAt: string,
  completedAt: string,
  errorCode: string,
  message: string,
): AnalyticsSyncResult {
  return {
    state: 'error',
    connectionId: request.connectionId,
    siteId: request.siteId,
    startedAt,
    completedAt,
    observations: [],
    provenance: [],
    errorCode,
    message,
  }
}

function requireTenant(tenantId: string): void {
  if (!tenantId) throw new Error('TENANT_REQUIRED')
}
