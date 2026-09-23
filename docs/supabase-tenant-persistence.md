# Phase 2: Supabase tenant persistence

Issue #281 establishes the authoritative relational boundary for Ottimo's account and tenant metadata.

## Model

```text
Supabase Auth user
       |
       v
profiles (application lifecycle)
       |
       v
workspaces
       |
       +--> workspace_members
       |
       +--> websites
                |
                v
          audit_records
```

Supabase Auth remains the identity authority. The public schema stores the application relationships and lifecycle state Ottimo needs.

## Ownership rules

- A user may be a member of a workspace through `workspace_members`.
- A website belongs to exactly one workspace.
- An audit record belongs to exactly one workspace and one website.
- The composite website/workspace foreign key prevents mismatched tenant ownership.
- RLS policies scope data access to authenticated workspace membership.
- The application server remains responsible for explicit authorization checks on every protected operation.

## Why the temporary blob repository is not authoritative

The abandoned #283 implementation stored the workspace/user relationship inside a Netlify Blob envelope. That was a prototype, but it is not the authoritative identity store selected by ADR-001.

This migration moves identity/tenant metadata to relational PostgreSQL so uniqueness, foreign keys and ownership relationships are database-enforced.

Netlify Blobs can continue to hold suitable unstructured audit output, but it must not become the source of truth for user/workspace ownership.

## Deployment

The migration should be tested locally with the Supabase CLI before being pushed to the linked project. The remote database should only be changed through versioned migrations.
