import type { ServerStorageAdapter } from './persistence'

export interface WorkspaceRecord {
  id: string
  userId: string
  name: string
  createdAt: string
}

export interface WebsiteRecord {
  id: string
  workspaceId: string
  name: string
  url: string
  createdAt: string
}

export interface WorkspaceState {
  workspaces: WorkspaceRecord[]
  websites: WebsiteRecord[]
}

export interface WorkspaceRepository {
  findWorkspaceForUser(userId: string): Promise<WorkspaceRecord | undefined>
  findWebsite(workspaceId: string, websiteId: string): Promise<WebsiteRecord | undefined>
  createWorkspace(userId: string, name: string): Promise<WorkspaceRecord>
  createWebsite(workspaceId: string, name: string, url: string): Promise<WebsiteRecord>
}

const KEY = 'identity/workspaces'

export function validateWebsiteUrl(input: string): string {
  const url = new URL(input.trim())
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('WEBSITE_URL_UNSUPPORTED')
  if (!url.hostname || url.username || url.password) throw new Error('WEBSITE_URL_INVALID')
  url.hash = ''
  return url.toString()
}

export class DurableWorkspaceRepository implements WorkspaceRepository {
  constructor(private readonly adapter: ServerStorageAdapter) {}

  async findWorkspaceForUser(userId: string): Promise<WorkspaceRecord | undefined> {
    const state = await this.read()
    return state.workspaces.find(workspace => workspace.userId === userId)
  }

  async findWebsite(workspaceId: string, websiteId: string): Promise<WebsiteRecord | undefined> {
    const state = await this.read()
    return state.websites.find(website => website.workspaceId === workspaceId && website.id === websiteId)
  }

  async createWorkspace(userId: string, name: string): Promise<WorkspaceRecord> {
    const state = await this.read()
    const existing = state.workspaces.find(workspace => workspace.userId === userId)
    if (existing) return existing

    const workspace: WorkspaceRecord = {
      id: crypto.randomUUID(),
      userId,
      name: name.trim(),
      createdAt: new Date().toISOString(),
    }
    await this.write({ ...state, workspaces: [...state.workspaces, workspace] })
    return workspace
  }

  async createWebsite(workspaceId: string, name: string, url: string): Promise<WebsiteRecord> {
    const state = await this.read()
    const canonicalUrl = validateWebsiteUrl(url)
    const existing = state.websites.find(website => website.workspaceId === workspaceId && website.url === canonicalUrl)
    if (existing) return existing

    const website: WebsiteRecord = {
      id: crypto.randomUUID(),
      workspaceId,
      name: name.trim(),
      url: canonicalUrl,
      createdAt: new Date().toISOString(),
    }
    await this.write({ ...state, websites: [...state.websites, website] })
    return website
  }

  private async read(): Promise<WorkspaceState> {
    const envelope = await this.adapter.read<WorkspaceState>(KEY)
    return envelope?.data ?? { workspaces: [], websites: [] }
  }

  private async write(data: WorkspaceState): Promise<void> {
    await this.adapter.write(KEY, {
      schemaVersion: 1,
      tenantId: 'identity',
      updatedAt: new Date().toISOString(),
      data,
    })
  }
}
