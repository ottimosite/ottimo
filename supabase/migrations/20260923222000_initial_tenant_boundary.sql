-- Ottimo Phase 2 tenant persistence boundary
-- Issue: #281
-- Authentication remains owned by Supabase Auth; this schema owns application
-- account/workspace/website/audit relationships.

create schema if not exists private;

create type public.account_status as enum (
  'onboarding_started',
  'pending_verification',
  'verified',
  'suspended'
);

create type public.workspace_role as enum (
  'owner',
  'admin',
  'member'
);

create type public.audit_record_status as enum (
  'queued',
  'running',
  'ready',
  'failed',
  'retryable'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  account_status public.account_status not null default 'pending_verification',
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
  role public.workspace_role not null default 'member',
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
  constraint websites_url_not_blank check (char_length(btrim(url)) > 0),
  constraint websites_workspace_url_unique unique (workspace_id, url)
);

-- Keep a composite key available so an audit cannot pair a website with a
-- different workspace.
alter table public.websites
  add constraint websites_id_workspace_unique unique (id, workspace_id);

create table public.audit_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  status public.audit_record_status not null default 'queued',
  storage_key text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint audit_records_website_workspace_fk
    foreign key (website_id, workspace_id)
    references public.websites (id, workspace_id)
    on delete cascade
);

create index workspace_members_user_id_idx on public.workspace_members(user_id);
create index websites_workspace_id_idx on public.websites(workspace_id);
create index websites_created_by_idx on public.websites(created_by);
create index audit_records_workspace_id_idx on public.audit_records(workspace_id);
create index audit_records_website_id_idx on public.audit_records(website_id);
create index audit_records_created_by_idx on public.audit_records(created_by);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function private.set_updated_at();

create trigger workspace_members_set_updated_at
before update on public.workspace_members
for each row execute function private.set_updated_at();

create trigger websites_set_updated_at
before update on public.websites
for each row execute function private.set_updated_at();

create trigger audit_records_set_updated_at
before update on public.audit_records
for each row execute function private.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, account_status)
  values (
    new.id,
    case
      when new.email_confirmed_at is not null then 'verified'::public.account_status
      else 'pending_verification'::public.account_status
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.sync_user_verification_state()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update public.profiles
    set account_status = 'verified'::public.account_status
    where id = new.id
      and account_status <> 'suspended'::public.account_status;
  elsif new.email_confirmed_at is null and old.email_confirmed_at is not null then
    update public.profiles
    set account_status = 'pending_verification'::public.account_status
    where id = new.id
      and account_status <> 'suspended'::public.account_status;
  end if;
  return new;
end;
$$;

revoke execute on function public.sync_user_verification_state() from public, anon, authenticated;

create trigger on_auth_user_verification_changed
after update of email_confirmed_at on auth.users
for each row execute function public.sync_user_verification_state();

create or replace function private.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = (select auth.uid())
  );
$$;

create or replace function private.has_workspace_role(
  target_workspace_id uuid,
  allowed_roles public.workspace_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = (select auth.uid())
      and wm.role = any(allowed_roles)
  );
$$;

create or replace function private.user_workspace_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select wm.workspace_id
  from public.workspace_members wm
  where wm.user_id = (select auth.uid());
$$;

revoke all on function private.is_workspace_member(uuid) from public, anon, authenticated;
revoke all on function private.has_workspace_role(uuid, public.workspace_role[]) from public, anon, authenticated;
revoke all on function private.user_workspace_ids() from public, anon, authenticated;

grant usage on schema private to authenticated;
grant execute on function private.is_workspace_member(uuid) to authenticated;
grant execute on function private.has_workspace_role(uuid, public.workspace_role[]) to authenticated;
grant execute on function private.user_workspace_ids() to authenticated;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.websites enable row level security;
alter table public.audit_records enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.workspaces from anon, authenticated;
revoke all on table public.workspace_members from anon, authenticated;
revoke all on table public.websites from anon, authenticated;
revoke all on table public.audit_records from anon, authenticated;

grant select on table public.profiles to authenticated;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

grant select, insert, update, delete on table public.workspaces to authenticated;

create policy workspaces_select_member
on public.workspaces
for select
to authenticated
using ((select private.is_workspace_member(id)));

create policy workspaces_insert_creator
on public.workspaces
for insert
to authenticated
with check ((select auth.uid()) = created_by);

create policy workspaces_update_admin
on public.workspaces
for update
to authenticated
using ((select private.has_workspace_role(id, array['owner','admin']::public.workspace_role[])))
with check ((select private.has_workspace_role(id, array['owner','admin']::public.workspace_role[])));

create policy workspaces_delete_owner
on public.workspaces
for delete
to authenticated
using ((select private.has_workspace_role(id, array['owner']::public.workspace_role[])));

create or replace function private.add_workspace_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.created_by, 'owner'::public.workspace_role);
  return new;
end;
$$;

revoke all on function private.add_workspace_owner() from public, anon, authenticated;

create trigger workspace_add_owner
after insert on public.workspaces
for each row execute function private.add_workspace_owner();

grant select, insert, update, delete on table public.workspace_members to authenticated;

create policy workspace_members_select_member
on public.workspace_members
for select
to authenticated
using ((select private.is_workspace_member(workspace_id)));

create policy workspace_members_insert_admin
on public.workspace_members
for insert
to authenticated
with check ((select private.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[])));

create policy workspace_members_update_admin
on public.workspace_members
for update
to authenticated
using ((select private.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[])))
with check ((select private.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[])));

create policy workspace_members_delete_admin
on public.workspace_members
for delete
to authenticated
using ((select private.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[])));

grant select, insert, update, delete on table public.websites to authenticated;

create policy websites_select_member
on public.websites
for select
to authenticated
using ((select private.is_workspace_member(workspace_id)));

create policy websites_insert_member
on public.websites
for insert
to authenticated
with check (
  (select private.is_workspace_member(workspace_id))
  and (select auth.uid()) = created_by
);

create policy websites_update_admin
on public.websites
for update
to authenticated
using ((select private.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[])))
with check ((select private.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[])));

create policy websites_delete_admin
on public.websites
for delete
to authenticated
using ((select private.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[])));

grant select, insert, update, delete on table public.audit_records to authenticated;

create policy audit_records_select_member
on public.audit_records
for select
to authenticated
using ((select private.is_workspace_member(workspace_id)));

create policy audit_records_insert_member
on public.audit_records
for insert
to authenticated
with check (
  (select private.is_workspace_member(workspace_id))
  and (select auth.uid()) = created_by
);

create policy audit_records_update_admin
on public.audit_records
for update
to authenticated
using ((select private.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[])))
with check ((select private.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[])));

create policy audit_records_delete_admin
on public.audit_records
for delete
to authenticated
using ((select private.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[])));

-- Profile lifecycle is provider/server controlled.
revoke insert, update, delete on table public.profiles from authenticated;
