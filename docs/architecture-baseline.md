# Ottimo Architecture Baseline

> Baseline for refactor programme #167. Captured from the repository state on 20 September 2026. This document records observed structure; candidates are not deletion instructions. Historical measurements remain intentionally preserved where noted.

## 1. Scope

This baseline covers:
- global stylesheet loading and ownership;
- repeated CSS selectors and cascade layers;
- application/public route ownership;
- repeated application data/service patterns;
- refactor risks and proposed sequence.

It deliberately does **not** change runtime behaviour or audit evidence semantics.

## 2. Global stylesheet inventory

The current `src/main.tsx` stylesheet surface is:

1. `tokens.css`
2. `base.css`
3. `shell.css`
4. `shared-components.css`
5. `public-site.css`
6. `components.css`
7. `platform.css`
8. `concepts.css`
9. `lead-home.css`
10. `public-refresh.css`
11. `public-services.css`
12. `audit-overview.css`
13. `audit-expansion.css`
14. `standards.css`
15. `performance-metrics.css`
16. `onboarding.css`
17. `quality.css`

`global.css` was retired in #211 after its remaining application/component rules were moved to their owning layers. The former `overrides.css`, `menu-overrides.css` and `application-layout.css` layers were also retired earlier in the refactor programme.

### Historical measured inventory

The following measurements are preserved from the pre-refactor repository state. They are historical evidence, not current measurements:

| Stylesheet | Approx bytes | Rules | Selector occurrences | @media | !important |
|---|---:|---:|---:|---:|---:|
| global.css | 17,422 | 214 | 310 | 15 | 0 |
| components.css | 4,412 | 55 | 83 | 3 | 0 |
| platform.css | 20,654 | 254 | 394 | 14 | 0 |
| overrides.css | removed in #182 | — | — | — | — |
| menu-overrides.css | removed in #182 | — | — | — | — |
| concepts.css | 5,699 | 65 | 133 | 1 | 0 |
| lead-home.css | 13,664 | 158 | 321 | 9 | 0 |
| public-refresh.css | 9,011 | 109 | 184 | 8 | 0 |
| public-services.css | 2,235 | 32 | 51 | 2 | 0 |
| audit-overview.css | 9,558 | 123 | 241 | 7 | 1 |
| audit-expansion.css | 11,733 | 135 | 190 | 11 | 0 |
| standards.css | 657 | 8 | 13 | 1 | 0 |
| performance-metrics.css | 2,209 | 29 | 60 | 2 | 0 |
| onboarding.css | 5,639 | 74 | 151 | 2 | 1 |
| quality.css | 545 | 6 | 2 | 2 | 4 |
| application-layout.css | removed in #184 | — | — | — | — |

The historical total was 103,173 bytes, 1,390 rules, 2,336 selector occurrences, 85 media-query occurrences and 34 `!important` declarations. These figures must not be presented as current.

## 3. Confirmed CSS duplication/overlap

The following class names are defined in multiple stylesheets and require ownership review:

### High-frequency shared concepts

- `eyebrow` — shared/components, platform, concepts, lead-home, audit-overview, performance-metrics
- `btn` — shared components, platform, lead-home, audit-overview, onboarding
- `card` — shared components, platform, audit-overview, audit-expansion
- `page-heading` — components, platform, audit-overview
- `section-head` — components, platform, audit-overview, audit-expansion
- `muted` — components, platform, audit-overview, performance-metrics
- `text-link` — concepts, lead-home, public-refresh, public-services
- `site-header` — shell ownership established; legacy override layers removed in #182
- `brand` — shell ownership established; legacy override layers removed in #182
- `header-actions` — shell ownership established; legacy override layers removed in #182
- `sidebar` — shell ownership established; legacy override layers removed in #182
- `menu-toggle` — shell ownership established; legacy override layers removed in #182
- `app-content` — shell ownership established; legacy platform/override duplication reduced in #182
- `hero` — public-site ownership established; legacy override duplication removed in #182
- `content-page` — public-site ownership established; legacy override duplication removed in #182
- `content-hero` — public-site/public-refresh
- `side-cta` — public/legacy ownership requires further review

### Application/audit overlap

- `audit-stat-grid` — components, audit-overview, audit-expansion
- `audit-overview` — components, audit-overview
- `audit-url` — components, audit-overview
- `audit-health` — components, audit-overview
- `score` — components, platform
- `issue-list` — components, platform
- `audit-evidence-grid` — components, audit-expansion
- `screenshot-card` / `screenshot-frame` — components, audit-expansion
- `stat-icon` — components, audit-overview
- `standard-tag` / `criterion` — components, standards
- `stack` / `score-card` / `metric-copy` / `hero-metrics` — platform ownership; legacy override rules removed in #182
- `evidence-status` / `evidence-status--unavailable` — platform, audit-expansion
- `ai-decision-* ` — platform and audit-overview
- `profile-list` / `section-subtitle` — audit-overview and audit-expansion
- `interpretation-* ` — audit-overview and performance-metrics

### Public-site overlap

The following concepts are defined across multiple public-facing files:

- `lead-home`
- `lead-hero`
- `lead-hero-grid`
- `lead-form`
- `audit-preview`
- `preview-note`
- `education-strip`
- `section-intro`
- `coverage-item`
- `lead-form-heading`
- `ethos`
- `onboarding-progress`

These may represent legitimate variants, but ownership is currently distributed rather than explicit.

## 4. Cascade/override observations

Confirmed observations:

1. `src/main.tsx` still relies partly on stylesheet import order.
2. The superseded `overrides.css`, `menu-overrides.css` and `application-layout.css` layers have been removed.
3. The former tactical application-layout layer contained 27 `!important` declarations; those declarations were removed with that stylesheet.
4. Remaining `!important` declarations are limited to documented contracts in `audit-overview.css`, `onboarding.css`, `quality.css` and the shell where explicitly required.
5. Responsive rules remain distributed across most stylesheet files, so ownership and cascade order still require continued attention.

These are structural observations. They do not by themselves prove that every duplicate selector is incorrect; some may intentionally provide contextual variants.

## 5. Application route ownership

`src/App.tsx` currently separates routes into:

### Public

- `/`
- `/services`
- `/performance`
- `/seo`
- `/accessibility`
- `/ai`
- `/methodology`
- `/usability`
- `/technical`
- `/pricing`
- `/about`
- `/case-studies`
- `/contact`
- `/concepts`
- `/concepts/reliability`
- `/concepts/speed`
- `/concepts/friendly`

Public layout is provided by `PublicLayout`.

### Authenticated application

The `/app` subtree is wrapped by `AuthProvider`, `ProtectedWorkspace` and `AppLayout`.

Current application routes include:

- dashboard
- websites
- websites/:id
- insights
- audits
- audits/new
- audits/new/run
- audits/:id
- performance
- accessibility
- seo
- usability
- technical
- ai
- recommendations
- reports
- history
- settings

`Layout.tsx` also contains website-context and audit-context navigation, meaning the application shell currently owns some route-derived domain lookup behaviour.

## 6. Repeated code/service responsibilities

Confirmed search evidence identifies repeated access patterns across:

- `features/audits/Audits.tsx`
- `features/dashboard/Dashboard.tsx`
- `components/Layout.tsx`
- `features/audits/AuditOnboarding.tsx`
- `features/platform/PlatformPages.tsx`
- `features/audits/AuditOverview.tsx`
- `features/recommendations/Recommendations.tsx`

These features directly interact with `storage.audits()` and/or `seedAudits`.

Date construction/formatting is also distributed across audit engine, services and feature components. This is a refactor candidate, not evidence that every date operation should be centralised.

Formatting helpers already exist in `src/lib/format.ts`, which should be evaluated before creating new utilities.

## 7. Architecture constraints

The refactor must preserve the existing architecture contracts:

- audit evidence remains separate from presentation;
- providers remain replaceable;
- measured/inferred/unavailable evidence semantics remain intact;
- UI must tolerate partial/failed/running audits;
- live unsupported scores remain unavailable rather than fabricated;
- authentication and tenant boundaries remain service/server concerns;
- public marketing content must not become coupled to audit-engine internals.

## 8. Candidate obsolete/dead areas

The following are **candidates for investigation only**:

- `overrides.css` — removed in #182
- `menu-overrides.css` — removed in #182
- `application-layout.css` — removed in #184
- `global.css` — retired in #211
- portions of `lead-home.css` that overlap the newer `public-refresh.css`
- duplicated primitives in `global.css`, `components.css` and `platform.css`
- compatibility declarations in `application-layout.css` once its consumers have migrated

No file should be deleted solely because it appears duplicated. Usage must be proven first.

## 9. Recommended refactor sequence

1. Establish shared design tokens and base contracts without changing appearance.
2. Consolidate shell/navigation ownership.
3. Consolidate shared UI primitives.
4. Separate public-site styling from authenticated application styling.
5. Consolidate audit/report feature styling.
6. Remove obsolete override layers after usage is proven.
7. Consolidate repeated React/data access responsibilities.
8. Add static guardrails against new duplicate/global styling patterns.
9. Integrate rendered visual QA and regression screenshots.
10. Measure build/bundle/render changes and document the final architecture.

Each slice should be independently reviewable and pass CI before the next slice begins.

## 10. Quality baseline

The repository's documented quality gate requires:

- `npm test`
- `npm run lint`
- `npm run build`
- keyboard traversal of changed journeys
- zoom/reflow inspection
- reduced-motion inspection where relevant
- screen-reader smoke testing for changed interactions
- production-route smoke testing for deployment changes

The refactor must not weaken this standard.

## 11. Success criteria for the programme

The desired end state is not a particular number of CSS files. It is:

- one clear owner for shared primitives;
- explicit feature/public/application boundaries;
- minimal reliance on import order;
- no `!important` used to compensate for architectural ambiguity;
- fewer duplicated selectors and behaviours;
- smaller, more understandable components;
- domain logic outside presentation components where appropriate;
- obsolete code removed after proof;
- rendered behaviour protected by automated and manual QA;
- unchanged evidence integrity.



### Local repository read boundary

The local demo application's persisted/seed read policy is owned by `src/services/local-repository.ts`. Feature components should use `localRepository` for normal website/audit reads rather than combining `storage` with seed collections themselves.

The repository currently exposes:
- `audits()`
- `websites()`
- `findAudit(id)`
- `findWebsite(id)`
- `websiteForAudit(audit)`

This boundary preserves the existing fallback policy: persisted collections are used when non-empty; otherwise the corresponding seed collection is returned. Storage writes remain owned by `storage.ts` while this migration is in progress.
