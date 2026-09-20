import type { ActionEvidenceLink, ActionLifecycleStatus, ActionWorkContext, OptimizationAction } from '../types/domain'

export interface ActionWorkItem extends OptimizationAction {
  work: ActionWorkContext
}

export interface ActionWorkRepository {
  list(): ActionWorkItem[]
  save(action: ActionWorkItem): void
}

export class MemoryActionWorkRepository implements ActionWorkRepository {
  private readonly items = new Map<string, ActionWorkItem>()

  list(): ActionWorkItem[] {
    return [...this.items.values()]
  }

  save(action: ActionWorkItem): void {
    this.items.set(action.id, action)
  }
}

const validTransitions: Record<ActionLifecycleStatus, ActionLifecycleStatus[]> = {
  planned: ['in_progress'],
  in_progress: ['verification', 'planned'],
  verification: ['resolved', 'failed', 'inconclusive'],
  resolved: ['in_progress'],
  failed: ['in_progress'],
  inconclusive: ['in_progress'],
}

export const canTransitionActionLifecycle = (
  current: ActionLifecycleStatus,
  next: ActionLifecycleStatus,
): boolean => current === next || validTransitions[current].includes(next)

export const toActionWorkItem = (
  action: OptimizationAction,
  context: ActionWorkContext,
): ActionWorkItem => ({
  ...action,
  work: {
    ...context,
    originatingFindingId: context.originatingFindingId || action.issueId,
    evidenceLinks: [...context.evidenceLinks],
  },
})
