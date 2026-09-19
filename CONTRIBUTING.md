# Contributing to Ottimo

## Audit engine changes

Treat src/audit-engine as a bounded subsystem.

- Keep browser collection separate from rule interpretation.
- Record evidence before creating findings.
- Never turn an unavailable measurement into a guessed value.
- Keep React components unaware of Playwright, Chromium and Node-only APIs.
- Add unit coverage for pure rule and security behaviour.
- Add integration coverage against local fixtures before adding external-site dependencies.

## Local setup

Install dependencies, install the Chromium browser required by Playwright, then run the normal quality checks:

npm install
npx playwright install chromium
npm test
npm run lint
npm run build

## Pull requests

A change is ready when the quality gate passes and the PR explains what audit behaviour changed, what evidence is collected, what security boundary was affected, and how the behaviour was tested.
