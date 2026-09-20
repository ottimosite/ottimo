# GitHub engineering workflow

GitHub is the single source of truth for Ottimo planning and engineering execution.

## Delivery flow

`product direction → roadmap → executable issue → feature branch → pull request → quality gate → merge → issue closure`

Do not create planning artefacts that are disconnected from implementation.

## Selecting work

Before starting work:

1. Check open issues and their dependencies.
2. Select the next unblocked issue with a concrete product outcome.
3. Read the acceptance criteria before changing code.
4. Confirm the change fits the current architecture and evidence model.

An issue should be executable. It should contain:

- objective
- product/user outcome
- scope
- dependencies
- acceptance criteria
- testing requirements
- performance and accessibility expectations
- Definition of Done

## Branches

Create one focused branch from `master`:

`feat/<short-name>` for product work  
`fix/<short-name>` for defects  
`hardening/<short-name>` for security/operations  
`test/<short-name>` for test infrastructure  
`docs/<short-name>` for documentation

Do not develop directly on `master`.

## Implementation

Prefer the smallest coherent implementation that satisfies the issue.

For audit-engine work:

- keep collection separate from interpretation
- record evidence before findings
- preserve measured/inferred/unavailable states
- never invent measurements
- preserve provenance
- keep security boundaries server-side
- add regression tests for edge cases

For UI work:

- preserve the evidence-first product model
- test keyboard and focus behaviour
- maintain readable contrast
- keep responsive behaviour intentional
- do not expose technical detail without useful progressive disclosure

## Pull requests

Every implementation should become a PR.

The PR should explain:

- what changed
- why it changed
- evidence/provenance implications
- security implications
- tests added or updated
- accessibility/performance considerations

Use `Closes #N` when the PR satisfies the issue completely.

## Quality gate

Before merge, the following must pass:

```bash
npm test
npm run lint
npm run build
```

A failing check is a blocker. Do not treat a green test run with a failing build or lint step as complete.

## Review before merge

Check the actual product behaviour, not only the diff:

- Does the feature answer the intended user problem?
- Are empty, unavailable and failed states honest?
- Are measurements traceable to evidence?
- Can untrusted input bypass a server-side boundary?
- Is the UI accessible and usable?
- Does the implementation preserve deterministic behaviour where required?

## After merge

The issue is closed only when its acceptance criteria are satisfied and the implementation is merged to `master`.

Update the roadmap when a major stage changes.

## What not to do

- Do not create work solely to make the project look busy.
- Do not fabricate measurements, acquisition data or success states.
- Do not bypass server-side security with client validation.
- Do not add dependencies when a focused native implementation is sufficient.
- Do not merge around failing quality checks.
- Do not allow the UI to imply certainty that the evidence does not support.
