# Ottimo Product & Development Roadmap

> **Status:** Living roadmap  
> **Planning issue:** #146  
> **Last updated:** 2026-09-20

## 1. North-star outcome

Ottimo should make website optimisation understandable and actionable.

The public experience must **educate, inform and convince through clarity and evidence** rather than hype. A prospective customer should quickly understand what Ottimo is, which parts of a website it examines, why those areas matter, what evidence it can observe, what findings mean, what should be fixed first, and how improvements can be verified.

The product journey should become:

**interest → account → email confirmation → audit → understanding → action → verification → repeat**

Payment comes later. The first objective is proving that the core product delivers trustworthy, understandable value.

## 2. Product principles

### Evidence before certainty
Ottimo must distinguish:
- **Measured** — directly observed or calculated from available evidence.
- **Inferred** — derived from evidence and explicitly presented as inference.
- **Unavailable** — evidence could not be obtained.

Never manufacture scores, measurements, rankings, traffic, user behaviour or certainty the audit cannot support.

### Explain before recommending
Important findings should explain:
1. What was observed?
2. Why does it matter?
3. Who/what may be affected?
4. What should be investigated or changed?
5. How confident is the finding?
6. How can the change be verified?

### Easy to digest, thorough underneath
The audit should provide a clear executive summary, prioritised issues, plain-language explanations, evidence/confidence, progressive technical detail, affected scope, recommended actions and verification status.

### Accessibility, performance, SEO and security are product requirements
Ottimo must demonstrate the standards it sells: semantic accessible UX, keyboard/screen-reader support, responsive behaviour, efficient JavaScript/assets/network use, deliberate SEO structure, secure authentication/tenant boundaries and safe handling of user data.

### Trust over hype
Marketing claims must be supportable. Product evidence must identify whether it is measured, inferred or unavailable.

### Progressive complexity
A first-time visitor should not need to understand the entire platform. Complexity should appear when it becomes useful.

## 3. Target customer journey

### A — Discover
The landing page educates visitors about the problem, Ottimo's approach, core audit domains, evidence model, audit experience, value and limitations. The primary CTA enters onboarding.

### B — Start
Collect only:
1. Website name / URL
2. Email address

Avoid unnecessary friction before value is demonstrated.

### C — Account creation
Create the account/workspace and associate the website. Send a confirmation email. The audit remains gated until confirmation.

### D — Confirm
A secure, single-purpose, time-limited confirmation link verifies the account. Invalid, expired and reused tokens receive clear recovery UX.

### E — Audit
Run a thorough analysis across:
1. Performance
2. Search / SEO
3. Accessibility
4. User experience / usability
5. Technical health
6. AI readiness

Unavailable evidence remains explicitly unavailable.

### F — Understand
Open with:
**Overall situation → Priority issues → Domain findings → Evidence → Technical detail**

Do not reduce the entire website to an opaque single number.

### G — Act
Turn findings into prioritised actions with issue, context, evidence, scope, confidence, defensible effort/impact information, recommended action and verification method.

### H — Verify
Support:
**Discover → Understand → Fix → Verify → Repeat**

### I — Monetise later
Introduce pricing/subscriptions only after the core product demonstrates repeatable value. Payment must be enforced server-side and must not distort the evidence model.

## 4. Delivery roadmap

### Phase 0 — Product foundation and direction
**Objective:** establish the product contract and engineering path.

Deliver:
- Living roadmap.
- Product principles.
- Evidence model.
- Customer journey.
- Architecture boundaries.
- Issue/branch/PR/CI/merge discipline.

**Exit:** roadmap is committed; terminology is consistent; major architectural decisions are documented.

### Phase 1 — Landing page that sells through understanding
**Objective:** make the public site a strong explanation of Ottimo's value.

Deliver:
- Clear value proposition.
- Problem/solution narrative.
- Methodology.
- Core audit domains.
- Evidence philosophy.
- Example findings/audit.
- Trust, privacy and limitation explanations.
- FAQ.
- Strong primary CTA.
- Responsive accessible experience.
- SEO foundations and structured metadata where appropriate.

**Exit:** visitors can answer “What does Ottimo do for my website, and what will I actually get?” without contacting sales; claims are supportable; CTA enters onboarding; automated accessibility/performance/interaction checks pass.

### Phase 2 — Low-friction onboarding and account creation
**Objective:** convert interest into a verified account safely.

Deliver:
- Website name/URL capture.
- Email capture.
- Account/workspace creation.
- Website association.
- Verification email.
- Audit gating.
- Resend flow.
- Secure sessions.
- Sign-out.
- Tenant boundaries.

Evaluate external authentication/email/rate-limit/abuse-prevention packages or services where they materially improve security or reliability. Record selection rationale and avoid unnecessary dependencies.

**Exit:** website + email creates the workspace; confirmation email is sent; unconfirmed users cannot access the released audit; successful confirmation unlocks the workflow; failure/recovery paths are tested.

### Phase 3 — Audit engine: trustworthy evidence collection
**Objective:** make auditing technically thorough and operationally reliable.

Core domains:

**Performance:** response timing, resource loading, document/resource characteristics, CWV where reliably obtainable, blocking/expensive resources and observable caching/compression signals.

**Search / SEO:** titles, descriptions, headings, canonical signals, robots directives, sitemap, crawlability, internal links, structured data and indexability-related signals. Never represent technical observations as rankings or organic traffic.

**Accessibility:** semantic structure, accessible names, headings, form labels, keyboard-related signals where testable, contrast where reliably measurable, alternatives, landmarks and automated rules. Automated findings are not proof of full accessibility compliance.

**User experience:** navigation structure, content hierarchy, interaction-friction signals, responsive/mobile behaviour and inferred journey structure. Do not imply actual user behaviour unless observed.

**Technical health:** broken links, redirects, resource failures, HTTP behaviour, metadata consistency and page integrity.

**AI readiness:** structured information, page identity, machine-readable context, semantic structure and discoverability of important content/entities. Avoid implying technical signals guarantee AI-system visibility.

**Exit:** reliable execution, evidence provenance, explicit unavailable states, confidence/provenance on findings, defined limits/graceful degradation, and tests for collectors/parsers/normalisation/failures.

### Phase 4 — Audit experience and reporting
**Objective:** turn raw evidence into a customer-understandable product.

Deliver:
- Audit overview.
- Executive summary.
- Domain summaries.
- Priority findings.
- Finding detail.
- Evidence/provenance.
- Confidence.
- Affected pages.
- Recommended actions.
- Progressive technical detail.
- Loading/error/empty/unavailable states.
- Audit history.

**Exit:** non-technical users can understand major findings while technical users can reach evidence; no unsupported certainty is presented.

### Phase 5 — Recommendations and verification loop
**Objective:** make Ottimo useful after the first audit.

Deliver:
- Prioritised recommendations.
- Defensible effort/impact/confidence.
- Lifecycle: Open, In progress, Resolved, Verification required, Verified, Unable to verify.
- Re-audit.
- Before/after evidence.
- Change history.

**Exit:** customer can complete **Finding → Action → Re-audit → Verification** inside Ottimo.

### Phase 6 — Website/workspace intelligence
Deliver:
- Website history.
- Audit comparison.
- Domain trends.
- Recurring issues.
- Resolved issues.
- Outstanding priorities.
- Website context.
- Reporting/export where useful.

**Exit:** Ottimo becomes useful for repeated optimisation rather than one-off audits.

### Phase 7 — Trust, education and growth
Deliver:
- Educational content.
- Methodology documentation.
- Concept/explanation pages.
- Evidence-led case studies.
- Audit examples.
- Product documentation.
- Privacy/security information.
- Search-friendly content architecture.

Use real, verifiable product evidence rather than generic claims.

### Phase 8 — Monetisation
Deliver:
- Pricing.
- Plans/entitlements.
- Payment provider integration.
- Checkout.
- Subscription management.
- Billing portal.
- Invoices/receipts.
- Usage/plan limits.
- Cancellation/downgrade flows.

**Dependency:** do not make payment the centre of development before the audit/recommendation loop provides a compelling reason for customers to return.

## 5. External libraries, services and repositories

External packages, libraries and services are explicitly allowed where they materially improve Ottimo.

Evaluate candidates for authentication, email, crawling/parsing, accessibility testing, performance measurement, structured-data parsing, visualisation, validation, rate limiting, background jobs, payment and observability against:

1. Necessity
2. Maintenance
3. Security
4. Quality improvement
5. Runtime/bundle cost
6. Architectural fit
7. Vendor lock-in
8. Failure behaviour
9. Explainability/trust of output
10. Testability/reproducibility

Do not add dependencies simply because they are popular.

## 6. Engineering quality gates

Every implementation Issue should consider:
- Correctness and type safety.
- Error handling and regression tests.
- Semantic/keyboard/screen-reader accessibility.
- Bundle, rendering, network and data-loading cost.
- SEO structure and metadata.
- Authentication, authorisation, tenant isolation, validation, secrets, cookies, CSRF where applicable, rate limiting and abuse prevention.
- Loading, error, empty, unavailable, success and recovery UX.
- Responsive/mobile behaviour.
- CI.

No implementation is complete until required CI checks are green.

## 7. Development workflow

**Issue → Plan → Feature branch → Implementation → Pull Request → CI → Fix if needed → Green CI → Merge → Status update → Next step**

Planned work must not be written directly to `master`.

Each implementation Issue should define problem, objective, scope, acceptance criteria, technical considerations, tests, risks and dependencies.

## 8. Change-control rule

This is a living roadmap. It may change when product evidence, customer feedback, technical constraints or architectural discoveries justify a different direction.

When direction changes:
1. Record the reason.
2. Update this roadmap.
3. Update relevant GitHub Issues.
4. Create new Issues where required.
5. Preserve completed history rather than rewriting it.
6. Explain material product/architecture trade-offs.
7. Continue through branch → PR → CI → merge.

A changed roadmap is not a failure. An undocumented change of direction is.

## 9. Current priority sequence

Unless new evidence changes the plan:

1. Complete and verify the current authentication foundation.
2. Finish the public landing-page narrative and conversion journey.
3. Build the real website + email onboarding flow.
4. Implement secure email verification and audit gating.
5. Strengthen the audit engine across Ottimo's core domains.
6. Build the easy-to-digest but technically thorough audit report.
7. Connect findings to prioritised recommendations.
8. Build re-audit and verification.
9. Strengthen website history and intelligence.
10. Build evidence-led educational/growth content.
11. Introduce payment and commercial entitlements.
12. Expand automation, reporting and advanced capabilities.

This ordering can change, but the roadmap must be updated before a new direction becomes the development path.

## 10. Definition of the finished product

A potential customer can:

**Understand Ottimo → enter website and email → create and confirm an account → receive a trustworthy audit → understand important problems → see the evidence → know what to fix first → make changes → re-audit → verify improvement → continue using Ottimo.**

The experience should feel:

**Fast. Clear. Evidence-led. Accessible. Useful. Trustworthy.**

Ottimo should demonstrate those same qualities in its own implementation.
