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
