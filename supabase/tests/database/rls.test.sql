begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'one@example.com', '', now(), now()),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'two@example.com', '', now(), now());

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000011","role":"authenticated"}', true);

select lives_ok(
  $$insert into public.user_progress_items (user_id, surface, slug, status) values ('00000000-0000-0000-0000-000000000011', 'document', 'test/own', 'started')$$,
  'a user can create their own progress'
);
select throws_ok(
  $$insert into public.user_progress_items (user_id, surface, slug, status) values ('00000000-0000-0000-0000-000000000022', 'document', 'test/other', 'started')$$,
  '42501', null, 'a user cannot create another user progress row'
);
select is((select count(*)::integer from public.user_progress_items), 1, 'a user sees only their progress');
select lives_ok(
  $$insert into public.user_skill_progress (user_id, path_slug, skill_id) values ('00000000-0000-0000-0000-000000000011', 'japanese-foundations', 'kana-reading')$$,
  'a user can create their own skill progress'
);
select throws_ok(
  $$insert into public.user_skill_progress (user_id, path_slug, skill_id) values ('00000000-0000-0000-0000-000000000022', 'japanese-foundations', 'kana-reading')$$,
  '42501', null, 'a user cannot create another user skill row'
);
select is((select count(*)::integer from public.user_skill_progress), 1, 'a user sees only their skill progress');
select is((select count(*)::integer from public.kb_documents), 0, 'authenticated clients cannot read unsynchronized protected content directly');

set local role anon;
select throws_ok(
  $$insert into public.user_progress_items (user_id, surface, slug, status) values ('00000000-0000-0000-0000-000000000011', 'document', 'test/anon', 'started')$$,
  '42501', null, 'anonymous clients cannot write progress'
);

select * from finish();
rollback;
