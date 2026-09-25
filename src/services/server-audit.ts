import type { AuditResult, AuditIssue, Category, Severity, AuditStats } from '../types/domain'
import { calculateHealth } from '../audit-engine/scoring'
import { aggregateFindings } from '../audit-engine/aggregation'
import { buildOptimizationActions } from '../audit-engine/actions'
import { buildWebsiteHealthModel } from '../audit-engine/health-model'
import { buildSiteIntelligence, summariseSearchVisibility, summariseSocial, summariseTechnology } from '../audit-engine/site-intelligence'
import type { AuditCategory, AuditReport } from '../audit-engine/types'

interface ServerSiteAuditReport {
  run: AuditReport['run']
  requestedUrl: string
  finalUrl: string
  pages: Array<{ url: string; report: AuditReport }>
  discoveredUrls: string[]
  truncated: boolean
  discovery: {
    robotsFound: boolean
    sitemapFound: boolean
    sitemapPageCount: number
    sitemapDocuments: string[]
    sitemapUrls: string[]
    robots: { found: boolean; sitemaps: string[]; disallow: string[]; allow: string[] }
  }
  error?: AuditReport['error']
}

const categories: Category[] = ['performance', 'accessibility', 'seo', 'technical']

const severity = (value: AuditReport['findings'][number]['severity']): Severity => value

const statsForPage = (report: AuditReport): AuditStats | undefined => {
  const page = report.page
  if (!page) return undefined
  return {
    htmlBytes: new TextEncoder().encode(page.html).length,
    imageCount: (page.html.match(/<img\b/gi) ?? []).length,
    linkCount: (page.html.match(/<a\b/gi) ?? []).length,
    title: page.title,
    language: page.language,
    performance: {
      ttfbMs: page.timing.ttfbMs, fcpMs: page.timing.fcpMs, lcpMs: page.timing.lcpMs,
      domContentLoadedMs: page.timing.domContentLoadedMs, cls: page.timing.cls, inpMs: page.timing.inpMs,
      mode: 'rendered-page',
    },
    discovery: {
      finalUrl: page.finalUrl, https: page.secureContext, robotsFound: false, sitemapFound: false,
      discoveredPageCount: 1, technologies: page.technology?.map(signal => signal.name) ?? [],
      technologySignals: page.technology, searchVisibility: page.searchVisibility, socialPresence: page.socialPresence,
      searchSummary: summariseSearchVisibility([page.searchVisibility]),
      technologySummary: summariseTechnology([page.technology]),
      socialSummary: summariseSocial([page.socialPresence]),
    },
    pageScope: 'single-page', source: 'live', technologySignals: page.technology,
    searchVisibility: page.searchVisibility, socialPresence: page.socialPresence,
  }
}

const resourcePerformanceFor = (reports: Array<{ report: AuditReport }>): NonNullable<AuditStats['resourcePerformance']> => {
  const resources = reports.flatMap(({ report }) => report.page?.resources.map(resource => ({ resource, pageUrl: report.page!.finalUrl })) ?? []).filter(({ resource }) => !resource.failed)
  const byTypeMap = new Map<string, { count: number; transferBytes: number }>()
  const sizeOf = (resource: (typeof resources)[number]['resource']) => resource.transferSize ?? resource.encodedBodySize ?? 0
  for (const { resource } of resources) {
    const type = resource.type || 'other'
    const current = byTypeMap.get(type) ?? { count: 0, transferBytes: 0 }
    current.count += 1
    current.transferBytes += sizeOf(resource)
    byTypeMap.set(type, current)
  }
  const withSize = resources.filter(({ resource }) => resource.transferSize !== undefined || resource.encodedBodySize !== undefined)
  const withDuration = resources.filter(({ resource }) => resource.durationMs !== undefined)
  const totalTransferBytes = resources.reduce((sum, item) => sum + sizeOf(item.resource), 0)
  const totalDurationMs = resources.reduce((sum, item) => sum + (item.resource.durationMs ?? 0), 0)
  const contributors = [...resources]
    .filter(({ resource }) => sizeOf(resource) > 0 || (resource.durationMs ?? 0) > 0)
    .sort((a, b) => (sizeOf(b.resource) + (b.resource.durationMs ?? 0) * 10) - (sizeOf(a.resource) + (a.resource.durationMs ?? 0) * 10))
    .slice(0, 12)
    .map(({ resource, pageUrl }) => {
      let host = 'unknown'
      try { host = new URL(resource.url).host } catch { /* Keep an explicit unknown host. */ }
      return {
        pageUrl,
        url: resource.url,
        type: resource.type || 'other',
        host,
        transferBytes: resource.transferSize ?? resource.encodedBodySize,
        durationMs: resource.durationMs,
        transferShare: totalTransferBytes > 0 ? Number((sizeOf(resource) / totalTransferBytes).toFixed(4)) : undefined,
        durationShare: totalDurationMs > 0 && resource.durationMs !== undefined ? Number((resource.durationMs / totalDurationMs).toFixed(4)) : undefined,
        evidence: 'measured' as const,
      }
    })

  return {
    resourceCount: resources.length,
    totalTransferBytes,
    byType: [...byTypeMap.entries()].map(([type, value]) => ({ type, ...value })).sort((a, b) => b.transferBytes - a.transferBytes),
    largest: withSize.sort((a, b) => sizeOf(b.resource) - sizeOf(a.resource)).slice(0, 8).map(({ resource }) => ({ url: resource.url, type: resource.type || 'other', transferBytes: resource.transferSize ?? resource.encodedBodySize, durationMs: resource.durationMs })),
    slowest: withDuration.sort((a, b) => (b.resource.durationMs ?? 0) - (a.resource.durationMs ?? 0)).slice(0, 8).map(({ resource }) => ({ url: resource.url, type: resource.type || 'other', transferBytes: resource.transferSize ?? resource.encodedBodySize, durationMs: resource.durationMs })),
    contributors,
  }
}

const measuredCategoriesFor = (report: AuditReport): Category[] => {
  const measured = new Set<Category>()
  for (const measurement of report.measurements) {
    if (measurement.status === 'measured' && categories.includes(measurement.category as Category)) measured.add(measurement.category as Category)
  }
  for (const check of report.checks) {
    if (check.status !== 'unavailable' && categories.includes(check.category as Category)) measured.add(check.category as Category)
  }
  return [...measured]
}

export const toResult = (site: ServerSiteAuditReport): AuditResult => {
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

  const siteIntelligence = buildSiteIntelligence({ pages: successfulPages.map(({ report }) => ({ url: report.page!.finalUrl, performance: statsForPage(report)?.performance, searchVisibility: report.page!.searchVisibility, technology: report.page!.technology, socialPresence: report.page!.socialPresence })) })
  const healthModel = buildWebsiteHealthModel({
    websiteUrl: site.finalUrl,
    pages: successfulPages.map(({ report }) => ({
      url: report.page!.finalUrl,
      title: report.page!.title,
      stats: statsForPage(report),
      measuredCategories: measuredCategoriesFor(report),
    })),
    issues,
    actions,
    generatedAt: site.run.completedAt,
    siteIntelligence,
  })
  const firstStats = statsForPage(first)
  const resourcePerformance = resourcePerformanceFor(successfulPages)

  return {
    score: health.score,
    scores: firstScores,
    issues,
    actions,
    healthModel,
    durationMs: site.run.durationMs,
    standards: ['WCAG 2.2 AA', 'Core Web Vitals', 'Technical SEO'],
    diagnostics: first.diagnostics,
    stats: {
      ...firstStats,
      resourcePerformance,
      discovery: {
        ...firstStats?.discovery,
        finalUrl: site.finalUrl,
        https: site.finalUrl.startsWith('https:'),
        robotsFound: site.discovery.robotsFound,
        sitemapFound: site.discovery.sitemapFound,
        sitemapPageCount: site.discovery.sitemapPageCount,
        discoveredPageCount: site.discoveredUrls.length,
        technologies: summariseTechnology(successfulPages.map(page => page.report.page?.technology)).signals.map(signal => signal.name),
        technologySignals: summariseTechnology(successfulPages.map(page => page.report.page?.technology)).signals,
        searchVisibility: firstPage?.searchVisibility,
        socialPresence: firstPage?.socialPresence,
        searchSummary: summariseSearchVisibility(successfulPages.map(page => page.report.page?.searchVisibility)),
        technologySummary: summariseTechnology(successfulPages.map(page => page.report.page?.technology)),
        socialSummary: summariseSocial(successfulPages.map(page => page.report.page?.socialPresence)),
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
