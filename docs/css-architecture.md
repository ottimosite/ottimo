# Ottimo CSS Architecture

> Current-state architecture record for issue #167. This is a controlled refactor, not a visual rewrite.

## Purpose

The governing rule is:

**one concern → one owner → one predictable cascade path**

CSS should be owned by the layer or feature that renders it. Shared primitives belong in one shared layer; feature presentation stays with the feature; browser foundations stay small and stable.

## Current import surface

`src/main.tsx` currently imports these global stylesheets in this order:

1. `tokens.css`
2. `base.css`
3. `shell.css`
4. `shared-components.css`
5. `public-site.css`
6. `components.css`
7. `recommendations.css`
8. `dashboard.css`
9. `platform-pages.css`
10. `lead-home.css`
11. `public-refresh.css`
12. `public-services.css`
13. `audit.css`
14. `standards.css`
15. `performance-metrics.css`
16. `onboarding.css`
17. `quality.css`

`global.css`, `platform.css`, `overrides.css`, `menu-overrides.css` and the former `concepts.css` layer are retired. The old Concepts pages are unreachable because all `/concepts*` routes redirect to `/methodology`; the unused `ConceptPages.tsx` implementation has also been removed.

The import order remains an explicit contract, but ownership and specificity should make it predictable rather than requiring ad-hoc override layers.

## Current inventory

Measured from the current stylesheet source on 24 September 2026.

| Stylesheet | Bytes | Selector occurrences | Media queries | !important | Current role |
|---|---:|---:|---:|---:|---|
| `tokens.css` | 2,578 | 1 | 0 | 0 | Design tokens |
| `base.css` | 1,534 | 40 | 1 | 0 | Browser/base foundation |
| `shell.css` | 8,866 | 112 | 5 | 0 | Application/public shell |
| `shared-components.css` | 6,495 | 87 | 4 | 0 | Shared primitives and application components |
| `public-site.css` | 5,777 | 69 | 5 | 0 | Public shared presentation |
| `components.css` | 3,048 | 29 | 2 | 0 | Remaining shared application presentation |
| `recommendations.css` | 7,042 | 74 | 8 | 0 | Recommendation feature |
| `dashboard.css` | 194 | 2 | 2 | 0 | Dashboard feature |
| `platform-pages.css` | 6,738 | 78 | 6 | 0 | Platform feature pages |
| `lead-home.css` | 21,294 | 255 | 17 | 0 | Public landing feature |
| `public-refresh.css` | 11,618 | 130 | 4 | 0 | Public information/shared presentation |
| `public-services.css` | 2,235 | 33 | 2 | 0 | Public services feature |
| `audit.css` | 26,531 | 338 | 22 | 0 | Audit feature |
| `standards.css` | 695 | 7 | 1 | 0 | Standards feature |
| `performance-metrics.css` | 1,550 | 19 | 1 | 0 | Performance feature |
| `onboarding.css` | 5,629 | 73 | 2 | 0 | Onboarding feature |
| `quality.css` | 545 | 11 | 2 | 4 | Focus/reduced-motion/forced-colour contracts |

**Measured total:** 112,369 source bytes, 1,358 selector occurrences, 84 media-query occurrences and 4 `!important` declarations.

These are source-level architecture metrics, not compressed production bundle measurements.

## Ownership model

### Foundation

- `tokens.css` owns design tokens and compatibility aliases.
- `base.css` owns browser normalization, document defaults, global focus foundation and reduced-motion extensions that are genuinely foundational.

### Shell

`shell.css` owns public navigation, authenticated navigation, responsive menus, skip-link behaviour and the application frame.

The global focus reset is owned by `base.css`; shell does not duplicate it.

### Shared components

`shared-components.css` is the authoritative owner for reusable primitives including:

- `.btn`
- `.card`
- `.eyebrow`
- `.muted`
- `.section-head`
- shared form/layout/finding/table/action/audit-list presentation

Feature styles may scope or extend these primitives, but must not redefine the shared primitive itself.

### Feature styles

Feature-owned presentation lives in explicit stylesheets:

- `lead-home.css` — landing experience
- `public-services.css` — services
- `public-refresh.css` — public information/shared presentation
- `recommendations.css` — recommendations
- `dashboard.css` — dashboard
- `platform-pages.css` — platform pages
- `audit.css` — audit/report presentation
- `standards.css` — standards
- `performance-metrics.css` — performance
- `onboarding.css` — onboarding

`components.css` is intentionally small and should retain only genuinely shared application presentation that has not yet earned a more explicit owner.

## Duplicate-selector contract

The architecture check now detects exact cross-file selector duplication after normalising whitespace and respecting commas inside functional selectors such as `:where(...)`.

A duplicate is permitted only when its ownership is explicitly documented as a layered contract:

- `*`, `*::before`, `*::after` — `base.css` + `quality.css` for reduced-motion behaviour.
- `input`, `select`, `textarea` — `base.css` + `shared-components.css`; base supplies inherited form typography while shared components supplies control presentation.
- `.btn` — `base.css` + `shared-components.css`; base supplies the reduced-motion extension.
- `.site-header .brand` — `base.css` + `shell.css`; base supplies reduced-motion behaviour while shell owns the presentation.
- `.progress span` — `base.css` + `components.css`; base supplies the reduced-motion extension while components owns the progress presentation.

Everything else that becomes an exact cross-file duplicate fails the architecture check. Scoped selectors such as `.audit-overview .score-list` are not treated as duplicate primitive definitions.

## !important contract

There are currently four `!important` declarations, all in `quality.css` and all part of the reduced-motion contract:

- `scroll-behavior`
- `animation-duration`
- `animation-iteration-count`
- `transition-duration`

The architecture check keeps a maximum of four. New `!important` declarations therefore require an explicit architectural decision rather than being introduced as cascade compensation.

## Verification contract

The CSS architecture slice is considered verified only when the repository gates pass:

- `npm test`
- `npm run lint`
- `npm run test:css-architecture`
- `npm run build`
- Chromium/E2E rendered QA
- public performance budget
- representative public and application desktop/mobile checks
- keyboard focus
- reduced motion
- horizontal-overflow checks
- no new browser console/request errors

The rendered application acceptance for `/app/audits/new` and `/app/audits` is covered by #303/#304. The public five-page rendering and accessibility acceptance is covered by the Phase 1 quality work.

## What remains for #167

The structural migration and the main quality-hardening work are substantially complete. The final decision is now evidence-based:

1. keep the explicit stylesheet ownership and import contract;
2. keep duplicate-selector and `!important` regression checks;
3. keep architecture documentation measured against current source;
4. reassess the parent issue after the current PR's full repository gates and rendered QA pass.

No Phase 2 work is part of this refactor slice.
