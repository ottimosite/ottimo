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
- Deterministic local `MockAuditProvider`
- Local repositories via `localStorage`
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
  services/         audit provider and local storage
  styles/           global responsive design system
  tests/             unit/component tests
  types/             domain models
```

## Demo behaviour

The app starts with example websites and historical audits. New demo audits use the local provider and deterministic scores/issues, then persist the generated audit locally. Recommendation status changes are also stored locally. Reports can be printed from the browser, and history uses a lightweight CSS chart instead of a charting dependency.

## Harbour & Pine demo case study

The default demo uses a fictional saved snapshot for `https://harbourpine.example/`. Harbour & Pine is an illustrative independent home and lifestyle retailer created specifically for Ottimo demonstration data. It does not represent a real business or make runtime requests to a third-party site. Keep the example clearly labelled as illustrative and keep findings evidence-based rather than treating the saved scores as a live Lighthouse result.

## Future integrations

The current service boundaries are designed so real Lighthouse/PageSpeed/crawler, authentication, billing, AI, reporting and monitoring providers can replace the local providers without rewriting the UI.

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

Copy `.env.example` only when adding environment-specific integrations. The local demo does not need environment variables.
