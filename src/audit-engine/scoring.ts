import type { AuditCategory, AuditCategoryScore, AuditFinding, AuditHealth, AuditReport } from './types'

const weights: Record<AuditCategory, number> = { performance: 1.2, accessibility: 1, seo: 0.9, technical: 0.9 }
const findingPenalty = (finding: AuditFinding) => ({ critical: 100, high: 75, medium: 50, low: 25 })[finding.severity]

export function calculateHealth(reports: AuditReport[]): AuditHealth {
  const completed = reports.filter(report => report.run.status === 'completed')
  const categoryScores: AuditCategoryScore[] = (Object.keys(weights) as AuditCategory[]).map(category => {
    const checks = completed.flatMap(report => report.checks.filter(check => check.category === category))
    const findings = completed.flatMap(report => report.findings.filter(finding => finding.category === category))
    const measured = checks.filter(check => check.status === 'pass' || check.status === 'fail')
    const passed = measured.filter(check => check.status === 'pass').length
    const failed = measured.length - passed
    const unavailable = checks.filter(check => check.status === 'unavailable').length
    if (!measured.length) return { category, score: undefined, checks: 0, passed: 0, failed: 0, unavailable, weight: weights[category] }
    let points = 0
    for (const check of measured) {
      if (check.status === 'pass') points += 100
      else {
        const linked = findings.filter(finding => finding.evidenceIds.some(id => check.evidenceIds.includes(id)))
        const penalty = linked.length ? Math.max(...linked.map(findingPenalty)) : 50
        points += Math.max(0, 100 - penalty)
      }
    }
    return { category, score: Math.round(points / measured.length), checks: measured.length, passed, failed, unavailable, weight: weights[category] }
  })
  const measured = categoryScores.filter(item => item.score !== undefined)
  const totalChecks = categoryScores.reduce((sum, item) => sum + item.checks, 0)
  const passed = categoryScores.reduce((sum, item) => sum + item.passed, 0)
  const failed = categoryScores.reduce((sum, item) => sum + item.failed, 0)
  const unavailable = categoryScores.reduce((sum, item) => sum + item.unavailable, 0)
  const methodology = 'Scores use measured pass/fail checks only. Unavailable checks are excluded; failed checks are penalised according to linked finding severity. Category weights are performance 1.2, accessibility 1.0, SEO 0.9 and technical 0.9.'
  if (!measured.length || totalChecks < 2) return { status: 'not-measured', measuredCategories: [], excludedCategories: categoryScores.map(item => item.category), checks: totalChecks, passed, failed, unavailable, categoryScores, methodology }
  const weighted = measured.reduce((sum, item) => sum + (item.score as number) * item.weight, 0) / measured.reduce((sum, item) => sum + item.weight, 0)
  const score = Math.round(weighted)
  return { score, status: score >= 80 ? 'good' : score >= 60 ? 'needs-improvement' : 'needs-attention', measuredCategories: measured.map(item => item.category), excludedCategories: categoryScores.filter(item => item.score === undefined).map(item => item.category), checks: totalChecks, passed, failed, unavailable, categoryScores, methodology }
}
