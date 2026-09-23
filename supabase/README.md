# Supabase database boundary

Ottimo's application identity and tenant metadata are managed by Supabase Auth + PostgreSQL.

## Repository workflow

The `supabase/` directory is version-controlled. Configuration, migrations and database tests belong in Git; local CLI state under `supabase/.temp/` and `supabase/.branches/` is ignored.

Hosted project:
- project: `ottimo`
- project ref: `syeipxngeyvyynezsvxc`
- region: `eu-west-1`

The project reference is not a credential. Never commit a database password, access token, or server secret key.

## Local setup

On Windows with Node 24:

```powershell
npm install -D supabase@2.117.0
npx supabase --version
npx supabase login
npx supabase link --project-ref syeipxngeyvyynezsvxc
```

Local database commands require a Docker-compatible runtime:

```powershell
npx supabase db start
npx supabase db reset
npx supabase test db
```

## Hosted database deployment

Before changing the hosted database, preview the migration:

```powershell
npx supabase db push --dry-run
```

Review the output. Only then apply the versioned migrations:

```powershell
npx supabase db push
```

Do not use `db reset --linked` against the hosted project.

## Security boundary

- Supabase Auth owns identity, sessions and email verification.
- `profiles` mirrors the Ottimo application lifecycle.
- `workspaces` and `workspace_members` establish tenant ownership.
- `websites` belong to workspaces.
- `audit_records` belong to both a workspace and website.
- Application tables use RLS.
- Privileged server credentials remain server-only.
- The service-role/secret key must never reach browser code.

The hosted database has not been changed by adding this repository workflow. Database deployment remains a deliberate operational step after local validation and a dry run.
