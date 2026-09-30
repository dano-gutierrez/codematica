begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
-- A pre-manual-feature backup lacks origin. No existing rows are removed.
select public.linkedin_restore(jsonb_build_object('version',1,'posts',jsonb_build_array(jsonb_build_object(
  'id','10000000-0000-4000-8000-000000000099','seed_key','legacy','title','Legacy','topic','Systems','status','review',
  'current_revision_id','20000000-0000-4000-8000-000000000099','created_at',now(),'updated_at',now())),
  'revisions',jsonb_build_array(jsonb_build_object('id','20000000-0000-4000-8000-000000000099',
  'post_id','10000000-0000-4000-8000-000000000099','kind','initial','body','Legacy source-grounded draft',
  'first_comment','','sources',jsonb_build_array(jsonb_build_object('path','content/knowledge/fixture.md')),
  'facts_confirmed',false,'created_at',now())), 'jobs','[]'::jsonb,'publications','[]'::jsonb,'settings','[]'::jsonb));
select is((select origin from public.linkedin_posts),'material','old backup restores material provenance');
select is((select body from public.linkedin_revisions),'Legacy source-grounded draft','old immutable text preserved');
select throws_ok($$insert into public.linkedin_revisions(post_id,kind,body,sources) select id,'edit','Missing source','[]'::jsonb from public.linkedin_posts$$,'23514','Material drafts require source snapshots','material source requirement remains enforced');
select * from finish();
rollback;
