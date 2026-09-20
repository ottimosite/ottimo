# AI Agent Development Workflow

## Purpose

This document defines the required development workflow for AI agents working on Ottimo.

Ottimo is developed as a production-quality web performance, search, accessibility, UX, technical-quality and AI-readiness platform. Agents must treat code quality, user experience, accessibility, performance, testability and production safety as first-class requirements.

## Source of truth

GitHub is the source of truth for the project.

Before making changes:
- Inspect the current repository state.
- Read relevant implementation, tests and architecture documentation.
- Check existing Issues and Pull Requests for related work.
- Do not rely on stale local copies, previous generated code, or assumptions about the repository.

## Standard development lifecycle

**Issue → Plan → Feature branch → Implementation → Pull Request → CI → Fix if needed → Green CI → Merge → Status update → Next step**

### 1. Plan the work
Before writing code:
- Understand the user/problem being solved.
- Identify affected product areas.
- Review existing architecture and conventions.
- Identify dependencies and potential regressions.
- Define measurable acceptance criteria.
- Decide what tests need to be added or changed.
- Keep scope focused; avoid unrelated changes.

### 2. Use GitHub Issues
Create or use a GitHub Issue for planned work. The Issue should contain:
- Objective and user/problem context
- Scope
- Acceptance criteria
- Relevant technical considerations
- Testing requirements
- Known risks or dependencies

Issues are the planning source of truth. If scope changes materially, update the Issue rather than silently changing the plan.

### 3. Create a feature branch
Do not implement planned work directly on `master`. Create a descriptive branch from the current `master`, such as `feat/website-audit-onboarding`, `fix/audit-validation`, `refactor/audit-reporting`, or `docs/ai-development-workflow`.

### 4. Implement
- Follow existing architecture and coding conventions.
- Prefer simple, maintainable solutions.
- Avoid unnecessary dependencies.
- Preserve backwards compatibility unless a deliberate breaking change is documented.
- Add or update automated tests for changed behaviour.
- Maintain accessibility from implementation stage.
- Protect performance and avoid unnecessary client-side work.
- Do not fabricate product data, measurements, scores or claims.
- Preserve Ottimo's evidence model: distinguish measured, inferred and unavailable information.
- Treat error, loading, empty and unavailable states as part of the UX.
- Consider keyboard navigation, semantics, focus management and screen-reader behaviour.
- Consider responsive/mobile behaviour and security implications.

### 5. Open a Pull Request
Open a Pull Request against `master`. The PR should:
- Reference the GitHub Issue.
- Explain what changed and why.
- Describe important UX/product decisions.
- List tests added or changed.
- State validation performed.
- Identify remaining risks or follow-up work.

Do not merge before CI completes successfully.

### 6. Wait for CI
- Wait for GitHub Actions/required checks to complete.
- Inspect the actual CI result.
- Do not assume local success means CI will pass.
- Treat test, lint, type-check and build failures as actionable engineering work.

### 7. Diagnose and fix failures
If CI fails:
1. Read the complete relevant failure output.
2. Identify the root cause.
3. Determine whether the defect is production code, tests, configuration or CI environment.
4. Fix the root cause rather than hiding the failure.
5. Add or improve regression coverage when appropriate.
6. Push the fix to the same PR.
7. Wait for CI again.

Repeat until the required quality gate is green.

Do not weaken tests or alter production behaviour solely to make CI pass unless the existing contract is demonstrably obsolete and the intended behaviour has deliberately changed.

### 8. Merge only when green
Only merge when required CI checks, tests, lint/type/build checks are passing, no known unresolved regressions were introduced, and the Issue acceptance criteria are satisfied.

After merging, verify that `master` contains the expected change and is not left in a known failing state.

### 9. Status update
After completion, report:
- What was completed
- Issue number/link
- PR number/link
- CI outcome
- Merge status
- Important implementation notes
- Follow-up work

Do not report work as complete until the relevant GitHub state has actually been verified.

### 10. Identify the next step
After a successful merge, review Ottimo's current state, identify the next highest-value engineering task, create or update the relevant Issue, and begin the same workflow.

## Emergency production/master fixes
If `master` is already broken and an immediate repair is required:
- Diagnose the failure first.
- Minimise the emergency change.
- Prefer a dedicated fix branch and PR where possible.
- Preserve regression coverage.
- Run and verify CI.
- Do not use direct `master` writes as the normal workflow for planned work.

## Testing expectations
Tests are part of implementation, not an afterthought.
- Locate existing tests before modifying code.
- Update stale tests when the intended product contract has deliberately changed.
- Add regression tests for newly discovered bugs.
- Prefer accessible user-facing queries in UI tests.
- Test important validation and error paths.
- Test observable behaviour rather than implementation details.

When CI fails, inspect the actual failure before deciding what to change.

## UX, accessibility and performance
Every user-facing change should consider clear hierarchy, obvious primary action, progressive disclosure, useful validation/errors, loading/empty/unavailable states, keyboard operation, focus behaviour, semantic HTML, accessible names/descriptions, responsive layouts, reduced cognitive load and consistent terminology.

Performance is a product requirement. Avoid unnecessary JavaScript, client-side rendering, oversized dependencies, blocking resources, unnecessary network requests, layout instability and repeated expensive computation. Measure where possible.

## Product evidence principles
Ottimo must not manufacture certainty.
- **Measured** means directly observed or calculated from available evidence.
- **Inferred** means derived from available evidence and clearly identified as such.
- **Unavailable** means required evidence could not be obtained.

An unavailable measurement is preferable to a fabricated value.

## Change discipline
Do not bundle unrelated changes into a feature PR. Do not silently rewrite architecture. For larger architectural changes, document rationale, alternatives and trade-offs in the Issue and break migration into safe increments.

## Definition of done
A task is done only when:
- Issue acceptance criteria are satisfied.
- Implementation is committed on the appropriate branch.
- A PR exists.
- Required CI checks have completed successfully.
- CI failures have been resolved.
- The PR has been merged into `master`.
- The resulting `master` state has been verified.
- The user has received a status update.
- The next logical task has been identified.

## Agent operating rule
When in doubt, favour: **evidence over assumption, planning over improvisation, small changes over broad rewrites, tests over confidence, accessible UX over visual novelty, and verified GitHub state over claims of completion.**