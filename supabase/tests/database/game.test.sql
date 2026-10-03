begin;
create extension if not exists pgtap with schema extensions;
select plan(15);
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,created_at,updated_at) values
 ('00000000-0000-0000-0000-000000000031','00000000-0000-0000-0000-000000000000','authenticated','authenticated','game-one@example.com','',now(),now()),
 ('00000000-0000-0000-0000-000000000032','00000000-0000-0000-0000-000000000000','authenticated','authenticated','game-two@example.com','',now(),now());
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000031","role":"authenticated"}',true);
select is(public.get_game_progress(),null::jsonb,'an account begins without game state');
select throws_ok($$select public.merge_game_progress('{}')$$,'P0001','Invalid snapshot','missing fields cannot create a snapshot');
select throws_ok($$select public.merge_game_progress('{}','00000000-0000-0000-0000-000000000032')$$,'42501','Account changed','in-flight writes cannot cross accounts');
select lives_ok($$select public.merge_game_progress('{"version":1,"timezone":"UTC","cosmetic":"none","updatedAt":"2026-01-02T12:00:00Z","awards":{"restore-the-signal/courtyard-defense/main":{"mode":"standard","earnedAt":"2026-01-02T12:00:00Z"}},"activityDays":["2026-01-02","2026-01-02"]}')$$,'a main clear is saved');
select is((select count(*)::int from public.user_game_awards),1,'a single reward is recorded');
select is((select count(*)::int from public.user_game_activity_days),1,'success dates deduplicate');
select lives_ok($$select public.merge_game_progress('{"version":1,"timezone":"UTC","cosmetic":"none","updatedAt":"2026-01-03T12:00:00Z","awards":{"restore-the-signal/courtyard-defense/mastery-1":{"mode":"assisted","earnedAt":"2026-01-03T12:00:00Z"}},"activityDays":["2026-01-03"]}')$$,'a second device can merge against the already earned main');
select is((select count(*)::int from public.user_game_awards),2,'a merge retains preceding rewards');
select lives_ok($$select public.merge_game_progress('{"version":1,"timezone":"UTC","cosmetic":"none","updatedAt":"2026-01-04T12:00:00Z","awards":{"restore-the-signal/courtyard-defense/main":{"mode":"assisted","earnedAt":"2026-01-04T12:00:00Z"}},"activityDays":["2026-01-03"]}')$$,'a replay retries idempotently');
select is((public.get_game_progress()->'awards'->'restore-the-signal/courtyard-defense/main'->>'mode'),'standard','the original clear mode survives replay');
select throws_ok($$select public.merge_game_progress('{"version":1,"timezone":"UTC","cosmetic":"none","updatedAt":"2026-01-03T12:00:00Z","awards":{"restore-the-signal/first-outpost/main":{"mode":"standard","earnedAt":"2026-01-03T12:00:00Z"}},"activityDays":[]}')$$,'P0001','Missing preceding clear','campaign order is enforced');
select throws_ok($$select public.merge_game_progress('{"version":1,"timezone":"UTC","cosmetic":"beacon","updatedAt":"2026-01-03T12:00:00Z","awards":{},"activityDays":[]}')$$,'P0001','Cosmetic not earned','unearned cosmetics are rejected');
select throws_ok($$insert into public.user_game_awards values('00000000-0000-0000-0000-000000000031','restore-the-signal/target-lock/main','standard',now())$$,'42501',null,'direct inserts cannot bypass merge validation');
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000032","role":"authenticated"}',true);
select is((select count(*)::int from public.user_game_awards),0,'RLS hides the other account');
set local role anon;
select throws_ok($$select public.get_game_progress()$$,'42501',null,'anonymous clients cannot read hosted game state');
select * from finish();
rollback;
