import type { Audit, AuditIssue, AuditScore, Website } from '../../types/domain'

export const harbourPineWebsite: Website = {
  id: 'site-harbour-pine',
  name: 'Harbour & Pine',
  url: 'https://harbourpine.example',
  createdAt: '2026-09-06T00:00:00Z',
  lastAuditId: 'audit-harbour-pine',
}

export const harbourPineSnapshot = {
  sourceUrl: 'https://harbourpine.example/',
  capturedAt: '2026-09-06',
  title: 'Harbour & Pine',
  businessSummary: 'Illustrative independent home and lifestyle retailer used as Ottimo demonstration data.',
  primaryNavigation: ['Furniture', 'Lighting', 'Homeware', 'Outdoor', 'Collections', 'Journal'],
  serviceSignals: ['Free delivery over £75', 'Click and collect', 'Trade enquiries', 'Customer support'],
  trustSignals: ['Independent business story', 'Product care information', 'Clear returns guidance', 'Secure checkout messaging'],
  contact: { phone: '01234 555 018', email: 'hello@harbourpine.example', address: '12 Market Lane, Bristol, BS1 1AA' },
  contentLinks: ['/furniture', '/lighting', '/homeware', '/delivery', '/returns', '/contact'],
} as const

const harbourPineIssues: AuditIssue[] = [
  { id: 'harbour-pine-issue-1', category: 'performance', severity: 'high', title: 'Homepage carries a large visual catalogue', summary: 'The illustrative storefront presents several promotional panels, product images and collection artwork before the primary shopping paths.', impact: 'Heavy media delivery can delay the first useful view and make category discovery feel slower on mobile.', solution: 'Audit image dimensions and formats, reserve media space, lazy-load below-the-fold campaigns and keep the first category actions lightweight.', effort: 'medium', priority: 89, status: 'open' },
  { id: 'harbour-pine-issue-2', category: 'accessibility', severity: 'medium', title: 'Navigation and commerce controls need a keyboard-first review', summary: 'The example storefront exposes catalogue navigation, search, account/cart controls and interactive promotional elements.', impact: 'Keyboard and assistive-technology users may have difficulty understanding or reaching the same shopping actions.', solution: 'Test navigation, search, account, cart and promotional controls without a mouse; preserve visible focus and useful accessible names.', effort: 'medium', priority: 84, status: 'open' },
  { id: 'harbour-pine-issue-3', category: 'seo', severity: 'medium', title: 'Collection paths should carry distinct search intent', summary: 'The example has multiple product and editorial categories that need clear, unique metadata and heading structure.', impact: 'Clear intent helps buyers and search engines distinguish furniture, lighting, homeware and editorial pages.', solution: 'Review title tags, H1s, canonical URLs, breadcrumbs and internal links for every primary collection.', effort: 'medium', priority: 81, status: 'in_progress' },
  { id: 'harbour-pine-issue-4', category: 'usability', severity: 'medium', title: 'Delivery promises should stay close to buying decisions', summary: 'Delivery thresholds, collection options and returns guidance are important conversion information.', impact: 'If these promises are not visible at category and product decision points, customers may hesitate or abandon their order.', solution: 'Repeat delivery, collection and returns guidance near relevant product actions with plain language and accessible status styling.', effort: 'low', priority: 86, status: 'open' },
  { id: 'harbour-pine-issue-5', category: 'technical', severity: 'medium', title: 'Third-party commerce scripts need performance budgets', summary: 'Checkout, analytics and support functionality add useful capability but can compete with the main shopping experience.', impact: 'Unbounded third-party work can increase interaction delay and make the storefront feel less responsive.', solution: 'Load non-critical functionality after intent, measure script cost, and set budgets for third-party JavaScript and long tasks.', effort: 'medium', priority: 78, status: 'open' },
  { id: 'harbour-pine-issue-6', category: 'ai', severity: 'low', title: 'Product and service facts are candidates for structured content', summary: 'The example contains useful facts about products, delivery, returns and customer service that could be expressed consistently.', impact: 'Consistent product, organisation, FAQ and delivery data helps people and answer engines interpret the business accurately.', solution: 'Use schema where appropriate and standardise product, delivery, service and organisation entities across key pages.', effort: 'medium', priority: 68, status: 'open' },
]

export const harbourPineScores: AuditScore[] = [
  { category: 'performance', score: 76, previous: 76 },
  { category: 'accessibility', score: 78, previous: 78 },
  { category: 'seo', score: 82, previous: 82 },
  { category: 'usability', score: 80, previous: 80 },
  { category: 'technical', score: 79, previous: 79 },
  { category: 'ai', score: 74, previous: 74 },
]

export const harbourPineAudit: Audit = {
  id: 'audit-harbour-pine',
  websiteId: harbourPineWebsite.id,
  url: harbourPineWebsite.url,
  createdAt: '2026-09-06T10:00:00Z',
  score: 78,
  durationMs: 2180,
  scores: harbourPineScores,
  issues: harbourPineIssues,
}
