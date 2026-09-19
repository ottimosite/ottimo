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

## Audit evidence model

The audit pipeline is now being separated from its presentation model.

An `AuditRun` represents the lifecycle of one requested analysis and contains:

- discovery context
- page inventory
- evidence records
- check results
- findings
- measurements
- explicit terminal/error state

Evidence records identify the audit run, optional page, check, observation time and source. Each observation is explicitly classified as `measured`, `inferred`, or `unavailable`.

A finding references its evidence rather than embedding an unexplained score. Findings carry impact, recommendation, remediation, scope, affected pages, confidence and measurement status.

### Current orchestration boundary

The orchestration layer follows:

`request → provider → evidence → checks → findings → measurements → result`

Provider failures produce a failed `AuditRun` with an explicit error; they do not manufacture a successful result.

### Scoring rule

The browser-fetch prototype no longer derives a live overall or category score from HTML size, image counts or issue counts. Unsupported live scores are represented as unavailable. Real performance scoring requires rendered measurement and will be introduced by the dedicated performance provider.

Saved demo fixtures may still contain illustrative scores, but those are fixture data and must not be presented as measured live results.

### Next step

The next audit-engine stage will connect discovery to a bounded multi-page page inventory. The evidence model remains provider-agnostic so accessibility, SEO, technical, usability and rendered-performance engines can contribute independently.