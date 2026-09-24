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

## Current inventory (measured on 24 September 2026)

The following figures are generated from the current stylesheet surface rather than copied from historical migration notes.

| Stylesheet | Bytes | Selector occurrences | Media queries | !important | Current role |
|---|---:|---:|---:|---:|---|
| `tokens.css` | 2,578 | 1 | 0 | 0 | Design tokens |
| `base.css` | 1,534 | 22 | 1 | 0 | Browser/base foundation |
| `shell.css` | 9,046 | 114 | 5 | 0 | Application/public shell |
| `shared-components.css` | 6,428 | 81 | 4 | 0 | Shared primitives |
| `public-site.css` | 5,846 | 67 | 5 | 0 | Public shared presentation |
| `components.css` | 3,048 | 30 | 2 | 0 | Remaining compatibility/shared presentation |
| `recommendations.css` | 7,042 | 80 | 8 | 0 | Recommendation feature |
| `dashboard.css` | 194 | 4 | 2 | 0 | Dashboard feature |
| `platform-pages.css` | 7,067 | 78 | 6 | 0 | Platform feature pages |
| `concepts.css` | 5,699 | 65 | 1 | 0 | Concepts feature |
| `lead-home.css` | 21,361 | 248 | 17 | 0 | Public landing feature |
| `public-refresh.css` | 11,618 | 105 | 4 | 0 | Public information/shared presentation |
| `public-services.css` | 2,235 | 32 | 2 | 0 | Public services feature |
| `audit.css` | 26,541 | 321 | 22 | 0 | Audit feature |
| `standards.css` | 695 | 8 | 1 | 0 | Standards feature |
| `performance-metrics.css` | 1,550 | 20 | 1 | 0 | Performance feature |
| `onboarding.css` | 5,639 | 74 | 2 | 0 | Onboarding feature |
| `quality.css` | 545 | 6 | 2 | 4 | Quality/reduced-motion contracts |

**Measured total:** 118,649 bytes, 1,440 selector occurrences, 85 media-query occurrences and 4 `!important` declarations.

These are source-level architecture metrics, not compressed production bundle measurements. They make structural changes measurable and repeatable.
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

## Current implementation slice

The next slice is **quality hardening and architecture verification**.

It establishes a small automated contract around the architecture already present on `master`:

- `src/main.tsx` must retain the deliberate stylesheet layer order;
- retired stylesheet names must not return;
- `.btn`, `.card`, `.eyebrow`, `.muted` and `.section-head` must remain authoritative in `shared-components.css`;
- the repository-wide `!important` count must not increase above the current four declarations, which are confined to the reduced-motion contract in `quality.css`;
- source-level CSS inventory metrics are printed on every quality run.

This is deliberately a guardrail, not a CSS rewrite. The check does not treat every repeated selector as a defect because feature styles legitimately extend shared primitives. It catches ownership regressions at architectural boundaries that can be checked deterministically.

The current refactor slice also removed three legacy compensation declarations from `shell.css`, `audit.css` and `onboarding.css` without changing their intended visual contracts.

`global.css` and the historical `platform.css` layer are retired. The success criterion is not merely fewer lines of CSS; it is a predictable ownership graph with explicit shared/application/feature boundaries.
