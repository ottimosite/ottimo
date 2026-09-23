-- Canonical Ottimo tenant and audit schema.
-- This migration mirrors the hosted Supabase schema recorded as 20260923213753.

create type public.workspace_member_role as enum ('owner','admin','member','viewer');
create type public.audit_status as enum ('queued','running','completed','failed','cancelled');
create type public.audit_evidence_status as enum ('measured','inferred','unavailable');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_member_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.websites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  url text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_audit_id uuid,
  constraint websites_workspace_url_unique unique (workspace_id, url)
);

create table public.audits (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  status public.audit_status not null default 'queued',
  url text not null,
  score numeric check (score is null or (score >= 0 and score <= 100)),
  duration_ms bigint check (duration_ms is null or duration_ms >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  engine_version text,
  result jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.websites
  add constraint websites_last_audit_fk
  foreign key (last_audit_id) references public.audits(id) on delete set null;

create table public.audit_findings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  audit_id uuid not null references public.audits(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  fingerprint text,
  category text not null,
  severity text not null,
  status text not null default 'open',
  title text not null,
  summary text,
  impact text,
  solution text,
  effort text,
  priority numeric,
  confidence text,
  evidence_status public.audit_evidence_status not null default 'unavailable',
  evidence jsonb not null default '{}'::jsonb,
  affected_pages jsonb not null default '[]'::jsonb,
  affected_resources jsonb not null default '[]'::jsonb,
  standards jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.optimization_actions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  audit_id uuid references public.audits(id) on delete set null,
  finding_id uuid references public.audit_findings(id) on delete set null,
  fingerprint text,
  title text not null,
  category text not null,
  severity text not null,
  impact text not null,
  confidence text not null,
  effort text not null,
  priority_score numeric,
  status text not null default 'open',
  lifecycle_status text not null default 'planned',
  affected_pages jsonb not null default '[]'::jsonb,
  affected_resources jsonb not null default '[]'::jsonb,
  dependencies jsonb not null default '[]'::jsonb,
  implementation_steps jsonb not null default '[]'::jsonb,
  verification jsonb not null default '[]'::jsonb,
  expected_outcome text,
  priority jsonb not null default '{}'::jsonb,
  work jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  audit_id uuid not null references public.audits(id) on delete cascade,
  title text not null,
  format text not null default 'html',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index workspace_members_user_idx on public.workspace_members(user_id);
create index websites_workspace_idx on public.websites(workspace_id);
create index audits_workspace_created_idx on public.audits(workspace_id, created_at desc);
create index audits_website_created_idx on public.audits(website_id, created_at desc);
create index audit_findings_workspace_idx on public.audit_findings(workspace_id);
create index audit_findings_audit_idx on public.audit_findings(audit_id);
create index optimization_actions_workspace_idx on public.optimization_actions(workspace_id);
create index optimization_actions_audit_idx on public.optimization_actions(audit_id);
create index reports_workspace_idx on public.reports(workspace_id);
create index workspaces_created_by_idx on public.workspaces(created_by);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger workspaces_set_updated_at before update on public.workspaces for each row execute function public.set_updated_at();
create trigger workspace_members_set_updated_at before update on public.workspace_members for each row execute function public.set_updated_at();
create trigger websites_set_updated_at before update on public.websites for each row execute function public.set_updated_at();
create trigger audits_set_updated_at before update on public.audits for each row execute function public.set_updated_at();
create trigger audit_findings_set_updated_at before update on public.audit_findings for each row execute function public.set_updated_at();
create trigger optimization_actions_set_updated_at before update on public.optimization_actions for each row execute function public.set_updated_at();