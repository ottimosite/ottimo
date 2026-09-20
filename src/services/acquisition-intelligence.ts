import type { AcquisitionObservation } from './acquisition'
import type { Audit, Category, MeasurementStatus } from '../types/domain'

export type AcquisitionEvidenceKind = 'observation' | 'correlation' | 'inference' | 'unavailable'

export interface AcquisitionEvidence {
  kind: AcquisitionEvidenceKind
  status: MeasurementStatus
  summary: string
  observationIds: string[]
  auditEvidence: string[]
}

export interface AcquisitionInsight {
  id: string
  title: string
  category: Category | 'acquisition'
  evidence: AcquisitionEvidence
  confidence: 'high' | 'medium' | 'low'
  rationale: string
}

export interface AcquisitionIntelligence {
  generatedAt: string
  insights: AcquisitionInsight[]
}

const evidenceStatus = (observation: AcquisitionObservation): MeasurementStatus =>
  observation.provenance ? 'measured' : 'unavailable'

function auditCategoryEvidence(audit: Audit, category: Category): string[] {
  return audit.issues
    .filter(issue => issue.category === category)
    .flatMap(issue => issue.evidence ? [issue.evidence.details ?? issue.title] : [])
}

export function buildAcquisitionIntelligence(input: {
  generatedAt: string
  observations: AcquisitionObservation[]
  audits: Audit[]
}): AcquisitionIntelligence {
  const insights: AcquisitionInsight[] = []
  const search = input.observations.filter(observation => observation.provider === 'search-console')
  const analytics = input.observations.filter(observation => observation.provider === 'analytics')

  for (const observation of [...search, ...analytics]) {
    insights.push({
      id: `observation:${observation.id}`,
      title: `${observation.metric} observed from ${observation.provider}`,
      category: observation.provider === 'search-console' ? 'seo' : 'usability',
      evidence: {
        kind: 'observation',
        status: evidenceStatus(observation),
        summary: `Provider reported ${observation.value} ${observation.unit} for the requested period.`,
        observationIds: [observation.id],
        auditEvidence: [],
      },
      confidence: observation.confidence,
      rationale: 'This insight reports imported provider data without attributing a cause.',
    })
  }

  const seoEvidence = input.audits.flatMap(audit => auditCategoryEvidence(audit, 'seo'))
  const usabilityEvidence = input.audits.flatMap(audit => auditCategoryEvidence(audit, 'usability'))

  if (search.length && seoEvidence.length) {
    insights.push({
      id: 'correlation:search-seo',
      title: 'Search visibility and SEO audit evidence can be reviewed together',
      category: 'seo',
      evidence: {
        kind: 'correlation',
        status: 'measured',
        summary: 'Search Console observations and Ottimo SEO evidence overlap in the same analysis window.',
        observationIds: search.map(item => item.id),
        auditEvidence: seoEvidence,
      },
      confidence: 'medium',
      rationale: 'The data supports comparison, but does not establish that audit findings caused search performance changes.',
    })
  }

  if (analytics.length && usabilityEvidence.length) {
    insights.push({
      id: 'correlation:analytics-usability',
      title: 'Analytics observations and usability audit evidence can be reviewed together',
      category: 'usability',
      evidence: {
        kind: 'correlation',
        status: 'measured',
        summary: 'Analytics observations and Ottimo usability evidence overlap in the same analysis window.',
        observationIds: analytics.map(item => item.id),
        auditEvidence: usabilityEvidence,
      },
      confidence: 'medium',
      rationale: 'The data supports comparison, but does not establish that audit findings caused analytics outcomes.',
    })
  }

  if (!input.observations.length) {
    insights.push({
      id: 'unavailable:acquisition',
      title: 'Acquisition intelligence is unavailable',
      category: 'acquisition',
      evidence: {
        kind: 'unavailable',
        status: 'unavailable',
        summary: 'No supported external acquisition observations are available.',
        observationIds: [],
        auditEvidence: [],
      },
      confidence: 'low',
      rationale: 'Ottimo does not substitute missing external data with estimated acquisition results.',
    })
  }

  return { generatedAt: input.generatedAt, insights }
}
