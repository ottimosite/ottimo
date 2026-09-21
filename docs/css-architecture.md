# Ottimo CSS Architecture Baseline

> Baseline taken from `master` after PR #193 (single sans-serif typography). This document records the existing migration groundwork and the remaining architecture problem; it is not a proposal to rewrite the styling system.

## Purpose

Issue #167 is a controlled refactor, not a visual rewrite. The repository already contains part of the intended architecture. The job now is to finish that migration without creating another override layer.

The governing rule is:

**one concern → one owner → one predictable cascade path**

New CSS should not be added to a legacy file merely because that file is currently imported.

## Current import surface

`src/main.tsx` currently imports these global stylesheets, in this order:

1. `tokens.css`
2. `shell.css`
3. `shared-components.css`
4. `public-site.css`
5. `global.css`
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

The ordering is currently functional but still acts as a significant part of the cascade contract. The target is for ownership and specificity to make this ordering much less fragile.

## Current inventory

| Stylesheet | Size | Approx. selector rules | Media queries | !important | Current role | Direction |
|---|---:|---:|---:|---:|---|---|
| `tokens.css` | 2.5 KB | 1 | 0 | 0 | Design tokens | **Keep / authoritative** |
| `shell.css` | 8.9 KB | 97 | 5 | 1 | App shell + navigation | **Keep / consolidate** |
| `shared-components.css` | 1.7 KB | 16 | 0 | 0 | Shared primitives | **Keep / authoritative** |
| `public-site.css` | 2.6 KB | 24 | 3 | 0 | Public shared styles | **Keep / consolidate** |
| `global.css` | 9.6 KB | 90 | 9 | 0 | Mixed foundation + legacy compatibility + UI | **Reduce heavily** |
| `components.css` | 3.5 KB | 36 | 3 | 0 | Mixed component styles | **Consolidate into shared/feature owners** |
| `platform.css` | 17.3 KB | 184 | 12 | 0 | Large mixed application layer | **Split/consolidate** |
| `concepts.css` | 5.7 KB | 1 grouped block | 1 | 0 | Concept pages | **Keep as feature-owned CSS; normalise formatting later** |
| `lead-home.css` | 17.8 KB | 191 | 12 | 0 | Landing page | **Keep as public feature owner** |
| `public-refresh.css` | 7.4 KB | 78 | 7 | 0 | Landing/public additions | **Merge into public feature ownership** |
| `public-services.css` | 2.2 KB | 17 | 2 | 0 | Public services pages | **Keep as feature owner** |
| `audit-overview.css` | 9.9 KB | 78 | 8 | 1 | Audit UI | **Keep as audit feature owner; remove legacy overlap** |
| `audit-expansion.css` | 11.6 KB | 89 | 11 | 0 | Audit UI extensions | **Consolidate with audit ownership** |
| `standards.css` | 0.7 KB | 1 grouped block | 1 | 0 | Standards feature | **Keep; consider merging if ownership remains tiny** |
| `performance-metrics.css` | 1.6 KB | 1 grouped block | 1 | 0 | Performance feature | **Keep; consider merging if ownership remains tiny** |
| `onboarding.css` | 5.6 KB | 38 | 2 | 1 | Onboarding feature | **Keep as feature owner; remove generic overlap** |
| `quality.css` | 0.5 KB | 2 grouped blocks | 2 | 4 | Quality/utility styles | **Audit and reduce !important** |

Rule counts are an inventory heuristic rather than a CSS parser result; grouped/minified selectors can make the count conservative.

## What has already been achieved

### Tokens

`tokens.css` is already the correct foundation for design tokens. It owns the primary custom-property vocabulary and should remain the authoritative source.

### Shared components

`shared-components.css` already establishes a small shared component layer. This is the correct direction for primitives such as cards and section headings.

### Shell

`shell.css` has a clear application-shell purpose. It should remain responsible for navigation, application chrome and shell layout rather than becoming a general-purpose application stylesheet.

### Public feature ownership

`lead-home.css`, `public-services.css` and related public styles already provide meaningful feature boundaries. These should be consolidated rather than replaced.

### Audit feature ownership

`audit-overview.css` and `audit-expansion.css` already indicate that audit presentation has a feature boundary. The next step is to decide which rules are genuinely shared audit primitives versus route-specific presentation.

### Typography

PR #193 established the single sans-serif direction. Future CSS migration must preserve that baseline and must not reintroduce serif/Georgia presentation styles.

## Main architectural problems remaining

### 1. Foundation leakage

`global.css` contains both genuine foundational rules and application/component rules. This makes it difficult to know whether a selector is globally contractual or merely legacy.

The first migration target is therefore not deletion; it is classification.

### 2. Duplicate shared primitives

Current cross-file overlap includes examples such as:

- `.card` — shared components, global and platform layers
- `.section-head` — shared components and platform
- `.recommendation` / `.rec-meta` — global and components
- `.app-content` — shell, global and platform
- `.website-context` and related navigation selectors — shell and global
- `.auth-account` — shell and platform
- form controls such as `input`, `select`, `textarea` — shell/global/platform
- `.site-header nav a` — shell and public-site

These are migration candidates. The exact authoritative definition must be established from rendered usage before deleting any rule.

### 3. Public-layer overlap

The landing page currently spans `lead-home.css` and `public-refresh.css), with selectors such as `.lead-hero h1`, `.preview-action`, `.preview-note` and `.coverage-item` appearing across both layers.

The desired outcome is a single clear public feature owner per component, not another override stylesheet.

### 4. Specificity dependencies

The recent hero-grid fix is an instructive example. A generic responsive declaration was overridden by a more-specific landing-page selector.

The correct response was to fix ownership/specificity in the feature stylesheet, not to introduce another global override.

### 5. Legacy compatibility surface

`global.css`, `components.css` and `platform.css` contain a mixture of older and newer patterns. They should not be deleted wholesale. Rules need to migrate into the appropriate owner and then be removed from the legacy layer.

## Target architecture

The intended dependency direction is:

```text
tokens / foundations
        ↓
reset + base
        ↓
shared components
        ↓
application shell
        ↓
feature styles
        ├── public
        ├── audit
        ├── onboarding
        └── other application features
        ↓
narrow route-specific exceptions
```

A feature may consume lower layers. Lower layers must not depend on feature styles.

### Ownership rules

- Tokens belong in `tokens.css`.
- Global browser/base behaviour belongs in a small foundation/base layer.
- Shared UI primitives have one authoritative definition.
- Shell/navigation rules belong to the shell.
- Public landing/service rules belong to public feature styles.
- Audit presentation rules belong to audit feature styles.
- Onboarding rules belong to onboarding.
- Route-specific exceptions must be narrowly scoped to the route/feature.
- Domain logic does not belong in CSS or presentation components.
- Do not use `!important` to repair uncertain ownership.
- Do not create a new override file to resolve a conflict.
- Do not add a selector to a legacy stylesheet simply because it is already imported.

## Migration order

The migration should proceed in small PRs:

1. **Baseline/inventory** — this document.
2. **Foundation extraction** — separate true reset/base contracts from `global.css`.
3. **Shared primitive consolidation** — establish authoritative card/button/section/form/focus primitives.
4. **Shell isolation** — keep application chrome independent of feature styles.
5. **Public consolidation** — reduce overlap between `lead-home.css` and `public-refresh.css`.
6. **Audit consolidation** — establish a coherent audit presentation boundary.
7. **Application feature cleanup** — migrate remaining `platform.css`/component rules.
8. **Delete obsolete rules/files** — only after usage is proven absent.
9. **Quality hardening** — add checks that prevent duplicate ownership and cascade regressions.

Each migration PR should preserve the same rendered behaviour unless a deliberate product change is explicitly part of the PR.

## Verification contract

Every CSS migration should validate:

- `npm test`
- `npm run lint`
- `npm run build`
- `npm run test:e2e`
- representative public desktop/mobile rendering
- representative application desktop/mobile rendering
- keyboard focus behaviour
- reduced-motion behaviour
- no new console errors
- no new horizontal overflow
- typography remains on the #193 sans-serif contract

## Non-goals

This baseline does **not**:

- rewrite the site;
- introduce CSS modules or another styling framework;
- redesign the visual system;
- remove styles based solely on apparent duplication;
- change audit evidence semantics;
- change authentication/storage behaviour;
- claim that the stylesheet migration is complete.

## Next implementation slice

The next implementation PR should extract the genuine foundation/base responsibilities currently living in `global.css`, while preserving behaviour and leaving component/feature migration for subsequent focused PRs.

Before deleting any global rule, confirm its consumers and move it to the correct owner. The success criterion is not merely fewer lines of CSS; it is a more predictable ownership graph.
