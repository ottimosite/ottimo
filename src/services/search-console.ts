import type { AcquisitionObservation, IntegrationProvenance, IntegrationState } from './acquisition'

export type SearchConsoleSyncState = 'idle' | 'syncing' | 'success' | 'partial' | 'unavailable' | 'error'

export interface SearchConsoleSite {
  id: string
  property: string
  siteUrl: string
  permission?: 'owner' | 'full' | 'restricted' | 'unknown'
}

export interface SearchConsoleConnection {
  id: string
  tenantId: string
  provider: 'search-console'
  state: IntegrationState
  connectedAt?: string
  lastSuccessfulSyncAt?: string
  selectedSiteId?: string
  message?: string
}

export interface SearchConsoleSyncRequest {
  tenantId: string
  connectionId: string
  siteId: string
  periodStart: string
  periodEnd: string
}

export interface SearchConsoleSyncResult {
  state: SearchConsoleSyncState
  connectionId: string
  siteId: string
  startedAt: string
  completedAt: string
  observations: AcquisitionObservation[]
  provenance: IntegrationProvenance[]
  message?: string
  errorCode?: string
}

export interface SearchConsoleConnector {
  listSites(connection: SearchConsoleConnection): Promise<SearchConsoleSite[]>
  sync(request: SearchConsoleSyncRequest): Promise<SearchConsoleSyncResult>
}

export interface SearchConsoleIntegration {
  getConnection(tenantId: string): Promise<SearchConsoleConnection | undefined>
  connect(tenantId: string, connectionId: string): Promise<SearchConsoleConnection>
  disconnect(tenantId: string, connectionId: string): Promise<SearchConsoleConnection>
  selectSite(tenantId: string, connectionId: string, siteId: string): Promise<SearchConsoleConnection>
  sync(request: SearchConsoleSyncRequest): Promise<SearchConsoleSyncResult>
}

export function createSearchConsoleConnection(tenantId: string, connectionId: string): SearchConsoleConnection {
  requireTenant(tenantId)
  if (!connectionId) throw new Error('SEARCH_CONSOLE_CONNECTION_ID_REQUIRED')

  return {
    id: connectionId,
    tenantId,
    provider: 'search-console',
    state: 'disconnected',
  }
}

export function markSearchConsoleConnecting(connection: SearchConsoleConnection): SearchConsoleConnection {
  return { ...connection, state: 'partial', message: 'Connection is being established.' }
}

export function markSearchConsoleConnected(connection: SearchConsoleConnection, connectedAt: string): SearchConsoleConnection {
  return {
    ...connection,
    state: 'connected',
    connectedAt,
    message: undefined,
  }
}

export function markSearchConsoleSyncSuccess(
  connection: SearchConsoleConnection,
  completedAt: string,
): SearchConsoleConnection {
  return {
    ...connection,
    state: 'connected',
    lastSuccessfulSyncAt: completedAt,
    message: undefined,
  }
}

export function markSearchConsoleUnavailable(
  connection: SearchConsoleConnection,
  message: string,
): SearchConsoleConnection {
  return { ...connection, state: 'unavailable', message }
}

export function markSearchConsoleError(
  connection: SearchConsoleConnection,
  message: string,
): SearchConsoleConnection {
  return { ...connection, state: 'error', message }
}

export function selectSearchConsoleSite(
  connection: SearchConsoleConnection,
  siteId: string,
  sites: SearchConsoleSite[],
): SearchConsoleConnection {
  if (!siteId) throw new Error('SEARCH_CONSOLE_SITE_ID_REQUIRED')
  const site = sites.find(item => item.id === siteId)
  if (!site) throw new Error('SEARCH_CONSOLE_SITE_NOT_AVAILABLE')
  if (connection.state !== 'connected') throw new Error('SEARCH_CONSOLE_NOT_CONNECTED')

  return { ...connection, selectedSiteId: site.id }
}

export function assertSearchConsoleTenant(
  connection: SearchConsoleConnection,
  tenantId: string,
): void {
  requireTenant(tenantId)
  if (connection.tenantId !== tenantId) throw new Error('TENANT_ACCESS_DENIED')
}

export function assertSearchConsoleSyncRequest(
  connection: SearchConsoleConnection,
  request: SearchConsoleSyncRequest,
): void {
  assertSearchConsoleTenant(connection, request.tenantId)
  if (connection.id !== request.connectionId) throw new Error('SEARCH_CONSOLE_CONNECTION_MISMATCH')
  if (connection.state !== 'connected') throw new Error('SEARCH_CONSOLE_NOT_CONNECTED')
  if (connection.selectedSiteId !== request.siteId) throw new Error('SEARCH_CONSOLE_SITE_NOT_SELECTED')
  if (!request.periodStart || !request.periodEnd) throw new Error('SEARCH_CONSOLE_SYNC_PERIOD_REQUIRED')
}

export function createUnavailableSyncResult(
  request: SearchConsoleSyncRequest,
  startedAt: string,
  completedAt: string,
  message: string,
): SearchConsoleSyncResult {
  return {
    state: 'unavailable',
    connectionId: request.connectionId,
    siteId: request.siteId,
    startedAt,
    completedAt,
    observations: [],
    provenance: [],
    message,
    errorCode: 'SEARCH_CONSOLE_UNAVAILABLE',
  }
}

export function createErrorSyncResult(
  request: SearchConsoleSyncRequest,
  startedAt: string,
  completedAt: string,
  errorCode: string,
  message: string,
): SearchConsoleSyncResult {
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
