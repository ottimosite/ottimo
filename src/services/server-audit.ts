import type { AuditResult, AuditIssue, Category, Severity } from '../types/domain'
import type { AuditCategory, AuditReport } from '../audit-engine'

const categories: Category[] = ['performance', 'accessibility', 'seo', 'technical']

const severity = (value: AuditReport['findings'][number]['severity']): Severity => value

const toResult = (report: AuditReport): AuditResult => {
  if (report.run.status === 'failed') {
    throw new Error(report.error?.message ?? 'The audit engine could not complete the audit.')
  }

  const issues: AuditIssue[] = report.findings.map((finding, index) => ({
    id: finding.id,
    category: finding.category,
    severity: severity(finding.severity),
    title: finding.title,
    summary: finding.summary,
    impact: finding.impact,
    solution: finding.recommendation,
    effort: 'medium',
    priority: finding.severity === 'critical' ? 100 : finding.severity === 'high' ? 85 : finding.severity === 'medium' ? 65 : 40,
    status: 'open',
    criterion: finding.title,
    evidence: {
      status: 'measured',
      source: report.evidence.find(item => finding.evidenceIds.includes(item.id))?.source,
      details: finding.summary,
    },
    confidence: 'high',
    standards: finding.category === 'accessibility' ? ['WCAG 2.2 AA'] : finding.category === 'performance' ? ['Core Web Vitals'] : finding.category === 'seo' ? ['Technical SEO'] : undefined,
  }))

  return {
    score: undefined,
    scores: categories.map(category => {
      const measurement = report.measurements.find(item => item.category === category && item.metric.endsWith('.score'))
      return { category, score: measurement?.value, measurement: measurement ? 'measured' : 'unavailable' }
    }),
    issues,
    durationMs: report.run.durationMs,
    standards: ['WCAG 2.2 AA', 'Core Web Vitals', 'Technical SEO'],
    stats: {
      htmlBytes: new TextEncoder().encode(report.page?.html ?? '').length,
      imageCount: (report.page?.html.match(/<img\b/gi) ?? []).length,
      linkCount: (report.page?.html.match(/<a\b/gi) ?? []).length,
      title: report.page?.title,
      language: report.page?.language,
      performance: {
        ttfbMs: report.page?.timing.ttfbMs,
        fcpMs: report.page?.timing.fcpMs,
        lcpMs: report.page?.timing.lcpMs,
        cls: report.page?.timing.cls,
        inpMs: report.page?.timing.inpMs,
        mode: 'rendered-page',
      },
      source: 'live',
    },
  }
}

export class ServerAuditProvider {
  async runAudit(url: string, selectedCategories: string[] = []): Promise<AuditResult> {
    const requested = selectedCategories.filter((value): value is AuditCategory => categories.includes(value as Category))
    const response = await fetch('/.netlify/functions/audit-site', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url, categories: requested.length ? requested : categories }),
    })

    let report: AuditReport
    try {
      report = await response.json() as AuditReport
    } catch {
      throw new Error('Ottimo received an invalid response from the audit service.')
    }

    return toResult(report)
  }
}
