# CSS Foundation

Ottimo's foundational design values are owned by `src/styles/tokens.css`.

## Token ownership

Use canonical `--color-*`, `--space-*`, `--container-*`, `--radius-*`, `--font-*`, `--focus-*`, `--motion-*` and `--shadow-*` tokens for new CSS.

The shorter historical variables such as `--forest`, `--line` and `--cream` remain as compatibility aliases during migration. New code must not introduce additional uses of those aliases.

## Migration rule

This foundation slice intentionally does not migrate every existing declaration. Feature styles will be migrated in separate issues so visual regressions remain attributable to a small PR.

Do not:
- add new raw brand colours;
- add new arbitrary spacing values when an existing token fits;
- introduce new typography stacks outside the foundation;
- introduce `!important` to compensate for token migration;
- change evidence/audit semantics as part of styling refactors.

## Layer order

`tokens.css` loads before the existing global/component/feature styles. The current multi-file cascade remains temporarily while the refactor programme consolidates ownership.

The intended future direction is:

1. tokens/foundation
2. reset/base
3. shared components
4. application shell
5. feature styles
6. public-site styles
7. route-specific exceptions

## Completion criteria

The token layer is considered stable enough for later migration when:
- every new design value can be expressed through it;
- shared components can consume it without contextual overrides;
- responsive/container values have explicit ownership;
- later CSS consolidation can remove compatibility aliases safely.

## Shared component ownership

The first shared primitive layer is `src/styles/shared-components.css`. It owns reusable controls and surfaces including `.btn`, button variants, `.card`, `.eyebrow`, `.muted` and `.section-head`.

Feature styles may extend these primitives, but must not redefine their base contract. Feature-specific visual variants remain local to the feature. New shared primitives should be added here only when they are genuinely reused across public and application surfaces.

## Public-site ownership

The shared public-site structure is owned by `src/styles/public-site.css`. It contains generic marketing/content-page structure such as hero framing, content pages, callouts and footer structure. Landing-page composition remains in `lead-home.css`; service-page composition remains in `public-services.css`; the newer marketing refinement layer remains in `public-refresh.css` until those feature-specific slices are independently consolidated.

Application-only selectors must not be introduced into this layer. Public pages should remain renderable without application feature styles.

## Landing-page ownership

Landing-page composition is owned by `src/styles/lead-home.css`. Landing-only hero conversion, ethos, audit-preview and responsive rules belong there. `public-refresh.css` is reserved for genuinely reusable public marketing refinements; it must not become a second landing-page override layer.


## Application and audit feature ownership

The application feature layer is split by feature rather than by generic visual primitive:

- `platform.css` owns reusable application/platform surfaces and platform-page composition. Audit-only evidence and AI decision presentation must not be added here.
- `audit-overview.css` owns the audit overview surface, including the authoritative `.audit-stat-grid`, interpretation surface and audit-specific decision presentation.
- `audit-expansion.css` owns deeper audit evidence, command-centre, evidence explorer and resource-detail presentation. It consumes the audit overview's shared audit-stat contract rather than redefining it.
- `performance-metrics.css` owns performance metric explanation and status presentation; the audit interpretation surface is owned by `audit-overview.css`.
- `standards.css` owns standards/criterion presentation.
- `onboarding.css` owns audit setup/loading states.

When a selector is used by more than one audit sub-surface, establish one authoritative definition in the owning audit feature stylesheet rather than adding a later override.


## Legacy override-layer removal

The superseded `overrides.css` and `menu-overrides.css` layers have been removed. Their remaining legitimate rules were redistributed to their owning layers: `shell.css` for shell spacing, `platform.css` for platform preview sizing, `public-site.css` for shared public structure, and `lead-home.css` for landing-page composition. Foundational document behaviour remains in `global.css`.

New CSS must not recreate these concerns as a later override layer.
