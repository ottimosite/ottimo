# Local Supabase development

## Purpose

Ottimo uses a disposable local Supabase stack for database development and testing. Git-controlled migrations are the source of truth; the hosted Supabase project is deployed deliberately and is not the normal development database.

## Prerequisites

- Git
- Node.js 24 (`>=24 <25`)
- npm
- Docker Desktop or another Docker-compatible runtime
- A checkout of the Ottimo repository

Check the tools:

```bash
node --version
npm --version
docker --version
```

On Windows, start Docker Desktop before starting Supabase.

## Install the Supabase CLI

Ottimo's documented CLI version is 2.117.0:

```bash
npm install -D supabase@2.117.0
npx supabase --version
```

Use the repository's CLI version rather than relying on an unrelated global installation.

## First-time setup

From the repository root:

```bash
npm install
npx supabase db start
```

The first start downloads the required container images and can take several minutes.

Inspect the local services:

```bash
npx supabase status
```

The local stack is separate from the hosted Ottimo project.

## Build the database from Git

The canonical database definition is in `supabase/migrations/`.

Rebuild the local database from scratch with:

```bash
npx supabase db reset
```

This destroys local database state and reapplies the repository migrations in order. Local data is disposable.

If Git and a local database disagree, rebuild the local database rather than manually repairing it.

## Database tests

Ottimo uses pgTAP database contracts:

```bash
npx supabase test db
```

These tests verify the current schema contract, including required tables, indexes, primary/foreign keys and security helper functions.

A schema change must update the migration and its database contract together. Do not add obsolete tables merely to make an old test pass.

## Run Ottimo locally

Start Supabase:

```bash
npx supabase db start
```

Then start the application in another terminal:

```bash
npm run dev
```

The application currently retains local/demo persistence and authentication boundaries while the Supabase-backed application path is being developed. Do not assume every current UI operation is already persisted to local Supabase.

When an application feature is wired to Supabase, its development configuration must point at the local Supabase URL shown by `npx supabase status`, not the hosted project.

## Local authentication

The local stack provides its own Supabase Auth service. When Ottimo's application is wired to it, development users and sessions remain local:

```text
Browser → Local Supabase Auth → Local PostgreSQL
```

Never use production credentials for local testing.

Authentication changes should cover unauthenticated access, authenticated access, invalid/expired sessions, workspace membership, role boundaries, sign-out and cross-workspace access attempts.

## Environment variables and secrets

Never commit credentials.

Browser-facing Supabase configuration must use a public/publishable credential appropriate to the current client integration. Never expose a Supabase secret/service-role key through React code or a `VITE_*` variable.

Server-only credentials stay in server environment configuration.

Use `npx supabase status` to obtain local connection information when needed.

## Schema development workflow

For active Ottimo development, breaking internal schema changes are acceptable. Do not keep obsolete tables, columns, enums or helper functions solely for compatibility.

Use this workflow:

1. Define the intended canonical schema.
2. Add or modify one coherent migration in `supabase/migrations/`.
3. Rebuild locally: `npx supabase db reset`.
4. Run database contracts: `npx supabase test db`.
5. Update repositories, domain types, generated types, functions, UI and tests as required.
6. Run application checks:

```bash
npm test
npm run lint
npm run build
```

7. Run `npm run test:e2e` when rendered behaviour is affected.
8. Open a focused PR.
9. Let CI prove the migration works from a clean local database.
10. Deploy to the hosted project only after review and merge.

The intended flow is:

```text
Migration in Git
      ↓
Local Supabase
      ↓
Database tests
      ↓
Application tests
      ↓
Pull request
      ↓
CI fresh database
      ↓
Merge
      ↓
Hosted migration deployment
```

## Clean-room migration test

The most useful local database check is:

```bash
npx supabase db reset
npx supabase test db
```

This catches missing migrations, wrong ordering, stale references to deleted objects, missing indexes/foreign keys and incorrect database tests.

## Inspect and stop the local stack

Inspect:

```bash
npx supabase status
```

Stop when finished:

```bash
npx supabase stop
```

Restart later with:

```bash
npx supabase db start
```

## Troubleshooting

### Docker errors

Make sure Docker Desktop is running, then retry:

```bash
npx supabase db start
```

### Wrong CLI version

Check:

```bash
npx supabase --version
```

Use the repository's pinned/documented version.

### Database tests fail after a schema change

First run:

```bash
npx supabase db reset
npx supabase test db
```

Fix the first real mismatch. If the intended schema changed, update the test; do not create compatibility tables just to satisfy a stale test.

### Local data is corrupted or confusing

Reset it:

```bash
npx supabase db reset
```

Local state is disposable by design.

### The application points at production

Stop the app and inspect its environment variables. Local development must use the local Supabase URL and local public credential. Never put production credentials into `VITE_*` variables.

## Hosted database deployment

Hosted Supabase is persistent and follows a stricter workflow.

Preview changes first:

```bash
npx supabase db push --dry-run
```

After the migration has been reviewed and merged, apply the versioned migrations:

```bash
npx supabase db push
```

Never use:

```bash
npx supabase db reset --linked
```

against the hosted project.

A hosted change should correspond to a migration committed in Git. Do not manually change production and reconstruct the repository afterwards.

## CI

The database workflow creates a fresh local Supabase environment, applies the repository migrations and runs the pgTAP tests. CI therefore verifies that the database can be reconstructed from source control rather than relying on production state.

## What belongs in Git

Commit:

- `supabase/config.toml`
- `supabase/migrations/*.sql`
- `supabase/tests/*.sql`
- documentation and application code
- generated types when the repository explicitly treats them as source-controlled artifacts

Never commit database passwords, access tokens, secret/service-role keys, production environment files or local Supabase runtime state such as `supabase/.temp/` and `supabase/.branches/`.

## Daily workflow

For ordinary development:

```bash
npx supabase db start
npm run dev
```

For database work:

```bash
npx supabase db reset
npx supabase test db
npm test
npm run lint
npm run build
```

Then create the PR and let CI validate the clean-room database.

## Rule of thumb

> **Git is the source of truth. Local Supabase is disposable. CI proves migrations work from scratch. Hosted Supabase is deployed deliberately.**

If the local database and Git disagree, rebuild locally. If the hosted database and Git disagree, stop and reconcile the migration history before making another schema change.
