# ADR-001: Authentication, session, email and abuse-prevention architecture

- Status: Accepted
- Date: 2026-09-23
- Related: #152, #154, #273
- Scope: Phase 2 account creation, email confirmation, session establishment and tenant authorization

## Context

Ottimo currently has a lightweight authentication boundary in the React client and a server-side HMAC session-token verifier. The existing token is useful as a foundation, but it is not sufficient as the production account/session system.

The production workflow requires:
- account creation from website + email;
- email confirmation before audit release;
- secure sessions and sign-out;
- workspace and website ownership;
- server-side authorization;
- protection against enumeration, replay and abuse;
- deterministic local/CI testing;
- a small client runtime footprint;
- a clear migration path from the existing authentication foundation.

Ottimo remains a React 19 + TypeScript + Vite + React Router application deployed on Netlify Functions. The architecture should not require a framework migration.

## Decision

### 1. Authentication and identity: Supabase Auth

Use Supabase Auth as the managed identity/authentication boundary rather than implementing password handling, email-verification token issuance, refresh-token rotation and account lifecycle primitives ourselves.

Use passwordless email authentication for the initial Ottimo onboarding flow where practical. Supabase supports magic links/one-time passwords, email confirmation, sessions and sign-out. Email confirmation remains mandatory before the application releases the audit workflow.

Use the London (eu-west-2) Supabase region to keep primary application/auth data geographically close to the UK user base and to make the chosen data location explicit.

The Supabase publishable key may be present in client code where required by the official client flow. Service-role credentials and other privileged secrets must remain server-side.

### 2. Application authorization: Ottimo-owned workspace model

Authentication establishes identity; it does not by itself establish permission to Ottimo resources.

Ottimo will maintain its own application-level relationships:
- user;
- workspace/tenant;
- workspace membership/role;
- website;
- audit ownership.

Every protected server operation must resolve the authenticated Supabase user and then perform an explicit Ottimo ownership/membership check.

Do not rely on client route state, URL parameters, cached React state or a tenant ID supplied by the browser as proof of authorization.

Where data is stored outside Supabase, the authenticated user/workspace relationship must still be checked by an Ottimo server boundary before the data is returned or mutated.

### 3. Database / durable application state: Supabase Postgres for identity and tenant metadata

Use Supabase Postgres for account-linked application metadata that needs relational integrity and uniqueness, including workspace, membership, website ownership and account lifecycle state.

Use foreign keys and database constraints for relationships that must remain consistent.

Netlify Blobs remains an appropriate store for existing unstructured/derived audit objects where that storage abstraction already exists. It is not the authoritative identity database.

When Netlify Blobs is used for tenant-owned objects, keys and access must remain scoped to the authenticated workspace and the server must enforce the relationship.

### 4. Email delivery: Resend via Supabase custom SMTP

Use Resend as the transactional email delivery provider for authentication email.

Connect Resend to Supabase Auth using custom SMTP rather than putting email credentials in the Ottimo browser bundle.

Use a dedicated authentication sending identity/domain rather than mixing authentication messages with future marketing email.

Email content must contain only the information required for the authentication/verification flow.

Resend currently states that it supports GDPR requirements and UK/EU transfer mechanisms, but its stored customer/message data is currently held in the United States. This must be reflected in Ottimo privacy/data-processing documentation before production launch.

### 5. Verification-token lifecycle: delegated to Supabase Auth

Ottimo will not maintain a second independent email-verification token system.

Supabase Auth owns:
- generation;
- expiry;
- single-use verification/magic-link handling;
- confirmation state;
- refresh-token lifecycle.

Ottimo owns the application transition that follows successful authentication/verification: account/workspace/website state and audit eligibility.

This avoids two competing sources of truth for whether an email is verified.

### 6. Rate limiting and abuse prevention

Use Netlify Function rate-limit rules as the first infrastructure layer for sensitive authentication endpoints. Netlify supports code-defined per-function rate limits, including per-IP/domain aggregation.

Apply tighter limits to account creation, verification/resend and other authentication-related endpoints where those endpoints exist.

For signup abuse that is not adequately addressed by request rate limiting, use Cloudflare Turnstile conditionally rather than placing a CAPTCHA on every normal interaction.

Turnstile validation must always occur server-side. Client-side presence of the widget is never treated as proof of verification.

Do not add a separate Redis/rate-limit service in this phase unless measured abuse patterns or platform limitations demonstrate a need for it.

### 7. URL validation

Use the platform's native WHATWG URL implementation plus a small Ottimo domain-normalization/validation utility.

Do not introduce a URL-validation package solely for basic syntax and protocol validation.

The server must allow only supported web URL schemes and normalize the canonical representation before persistence.

### 8. Observability and security events

Use Netlify's deployment/function observability for infrastructure-level monitoring.

Add a small application security-event abstraction for account creation attempts, verification requests/results, resend requests, sign-out, authorization denial and suspicious/repeated abuse responses.

Logs must avoid passwords, tokens, full verification URLs and unnecessary personal data.

### 9. Background jobs

No additional background-job service is required for initial onboarding.

Verification email delivery is handled by the authentication/email provider. Long-running audit execution remains a separate concern.

## Alternatives considered

### A. Continue with custom HMAC sessions + Netlify Blobs

Rejected for the production identity boundary.

The existing implementation is valuable as a security-tested foundation, but extending it into a full identity system would require Ottimo to own account verification semantics, session revocation, concurrent account creation, refresh lifecycle, abuse controls and recovery behaviour.

Netlify Blobs provides strong reads when requested but uses last-write-wins semantics and does not provide general concurrency control. That makes it a poor sole authority for uniqueness-sensitive identity operations.

### B. Clerk

Technically viable and particularly strong for B2B organizations and membership management.

Rejected for the initial architecture because it would introduce a second managed identity/workspace abstraction when Ottimo already needs its own domain model and storage boundary.

### C. Auth0

Technically viable and mature.

Rejected for the initial implementation because the current onboarding requirement is deliberately narrow and passwordless. Re-evaluate if enterprise SSO or complex federation becomes a near-term requirement.

### D. Fully self-hosted authentication

Rejected for the initial production release because it would make Ottimo responsible for security-critical identity infrastructure, email verification, recovery and token lifecycle that do not differentiate the product.

## Consequences

### Positive

- Production identity security is delegated to a maintained authentication service.
- Email verification has one authoritative source of truth.
- Workspace/website authorization remains owned by Ottimo.
- Relational tenant data gets database constraints rather than relying on blob-key conventions.
- Existing Netlify Functions and React/Vite architecture can remain.
- Client code can remain focused on session state rather than implementing cryptography.
- Local and CI tests can use provider test/local configuration or mocked server boundaries without sending real email.

### Costs / trade-offs

- Adds Supabase as a production dependency.
- Adds Resend as a transactional email processor.
- Authentication and some account data become dependent on Supabase availability.
- Resend currently stores customer/message data in the United States, so privacy documentation and transfer safeguards must be explicit.
- Supabase session/JWT semantics must be handled correctly at server boundaries; client authentication state is never sufficient for authorization.
- Provider configuration becomes part of deployment/runbook management.

## Security invariants

1. Client authentication state is never an authorization decision.
2. Every protected resource lookup is scoped to the authenticated workspace.
3. Verification must be confirmed server-side.
4. No verification token is stored in application logs.
5. No privileged provider secret is shipped to the browser.
6. Account-existence responses must not create an email-enumeration oracle.
7. Sign-out and session expiry must remove effective application access according to the chosen provider/session semantics.
8. Cross-tenant resource access must have explicit negative tests.
9. Public pages must not initialize the authenticated application runtime merely to render public content.
10. Authentication dependencies must not materially regress the public performance budget.

## Implementation sequence

1. Configure Supabase Auth and project region.
2. Establish the server-side Supabase client boundary.
3. Define Ottimo user/workspace/website relationships and constraints.
4. Replace the demo-only authentication assumption with a real session boundary.
5. Configure Resend as custom SMTP.
6. Implement onboarding and verification states.
7. Add Netlify rate limits and conditional Turnstile protection.
8. Add server-side authorization tests and tenant-isolation regression tests.
9. Remove the superseded custom HMAC session path only after replacement coverage is green.

## References

- Supabase Auth: https://supabase.com/docs/guides/auth
- Supabase regions: https://supabase.com/docs/guides/platform/regions
- Supabase custom SMTP: https://supabase.com/docs/guides/auth/auth-smtp
- Supabase passwordless email: https://supabase.com/docs/guides/auth/auth-email-passwordless
- Resend GDPR: https://resend.com/security/gdpr
- Resend Node.js: https://resend.com/nodejs
- Netlify rate limiting: https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/
- Cloudflare Turnstile server-side validation: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/