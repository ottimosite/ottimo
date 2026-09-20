import type { Audit, AuditEvidence, AuditIssue } from '../types/domain'

export type AIStatementKind = 'evidence-backed' | 'proposal'
export interface AIStatement { kind: AIStatementKind; text: string; evidenceIds: string[] }

export interface AIEvidence {
  id: string
  kind: 'measurement' | 'finding' | 'action'
  sourceId: string
  status: 'measured' | 'inferred' | 'unavailable'
  value?: string | number | boolean
  unit?: string
  source?: string
  observedAt?: string
}

export interface AIContext {
  auditId: string
  websiteId: string
  findingIds: string[]
  actionIds: string[]
  evidence: AIEvidence[]
}

export interface AIAnalysis {
  explanation: AIStatement
  nextStep: AIStatement
  changeNarrative?: AIStatement
  verificationSuggestions?: AIStatement[]
}

export interface AIProvider { analyse(context: AIContext): Promise<AIAnalysis> }

export class UnsupportedAIOutputError extends Error {
  constructor(message: string) { super(message); this.name = 'UnsupportedAIOutputError' }
}

const acquisitionTerms = /(?:traffic|conversion|conversions|impressions|clicks|ctr|sessions|reach)\b/i
const measurementClaim = /\b(?:\d+(?:\.\d+)?\s*(?:ms|s|kb|mb|bytes?|%|px)|(?:lcp|fcp|ttfb|inp|cls)\s*(?:is|of|=|:))\b/i

function auditEvidence(issue: AuditIssue, auditId: string): AIEvidence | undefined {
  const evidence: AuditEvidence | undefined = issue.evidence
  if (!evidence) return undefined
  return {
    id: 'finding:' + auditId + ':' + issue.id,
    kind: 'measurement',
    sourceId: issue.id,
    status: evidence.status,
    value: evidence.value,
    unit: evidence.unit,
    source: evidence.source,
    observedAt: evidence.observedAt,
  }
}

export function buildAIContext(audit: Pick<Audit, 'id' | 'websiteId' | 'issues' | 'actions'>): AIContext {
  return {
    auditId: audit.id,
    websiteId: audit.websiteId,
    findingIds: audit.issues.map(issue => issue.id),
    actionIds: (audit.actions ?? []).map(action => action.id),
    evidence: audit.issues.flatMap(issue => {
      const evidence = auditEvidence(issue, audit.id)
      return evidence ? [evidence] : []
    }),
  }
}

function validateStatement(statement: AIStatement, context: AIContext, label: string): void {
  const evidence = new Map(context.evidence.map(item => [item.id, item]))
  const referenced = statement.evidenceIds.map(id => evidence.get(id))

  if (statement.kind === 'evidence-backed') {
    if (!statement.evidenceIds.length || referenced.some(item => !item)) {
      throw new UnsupportedAIOutputError(label + ' must reference supplied evidence.')
    }
  }

  if (acquisitionTerms.test(statement.text)) {
    throw new UnsupportedAIOutputError(label + ' contains an acquisition metric that the audit evidence cannot establish.')
  }

  if (measurementClaim.test(statement.text)) {
    const supportedValues = referenced.flatMap(item => item?.value === undefined ? [] : [String(item.value)])
    const supportedUnits = referenced.flatMap(item => item?.unit ? [item.unit] : [])
    const supported = supportedValues.some(value => statement.text.includes(value)) &&
      (supportedUnits.length === 0 || supportedUnits.some(unit => statement.text.toLowerCase().includes(unit.toLowerCase())))
    if (!supported) throw new UnsupportedAIOutputError(label + ' contains a measurement that is not supported by referenced evidence.')
  }
}

export function validateAIAnalysis(output: AIAnalysis, context: AIContext): AIAnalysis {
  validateStatement(output.explanation, context, 'Explanation')
  validateStatement(output.nextStep, context, 'Next step')
  if (output.changeNarrative) validateStatement(output.changeNarrative, context, 'Change narrative')
  output.verificationSuggestions?.forEach((statement, index) => validateStatement(statement, context, 'Verification suggestion ' + (index + 1)))
  return output
}

export async function analyseWithSafeguards(provider: AIProvider, context: AIContext): Promise<AIAnalysis | undefined> {
  try { return validateAIAnalysis(await provider.analyse(context), context) } catch { return undefined }
}

export class MockAIProvider implements AIProvider {
  async analyse(context: AIContext): Promise<AIAnalysis> {
    const finding = context.evidence[0]
    return {
      explanation: {
        kind: 'evidence-backed',
        text: finding ? 'This explanation is based on evidence supplied by Ottimo.' : 'No supporting audit evidence is available.',
        evidenceIds: finding ? [finding.id] : [],
      },
      nextStep: {
        kind: 'proposal',
        text: 'Review the supplied finding and use its existing verification criteria before making a change.',
        evidenceIds: [],
      },
    }
  }
}
