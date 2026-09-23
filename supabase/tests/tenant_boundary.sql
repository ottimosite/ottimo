begin;

create extension if not exists pgtap with schema extensions;

select plan(20);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'workspaces', 'workspaces table exists');
select has_table('public', 'workspace_members', 'workspace membership table exists');
select has_table('public', 'websites', 'websites table exists');
select has_table('public', 'audits', 'audits table exists');
select has_table('public', 'audit_findings', 'audit findings table exists');
select has_table('public', 'optimization_actions', 'optimization actions table exists');
select has_table('public', 'reports', 'reports table exists');

select has_index('public', 'workspace_members', 'workspace_members_user_idx', 'membership user index exists');
select has_index('public', 'websites', 'websites_workspace_idx', 'website workspace index exists');
select has_index('public', 'audits', 'audits_workspace_created_idx', 'audit workspace index exists');

select col_is_pk('public', 'profiles', 'id', 'profile identity is the primary key');
select col_is_fk('public', 'profiles', 'id', 'profile identity references auth users');
select col_is_fk('public', 'workspace_members', 'workspace_id', 'membership references workspace');
select col_is_fk('public', 'workspace_members', 'user_id', 'membership references auth user');
select col_is_fk('public', 'websites', 'workspace_id', 'website references workspace');
select col_is_fk('public', 'audits', 'workspace_id', 'audit references workspace');
select col_is_fk('public', 'audits', 'website_id', 'audit references website');

select has_function('public', 'is_workspace_member', ARRAY['uuid'], 'workspace membership helper exists');
select has_function('public', 'is_workspace_admin', ARRAY['uuid'], 'workspace admin helper exists');

select * from finish();

rollback;
