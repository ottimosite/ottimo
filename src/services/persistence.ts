import type { Audit, Website } from '../types/domain'
import { assertAuditReleased, type LifecycleState } from './account-lifecycle'

export const STORAGE_SCHEMA_VERSION = 1 as const

export interface TenantPrincipal {
  userId: string
  tenantId: string
}

export interface PersistedEnvelope<T> {
  schemaVersion: typeof STORAGE_SCHEMA_VERSION
  tenantId: string
  updatedAt: string
  data: T
}

export interface PersistentRepository {
  listWebsites(principal: TenantPrincipal): Promise<Website[]>
  listAudits(principal: TenantPrincipal): Promise<Audit[]>
  listAuditsForWebsite(principal: TenantPrincipal, websiteId: string): Promise<Audit[]>
  getLifecycle(principal: TenantPrincipal): Promise<LifecycleState | undefined>
  saveLifecycle(principal: TenantPrincipal, state: LifecycleState): Promise<void>
  saveWebsite(principal: TenantPrincipal, website: Website): Promise<void>
  saveAudit(principal: TenantPrincipal, audit: Audit): Promise<void>
}

export interface ServerStorageAdapter {
  read<T>(key: string): Promise<PersistedEnvelope<T> | undefined>
  write<T>(key: string, value: PersistedEnvelope<T>): Promise<void>
}

export function tenantKey(principal: TenantPrincipal, resource: 'websites' | 'audits' | 'lifecycle', id?: string): string {
  const suffix = id ? `/${id}` : ''
  return `tenant/${principal.tenantId}/${resource}${suffix}`
}

export function assertTenantOwnership<T extends { websiteId?: string }>(
  principal: TenantPrincipal,
  resource: { tenantId?: string; websiteId?: string },
): void {
  if (resource.tenantId && resource.tenantId !== principal.tenantId) {
    throw new Error('TENANT_ACCESS_DENIED')
  }
  if (!principal.userId || !principal.tenantId) {
    throw new Error('AUTHENTICATION_REQUIRED')
  }
}

export class TenantRepository implements PersistentRepository {
  constructor(private readonly adapter: ServerStorageAdapter) {}

  async listWebsites(principal: TenantPrincipal): Promise<Website[]> {
    requirePrincipal(principal)
    const envelope = await this.adapter.read<Website[]>(tenantKey(principal, 'websites'))
    return envelope?.tenantId === principal.tenantId ? envelope.data : []
  }

  async listAudits(principal: TenantPrincipal): Promise<Audit[]> {
    requirePrincipal(principal)
    const lifecycle = await this.getLifecycle(principal)
    if (!lifecycle) return []
    assertAuditReleased(lifecycle)
    return this.readAudits(principal)
  }

  private async readAudits(principal: TenantPrincipal): Promise<Audit[]> {
    const envelope = await this.adapter.read<Audit[]>(tenantKey(principal, 'audits'))
    return envelope?.tenantId === principal.tenantId ? envelope.data : []
  }

  async listAuditsForWebsite(principal: TenantPrincipal, websiteId: string): Promise<Audit[]> {
    requirePrincipal(principal)
    const websites = await this.listWebsites(principal)
    if (!websites.some(website => website.id === websiteId)) return []
    const audits = await this.listAudits(principal)
    return audits.filter(audit => audit.websiteId === websiteId)
  }

  async getLifecycle(principal: TenantPrincipal): Promise<LifecycleState | undefined> {
    requirePrincipal(principal)
    const envelope = await this.adapter.read<LifecycleState>(tenantKey(principal, 'lifecycle'))
    return envelope?.tenantId === principal.tenantId ? envelope.data : undefined
  }

  async saveLifecycle(principal: TenantPrincipal, state: LifecycleState): Promise<void> {
    requirePrincipal(principal)
    await this.adapter.write(tenantKey(principal, 'lifecycle'), {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      tenantId: principal.tenantId,
      updatedAt: state.updatedAt,
      data: state,
    })
  }

  async saveWebsite(principal: TenantPrincipal, website: Website): Promise<void> {
    requirePrincipal(principal)
    const existing = await this.listWebsites(principal)
    await this.adapter.write(tenantKey(principal, 'websites'), {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      tenantId: principal.tenantId,
      updatedAt: new Date().toISOString(),
      data: [...existing.filter(item => item.id !== website.id), website],
    })
  }

  async saveAudit(principal: TenantPrincipal, audit: Audit): Promise<void> {
    requirePrincipal(principal)
    const websites = await this.listWebsites(principal)
    if (!websites.some(website => website.id === audit.websiteId)) {
      throw new Error('WEBSITE_ACCESS_DENIED')
    }
    const existing = await this.readAudits(principal)
    await this.adapter.write(tenantKey(principal, 'audits'), {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      tenantId: principal.tenantId,
      updatedAt: new Date().toISOString(),
      data: [...existing.filter(item => item.id !== audit.id), audit],
    })
  }
}

function requirePrincipal(principal: TenantPrincipal): void {
  if (!principal.userId || !principal.tenantId) throw new Error('AUTHENTICATION_REQUIRED')
}

export function migrateEnvelope<T>(input: { schemaVersion: number; tenantId: string; updatedAt: string; data: T }): PersistedEnvelope<T> {
  if (input.schemaVersion > STORAGE_SCHEMA_VERSION) throw new Error('UNSUPPORTED_STORAGE_SCHEMA')
  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    tenantId: input.tenantId,
    updatedAt: input.updatedAt,
    data: input.data,
  }
}
