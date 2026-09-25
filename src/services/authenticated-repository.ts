import type { Audit, Website } from '../types/domain'
import { transitionLifecycle, type LifecycleState, type LifecycleTransition } from './account-lifecycle'
import { requireSession, type AuthenticatedSession, type SessionVerifier } from './auth'
import { TenantRepository, type AuditJob, type PersistentRepository, type ServerStorageAdapter } from './persistence'

export class AuthenticatedTenantRepository {
  private readonly repository: PersistentRepository

  constructor(
    private readonly verifier: SessionVerifier,
    adapter: ServerStorageAdapter,
  ) {
    this.repository = new TenantRepository(adapter)
  }

  private async session(request: Request): Promise<AuthenticatedSession> {
    return requireSession(await this.verifier.verify(request))
  }

  async listWebsites(request: Request): Promise<Website[]> {
    const session = await this.session(request)
    return this.repository.listWebsites(session)
  }

  async listAudits(request: Request): Promise<Audit[]> {
    const session = await this.session(request)
    return this.repository.listAudits(session)
  }

  async getAuditJob(request: Request, jobId: string): Promise<AuditJob | undefined> {
    const session = await this.session(request)
    return this.repository.getAuditJob(session, jobId)
  }

  async saveAuditJob(request: Request, job: AuditJob): Promise<void> {
    const session = await this.session(request)
    return this.repository.saveAuditJob(session, job)
  }

  async getLifecycle(request: Request): Promise<LifecycleState | undefined> {
    const session = await this.session(request)
    return this.repository.getLifecycle(session)
  }

  async transitionLifecycle(request: Request, transition: LifecycleTransition): Promise<LifecycleState> {
    const session = await this.session(request)
    const current = await this.repository.getLifecycle(session)
    if (!current) throw new Error('LIFECYCLE_NOT_INITIALIZED')
    const next = transitionLifecycle(current, transition)
    await this.repository.saveLifecycle(session, next)
    return next
  }

  async listAuditsForWebsite(request: Request, websiteId: string): Promise<Audit[]> {
    const session = await this.session(request)
    return this.repository.listAuditsForWebsite(session, websiteId)
  }

  async saveWebsite(request: Request, website: Website): Promise<void> {
    const session = await this.session(request)
    return this.repository.saveWebsite(session, website)
  }

  async saveAudit(request: Request, audit: Audit): Promise<void> {
    const session = await this.session(request)
    return this.repository.saveAudit(session, audit)
  }
}
