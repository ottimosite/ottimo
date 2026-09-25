import { transitionLifecycle, type LifecycleState } from './account-lifecycle'
import { TenantRepository, type ServerStorageAdapter, type TenantPrincipal } from './persistence'
import type { WorkspaceRepository } from './supabase-tenant-repository'

export async function completeVerifiedLifecycle(
  userId: string,
  workspaceRepository: WorkspaceRepository,
  storage: ServerStorageAdapter,
  now = new Date().toISOString(),
): Promise<TenantPrincipal> {
  const tenantId = await workspaceRepository.findWorkspaceForUser(userId)
  if (!tenantId) throw new Error('WORKSPACE_NOT_FOUND')

  const principal: TenantPrincipal = { userId, tenantId: tenantId.id }
  const repository = new TenantRepository(storage)
  const current = await repository.getLifecycle(principal)

  if (!current) throw new Error('LIFECYCLE_NOT_INITIALIZED')
  if (current.account === 'verified') return principal

  const verified: LifecycleState = transitionLifecycle(current, 'complete_verification', now)
  await repository.saveLifecycle(principal, verified)
  return principal
}
