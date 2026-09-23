# Ottimo

Ottimo is a performance-first React SaaS-style demo platform for web performance, technical SEO, accessibility, usability and AI-readiness.

## Run locally

Install dependencies first:

```bash
npm install
```

### Full local stack — recommended

```bash
npm run dev
```

This starts Vite and a standalone Netlify Functions server together. Vite proxies `/.netlify/functions/*` to the local Functions server.

Open `http://127.0.0.1:5173`.

Ottimo standardises on Node.js 24 for local development, CI and Netlify. Keep local Node aligned with the Node 24 runtime.

On first setup, install Playwright's Chromium browser:

```bash
npx playwright install chromium
```

### Frontend-only Vite mode

```bash
npm run dev:vite
```

Use this when you only need the React frontend. Serverless audit endpoints are not available in this mode.

### Functions-only debugging

```bash
npm run dev:functions
```

For normal development, prefer `npm run dev`.

## Local Supabase development

Ottimo has a version-controlled Supabase database workflow for local schema development and testing.

The complete guide is [docs/local-supabase-development.md](docs/local-supabase-development.md).

Quick start:

```bash
npx supabase db start
npx supabase db reset
npx supabase test db
```

Local Supabase runs independently from the hosted project and is disposable. Docker Desktop or another Docker-compatible runtime is required.

The canonical database changes live in `supabase/migrations/`. Database contracts live in `supabase/tests/`.

For database work, use:

```bash
npx supabase db reset
npx supabase test db
npm test
npm run lint
npm run build
```

Do not use the hosted database as the normal development database. Hosted migrations are deployed deliberately after review and merge.

## Commands

```bash
npm run dev
npm run dev:vite
npm run dev:functions
npm run build
npm run preview
npm run test
npm run test:e2e
npm run lint
```

`npm run test:e2e` starts the full local Vite + Netlify Functions environment and runs Chromium against representative rendered journeys.

## Architecture

- React + TypeScript + Vite
- React Router for public/app routes
- Lightweight CSS design system
- Typed domain models in `src/types`
- Replaceable audit boundary: `AuditProvider`
- Deterministic local `MockAuditProvider`
- Server-side authenticated tenant repository
- Provider-independent durable storage contract
- Vitest + Testing Library
- Playwright + axe-core

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
  types/            domain models
  tests/             unit/component tests
tests/
  e2e/              rendered browser journeys
supabase/
  migrations/       canonical database schema changes
  tests/             pgTAP database contracts
```

## Demo behaviour

The app starts with a saved snapshot of a real public website: Wikipedia. The default fixture is stored locally so the UI and CI do not depend on a live third-party request.

The snapshot is deliberately conservative: structural observations are retained as evidence, while unavailable browser measurements remain unavailable rather than being invented.

## Wikipedia real-site snapshot

The deterministic fixture lives in `src/data/fixtures/wikipedia.ts`. It records the public Wikipedia portal observed on 20 September 2026.

To refresh it, capture the public portal again, record the new capture date and source observations, update the fixture and update its tests. Do not make CI fetch Wikipedia directly.

## Production persistence

The server-side persistence path uses provider-independent repository boundaries and Netlify Blobs for the current production durable-storage adapter.

Production secrets and storage credentials are managed through the deployment environment and are never committed.

## Authentication boundary

The authenticated application uses a server-side session boundary. The browser never stores session secrets or server credentials.

- `OTTIMO_SESSION_SECRET`: server-only HMAC session verification secret.
- `OTTIMO_AUTH_LOGIN_URL`: server-side identity-provider login URL.
- `VITE_AUTH_LOGIN_URL`: optional public login entry-point override.
- The authenticated workspace checks `/.netlify/functions/auth-session`.
- Sign-out clears the `ottimo_session` HttpOnly cookie.
- Local/demo development retains the demo workspace unless authentication is explicitly enabled.

## Performance and accessibility checklist

- Mobile-first responsive layout
- Semantic HTML and landmarks
- Skip link and visible focus states
- Keyboard-friendly controls
- Reduced-motion support
- Minimal third-party dependencies
- Route-based application structure
- No external fonts required
- Stable dimensions and simple CSS visualisations
- Deterministic local data
- Rendered desktop/mobile smoke coverage
- Automated axe-core accessibility checks

## Engineering workflow

GitHub is the single source of truth for Ottimo planning and delivery. See [docs/engineering-workflow.md](docs/engineering-workflow.md) for the branch, issue, PR and quality-gate workflow.

## Production security boundary

The deployed browser surface applies baseline security headers through `netlify.toml`.

Session tokens remain signed with HMAC-SHA-256 and are verified server-side. An application-level error boundary contains unexpected render failures without treating them as audit results or modifying persisted evidence.
