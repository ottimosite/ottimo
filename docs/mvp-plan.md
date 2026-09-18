# Ottimo MVP Delivery Plan

## Working method

Each product stage is implemented on a dedicated branch and delivered through a focused pull request. Every PR should build, lint and test before it is considered complete.

## Stage 1 — Foundation

- establish domain contracts
- document audit lifecycle and provider boundaries
- define evidence and finding structures
- preserve the current working UI

## Stage 2 — Onboarding

- URL-first entry
- progressive discovery status
- URL validation and normalisation
- website identity detection
- robots.txt and sitemap discovery
- technology and page discovery
- audit priority selection
- real progress based on pipeline state

Acceptance journey:

Landing → URL → discovery → priorities → audit.

## Stage 3 — Discovery engine

- fetch policy
- robots handling
- sitemap parsing
- canonical URL normalisation
- internal URL extraction
- duplicate URL handling
- page inventory
- crawl limits and safety controls
- site/page coverage reporting

## Stage 4 — Audit engines

Performance:
- transfer size
- requests
- resource classes
- caching/compression signals
- render-blocking resources
- images/fonts/scripts
- Core Web Vitals through a rendered-browser provider

Accessibility:
- document language
- headings
- landmarks
- labels
- images
- keyboard/focus signals
- contrast
- ARIA and semantic structure

SEO:
- titles
- descriptions
- canonicals
- robots
- sitemap
- indexability
- structured data
- internal linking
- duplicate/weak metadata

Technical:
- HTTP errors
- redirects
- broken resources
- mixed content
- malformed URLs
- sitemap inconsistencies

UX:
- measurable/observable interface signals only.

## Stage 5 — Results

- executive summary
- domain health
- evidence-backed findings
- affected pages
- severity and priority
- impact explanation
- recommended fix
- effort
- audit coverage and limitations

## Stage 6 — Improvement plans

- convert findings into an action queue
- group related work
- track status
- show expected impact and effort
- generate implementation plans

## Stage 7 — AI

AI receives structured Ottimo evidence and produces:
- plain-language explanations
- business summaries
- implementation plans
- technical assistance

AI must not be the source of truth for measured audit results.
