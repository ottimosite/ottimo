begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'workspaces', 'workspaces table exists');
select has_table('public', 'workspace_members', 'workspace membership table exists');
select has_table('public', 'websites', 'websites table exists');
select has_table('public', 'audit_records', 'audit records table exists');

select has_index('public', 'workspace_members', 'workspace_members_user_id_idx', 'membership user index exists');
select has_index('public', 'websites', 'websites_workspace_id_idx', 'website workspace index exists');
select has_index('public', 'audit_records', 'audit_records_workspace_id_idx', 'audit workspace index exists');

select col_is_pk('public', 'profiles', 'id', 'profile identity is the primary key');
select col_is_fk('public', 'profiles', 'id', 'profile identity references auth users');
select col_is_fk('public', 'workspace_members', 'workspace_id', 'membership references workspace');
select col_is_fk('public', 'workspace_members', 'user_id', 'membership references auth user');
select col_is_fk('public', 'websites', 'workspace_id', 'website references workspace');
select col_is_fk('public', 'audit_records', 'workspace_id', 'audit references workspace');
select col_is_fk('public', 'audit_records', 'website_id', 'audit references website');

select has_function('private', 'is_workspace_member', ARRAY['uuid'], 'membership helper exists');
select has_function('private', 'user_workspace_ids', ARRAY[]::text[], 'workspace id helper exists');

select * from finish();

rollback;
