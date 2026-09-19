import type {
  AuditCategory,
  AuditCheck,
  AuditEvidence,
  AuditFinding,
  AuditMeasurement,
  AuditRuleContext,
} from './types'

const makeId = (prefix: string, value: string) => {
  let hash = 2166136261
  for (const char of value) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return prefix + '-' + (hash >>> 0).toString(36)
}

const now = () => new Date().toISOString()

const evidence = (
  context: AuditRuleContext,
  input: Omit<AuditEvidence, 'id' | 'observedAt'>,
) => {
  const item = {
    ...input,
    id: makeId(
      'ev',
      input.kind + input.description + (input.url ?? '') + (input.selector ?? ''),
    ),
    observedAt: now(),
  }
  context.evidence.push(item)
  return item
}

const check = (context: AuditRuleContext, input: Omit<AuditCheck, 'id'>) => {
  const item = {
    ...input,
    id: makeId('check', input.category + input.criterion),
  }
  context.checks.push(item)
  return item
}

const finding = (context: AuditRuleContext, input: Omit<AuditFinding, 'id'>) => {
  const item = {
    ...input,
    id: makeId(
      'finding',
      input.category +
        input.title +
        (input.selector ?? '') +
        (input.resourceUrl ?? ''),
    ),
  }
  context.findings.push(item)
  return item
}

const measurement = (
  context: AuditRuleContext,
  input: Omit<AuditMeasurement, 'id'>,
) => {
  const item = {
    ...input,
    id: makeId('metric', input.category + input.metric),
  }
  context.measurements.push(item)
  return item
}

const seo = (html: string) => ({
  description: html
    .match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i,
    )?.[1]
    ?.trim(),
  canonical:
    /<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]+href=["'][^"']+["'][^>]*>/i.test(
      html,
    ),
  viewport: /<meta[^>]+name=["']viewport["']/i.test(html),
})

export function runAuditRules(
  context: AuditRuleContext,
  categories: AuditCategory[],
) {
  const page = context.page

  if (categories.includes('performance')) {
    const metrics = [
      {
        key: 'ttfb',
        label: 'Time to first byte',
        value: page.timing.ttfbMs,
        unit: 'ms',
        good: 800,
        description: 'Time to first byte',
        source: 'PerformanceNavigationTiming',
      },
      {
        key: 'fcp',
        label: 'First contentful paint',
        value: page.timing.fcpMs,
        unit: 'ms',
        good: 1800,
        description: 'First contentful paint',
        source: 'PerformancePaintTiming',
      },
      {
        key: 'lcp',
        label: 'Largest contentful paint',
        value: page.timing.lcpMs,
        unit: 'ms',
        good: 2500,
        description: 'Largest contentful paint',
        source: 'LargestContentfulPaint',
      },
      {
        key: 'cls',
        label: 'Cumulative layout shift',
        value: page.timing.cls,
        unit: 'score',
        good: 0.1,
        description: 'Cumulative layout shift',
        source: 'LayoutShift',
      },
      {
        key: 'inp',
        label: 'Interaction to next paint',
        value: page.timing.inpMs,
        unit: 'ms',
        good: 200,
        description: 'Interaction to next paint',
        source: 'EventTiming',
      },
    ] as const

    for (const metric of metrics) {
      const item = evidence(context, {
        category: 'performance',
        kind: 'timing',
        description: metric.description,
        value: metric.value,
        unit: metric.unit,
        source: 'browser-performance',
        url: page.finalUrl,
      })

      measurement(context, {
        category: 'performance',
        metric: metric.key,
        value: metric.value,
        unit: metric.unit,
        status: metric.value === undefined ? 'unavailable' : 'measured',
        source: metric.source,
        evidenceIds: [item.id],
      })

      if (metric.value === undefined) continue

      const pass = metric.value <= metric.good

      check(context, {
        category: 'performance',
        criterion: metric.key,
        status: pass ? 'pass' : 'fail',
        message: pass
          ? metric.label + ' is within the good threshold.'
          : metric.label + ' exceeds the good threshold.',
        evidenceIds: [item.id],
      })

      if (!pass) {
        finding(context, {
          category: 'performance',
          severity: metric.value > metric.good * 2 ? 'high' : 'medium',
          title: metric.label + ' needs attention',
          summary: metric.label + ' is above the good threshold.',
          impact:
            'This can make the page feel slower or less responsive for visitors.',
          recommendation:
            metric.key === 'ttfb'
              ? 'Investigate server processing, caching and CDN response time.'
              : metric.key === 'fcp'
                ? 'Reduce render-blocking resources and prioritise visible content.'
                : metric.key === 'lcp'
                  ? 'Optimise the largest visible element and prioritise its resource.'
                  : metric.key === 'cls'
                    ? 'Reserve space for images, embeds and dynamic content.'
                    : 'Reduce long main-thread tasks and expensive JavaScript.',
          scope: 'page',
          evidenceIds: [item.id],
        })
      }
    }
  }

  if (categories.includes('seo')) {
    const titleEvidence = evidence(context, {
      category: 'seo',
      kind: 'dom',
      description: 'Document title',
      value: page.title,
      source: 'playwright',
      url: page.finalUrl,
    })

    check(context, {
      category: 'seo',
      criterion: 'title',
      status: page.title ? 'pass' : 'fail',
      message: page.title
        ? 'A document title is present.'
        : 'The document has no title.',
      evidenceIds: [titleEvidence.id],
    })

    if (!page.title) {
      finding(context, {
        category: 'seo',
        severity: 'high',
        title: 'Page is missing a title',
        summary: 'The rendered document does not expose a document title.',
        impact: 'Search engines and users receive less page context.',
        recommendation: 'Add one unique, descriptive title matching the page intent.',
        scope: 'page',
        evidenceIds: [titleEvidence.id],
      })
    }

    const metadata = seo(page.html)
    const descriptionEvidence = evidence(context, {
      category: 'seo',
      kind: 'dom',
      description: 'Meta description',
      value: metadata.description ?? '',
      source: 'playwright',
      url: page.finalUrl,
    })

    check(context, {
      category: 'seo',
      criterion: 'meta-description',
      status: metadata.description ? 'pass' : 'fail',
      message: metadata.description
        ? 'A meta description is present.'
        : 'No meta description was found.',
      evidenceIds: [descriptionEvidence.id],
    })

    if (!metadata.description) {
      finding(context, {
        category: 'seo',
        severity: 'medium',
        title: 'Page is missing a meta description',
        summary: 'No meta description was found in the rendered document.',
        impact:
          'Search engines may have less useful text available for snippets.',
        recommendation: 'Add a concise, page-specific meta description.',
        scope: 'page',
        evidenceIds: [descriptionEvidence.id],
      })
    }
  }

  if (categories.includes('accessibility')) {
    for (const violation of page.accessibility.violations) {
      const nodes = violation.nodes.map((node) => node.target.join(' ')).join(', ')
      const item = evidence(context, {
        category: 'accessibility',
        kind: 'accessibility',
        description: violation.help,
        value: violation.impact ?? 'unknown',
        source: 'axe-core',
        url: page.finalUrl,
        selector: nodes,
      })

      check(context, {
        category: 'accessibility',
        criterion: `axe-${violation.id}`,
        status: 'fail',
        message: violation.help,
        evidenceIds: [item.id],
      })

      finding(context, {
        category: 'accessibility',
        severity:
          violation.impact === 'critical'
            ? 'critical'
            : violation.impact === 'serious'
              ? 'high'
              : violation.impact === 'moderate'
                ? 'medium'
                : 'low',
        title: violation.help,
        summary: violation.description,
        impact:
          'axe-core identified an accessibility rule violation in the rendered page.',
        recommendation:
          'Review the affected nodes and fix the underlying WCAG issue.',
        scope: 'page',
        selector: nodes,
        evidenceIds: [item.id],
      })
    }

    const languageEvidence = evidence(context, {
      category: 'accessibility',
      kind: 'dom',
      description: 'HTML language',
      value: page.language ?? '',
      source: 'playwright',
      url: page.finalUrl,
    })

    check(context, {
      category: 'accessibility',
      criterion: 'document-language',
      status: page.language ? 'pass' : 'fail',
      message: page.language
        ? 'The document language is declared.'
        : 'The document language is not declared.',
      evidenceIds: [languageEvidence.id],
    })

    if (!page.language) {
      finding(context, {
        category: 'accessibility',
        severity: 'low',
        title: 'Document language is not declared',
        summary: 'The html element has no lang attribute.',
        impact:
          'Assistive technology may use incorrect pronunciation rules.',
        recommendation: 'Declare the primary language on the html element.',
        scope: 'page',
        evidenceIds: [languageEvidence.id],
      })
    }

    const missing = [...page.html.matchAll(/<img\b([^>]*)>/gi)].filter(
      (match) => !/\balt\s*=/.test(match[1]),
    ).length

    const altEvidence = evidence(context, {
      category: 'accessibility',
      kind: 'dom',
      description: 'Images without alt attributes',
      value: missing,
      unit: 'images',
      source: 'playwright',
      url: page.finalUrl,
    })

    check(context, {
      category: 'accessibility',
      criterion: 'image-alt',
      status: missing ? 'fail' : 'pass',
      message: missing
        ? 'Images are missing alt attributes.'
        : 'Images expose alt attributes.',
      evidenceIds: [altEvidence.id],
    })

    if (missing) {
      finding(context, {
        category: 'accessibility',
        severity: 'high',
        title: 'Images are missing alternative text',
        summary: 'Some rendered images do not expose an alt attribute.',
        impact:
          'Screen-reader users may miss meaningful image content.',
        recommendation:
          'Add concise alt text to informative images and empty alt text to decorative images.',
        scope: 'page',
        evidenceIds: [altEvidence.id],
      })
    }
  }

  if (categories.includes('technical')) {
    const documentEvidence = evidence(context, {
      category: 'technical',
      kind: 'http',
      description: 'Main document HTTP status',
      value: page.status,
      source: 'playwright',
      url: page.finalUrl,
    })

    check(context, {
      category: 'technical',
      criterion: 'document-http-status',
      status: page.status >= 200 && page.status < 400 ? 'pass' : 'fail',
      message:
        page.status >= 200 && page.status < 400
          ? 'The main document returned a successful HTTP status.'
          : 'The main document returned an HTTP error status.',
      evidenceIds: [documentEvidence.id],
    })

    if (page.status >= 400) {
      finding(context, {
        category: 'technical',
        severity: page.status >= 500 ? 'high' : 'medium',
        title: 'Main document returned HTTP ' + page.status,
        summary: 'The rendered audit target returned an HTTP error status.',
        impact:
          'Visitors and search engines may be unable to access the page reliably.',
        recommendation:
          'Investigate the server response and restore a successful document status.',
        scope: 'page',
        evidenceIds: [documentEvidence.id],
      })
    }

    const failed = page.resources.filter(
      (resource) =>
        typeof resource.status === 'number' && resource.status >= 400,
    )

    const resourceEvidence = evidence(context, {
      category: 'technical',
      kind: 'network',
      description: 'HTTP resources returning errors',
      value: failed.length,
      unit: 'resources',
      source: 'playwright',
      url: page.finalUrl,
    })

    check(context, {
      category: 'technical',
      criterion: 'resource-http-status',
      status: failed.length ? 'fail' : 'pass',
      message: failed.length
        ? 'Collected resources returned HTTP errors.'
        : 'No collected resource returned an HTTP error.',
      evidenceIds: [resourceEvidence.id],
    })

    for (const resource of failed.slice(0, 20)) {
      finding(context, {
        category: 'technical',
        severity:
          resource.status && resource.status >= 500 ? 'high' : 'medium',
        title: 'Resource returned HTTP ' + resource.status,
        summary: 'A browser-collected resource returned an error status.',
        impact: 'Broken resources can remove content or functionality.',
        recommendation:
          'Investigate the resource response and restore a successful response.',
        scope: 'resource',
        resourceUrl: resource.url,
        evidenceIds: [resourceEvidence.id],
      })
    }
  }
}
