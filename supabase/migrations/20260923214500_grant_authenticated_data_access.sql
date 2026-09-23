-- Restrict Ottimo's public data API to authenticated callers.
-- Row-level security remains the authoritative tenant boundary.

revoke all on table public.profiles, public.workspaces, public.workspace_members, public.websites, public.audits, public.audit_findings, public.optimization_actions, public.reports from anon;

grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.workspaces to authenticated;
grant select, insert, update, delete on table public.workspace_members to authenticated;
grant select, insert, update, delete on table public.websites to authenticated;
grant select, insert, update, delete on table public.audits to authenticated;
grant select, insert, update, delete on table public.audit_findings to authenticated;
grant select, insert, update, delete on table public.optimization_actions to authenticated;
grant select, insert, update, delete on table public.reports to authenticated;

revoke execute on function public.is_workspace_member(uuid) from anon, public;
revoke execute on function public.is_workspace_admin(uuid) from anon, public;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.is_workspace_admin(uuid) to authenticated;
