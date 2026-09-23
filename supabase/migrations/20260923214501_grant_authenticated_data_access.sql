-- Data API grants for the canonical tenant schema.
revoke all on table public.profiles, public.workspaces, public.workspace_members, public.websites, public.audits, public.audit_findings, public.optimization_actions, public.reports from anon;

grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.workspaces, public.workspace_members, public.websites, public.audits, public.audit_findings, public.optimization_actions, public.reports to authenticated;

revoke execute on function public.is_workspace_member(uuid) from anon, public;
revoke execute on function public.is_workspace_admin(uuid) from anon, public;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.is_workspace_admin(uuid) to authenticated;