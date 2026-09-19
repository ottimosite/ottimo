import type { AuditResult, AuditIssue, Category, Severity } from '../types/domain'
import { calculateHealth } from '../audit-engine/scoring'
import { aggregateFindings } from '../audit-engine/aggregation'
import { buildOptimizationActions } from '../audit-engine/actions'\nimport { buildWebsiteHealthModel } from '../audit-engine/health-model'
import type { AuditCategory, AuditReport } from '../audit-engine/types'

interface ServerSiteAuditReport {
  run: AuditReport['run']
  requestedUrl: string
  finalUrl: string
  pages: Array<{ url: string; report: AuditReport }>
  discoveredUrls: string[]
  truncated: boolean
  error?: AuditReport['error']
}

const categories: Category[] = ['performance', 'accessibility', 'seo', 'technical']

const severity = (value: AuditReport['findings'][number]['severity']): Severity => value

const toResult = (site: ServerSiteAuditReport): AuditResult => {
  const successfulPages = site.pages.filter(page => page.report.run.status === 'completed' && page.report.page)
  const failedPages = site.pages.filter(page => page.report.run.status === 'failed')

  if (!successfulPages.length) {
    throw new Error(site.error?.message ?? failedPages[0]?.report.error?.message ?? 'The audit engine could not complete the audit.')
  }

  const aggregated = aggregateFindings(successfulPages)
  const issues: AuditIssue[] = aggregated.map(({ finding, fingerprint, affectedPages, affectedResources, occurrenceCount, evidenceIds }) => ({
      id: `${finding.id}-${encodeURIComponent(fingerprint)}`,
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
      evidence: (() => {
        const source = successfulPages
          .flatMap(page => page.report.evidence)
          .find(item => finding.evidenceIds.includes(item.id))
        return {
          status: source ? 'measured' as const : 'unavailable' as const,
          value: source?.value,
          unit: source?.unit,
          source: source?.source,
          details: source
            ? `${finding.summary} Affected pages: ${affectedPages.length}${source.selector ? ` Affected element: ${source.selector}` : ''}`
            : `The finding was recorded on ${affectedPages.length} page${affectedPages.length === 1 ? '' : 's'}, but its supporting evidence could not be resolved.`,
        }
      })(),
      confidence: 'high',
      affectedPages,
      affectedResources,
      occurrenceCount,
      evidenceCount: evidenceIds.length,
      fingerprint,
      standards: finding.category === 'accessibility' ? ['WCAG 2.2 AA'] : finding.category === 'performance' ? ['Core Web Vitals'] : finding.category === 'seo' ? ['Technical SEO'] : undefined,
    }))

  const actions = buildOptimizationActions(issues)
  const health = calculateHealth(successfulPages.map(page => page.report))
  const first = successfulPages[0].report
  const firstPage = first.page
  const firstScores = categories.map(category => {
    const measurements = successfulPages
      .map(page => page.report.measurements.find(item => item.category === category && item.metric.endsWith('.score')))
      .filter(Boolean)
    const measured = measurements.find(item => typeof item?.value === 'number')
    return { category, score: measured?.value, measurement: measured ? 'measured' as const : 'unavailable' as const }
  })

  return {
    score: health.score,
    scores: firstScores,
    issues,
    actions,
    durationMs: site.run.durationMs,
    standards: ['WCAG 2.2 AA', 'Core Web Vitals', 'Technical SEO'],
    diagnostics: first.diagnostics,
    stats: {
      htmlBytes: firstPage ? new TextEncoder().encode(firstPage.html).length : undefined,
      imageCount: firstPage ? (firstPage.html.match(/<img\b/gi) ?? []).length : undefined,
      linkCount: firstPage ? (firstPage.html.match(/<a\b/gi) ?? []).length : undefined,
      title: firstPage?.title,
      language: firstPage?.language,
      performance: {
        ttfbMs: firstPage?.timing.ttfbMs,
        fcpMs: firstPage?.timing.fcpMs,
        lcpMs: firstPage?.timing.lcpMs,
        domContentLoadedMs: firstPage?.timing.domContentLoadedMs,
        cls: firstPage?.timing.cls,
        inpMs: firstPage?.timing.inpMs,
        mode: 'rendered-page',
      },
      discovery: {
        finalUrl: site.finalUrl,
        https: site.finalUrl.startsWith('https:'),
        robotsFound: false,
        sitemapFound: false,
        discoveredPageCount: site.discoveredUrls.length,
        technologies: [],
      },
      pageScope: 'site-crawl',
      source: 'live',
      technologySignals: firstPage?.technology,
      searchVisibility: firstPage?.searchVisibility,
      socialPresence: firstPage?.socialPresence,
    },
  }
}

export class ServerAuditProvider {
  async runAudit(url: string, selectedCategories: string[] = []): Promise<AuditResult> {
    const requested = selectedCategories.filter((value): value is AuditCategory => categories.includes(value as Category))
    const response = await fetch('/.netlify/functions/audit-site', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        url,
        categories: requested.length ? requested : categories,
        maxPages: 10,
      }),
    })

    let payload: unknown
    const contentType = response.headers.get('content-type') ?? ''
    try {
      payload = contentType.includes('json') ? await response.json() : await response.text()
    } catch {
      throw new Error(`The audit service returned an unreadable response (HTTP ${response.status}).`)
    }

    if (!response.ok) {
      const message = typeof payload === 'object' && payload !== null && 'error' in payload && typeof payload.error === 'object' && payload.error !== null && 'message' in payload.error
        ? String(payload.error.message)
        : typeof payload === 'object' && payload !== null && 'error' in payload ? String(payload.error)
        : typeof payload === 'string' && payload ? payload
        : `The audit service returned HTTP ${response.status}.`
      throw new Error(message)
    }

    if (typeof payload !== 'object' || payload === null || !('pages' in payload)) {
      throw new Error('Ottimo received an invalid audit report from the audit service.')
    }

    return toResult(payload as ServerSiteAuditReport)
  }
}
