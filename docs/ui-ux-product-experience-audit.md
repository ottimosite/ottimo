# Ottimo UI/UX Product Experience Audit

## Purpose

This audit reconciles the current interface with the capabilities already implemented in the domain and audit layers. It is the baseline for the next UI implementation phase.

## Current application model

The current application already has a useful structural foundation:
- Public marketing routes are separated from the application shell.
- Application navigation is grouped into Workspace, Insights and Reporting.
- Website detail already acts as a richer Website Health workspace.
- Audit pages have contextual navigation.
- Audit onboarding supports saved websites and progressive advanced options.
- Recommendations expose action lifecycle and dependency state.
- Category pages expose domain-specific findings.
- Accessibility primitives include skip navigation, focus-visible states, reduced-motion handling and mobile navigation behaviour.

The main problem is not absence of UI structure. It is that the interface has not yet been fully reconciled around the breadth and maturity of the underlying product.

## Capability-to-UI mapping

| Capability | Current surface | Assessment |
|---|---|---|
| Website Health | `/app/websites/:id` | Present, but should become the canonical website home rather than a secondary detail route |
| Audit history/comparison | Audit detail/history | Present but fragmented |
| Evidence/provenance | Audit command centre and evidence-oriented panels | Present, but not consistently surfaced in the decision flow |
| Performance attribution | Performance/resource panels | Present, needs stronger connection to findings/actions |
| Site/page/journey intelligence | Website Health/audit surfaces | Present, discoverability needs improvement |
| Action dependencies/lifecycle | Recommendations | Strong capability, but currently feels like a separate destination |
| Verification | Audit/website model | Needs stronger first-class presentation |
| AI explanations/plans | Audit decision UI | Present, should be attached to decisions rather than presented as a separate feature |
| Acquisition boundaries | Platform/category surfaces | States need explicit unavailable/disconnected treatment |
| Customer/Engineer distinction | Existing progressive disclosure patterns | Partial; needs a consistent product-wide rule |
| Persistence/authentication | Service architecture | Not adequately represented in UI state yet |
| Loading/error/empty states | Existing component patterns | Present, but should be standardised across major journeys |

## Current information architecture

The current application navigation is Workspace → Overview, Websites, Audits, Actions; Insights → Performance, Search, Accessibility, Experience, Technical, AI readiness; Reporting → Reports, History; Settings.

This is a reasonable starting point, but it encourages users to think in terms of product modules rather than a Website and its lifecycle.

## Target information architecture

The Website should become the primary persistent product object:

```text
Workspace
├── Overview
└── Websites
    └── Website
        ├── Health
        ├── Audits
        │   ├── Latest
        │   ├── History
        │   └── Compare
        ├── Insights
        │   ├── Performance
        │   ├── Search
        │   ├── Accessibility
        │   ├── Experience
        │   ├── Technical
        │   └── AI readiness
        ├── Actions
        ├── Evidence
        └── Verification

Reporting
├── Reports
└── History

Settings
```

Global Actions can remain available as a cross-website queue, but individual action context should always identify the website, audit and evidence that produced it.

## Core journey

Website → Current health → What changed → What matters → Evidence → Recommended action → Implementation guidance → Verification → Next audit.

This makes the product loop tangible: Discover → Understand → Prioritise → Act → Verify → Learn.

## Customer vs Engineer presentation

### Customer mode
Lead with answer, meaning, priority, action and verification. Avoid exposing raw diagnostics unless they help the decision.

### Engineer mode
Lead with evidence, affected page/resource, diagnostic, finding, action and verification criteria.

Both modes must reference the same evidence model.

## Principal UX findings

### 1. Website Health is currently more mature than the surrounding navigation

`WebsiteDetail` already contains health, active/blocked actions, verified counts, change information, intelligence and audit history concepts. This should become the canonical workspace rather than remaining a detail page reached from a generic Websites table.

### 2. The dashboard duplicates part of the Website Health story

The dashboard currently presents latest audit score, website count and open actions, then repeats health-by-domain and next actions. It should become a concise workspace overview that routes users into the relevant Website rather than competing with it.

### 3. Actions are powerful but disconnected

The recommendation queue has lifecycle and dependency semantics, but the global Actions destination can feel detached from the finding/evidence that generated each action. Action cards should retain clear website, audit, evidence and verification context.

### 4. Insights are currently module-first

Performance, Search, Accessibility, Experience, Technical and AI readiness are useful domains, but their standalone routes should be secondary views of a Website rather than competing top-level destinations.

### 5. Audit remains the central diagnostic surface

The audit command centre should remain the evidence-rich diagnostic workspace, but Website Health should own the persistent customer journey. The UI needs stronger hand-offs between health, finding, evidence, action and verification.

### 6. AI should remain decision-attached

AI is most useful beside a finding or action: explain, plan, implement and verify. It should not become a generic chatbot destination that obscures the evidence contract.

### 7. Verification needs first-class visibility

Verification exists in the domain model but is not yet prominent enough in the overall navigation/story. Users should be able to see what has been fixed, what has been verified and what still needs another audit.

### 8. Production state needs honest UI treatment

As server persistence becomes production-capable, the UI needs explicit states for loading, unavailable, authentication/session expiry, persistence failure and disconnected integrations. These states must never be represented as zeros or fabricated health data.

## UI quality requirements

### Accessibility
- semantic landmarks and headings
- keyboard-complete interaction
- visible focus
- correct button/link semantics
- labelled form controls
- accessible status/error messaging
- reduced-motion support
- responsive layouts at narrow widths
- sufficient contrast
- no information conveyed by colour alone

### Performance
- avoid new UI dependencies unless justified
- prefer existing CSS primitives
- keep route code split-friendly
- avoid unnecessary client state and effects
- minimise repeated rendering of large evidence collections
- reserve stable space for async content
- keep the application usable on constrained mobile devices

### Evidence integrity
- measured, inferred and unavailable remain distinct
- provenance remains accessible
- AI proposals remain visually distinct from observations
- acquisition/outcome data is never implied when unavailable

## Sequenced implementation plan

### UI-01 — Application information architecture and navigation
Rework the application shell so Website is the primary product context, with contextual navigation for Health, Audits, Insights, Actions and Verification.

### UI-02 — Website Health v2
Make Website Health the canonical workspace. Consolidate current health, change, priority work, evidence coverage, active actions and verification into a coherent first viewport and progressive sections.

### UI-03 — Audit Command Centre v2
Reconcile the audit command centre with the Website Health journey. Strengthen evidence → finding → action → verification navigation and progressive technical disclosure.

### UI-04 — Evidence, intelligence and insight surfaces
Bring performance attribution, resources, site/page/journey intelligence, SEO and accessibility evidence into consistent Website-contextual views.

### UI-05 — Action and verification workflow
Make actions traceable to findings/evidence and make lifecycle/verification states visible as part of the Website workflow.

### UI-06 — AI decision surfaces
Refine AI explanations, plans and verification guidance so they appear at the relevant finding/action decision points while preserving evidence/proposal distinctions.

### UI-07 — UI performance and accessibility hardening
Run a focused quality pass across the new experience: keyboard/focus, semantic structure, responsive behaviour, reduced motion, loading/error/empty states and bundle/runtime performance.

## Recommended execution order

```text
UI-01
  ↓
UI-02
  ↓
UI-03
  ↓
UI-04 ──┐
        ├──→ UI-05
UI-06 ──┘       ↓
              UI-07
```

UI-04 and UI-06 can be developed independently after the core Website/Audit information architecture is established.

## Definition of Done for this audit

- Current application routes and major surfaces inspected.
- Existing capabilities mapped to UI.
- Target Website-centric information architecture documented.
- Customer/Engineer presentation model documented.
- Accessibility and performance requirements documented.
- Follow-up implementation slices defined.
- No product domain behaviour changed by the audit.