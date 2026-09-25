# Production security regression tests

Ottimo's security regression suite tests the server-side authorization boundary rather than React state.

## Required coverage

Protected features should have tests for:

- unauthenticated access being rejected;
- authenticated access using the server-resolved tenant;
- cross-tenant reads returning no foreign resources;
- website ownership before audit persistence or retrieval;
- audit release remaining lifecycle-gated;
- invalid, expired, incomplete and replayed verification attempts;
- session expiry and sign-out removing effective access;
- resend/onboarding rate limits;
- malformed server input;
- opaque responses where account enumeration would otherwise be possible.

## Adding a new protected resource

When a new resource is introduced:

1. Make its repository/service API require an authenticated principal.
2. Resolve tenant identity on the server; never accept a client-supplied tenant as authorization evidence.
3. Namespace durable storage by tenant.
4. Validate ownership of parent resources before creating or returning child resources.
5. Add at least one same-tenant positive test and one cross-tenant negative test.
6. Add unauthenticated and malformed-input coverage at the server boundary where applicable.
7. Keep the test deterministic and independent of production credentials or third-party services.

Run the focused suite with:

`npm run test:security`

The normal `npm test` and Quality Gate remain authoritative; the dedicated command exists so security coverage is easy to run during development and is explicitly executed in CI.
