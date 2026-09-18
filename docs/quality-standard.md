# Ottimo Quality Standard

Ottimo must meet the same evidence-led principles that its audits promise to customers.

## Non-negotiables

- Accessibility is an engineering requirement, not a visual polish step.
- Evidence comes before scoring.
- A claim must identify whether it is measured, inferred, or unavailable.
- Colour is never the sole carrier of meaning.
- Every interactive journey must be keyboard-operable.
- Focus must remain visible and predictable.
- Errors must explain what happened and what the user can do next.
- Responsive layouts must preserve content and functionality without horizontal scrolling.
- Performance claims must come from real measurements or be explicitly labelled as observations/inferences.
- Automated checks do not replace manual or assisted accessibility testing.

## Evidence states

**Measured** — Ottimo directly observed the value using a defined measurement method.

**Inferred** — Ottimo derived a conclusion from observable evidence but did not directly measure the claimed outcome.

**Unavailable** — Ottimo could not establish the value with the available environment or tooling.

Unknown is a valid result.

## Accessibility baseline

Ottimo targets WCAG 2.2 AA as an engineering baseline. The quality suite covers, or is being expanded to cover:

- semantic structure and landmarks
- heading hierarchy
- accessible names and descriptions
- keyboard operation
- focus order and visible focus
- forms and validation
- status, progress and error announcements
- contrast and non-colour communication
- reduced motion
- responsive reflow and zoom
- screen-reader journeys

Automated assertions must be complemented by keyboard, screen-reader and visual inspection.

## Performance baseline

The application must not manufacture a performance score from proxies such as HTML size or image count. Network observations and rendered-user metrics are different measurements and must remain distinguishable.

## Audit integrity

Every finding should eventually carry:

- criterion
- evidence
- impact
- recommendation
- scope
- confidence
- measurement status

If evidence is unavailable, the result must say so.

## Quality gate

Before a quality-focused change is considered complete, run:

- `npm test`
- `npm run lint`
- `npm run build`
- keyboard traversal of the changed journey
- browser zoom/reflow inspection
- reduced-motion inspection where motion exists
- screen-reader smoke test for changed interactive flows

The goal is not merely to pass a checklist. The goal is for Ottimo to be a credible example of the standards it measures.
