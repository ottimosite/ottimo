# Ottimo audit engine

The audit engine is an internal bounded module. Ottimo remains a monolithic product and deployment, while collection and analysis stay isolated from UI, persistence and presentation code.

## Engine owns

- target validation and SSRF safeguards
- rendered Chromium collection
- network and browser timing evidence
- axe-core accessibility capture
- performance, accessibility, SEO and technical rules
- evidence, checks, measurements and findings
- structured audit failures

## Product owns

- authentication, projects and persistence
- audit history and prioritisation
- business interpretation and reports
- future AI features

React code must not import Playwright, Node DNS APIs or collectors. Server-side code invokes the engine and translates its AuditReport into Ottimo's domain model.

## Runtime boundary

The React application calls /.netlify/functions/audit-site. That function owns browser execution and returns an AuditReport. The function uses Playwright with a serverless Chromium binary so target websites are never fetched directly by the user's browser.

Netlify Functions currently provide configurable memory up to 4096 MB and a synchronous execution limit of 60 seconds. The audit function is configured for 2048 MB and a 55-second function timeout, leaving a small platform margin for the engine's 50-second navigation cap.

## Measurement policy

Unknown measurements remain unavailable. The engine does not manufacture Core Web Vitals, scores or performance values from HTML size or other proxies.

## Security

User-controlled targets are validated before navigation. Credentials, non-HTTP(S) protocols, non-standard ports and DNS results in private/reserved ranges are rejected. Navigation requests are revalidated during browser redirects. Production infrastructure should additionally enforce network egress policy and rate limits because application-level DNS validation cannot by itself eliminate every DNS-rebinding scenario.

## Growth path

The module can later be extracted into @ottimo/audit-engine without changing the product-facing contract if independent deployment becomes useful.
