import type { TenantResolver } from './supabase-auth'

export interface WorkspaceRecord {
  id: string
  name: string
  createdBy: string
  createdAt: string
}

export interface WebsiteRecord {
  id: string
  workspaceId: string
  name: string
  url: string
  createdBy: string
  createdAt: string
}

export interface SupabaseTenantRepositoryConfig {
  url: string
  secretKey: string
}

export interface WorkspaceRepository {
  findWorkspaceForUser(userId: string): Promise<WorkspaceRecord | undefined>
  findWebsite(workspaceId: string, websiteId: string): Promise<WebsiteRecord | undefined>
  createWorkspace(userId: string, name: string): Promise<WorkspaceRecord>
  createWebsite(workspaceId: string, userId: string, name: string, url: string): Promise<WebsiteRecord>
}

export class SupabaseWorkspaceRepository implements WorkspaceRepository, TenantResolver {
  constructor(private readonly config: SupabaseTenantRepositoryConfig) {}

  async findWorkspaceForUser(userId: string): Promise<WorkspaceRecord | undefined> {
    const workspaces = await this.findWorkspacesForUser(userId)
    return workspaces.length === 1 ? workspaces[0] : undefined
  }

  async findWorkspacesForUser(userId: string): Promise<WorkspaceRecord[]> {
    const memberships = await this.request<Array<{ workspace_id: string }>>(
      '/rest/v1/workspace_members?select=workspace_id&user_id=eq.' + encodeURIComponent(userId),
    )
    const workspaceIds = memberships.map(item => item.workspace_id)
    if (workspaceIds.length === 0) return []

    const filter = workspaceIds.map(id => '"' + id.replaceAll('"', '""') + '"').join(',')
    return await this.request<WorkspaceRecord[]>(
      '/rest/v1/workspaces?select=id,name,created_by,created_at&id=in.(' + encodeURIComponent(filter) + ')',
    )
  }

  async findWebsite(workspaceId: string, websiteId: string): Promise<WebsiteRecord | undefined> {
    const websites = await this.request<WebsiteRecord[]>(
      '/rest/v1/websites?select=id,workspace_id,name,url,created_by,created_at&id=eq.' +
      encodeURIComponent(websiteId) + '&workspace_id=eq.' + encodeURIComponent(workspaceId) + '&limit=1',
    )
    return websites[0]
  }

  async createWorkspace(userId: string, name: string): Promise<WorkspaceRecord> {
    const existing = await this.findWorkspaceForUser(userId)
    if (existing) return existing

    const created = await this.request<WorkspaceRecord[]>('/rest/v1/workspaces', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ name: name.trim(), created_by: userId }),
    })
    const workspace = created[0]
    if (!workspace) throw new Error('WORKSPACE_CREATE_FAILED')
    return workspace
  }

  async createWebsite(workspaceId: string, userId: string, name: string, url: string): Promise<WebsiteRecord> {
    const existing = await this.request<WebsiteRecord[]>(
      '/rest/v1/websites?select=id,workspace_id,name,url,created_by,created_at&workspace_id=eq.' +
      encodeURIComponent(workspaceId) + '&url=eq.' + encodeURIComponent(url) + '&limit=1',
    )
    if (existing[0]) return existing[0]

    const created = await this.request<WebsiteRecord[]>('/rest/v1/websites', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        workspace_id: workspaceId,
        name: name.trim(),
        url,
        created_by: userId,
      }),
    })
    const website = created[0]
    if (!website) throw new Error('WEBSITE_CREATE_FAILED')
    return website
  }

  async resolveTenant(userId: string): Promise<string | undefined> {
    const workspace = await this.findWorkspaceForUser(userId)
    return workspace?.id
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(this.config.url.replace(/\/+$/, '') + path, {
      ...init,
      headers: {
        apikey: this.config.secretKey,
        authorization: 'Bearer ' + this.config.secretKey,
        accept: 'application/json',
        'content-type': 'application/json',
        ...init.headers,
      },
    })
    if (!response.ok) {
      throw new Error('SUPABASE_DATABASE_REQUEST_FAILED')
    }
    return await response.json() as T
  }
}
