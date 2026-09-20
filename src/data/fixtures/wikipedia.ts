import type { Audit, AuditIssue, AuditScore, Website } from '../../types/domain'

/**
 * Reproducible snapshot of the public Wikipedia portal.
 *
 * Source: https://www.wikipedia.org/
 * Captured: 2026-09-20
 * The fixture is intentionally static: CI must never depend on a live Wikipedia request.
 */
export const wikipediaWebsite: Website = {
  id: 'site-wikipedia',
  name: 'Wikipedia',
  url: 'https://www.wikipedia.org/',
  createdAt: '2026-09-20T00:00:00Z',
  lastAuditId: 'audit-wikipedia',
}

export const wikipediaSnapshot = {
  sourceUrl: 'https://www.wikipedia.org/',
  capturedAt: '2026-09-20',
  sourceRevision: 'live public page observed 2026-09-20',
  title: 'Wikipedia The Free Encyclopedia',
  language: 'multilingual portal',
  primaryNavigation: ['English', '日本語', 'Deutsch', 'Français', 'Русский', 'Español', 'Italiano', '中文', 'Polski', 'Português'],
  sections: ['Search', 'Read Wikipedia in your language', 'Wikipedia languages'],
  languageCountObserved: 349,
  articleScaleSignals: ['1,000,000+ articles', '100,000+ articles', '10,000+ articles', '1,000+ articles'],
  canonicalLinks: [
    'https://en.wikipedia.org/',
    'https://de.wikipedia.org/',
    'https://fr.wikipedia.org/',
    'https://ja.wikipedia.org/',
  ],
} as const

const wikipediaIssues: AuditIssue[] = [
  {
    id: 'wikipedia-issue-performance',
    category: 'performance',
    severity: 'low',
    title: 'Rendered performance is not available in the snapshot',
    summary: 'The saved fixture contains structural observations from Wikipedia but no browser timing measurements.',
    impact: 'Without a rendered run, Core Web Vitals and interaction performance cannot be represented honestly.',
    solution: 'Run a live browser audit when performance measurements are required.',
    effort: 'low',
    priority: 20,
    status: 'open',
    evidence: {
      status: 'unavailable',
      source: 'Wikipedia snapshot',
      observedAt: wikipediaSnapshot.capturedAt,
      details: 'No browser timing data was retained in the deterministic fixture.',
    },
    confidence: 'high',
  },
  {
    id: 'wikipedia-issue-coverage',
    category: 'seo',
    severity: 'low',
    title: 'Snapshot coverage is limited to the public portal',
    summary: 'The fixture captures the Wikipedia language portal rather than crawling the encyclopedia editions and article corpus.',
    impact: 'Portal observations should not be interpreted as representative measurements of every Wikipedia page.',
    solution: 'Use a bounded live crawl or add additional explicitly captured page fixtures for broader coverage.',
    effort: 'medium',
    priority: 18,
    status: 'open',
    evidence: {
      status: 'measured',
      value: 1,
      unit: 'snapshot page',
      source: 'Wikipedia snapshot',
      observedAt: wikipediaSnapshot.capturedAt,
      details: 'The deterministic fixture represents the public Wikipedia portal only.',
    },
    confidence: 'high',
    affectedPages: [wikipediaSnapshot.sourceUrl],
    occurrenceCount: 1,
    evidenceCount: 1,
  },
]

export const wikipediaScores: AuditScore[] = [
  { category: 'performance', measurement: 'unavailable' },
  { category: 'accessibility', measurement: 'unavailable' },
  { category: 'seo', measurement: 'measured' },
  { category: 'usability', measurement: 'unavailable' },
  { category: 'technical', measurement: 'unavailable' },
  { category: 'ai', measurement: 'unavailable' },
]

export const wikipediaAudit: Audit = {
  id: 'audit-wikipedia',
  websiteId: wikipediaWebsite.id,
  url: wikipediaWebsite.url,
  createdAt: '2026-09-20T00:00:00Z',
  durationMs: 0,
  scores: wikipediaScores,
  issues: wikipediaIssues,
  stats: {
    language: wikipediaSnapshot.language,
    title: wikipediaSnapshot.title,
    pageScope: 'single-page',
    source: 'local',
  },
}
