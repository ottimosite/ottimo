# Ottimo MVP Architecture

## Product boundary

Ottimo is an audit and improvement platform. The audit is the product core; the public marketing site supports discovery but must not become the main engineering focus.

The primary journey is:

URL submission → website discovery → audit → evidence → prioritised findings → improvement plan.

## Architectural principles

1. Audit evidence must be separated from presentation.
2. Providers must be replaceable: browser/local providers today, server-side crawler and rendered-browser providers later.
3. Never manufacture measured performance data. Unknown metrics remain unknown.
4. Findings contain evidence, impact, remediation and scope.
5. Site-level and page-level findings are distinct.
6. Automated UX assessment is presented as observable signals, not a claim of complete human UX evaluation.
7. AI interprets trusted audit evidence; it does not invent findings.
8. The UI must remain usable when an audit is partial, failed or still running.

## Target pipeline

Audit request → validation → discovery → page inventory → collection → analysis → finding generation → prioritisation → persisted audit result → results UI.

## Current implementation boundary

The existing app already provides React 19 + TypeScript + Vite, React Router, typed domain models, local storage repositories, an AuditProvider abstraction, a browser-fetch prototype, a deterministic local provider, and an audit results UI.

The next stages replace the prototype implementation incrementally rather than discarding the working product shell.

## Provider boundary

The audit service should remain behind a small provider contract. Browser execution is useful for development and constrained environments, but production crawling and rendered performance measurement belong behind server-side services.

No UI component should directly own crawling, parsing or scoring logic.

## Audit lifecycle

queued → discovering → auditing → analysing → completed

Terminal failure states: failed, cancelled.

A completed audit may still be partial. Partial coverage must be explicit in result metadata.

## Evidence model

Every finding should be traceable to evidence:

- URL/page
- check identifier
- observed value
- expected condition
- source
- audit run
- optional selector/resource reference

This is the foundation for trustworthy recommendations and future AI interpretation.
