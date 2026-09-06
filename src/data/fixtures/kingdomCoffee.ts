import type { Audit, AuditIssue, AuditScore, Website } from '../../types/domain'

export const kingdomCoffeeWebsite: Website = {
  id: 'site-kingdom-coffee',
  name: 'Kingdom Coffee',
  url: 'https://kingdomcoffee.co.uk',
  createdAt: '2026-09-06T00:00:00Z',
  lastAuditId: 'audit-kingdom-coffee',
}

export const kingdomCoffeeSnapshot = {
  sourceUrl: 'https://kingdomcoffee.co.uk/',
  capturedAt: '2026-09-06',
  title: 'Kingdom Coffee',
  businessSummary: 'UK coffee, tea, catering supplies and equipment supplier serving trade customers.',
  primaryNavigation: ['Coffee', 'Tea', 'Chocolate & Other', 'Disposables & Cleaning', 'Cold Drinks', 'Equipment'],
  serviceSignals: ['Click and collect for local orders', 'Next working day UK delivery', 'Free delivery over £75 ex VAT', 'Live chat with the team'],
  trustSignals: ['Fairtrade and ethical coffee content', 'Our Story page', 'Customer service information', 'Secure payment marks'],
  contact: { phone: '01189 86 87 86', email: 'info@kingdomcoffee.co.uk', address: '1 Bridgewater Close, Reading, Berkshire, RG30 1JT' },
  contentLinks: ['/coffee', '/tea', '/disposables-cleaning', '/our-story/', '/delivery-information', '/contact-us'],
} as const

const kingdomIssues: AuditIssue[] = [
  { id: 'kingdom-issue-1', category: 'performance', severity: 'high', title: 'Homepage carries a large catalogue of visual assets', summary: 'The homepage presents several promotional banners, product imagery and service illustrations before the primary shopping paths.', impact: 'Heavy image delivery can delay the first useful view and make category discovery feel slower on mobile.', solution: 'Audit image dimensions and formats, reserve media space, lazy-load below-the-fold campaigns and keep the first category actions lightweight.', effort: 'medium', priority: 89, status: 'open' },
  { id: 'kingdom-issue-2', category: 'accessibility', severity: 'medium', title: 'Navigation and commerce controls need a keyboard-first review', summary: 'The page exposes a large catalogue navigation, account/cart controls, live chat and a JavaScript chat trigger.', impact: 'Keyboard and assistive-technology users may have difficulty understanding or reaching the same shopping actions.', solution: 'Test the menu, search, account, cart and live-chat trigger without a mouse; preserve visible focus and useful accessible names.', effort: 'medium', priority: 84, status: 'open' },
  { id: 'kingdom-issue-3', category: 'seo', severity: 'medium', title: 'Commercial category paths should carry distinct search intent', summary: 'The site has multiple product and service categories that need clear, unique page metadata and heading structure.', impact: 'Clear intent helps buyers and search engines distinguish coffee, tea, equipment and consumables pages.', solution: 'Review title tags, H1s, canonical URLs, breadcrumbs and internal links for every primary category.', effort: 'medium', priority: 81, status: 'in_progress' },
  { id: 'kingdom-issue-4', category: 'usability', severity: 'medium', title: 'Delivery promises should stay close to buying decisions', summary: 'Click-and-collect, next-working-day delivery and free-delivery thresholds are important conversion information.', impact: 'If these promises are not visible at category and product decision points, customers may hesitate or abandon their order.', solution: 'Repeat delivery, collection and threshold guidance near relevant product actions with plain language and accessible status styling.', effort: 'low', priority: 86, status: 'open' },
  { id: 'kingdom-issue-5', category: 'technical', severity: 'medium', title: 'Third-party chat and commerce scripts need performance budgets', summary: 'Live chat and ecommerce functionality add useful capability but can compete with the main shopping experience.', impact: 'Unbounded third-party work can increase interaction delay and make the storefront feel less responsive.', solution: 'Load non-critical chat after intent, measure script cost, and set budgets for third-party JavaScript and long tasks.', effort: 'medium', priority: 78, status: 'open' },
  { id: 'kingdom-issue-6', category: 'ai', severity: 'low', title: 'Product and ethical sourcing facts are strong candidates for structured content', summary: 'The site has useful facts about Fairtrade, delivery, products and customer service that could be expressed consistently.', impact: 'Consistent product, organisation, FAQ and delivery data helps people and answer engines interpret the business accurately.', solution: 'Use schema where appropriate and standardise product, delivery, sustainability and organisation entities across key pages.', effort: 'medium', priority: 68, status: 'open' },
]

export const kingdomCoffeeScores: AuditScore[] = [
  { category: 'performance', score: 76, previous: 76 },
  { category: 'accessibility', score: 78, previous: 78 },
  { category: 'seo', score: 82, previous: 82 },
  { category: 'usability', score: 80, previous: 80 },
  { category: 'technical', score: 79, previous: 79 },
  { category: 'ai', score: 74, previous: 74 },
]

export const kingdomCoffeeAudit: Audit = {
  id: 'audit-kingdom-coffee',
  websiteId: kingdomCoffeeWebsite.id,
  url: kingdomCoffeeWebsite.url,
  createdAt: '2026-09-06T10:00:00Z',
  score: 78,
  durationMs: 2180,
  scores: kingdomCoffeeScores,
  issues: kingdomIssues,
}