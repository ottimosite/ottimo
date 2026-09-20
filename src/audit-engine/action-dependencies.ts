import type { ActionDependency, ActionLifecycleStatus, OptimizationAction } from '../types/domain'

export interface ActionDependencyValidation {
  valid: boolean
  errors: string[]
}

export function validateActionDependencies(actions: OptimizationAction[]): ActionDependencyValidation {
  const errors: string[] = []
  const byId = new Map(actions.map(action => [action.id, action]))

  for (const action of actions) {
    const seen = new Set<string>()
    for (const dependency of action.dependencies) {
      if (dependency.id === action.id) errors.push(`Action ${action.id} cannot depend on itself.`)
      if (!byId.has(dependency.id)) errors.push(`Action ${action.id} references missing dependency ${dependency.id}.`)
      if (seen.has(dependency.id)) errors.push(`Action ${action.id} contains duplicate dependency ${dependency.id}.`)
      seen.add(dependency.id)
    }
  }

  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (id: string, path: string[]): void => {
    if (visiting.has(id)) {
      const start = path.indexOf(id)
      const cycle = [...path.slice(start), id].join(' -> ')
      errors.push(`Cyclic action dependency detected: ${cycle}.`)
      return
    }
    if (visited.has(id)) return
    visiting.add(id)
    const action = byId.get(id)
    for (const dependency of action?.dependencies ?? []) {
      if (byId.has(dependency.id)) visit(dependency.id, [...path, id])
    }
    visiting.delete(id)
    visited.add(id)
  }

  for (const action of actions) visit(action.id, [])

  return { valid: errors.length === 0, errors: [...new Set(errors)] }
}

export function blockingDependencies(actions: OptimizationAction[], action: OptimizationAction): OptimizationAction[] {
  const byId = new Map(actions.map(candidate => [candidate.id, candidate]))
  return action.dependencies
    .filter(dependency => dependency.blocking)
    .map(dependency => byId.get(dependency.id))
    .filter((candidate): candidate is OptimizationAction => Boolean(candidate))
}

export function canTransitionAction(
  action: OptimizationAction,
  nextStatus: ActionLifecycleStatus,
  actions: OptimizationAction[],
): boolean {
  const validation = validateActionDependencies(actions)
  if (!validation.valid) return false

  if (nextStatus !== 'verification' && nextStatus !== 'resolved') return true

  return blockingDependencies(actions, action)
    .every(dependency => dependency.lifecycleStatus === 'resolved')
}

export function normaliseActionDependencies(
  actions: OptimizationAction[],
): OptimizationAction[] {
  const validIds = new Set(actions.map(action => action.id))
  return actions.map(action => ({
    ...action,
    dependencies: [...new Map(
      action.dependencies
        .filter(dependency => dependency.id !== action.id && validIds.has(dependency.id))
        .map(dependency => [dependency.id, dependency]),
    ).values()],
  }))
}
