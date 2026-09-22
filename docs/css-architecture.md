# Ottimo CSS Architecture Baseline

> Baseline updated for the CSS ownership migrations through PR #244 and the current feature-boundary work in #245. This document records the current migration state; it is not a proposal to rewrite the styling system.

## Purpose

Issue #167 is a controlled refactor, not a visual rewrite. The repository already contains part of the intended architecture. The job now is to finish that migration without creating another override layer.

The governing rule is:

**one concern → one owner → one predictable cascade path**

New CSS should not be added to a legacy file merely because that file is currently imported.

## Current import surface

`src/main.tsx` currently imports these global stylesheets, in this order:

1. `tokens.css`
2. `base.css`
3. `shell.css`
4. `shared-components.css`
5. `public-site.css`
6. `components.css`
7. `recommendations.css`
8. `dashboard.css`
9. `platform-pages.css`
10. `concepts.css`
11. `lead-home.css`
12. `public-refresh.css`
13. `public-services.css`
14. `audit.css`
16. `standards.css`
17. `performance-metrics.css`
18. `onboarding.css`
19. `quality.css`

The ordering is currently functional but still acts as a significant part of the cascade contract. The target is for ownership and specificity to make this ordering much less fragile.

## Current inventory

| Stylesheet | Size | Approx. selector rules | Media queries | !important | Current role | Direction |
|---|---:|---:|---:|---:|---|---|
| `tokens.css` | 2.5 KB | 1 | 0 | 0 | Design tokens | **Keep / authoritative** |
| `shell.css` | 8.9 KB | 97 | 5 | 1 | App shell + navigation | **Keep / consolidate** |
| `shared-components.css` | 1.7 KB | 16 | 0 | 0 | Shared primitives | **Keep / authoritative** |
| `public-site.css` | 2.6 KB | 24 | 3 | 0 | Public shared styles | **Keep / consolidate** |
| `components.css` | 3.5 KB | 36 | 3 | 0 | Mixed component styles | **Consolidate into shared/feature owners** |
| `platform.css` | 17.3 KB | 184 | 12 | 0 | Large mixed application layer | **Split/consolidate** |
| `concepts.css` | 5.7 KB | 1 grouped block | 1 | 0 | Concept pages | **Keep as feature-owned CSS; normalise formatting later** |
| `lead-home.css` | 17.8 KB | 191 | 12 | 0 | Landing page | **Keep as public feature owner** |
| `public-refresh.css` | 7.4 KB | 78 | 7 | 0 | Landing/public additions | **Merge into public feature ownership** |
| `public-services.css` | 2.2 KB | 17 | 2 | 0 | Public services pages | **Keep as feature owner** |
| `audit.css` | ~22 KB | combined audit feature rules | feature-owned | 0 | Audit UI | **Single audit feature owner** |
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

`audit.css` already indicate that audit presentation now has one explicit feature boundary in `audit.css`.

### Typography

PR #193 established the single sans-serif direction. Future CSS migration must preserve that baseline and must not reintroduce serif/Georgia presentation styles.

## Main architectural problems remaining

### 1. Remaining legacy ownership

The former `global.css`, `platform.css`, and other superseded compatibility layers have now been retired. Remaining architectural work is concentrated in feature boundaries and the small amount of mixed presentation still in `components.css`, while completing application feature ownership.

### 2. Duplicate shared primitives

Shared primitives are now substantially consolidated. `shared-components.css` is authoritative for reusable cards, buttons, headings and section-level primitives, while feature styles own domain-specific presentation. Any remaining overlap must be verified from rendered usage before deletion.

### 3. Public-layer overlap

The landing page is owned by `lead-home.css`. `public-refresh.css` is reserved for genuinely reusable public marketing and information-page presentation. PR #245 moves landing-only trust, conversion, audit-preview, audit-output and FAQ presentation out of the refresh layer so it cannot become a second landing-page override layer.

### 4. Specificity dependencies

The recent hero-grid fix is an instructive example. A generic responsive declaration was overridden by a more-specific landing-page selector.

The correct response was to fix ownership/specificity in the feature stylesheet, not to introduce another global override.

### 5. Legacy compatibility surface

`components.css` remains a small compatibility/mixed layer and should only retain genuinely shared presentation. Feature-specific rules should continue moving to explicit owners such as `recommendations.css`, `lead-home.css`, audit styles and onboarding.

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
2. **Foundation extraction** — completed through #197.
3. **Shared primitive consolidation** — substantially completed through the shared card/heading work and PR #244 recommendation ownership.
4. **Shell isolation** — completed through #201/#203.
5. **Public consolidation** — reduce overlap between `lead-home.css` and `public-refresh.css`.
6. **Audit consolidation** — completed through #247/#248 with a single `audit.css` owner.
7. **Application feature cleanup** — migrate remaining mixed component rules and verify `dashboard.css`/`platform-pages.css` feature boundaries.
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

The current implementation slice is #249: remove remaining feature-owned presentation from `components.css` and return it to explicit feature owners. After it lands, continue with remaining application feature ownership and then quality hardening.

`global.css` and `platform.css` are retired. The success criterion is not merely fewer lines of CSS; it is a predictable ownership graph with explicit shared/application/feature boundaries.
