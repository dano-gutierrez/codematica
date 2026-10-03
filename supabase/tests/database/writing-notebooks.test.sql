begin;
create extension if not exists pgtap with schema extensions;
select plan(14);
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,created_at,updated_at) values
 ('00000000-0000-0000-0000-000000000071','00000000-0000-0000-0000-000000000000','authenticated','authenticated','notebook-one@example.test','',now(),now()),
 ('00000000-0000-0000-0000-000000000072','00000000-0000-0000-0000-000000000000','authenticated','authenticated','notebook-two@example.test','',now(),now());
select ok((select relrowsecurity from pg_class where oid='public.user_writing_notebook_progress'::regclass),'notebook RLS is enabled');
select hasnt_column('public','user_writing_notebook_progress','ink','no handwriting is stored remotely');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000071","role":"authenticated"}',true);
select lives_ok($$insert into public.user_writing_notebook_progress(user_id,notebook_id,sheet_id,prompt,best_count) values('00000000-0000-0000-0000-000000000071','custom-a-v1','a-mixed','あい',48)$$,'owner can complete their sheet');
select ok((select completed_at is not null from public.user_writing_notebook_progress),'completion timestamp is set');
select throws_ok($$insert into public.user_writing_notebook_progress(user_id,notebook_id,sheet_id,prompt) values('00000000-0000-0000-0000-000000000072','custom-a-v1','a-mixed','あい')$$,'42501',null,'another user cannot be written');
select throws_ok($$insert into public.user_writing_notebook_progress(user_id,notebook_id,sheet_id,prompt,best_count) values('00000000-0000-0000-0000-000000000071','custom-a-v1','bad','あい',49)$$,'23514',null,'progress is bounded by prompt length');
select throws_ok($$insert into public.user_writing_notebook_progress(user_id,notebook_id,sheet_id,prompt,best_count) values('00000000-0000-0000-0000-000000000071','custom-a-v1','negative','あ',-1)$$,'23514',null,'negative progress is rejected');
select lives_ok($$update public.user_writing_notebook_progress set best_count=0,completed_at=null$$,'restarting is allowed without losing earned progress');
select is((select best_count from public.user_writing_notebook_progress),48,'earned unlock stays at furthest progress');
select ok((select completed_at is not null from public.user_writing_notebook_progress),'earned completion survives restart');
select throws_ok($$update public.user_writing_notebook_progress set prompt='あ'$$,'P0001',null,'sheet prompt cannot change under a saved identifier');
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000072","role":"authenticated"}',true);
select is((select count(*)::integer from public.user_writing_notebook_progress),0,'other accounts see no notebook progress');
set local role anon;
select throws_ok($$select * from public.user_writing_notebook_progress$$,'42501',null,'anonymous remote reads are unavailable');
select throws_ok($$insert into public.user_writing_notebook_progress(user_id,notebook_id,sheet_id,prompt) values('00000000-0000-0000-0000-000000000071','a','b','あ')$$,'42501',null,'anonymous remote writes are unavailable');
reset role;
select * from finish();
rollback;
