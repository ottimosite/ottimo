import type {
  ActionLifecycleStatus,
  Audit,
  AuditEvidence,
  AuditIssue,
  OptimizationAction,
  VerificationCriterion,
} from '../types/domain'

export type CopilotTask = 'explanation' | 'implementation' | 'change-narrative' | 'verification'

export interface CopilotContext {
  auditId: string
  websiteUrl: string
  evidence: AuditEvidence[]
  findings: AuditIssue[]
  actions: OptimizationAction[]
  verification: Array<{
    actionId: string
    status: 'verified' | 'failed' | 'inconclusive'
    evidence: string
  }>
}

export interface CopilotProposal {
  task: CopilotTask
  title: string
  summary: string
  evidenceIds: string[]
  actionId?: string
  affectedPages: string[]
  verification: VerificationCriterion[]
  uncertainty: string[]
  isProposal: true
}

export interface CopilotProvider {
  generate(task: CopilotTask, context: CopilotContext, actionId?: string): Promise<CopilotProposal>
}

const evidenceKey = (evidence: AuditEvidence) =>
  [evidence.source, evidence.value, evidence.details, evidence.observedAt].map(value => String(value ?? '')).join('|')

export function createCopilotContext(audit: Audit, evidence: AuditEvidence[] = []): CopilotContext {
  return {
    auditId: audit.id,
    websiteUrl: audit.url,
    evidence: evidence.filter(item => item.status === 'measured' || item.status === 'inferred'),
    findings: audit.issues,
    actions: audit.actions ?? [],
    verification: (audit.verifications ?? []).map(item => ({
      actionId: item.actionId,
      status: item.status,
      evidence: item.evidence,
    })),
  }
}

export function validateCopilotProposal(proposal: CopilotProposal, context: CopilotContext): CopilotProposal {
  const allowedEvidence = new Set(context.evidence.map(evidenceKey))
  const validEvidenceIds = proposal.evidenceIds.filter(id =>
    context.evidence.some(evidence => evidence.id === id && allowedEvidence.has(evidenceKey(evidence))),
  )

  return {
    ...proposal,
    evidenceIds: validEvidenceIds,
    affectedPages: proposal.affectedPages.filter(page =>
      context.findings.some(finding => (finding.affectedPages ?? []).includes(page)) ||
      context.actions.some(action => action.affectedPages.includes(page)),
    ),
    uncertainty: [...new Set([
      ...proposal.uncertainty,
      'This is an AI-assisted proposal based only on supplied Ottimo evidence.',
      'Traffic, conversion, revenue and acquisition metrics are unavailable unless explicitly supplied as measured evidence.',
    ])],
    isProposal: true,
  }
}

const actionFor = (context: CopilotContext, actionId?: string) =>
  actionId ? context.actions.find(action => action.id === actionId) : context.actions[0]

const findingFor = (context: CopilotContext, action?: OptimizationAction) =>
  action ? context.findings.find(finding => finding.id === action.issueId) : context.findings[0]

export class DeterministicCopilotProvider implements CopilotProvider {
  async generate(task: CopilotTask, context: CopilotContext, actionId?: string): Promise<CopilotProposal> {
    const action = actionFor(context, actionId)
    const finding = findingFor(context, action)

    if (!finding && !action) {
      return validateCopilotProposal({
        task,
        title: 'No supported audit evidence',
        summary: 'Ottimo does not have a finding or action in the supplied context to explain or plan.',
        evidenceIds: [],
        affectedPages: [],
        verification: [],
        uncertainty: ['No supported evidence was supplied for this request.'],
        isProposal: true,
      }, context)
    }

    const evidenceIds = context.evidence.map(item => item.id).slice(0, 10)
    const affectedPages = action?.affectedPages ?? finding?.affectedPages ?? []
    const verification = action?.verification ?? []

    const summary = task === 'implementation'
      ? action?.implementationSteps.join(' ') ?? finding?.solution ?? 'Review the supplied finding and its evidence before making a change.'
      : task === 'verification'
        ? verification.map(item => item.description).join(' ') || 'Re-run the audit and compare the supplied evidence with the current finding.'
        : task === 'change-narrative'
          ? context.verification.map(item => item.evidence).join(' ') || 'No prior verification narrative is available in the supplied context.'
          : finding?.summary ?? action?.expectedOutcome ?? 'Review the supplied evidence and affected pages.'

    return validateCopilotProposal({
      task,
      title: finding?.title ?? action?.title ?? 'Evidence-backed Ottimo proposal',
      summary,
      evidenceIds,
      actionId: action?.id,
      affectedPages,
      verification,
      uncertainty: [
        'The proposal does not establish traffic, conversion, revenue or acquisition impact.',
        'Implementation should be validated by a subsequent audit.',
      ],
      isProposal: true,
    }, context)
  }
}

export const lifecycleLabel = (status: ActionLifecycleStatus) => status.replace(/-/g, ' ')
