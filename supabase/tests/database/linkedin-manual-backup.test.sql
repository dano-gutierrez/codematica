begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
select public.linkedin_restore(jsonb_build_object('version',1,'posts',jsonb_build_array(jsonb_build_object(
  'id','10000000-0000-4000-8000-000000000099','seed_key','manual:fixture','title','Manual','topic','Systems','status','review','origin','manual',
  'current_revision_id','20000000-0000-4000-8000-000000000099','created_at',now(),'updated_at',now())),
  'revisions',jsonb_build_array(jsonb_build_object('id','20000000-0000-4000-8000-000000000099',
  'post_id','10000000-0000-4000-8000-000000000099','kind','initial','body','Manual draft',
  'first_comment','','sources','[]'::jsonb,'facts_confirmed',false,'created_at',now())),
  'jobs','[]'::jsonb,'publications','[]'::jsonb,'settings','[]'::jsonb));
select is((select origin from public.linkedin_posts),'manual','manual backup retains provenance');
select is((select sources from public.linkedin_revisions),'[]'::jsonb,'manual empty sources survive restore');
select * from finish();
rollback;
