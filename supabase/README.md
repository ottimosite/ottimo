# Supabase database boundary

Ottimo's application identity and tenant metadata are managed by Supabase Auth + PostgreSQL.

## Migration workflow

The schema is version-controlled under `supabase/migrations/`.

For local development, install the Supabase CLI, initialise/link the project, then run:

```bash
supabase start
supabase db reset
supabase test db
```

For the remote project, migrations are deployed deliberately with:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

Do not make schema changes directly in the remote Dashboard after migrations are established. Keep schema history in Git.

## Security boundary

- Supabase Auth owns user identity, sessions and email verification.
- `public.profiles` mirrors only the application lifecycle state needed by Ottimo.
- `workspaces` and `workspace_members` establish explicit tenant ownership.
- `websites` belong to a workspace.
- `audit_records` carry both workspace and website ownership.
- Every application table has RLS enabled.
- Browser access is not granted merely because a table exists in `public`; grants are explicit.
- Privileged server access must use server-only Supabase credentials.
- The service role must never be shipped to the browser.

The first migration deliberately keeps Data API access narrow. Ottimo's server boundary can use privileged server-side access while retaining RLS as a database defence-in-depth layer.

## Current limitation

The repository does not yet contain the Supabase CLI project configuration or remote project reference. Those should be added when the local Supabase workflow is established.

The authoritative tenant resolver will be wired to this schema in the follow-up server-boundary work rather than introducing another blob-backed identity map.
