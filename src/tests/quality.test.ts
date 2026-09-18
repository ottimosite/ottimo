import { describe, expect, it } from 'vitest'
import { checkDocumentAccessibility } from '../quality/a11y'
import { criteriaFor, qualityCriteria } from '../quality/standards'

describe('Ottimo quality foundation', () => {
  it('recognises a valid accessible document baseline', () => {
    const document = new DOMParser().parseFromString(`<!doctype html><html lang="en"><body><main><h1>Ottimo</h1><button type="button">Analyse</button><img src="hero.webp" alt="Ottimo dashboard"></main></body></html>`, 'text/html')
    expect(checkDocumentAccessibility(document).every(check => check.passed)).toBe(true)
  })

  it('detects missing accessibility requirements', () => {
    const document = new DOMParser().parseFromString(`<!doctype html><html><body><main><h1>Ottimo</h1><button type="button"></button><img src="hero.webp"></main></body></html>`, 'text/html')
    const checks = checkDocumentAccessibility(document)
    expect(checks.find(check => check.id === 'document-language')?.passed).toBe(false)
    expect(checks.find(check => check.id === 'control-names')?.passed).toBe(false)
    expect(checks.find(check => check.id === 'image-alternatives')?.passed).toBe(false)
  })

  it('distinguishes automated and assisted criteria', () => {
    expect(criteriaFor('accessibility').some(criterion => criterion.testability === 'assisted')).toBe(true)
    expect(qualityCriteria.every(criterion => criterion.evidenceRequired)).toBe(true)
  })
})
