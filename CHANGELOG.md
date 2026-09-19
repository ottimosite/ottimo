# Changelog

## Unreleased

### Added

- Internal src/audit-engine boundary.
- Server-side rendered browser collection with Playwright.
- axe-core accessibility capture.
- browser timing evidence including TTFB, FCP, LCP, CLS and INP when exposed by the browser.
- structured evidence, checks, measurements, findings and audit errors.
- Netlify server-side audit function and serverless Chromium configuration.
- audit-engine unit coverage and authoring documentation.

### Changed

- Live audit UI no longer fetches target websites from the React client.
- Audit requests are routed through the server-side audit engine.
