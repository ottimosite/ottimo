# Ottimo

Ottimo is a performance-first React SaaS-style demo platform for web performance, technical SEO, accessibility, usability and AI-readiness.

## Run locally

```bash
npm install
npm run dev
```

The demo requires no API keys, database or external SaaS services.

## Commands

```bash
npm run dev
npm run build
npm run preview
npm run test
npm run lint
```

## Architecture

- React + TypeScript + Vite
- React Router for public/app routes
- Lightweight CSS design system instead of a large UI framework
- Typed domain models in `src/types`
- Replaceable audit boundary: `AuditProvider`
- Deterministic local `MockAuditProvider` backed by a captured real-site fixture
- Local repositories via `localStorage`
- Server-side authenticated tenant repository
- Provider-independent durable storage contract with a Netlify production adapter
- Authenticated tenant repository boundary via `SessionVerifier`
- Durable server storage through the `ServerStorageAdapter` contract
- Native SVG/CSS-style data presentation; no charting library
- Vitest + Testing Library for automated tests

## Project structure

```text
src/
  components/       shared UI + layouts
  data/             deterministic fixtures
  features/         dashboard, websites, audits, recommendations, platform views
  lib/              validation and formatting utilities
  pages/            public website pages
  services/         audit, authentication, persistence and runtime integrations
  styles/           global responsive design system
  services/         audit provider, authentication and persistence boundaries
  styles/            global responsive design system
  tests/             unit/component tests
  types/             domain models
```

## Demo behaviour

The app starts with a saved snapshot of a real public website: Wikipedia. The default fixture is captured from `https://www.wikipedia.org/` and stored locally so the UI and CI never depend on a live third-party request. New audits still use the local provider until the live audit provider is selected.

The snapshot is deliberately conservative: structural observations are retained as evidence, while browser performance measurements are represented as unavailable rather than invented. This keeps the demo useful without presenting fixture data as a live Lighthouse or Core Web Vitals result.

## Wikipedia real-site snapshot

The deterministic fixture lives in `src/data/fixtures/wikipedia.ts`. It records the public Wikipedia portal observed on 20 September 2026, including its title, multilingual structure, language links and captured scope. The fixture is a testing snapshot, not a claim that the live site is unchanged.

To refresh it, capture the public `https://www.wikipedia.org/` portal again, record the new capture date and source revision/observations, update the fixture, and update its tests. Do not make CI fetch Wikipedia directly.

## Production persistence

The server-side persistence path is provider-independent at the repository boundary:

1. `AuthenticatedTenantRepository` verifies the session before tenant operations.
2. `DurableServerStorageAdapter` validates versioned tenant envelopes.
3. `NetlifyBlobObjectStore` maps that contract to Netlify Blobs.
4. `createProductionRepository()` composes the authenticated production repository.

Netlify production uses a site-wide strongly consistent store. Preview and branch deployments use deploy-scoped storage so non-production data is isolated from production. The runtime receives Netlify storage configuration from the platform; no storage credentials are committed to the repository.

Set `OTTIMO_SESSION_SECRET` as a server-side environment variable with at least 32 characters. Local tests inject their own secret and never require Netlify credentials.
## Authentication boundary

The authenticated application uses a replaceable server-session boundary. Production deployments can enable it with `VITE_AUTH_REQUIRED=true`. The browser never stores session secrets or credentials.

- `OTTIMO_SESSION_SECRET`: server-only HMAC session verification secret (minimum 32 characters).
- `OTTIMO_AUTH_LOGIN_URL`: server-side identity-provider login URL used by the auth login redirect.
- `VITE_AUTH_LOGIN_URL`: optional public override for the login entry point; defaults to Ottimo's server auth-login function.
- The authenticated workspace checks `/.netlify/functions/auth-session` before rendering workspace data.
- Sign-out clears the `ottimo_session` HttpOnly cookie through the server endpoint.
- Local/demo development keeps the existing demo workspace when `VITE_AUTH_REQUIRED` is not enabled.

The auth layer intentionally does not choose an identity provider. The provider is responsible for authenticating the user and establishing the signed `ottimo_session` cookie expected by the server verifier.

## Persistence boundary

Production-facing tenant persistence is split into two provider-independent layers:

1. `AuthenticatedTenantRepository` verifies the server session before accessing tenant data.
2. `DurableServerStorageAdapter` validates and persists versioned envelopes through an injected durable object store.

A platform-specific server integration can provide the durable object store without leaking vendor types into the domain or repository layer. Local tests and development can continue to use deterministic in-memory adapters. Production secrets and storage credentials must remain environment-managed.

## Future integrations

The current service boundaries are designed so real Lighthouse/PageSpeed/crawler, authentication, durable storage, billing, AI, reporting and monitoring providers can replace the local providers without rewriting the UI.

## Performance and accessibility checklist

- Mobile-first responsive layout
- Semantic HTML and landmarks
- Skip link and visible focus states
- Keyboard-friendly controls
- Reduced-motion support
- Minimal third-party dependencies
- Route-based application structure ready for lazy loading
- No external fonts required
- Stable dimensions and simple CSS visualisations
- Deterministic local data for reproducible tests

## Environment

Production secrets and platform configuration must be managed through the deployment environment rather than committed to source control.
Copy `.env.example` only when adding environment-specific integrations. The local demo does not need environment variables. Production storage credentials, when required by the selected server platform, must be configured through the platform environment rather than committed to the repository.
## Real-site acceptance scenarios

The audit engine has deterministic acceptance contracts under `src/audit-engine/acceptance/`. These remain synthetic structural fixtures for edge-case coverage, while the default product/demo snapshot uses the captured real Wikipedia site described above.

When adding a scenario:
1. Model the smallest representative page/crawl structure that exercises the regression.
2. Keep observed values explicit; use `undefined` for unavailable browser measurements.
3. Assert the evidence contract (URL, status, redirect chain, resource data, discovery state) rather than presentation markup.
4. Include the failure mode and audit stage in the test name.
5. Do not add fabricated traffic, conversion, acquisition or other business telemetry.
6. Keep external origins represented only as fixture data; acceptance tests must not require third-party network access.

## Engineering workflow

GitHub is the single source of truth for Ottimo planning and delivery. See [docs/engineering-workflow.md](docs/engineering-workflow.md) for the branch, issue, PR and quality-gate workflow.


## Production security boundary

The deployed browser surface applies baseline security headers through `netlify.toml`:

- Content Security Policy limits executable content and prevents cross-origin framing.
- `X-Content-Type-Options: nosniff` prevents MIME sniffing.
- `Referrer-Policy: strict-origin-when-cross-origin` limits cross-origin referrer detail.
- `Permissions-Policy` disables browser capabilities Ottimo does not require.
- `X-Frame-Options: DENY` provides a legacy-compatible framing defence alongside CSP.

The CSP intentionally permits inline styles because the existing application styling pipeline uses them in the built UI; executable scripts remain same-origin. Same-origin network access is retained because the production UI communicates with its own serverless audit/runtime endpoints.

Session tokens remain signed with HMAC-SHA-256 and are verified with the Web Crypto verification primitive. Verification rejects malformed, expired, structurally invalid and unexpected session claims before a tenant session is accepted.

An application-level error boundary contains unexpected render failures and provides an accessible recovery action. It does not treat a runtime failure as an audit result and does not modify persisted evidence.
