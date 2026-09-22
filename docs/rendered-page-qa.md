# Rendered-page QA

Ottimo's rendered-page suite treats browser output as a first-class quality surface.

## What it checks

`tests/e2e/rendered-pages.spec.ts` runs against Chromium desktop and mobile projects and:

- renders public pages and representative application pages;
- checks uncaught page errors and browser console errors;
- checks failed requests and same-origin HTTP errors;
- checks horizontal overflow;
- runs the repository's pinned `axe-core` against the rendered document;
- captures full-page desktop/mobile screenshots into `test-results/rendered-pages/`.

The suite does not invent or assert visual scores. Screenshots are evidence for review and can become regression baselines later where stable visual contracts justify it.

## Local review

```bash
npx playwright install chromium
npm run test:e2e
npm run test:e2e:rendered
```

Generated screenshots are under `test-results/rendered-pages/`.

## CI

The Quality Gate runs rendered-page QA and uploads `test-results/` as a workflow artifact, including screenshots from successful tests.

This means UI changes can be reviewed from CI output without asking a developer to manually capture every page.

## Production / Netlify

Netlify also generates a deployment screenshot for production and deploy previews. When production rendering is material, check the deploy URL in addition to local rendered QA.

The longer-term target is automatic preview-deployment smoke testing as part of the same workflow.