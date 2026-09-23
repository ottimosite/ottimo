-- Security hardening and query indexes for the canonical tenant schema.

create index websites_created_by_idx on public.websites(created_by);
create index websites_last_audit_idx on public.websites(last_audit_id);
create index audits_created_by_idx on public.audits(created_by);
create index audit_findings_website_idx on public.audit_findings(website_id);
create index optimization_actions_finding_idx on public.optimization_actions(finding_id);
create index optimization_actions_website_idx on public.optimization_actions(website_id);
create index reports_audit_idx on public.reports(audit_id);
create index reports_created_by_idx on public.reports(created_by);
create index reports_website_idx on public.reports(website_id);

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_workspace_admin(target_workspace_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner','admin')
  );
$$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.websites enable row level security;
alter table public.audits enable row level security;
alter table public.audit_findings enable row level security;
alter table public.optimization_actions enable row level security;
alter table public.reports enable row level security;

create policy profiles_select_self on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_insert_self on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy profiles_update_self on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy workspaces_select_member on public.workspaces for select to authenticated using (is_workspace_member(id));
create policy workspaces_insert_creator on public.workspaces for insert to authenticated with check (created_by = (select auth.uid()));
create policy workspaces_update_admin on public.workspaces for update to authenticated using (is_workspace_admin(id)) with check (is_workspace_admin(id));
create policy workspaces_delete_owner on public.workspaces for delete to authenticated using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspaces.id and wm.user_id = (select auth.uid()) and wm.role = 'owner'));

create policy workspace_members_select_member on public.workspace_members for select to authenticated using (is_workspace_member(workspace_id));
create policy workspace_members_insert_self_or_admin on public.workspace_members for insert to authenticated with check (
  ((user_id = (select auth.uid())) and role = 'owner' and exists (select 1 from public.workspaces w where w.id = workspace_members.workspace_id and w.created_by = (select auth.uid())))
  or is_workspace_admin(workspace_id)
);
create policy workspace_members_update_admin on public.workspace_members for update to authenticated using (is_workspace_admin(workspace_id)) with check (is_workspace_admin(workspace_id));
create policy workspace_members_delete_admin_or_self on public.workspace_members for delete to authenticated using (is_workspace_admin(workspace_id) or user_id = (select auth.uid()));

create policy websites_select_member on public.websites for select to authenticated using (is_workspace_member(workspace_id));
create policy websites_insert_member on public.websites for insert to authenticated with check (is_workspace_member(workspace_id) and created_by = (select auth.uid()));
create policy websites_update_member on public.websites for update to authenticated using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy websites_delete_admin on public.websites for delete to authenticated using (is_workspace_admin(workspace_id));

create policy audits_select_member on public.audits for select to authenticated using (is_workspace_member(workspace_id));
create policy audits_insert_member on public.audits for insert to authenticated with check (is_workspace_member(workspace_id));
create policy audits_update_member on public.audits for update to authenticated using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy audits_delete_admin on public.audits for delete to authenticated using (is_workspace_admin(workspace_id));

create policy findings_select_member on public.audit_findings for select to authenticated using (is_workspace_member(workspace_id));
create policy findings_insert_member on public.audit_findings for insert to authenticated with check (is_workspace_member(workspace_id));
create policy findings_update_member on public.audit_findings for update to authenticated using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy findings_delete_admin on public.audit_findings for delete to authenticated using (is_workspace_admin(workspace_id));

create policy actions_select_member on public.optimization_actions for select to authenticated using (is_workspace_member(workspace_id));
create policy actions_insert_member on public.optimization_actions for insert to authenticated with check (is_workspace_member(workspace_id));
create policy actions_update_member on public.optimization_actions for update to authenticated using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy actions_delete_admin on public.optimization_actions for delete to authenticated using (is_workspace_admin(workspace_id));

create policy reports_select_member on public.reports for select to authenticated using (is_workspace_member(workspace_id));
create policy reports_insert_member on public.reports for insert to authenticated with check (is_workspace_member(workspace_id));
create policy reports_update_member on public.reports for update to authenticated using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy reports_delete_admin on public.reports for delete to authenticated using (is_workspace_admin(workspace_id));