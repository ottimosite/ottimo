import type { AuditStandard, Category } from '../types/domain'

export type Testability = 'automated' | 'assisted' | 'manual'

export interface QualityCriterion {
  id: string
  standard: AuditStandard
  category: Category
  title: string
  testability: Testability
  evidenceRequired: boolean
  description: string
}

export const qualityCriteria: QualityCriterion[] = [
  { id:'wcag-1.1.1', standard:'WCAG 2.2 AA', category:'accessibility', title:'Non-text Content', testability:'automated', evidenceRequired:true, description:'Informative images have an appropriate text alternative; decorative images are explicitly identified.' },
  { id:'wcag-1.3.1', standard:'WCAG 2.2 AA', category:'accessibility', title:'Info and Relationships', testability:'automated', evidenceRequired:true, description:'Structure and relationships conveyed visually are represented in semantic markup.' },
  { id:'wcag-2.1.1', standard:'WCAG 2.2 AA', category:'accessibility', title:'Keyboard', testability:'assisted', evidenceRequired:true, description:'Functionality is operable through a keyboard interface.' },
  { id:'wcag-2.4.3', standard:'WCAG 2.2 AA', category:'accessibility', title:'Focus Order', testability:'assisted', evidenceRequired:true, description:'Focusable components receive focus in an order that preserves meaning and operability.' },
  { id:'wcag-2.4.7', standard:'WCAG 2.2 AA', category:'accessibility', title:'Focus Visible', testability:'assisted', evidenceRequired:true, description:'Keyboard focus has a visible indicator.' },
  { id:'wcag-3.1.1', standard:'WCAG 2.2 AA', category:'accessibility', title:'Language of Page', testability:'automated', evidenceRequired:true, description:'The primary human language of the page is declared.' },
  { id:'wcag-4.1.2', standard:'WCAG 2.2 AA', category:'accessibility', title:'Name, Role, Value', testability:'automated', evidenceRequired:true, description:'User-interface components expose an accessible name, role and state/value where applicable.' },
  { id:'cwv-lcp', standard:'Core Web Vitals', category:'performance', title:'Largest Contentful Paint', testability:'automated', evidenceRequired:true, description:'Measure rendered loading performance rather than infer it from document size.' },
  { id:'cwv-inp', standard:'Core Web Vitals', category:'performance', title:'Interaction to Next Paint', testability:'automated', evidenceRequired:true, description:'Measure real interaction responsiveness in a rendered browser environment.' },
  { id:'cwv-cls', standard:'Core Web Vitals', category:'performance', title:'Cumulative Layout Shift', testability:'automated', evidenceRequired:true, description:'Measure unexpected visual movement during the page lifecycle.' },
  { id:'seo-title', standard:'Technical SEO', category:'seo', title:'Document Title', testability:'automated', evidenceRequired:true, description:'Each indexable page exposes a concise, meaningful document title.' },
  { id:'seo-canonical', standard:'Technical SEO', category:'seo', title:'Canonical URL', testability:'automated', evidenceRequired:true, description:'Canonical signals are present and consistent with the discovered page model.' },
  { id:'seo-indexability', standard:'Technical SEO', category:'seo', title:'Indexability', testability:'automated', evidenceRequired:true, description:'Robots directives, HTTP status, canonical signals and sitemap membership are considered together.' },
]

export const criteriaFor = (category: Category) => qualityCriteria.filter(criterion => criterion.category === category)
