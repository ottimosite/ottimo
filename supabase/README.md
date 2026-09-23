# Supabase database development

Ottimo uses Supabase Auth and PostgreSQL for application identity, workspace and audit data.

For the complete local-development workflow, see [docs/local-supabase-development.md](../docs/local-supabase-development.md).

## Repository structure

```text
supabase/
├── config.toml
├── migrations/       # canonical schema changes
└── tests/            # pgTAP database contracts
```

The repository is the source of truth for database changes. Local CLI state under `supabase/.temp/` and `supabase/.branches/` is ignored and must not be committed.

## Quick start

Requirements:

- Node.js 24
- npm
- Docker Desktop or another Docker-compatible runtime

From the repository root:

```bash
npm install
npx supabase db start
npx supabase db reset
npx supabase test db
```

Use `npx supabase status` to inspect local service URLs and keys.

## Local development

Local Supabase is disposable and isolated from the hosted project. Use `npx supabase db reset` to reconstruct the database from the migrations in Git.

The current application still has local/demo persistence and authentication boundaries that are being evolved toward the Supabase-backed application path. Do not assume every current UI operation is already using local Supabase.

## Schema changes

For active-development changes:

1. Define the intended canonical schema.
2. Add or modify the appropriate migration.
3. Run `npx supabase db reset`.
4. Run `npx supabase test db`.
5. Update application code and tests.
6. Run the application quality checks.
7. Open a PR.

Do not retain obsolete tables, columns, enums or helper functions solely for compatibility.

## Hosted deployment

Preview before applying:

```bash
npx supabase db push --dry-run
```

After review and merge, deploy the versioned migrations:

```bash
npx supabase db push
```

Never use `db reset --linked` against the hosted project.

## Security

- The hosted project reference is not a credential.
- Never commit database passwords or access tokens.
- Never expose Supabase secret/service-role credentials to browser code.
- Browser-facing configuration must use a public/publishable credential appropriate to the current client integration.
- Server-only credentials remain server-side.
- RLS is part of the schema contract and is tested with database changes.

## Current hosted project

- Project: `ottimo`
- Ref: `syeipxngeyvyynezsvxc`
- Region: `eu-west-1`

The project reference may be committed; credentials may not.
