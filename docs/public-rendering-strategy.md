# Public rendering and progressive enhancement strategy

> **Status:** Architecture contract for issue #269  
> **Runtime baseline:** Node.js 24  
> **Framework baseline:** React + TypeScript + Vite + React Router  
> **Hosting:** Netlify

## Purpose

Ottimo currently uses one React/Vite application for both its public website and authenticated application workspace. This document establishes the rendering contract for the next stage of the architecture without introducing a second framework or application.

The goal is to move public routes toward generated/static HTML while retaining the existing React/Vite/React Router foundation and keeping the interactive `/app/*` workspace as the application boundary.

This document is a design contract. It does not itself implement public static generation.

## Architectural decision

Ottimo will continue within the existing architecture:

- React remains the UI framework.
- TypeScript remains the implementation language.
- Vite remains the build tool.
- React Router remains the route model.
- Netlify remains the deployment platform.
- Netlify Functions remain the server-side runtime boundary.
- Existing domain, audit, evidence, repository and authentication boundaries remain intact.

No migration to Gatsby, Next.js or another application framework is required by this strategy.

## Route rendering boundary

### Public routes

The following are public/content routes and are candidates for generated static HTML:

- `/`
- `/services`
- `/performance`
- `/seo`
- `/accessibility`
- `/ai`
- `/methodology`
- `/usability`
- `/technical`
- `/pricing`
- `/about`
- `/case-studies`
- `/contact`
- `/example-audit`
- `/concepts/*`

Public pages must be understandable, navigable and content-complete in their initial HTML response.

### Application routes

The `/app/*` subtree remains the authenticated application boundary.

It includes:

- dashboard
- websites
- website detail
- insights
- audits
- audit creation/run
- audit detail
- performance
- accessibility
- SEO
- usability
- technical
- AI readiness
- recommendations
- reports
- history
- settings

These routes may remain application-rendered and JavaScript-dependent where the product interaction requires it.

## Generated public HTML contract

For a public route, the production document returned for the route must contain the essential page content without requiring JavaScript execution.

At minimum, generated HTML must contain:

1. The correct document title.
2. The correct meta description where applicable.
3. The canonical URL.
4. Appropriate robots directives.
5. Appropriate Open Graph metadata.
6. Appropriate Twitter/social metadata where used by the site contract.
7. The primary page heading.
8. The meaningful page copy and content structure.
9. Semantic navigation and links to other public content.
10. The primary public CTA and its destination.
11. Accessible structural landmarks.

React hydration/enhancement may add interaction after the document is available, but it must not be the mechanism by which essential public content first appears.

## No-JavaScript contract

With JavaScript disabled:

- public content remains readable;
- headings, paragraphs and lists remain available;
- navigation links continue to work;
- ordinary internal links continue to navigate;
- the primary public CTA continues to work;
- forms that are explicitly designed as server/native submissions may continue to operate;
- content is not replaced by an empty application shell;
- metadata remains present in the initial document.

Interactive enhancements that cannot operate without JavaScript must fail honestly and accessibly rather than pretending that an action succeeded.

The authenticated `/app/*` workspace is not required to provide a full no-JavaScript product experience. Its boundary must instead remain explicit so public content is not accidentally made dependent on application runtime boot.

## Progressive enhancement boundary

Public React code may enhance an already usable document.

Examples of acceptable enhancement include:

- mobile menu behaviour;
- disclosure controls;
- non-essential animation;
- client-side convenience interactions;
- richer form validation after native validation is available;
- visual or interaction improvements that do not replace essential content.

Public components must not require browser-only APIs to construct essential content.

Browser-dependent APIs such as `window`, `document`, `localStorage`, `sessionStorage`, `navigator` and `matchMedia` must remain inside explicitly client-only enhancement paths.

The public rendering path must not assume that these APIs exist during build-time generation.

## Metadata ownership

Public route metadata must be derived from the route/content contract rather than being assembled opportunistically after hydration.

Each public route should have one authoritative metadata definition covering, where applicable:

- title;
- description;
- canonical URL;
- robots;
- Open Graph;
- Twitter/social metadata.

Metadata must be present in generated HTML.

Client-side metadata mutation may be retained temporarily during the migration for compatibility, but it must not be the long-term source of truth for public metadata.

## SEO and crawlability

Generated public HTML must support ordinary crawler access without relying on client-side JavaScript.

The public rendering implementation must preserve:

- canonical URLs;
- robots.txt;
- sitemap.xml;
- internal links;
- semantic headings;
- stable public URLs;
- truthful metadata;
- appropriate status handling for known routes.

No public rendering change may introduce claims that cannot be supported by Ottimo's evidence model.

## Data boundary

Public generation must only use data intended for public consumption.

It must not expose:

- authentication/session data;
- tenant data;
- private audit results;
- secrets;
- server-only configuration;
- internal storage credentials;
- private user information.

The public example-audit experience may use deterministic fixture evidence where explicitly labelled as such. Fixture evidence must not be represented as a live customer measurement.

## Netlify routing contract

The current deployment uses a global SPA fallback to `/index.html`. That is compatible with the existing application but is not the final public-rendering contract.

When public static generation is implemented:

- generated public paths must resolve to their generated documents;
- `/app/*` must continue to resolve into the application shell/runtime;
- Netlify Functions must retain their function routing;
- assets must resolve without unnecessary SPA fallback;
- unknown public routes must not silently render an unrelated valid page;
- direct navigation and refresh must remain valid for application routes.

Routing changes belong to the implementation phase. This issue does not change the current routing behaviour.

## Local, CI, preview and production parity

The same architectural boundary must be testable in all environments.

Local development should provide a way to inspect:

- generated/public HTML;
- application routes;
- metadata in the initial response;
- no-JavaScript public behaviour.

CI must verify the public rendering contract without requiring third-party network access.

Netlify Deploy Previews must use the same build and routing model as production.

Production verification must include both a representative public route and a representative `/app/*` route.

## Testing contract

The public rendering implementation should add automated checks for:

### HTML/content

- essential content exists in initial HTML;
- primary heading exists;
- public navigation links exist;
- CTA destination exists.

### Metadata

- title;
- description;
- canonical;
- robots;
- Open Graph/social metadata where applicable.

### JavaScript independence

- representative public pages render meaningful content with JavaScript disabled;
- public navigation remains usable;
- no public route depends on a client-only API during generation.

### Routing

- representative public nested route resolves directly;
- representative `/app/*` route resolves directly;
- Netlify Functions remain reachable;
- unknown routes behave intentionally.

### Accessibility

- semantic landmarks and heading hierarchy remain intact;
- keyboard navigation remains usable;
- focus behaviour remains predictable;
- no information depends solely on client-side enhancement.

### Performance

Measure generated public HTML and production assets against the existing public performance budgets. Do not replace real measurements with proxy scores.

## Runtime standard: Node.js 24

Node.js 24 is the canonical Ottimo runtime for:

- local development;
- CI;
- Netlify builds/functions where the platform runtime is configurable;
- deployment documentation;
- repository runtime declarations.

Node 22 should no longer be described as the supported project runtime.

The project should use a compatible Node 24 declaration in `package.json`, CI should remain on Node 24, and Netlify should use Node 24.

The `@types/node` package may remain on its current compatible declaration unless a later dependency update requires a change; runtime selection and type-package version are separate concerns.

## Evidence and domain integrity

This rendering strategy does not change the audit evidence model.

The following remain mandatory:

- measured, inferred and unavailable states remain distinct;
- unsupported scores remain unavailable;
- fixture data remains explicitly identifiable;
- public content does not imply live measurements where none exist;
- rendering must not move audit collection or interpretation into UI components;
- server-side security boundaries remain server-side.

## Migration sequence

1. Establish this architecture contract.
2. Implement a public route/content manifest or equivalent authoritative public-page definition.
3. Introduce generated public HTML within the existing Vite build architecture.
4. Preserve React enhancement for interactions that benefit from it.
5. Replace client-only public metadata ownership with build-time metadata.
6. Update Netlify routing so generated public paths and `/app/*` coexist explicitly.
7. Add generated-HTML and no-JavaScript CI coverage.
8. Verify desktop/mobile, accessibility, SEO and performance contracts.
9. Remove obsolete public client-rendering workarounds only after usage is proven.
10. Keep the authenticated application architecture unchanged unless a separate issue requires it.

Each implementation step should be a focused issue/PR with CI as the merge gate.

## Non-goals

This strategy does not:

- replace Vite;
- replace React;
- replace React Router;
- introduce Next.js or Gatsby;
- redesign the public site;
- rewrite the audit engine;
- change audit evidence semantics;
- make the authenticated workspace static;
- introduce a third-party rendering platform;
- require client-side JavaScript for public content.

## Definition of done for the strategy

The repository has one documented rendering boundary:

```text
Public routes
  → generated/static HTML
  → progressive React enhancement

/app/*
  → authenticated application runtime

Netlify Functions
  → server-side execution boundary
```

The boundary is explicit, testable and compatible with Ottimo's existing React/Vite/React Router architecture.
