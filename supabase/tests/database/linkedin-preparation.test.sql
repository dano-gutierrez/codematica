begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
insert into auth.users(id,email,email_confirmed_at,created_at,updated_at) values('11111111-1111-4111-8111-111111111111','prepare@example.test',now(),now(),now());
select public.linkedin_bootstrap_admin('11111111-1111-4111-8111-111111111111');
select public.linkedin_enable_preparation();
set local role authenticated;
select throws_ok($$select public.linkedin_overview()$$,'42501','Admin access required','overview requires membership');
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
select public.linkedin_create('prepared','Title','Systems','Original body');
select is((select count(*)::int from public.linkedin_jobs where kind='prepare'),1,'create enqueues local preparation');
select is((select count(*)::int from public.linkedin_jobs where kind='refine'),0,'Codex cannot claim unprepared work');
select is((select preparation_required from public.linkedin_posts),true,'new drafts use the new gate');
select is(jsonb_array_length(public.linkedin_overview()->'revisions'),0,'polling omits revision history');
select is(jsonb_array_length(public.linkedin_detail((select id from public.linkedin_posts))->'revisions'),1,'detail loads only the chosen post');
select throws_ok($$select public.linkedin_review(id,current_revision_id,'approve') from public.linkedin_posts$$,'P0001','Adopt a Codex-verified preparation before approval.','local pipeline cannot be bypassed by approval');
select public.linkedin_review(id,current_revision_id,'refine') from public.linkedin_posts;
select is((select count(*)::int from public.linkedin_jobs),1,'repeated request does not duplicate active work');
select throws_ok($$select public.linkedin_claim('prepare')$$,'42501',null,'browser cannot claim worker jobs');
reset role;
create temp table claim as select public.linkedin_claim('prepare') payload;
create function pg_temp.report(c jsonb, outcome text) returns jsonb language sql as $$
  select jsonb_build_object('input_hash',repeat('a',64),'candidate_hash',encode(sha256(convert_to('Prepared body'||E'\n--first-comment--\n','UTF8')),'hex'),
    'outcome',outcome,'analysis',jsonb_build_object('rewrittenPost','Prepared body','postingPlan',jsonb_build_object('firstComment',''),'diagnosis','{}'::jsonb,'alternativeHooks','["a","b","c"]'::jsonb,'verificationNotes','[]'::jsonb),
    'issues','[]'::jsonb,'related','[]'::jsonb,'before','{}'::jsonb,'after','{}'::jsonb,
    'versions',jsonb_build_object('writer','test','judge','test','prompt',repeat('a',64),'voice',c#>>'{settings,voice_profile,id}'),
    'metrics',jsonb_build_object('rounds',1,'elapsed_ms',100));
$$;
select throws_ok($$select public.linkedin_complete_prepare((payload#>>'{job,id}')::uuid,(payload#>>'{job,lease_token}')::uuid,'{}') from claim$$,'P0001','Invalid preparation report','malformed local reports fail closed');
select public.linkedin_complete_prepare((payload#>>'{job,id}')::uuid,(payload#>>'{job,lease_token}')::uuid,pg_temp.report(payload,'ready')) from claim;
select is((select body from public.linkedin_revisions where kind='initial'),'Original body','original text is immutable');
select is((select count(*)::int from public.linkedin_revisions),1,'local analysis is separate from adopted revisions');
select is((select count(*)::int from public.linkedin_jobs where kind='refine'),1,'ready completion enqueues one Codex job');
select lives_ok($$select public.linkedin_complete_prepare((payload#>>'{job,id}')::uuid,(payload#>>'{job,lease_token}')::uuid,pg_temp.report(payload,'ready')) from claim$$,'completion retry is idempotent');
select throws_ok($$update public.linkedin_preparations set outcome='held'$$,'55000',null,'reports are immutable');
create temp table verify_claim as select public.linkedin_claim('refine') payload;
select throws_ok($$select public.linkedin_complete_refine((payload#>>'{job,id}')::uuid,(payload#>>'{job,lease_token}')::uuid,'{}',repeat('a',64)) from verify_claim$$,'P0001','Use verified completion for prepared jobs.','old completion cannot bypass candidate binding');
select throws_ok($$select public.linkedin_complete_verified((payload#>>'{job,id}')::uuid,(payload#>>'{job,lease_token}')::uuid,jsonb_build_object('preparation_id',payload#>>'{job,preparation_id}','candidate_hash',repeat('f',64),'verdict','accept','checked','["text","meaning","facts","voice"]'::jsonb,'notes','[]'::jsonb,'toolsUsed','[]'::jsonb),repeat('b',64)) from verify_claim$$,'P0001','Verification does not match the prepared candidate.','hash mismatch rejected in database');
select throws_ok($$select public.linkedin_complete_verified((payload#>>'{job,id}')::uuid,(payload#>>'{job,lease_token}')::uuid,'{}',repeat('b',64)) from verify_claim$$,'P0001','Verification does not match the prepared candidate.','missing bindings fail closed');
select throws_ok($$select public.linkedin_complete_verified((payload#>>'{job,id}')::uuid,(payload#>>'{job,lease_token}')::uuid,jsonb_build_object('preparation_id',payload#>>'{job,preparation_id}','candidate_hash',payload#>>'{preparation,candidate_hash}','verdict','accept','notes','[]'::jsonb),repeat('b',64)) from verify_claim$$,'P0001','Invalid verification','missing checks fail closed');
select public.linkedin_complete_verified((payload#>>'{job,id}')::uuid,(payload#>>'{job,lease_token}')::uuid,
  jsonb_build_object('preparation_id',payload#>>'{job,preparation_id}','candidate_hash',payload#>>'{preparation,candidate_hash}','verdict','accept','checked','["text","meaning","facts","voice"]'::jsonb,'notes','[]'::jsonb,'toolsUsed','[]'::jsonb),repeat('b',64)) from verify_claim;
set local role authenticated;
select public.linkedin_review(p.id,p.current_revision_id,'use',p_proposal_id=>r.id) from public.linkedin_posts p join public.linkedin_revisions r on r.post_id=p.id and r.kind='refine';
select public.linkedin_review(id,current_revision_id,'save',p_body=>'Prepared body',p_first_comment=>'',p_facts_confirmed=>true) from public.linkedin_posts;
select ok((select preparation_id is not null from public.linkedin_revisions where id=(select current_revision_id from public.linkedin_posts)),'fact-only confirmation preserves preparation identity');
select lives_ok($$select public.linkedin_review(id,current_revision_id,'approve') from public.linkedin_posts$$,'only adopted verified result can be approved');
select public.linkedin_review(id,current_revision_id,'withdraw') from public.linkedin_posts;
select public.linkedin_review(id,current_revision_id,'save',p_body=>'Edited body') from public.linkedin_posts;
select throws_ok($$select public.linkedin_review(id,current_revision_id,'approve') from public.linkedin_posts$$,'P0001','Adopt a Codex-verified preparation before approval.','changed text invalidates approval eligibility');
select public.linkedin_review(id,current_revision_id,'refine') from public.linkedin_posts;
reset role;
create temp table stale_claim as select public.linkedin_claim('prepare') payload;
set local role authenticated;
select public.linkedin_review(id,current_revision_id,'save',p_body=>'Newer edit') from public.linkedin_posts;
reset role;
select public.linkedin_complete_prepare((payload#>>'{job,id}')::uuid,(payload#>>'{job,lease_token}')::uuid,pg_temp.report(payload,'ready')) from stale_claim;
select is((select outcome from public.linkedin_preparations order by created_at desc,id desc limit 1),'stale','delayed preparation cannot advance a newer edit');
select is((select count(*)::int from public.linkedin_jobs where kind='refine' and status='pending'),0,'stale result does not enqueue Codex');
set local role authenticated;
select public.linkedin_review(id,current_revision_id,'refine') from public.linkedin_posts;
select public.linkedin_review(id,current_revision_id,'reject') from public.linkedin_posts;
select is((select count(*)::int from public.linkedin_jobs where kind='prepare' and status in ('pending','running')),0,'reject cancels preparation');
reset role;

set local role authenticated;
select public.linkedin_create('held','Held post','Systems','Possible repeat');
reset role;
create temp table held_claim as select public.linkedin_claim('prepare') payload;
select public.linkedin_complete_prepare((payload#>>'{job,id}')::uuid,(payload#>>'{job,lease_token}')::uuid,pg_temp.report(payload,'held')||'{"issues":[{"code":"facts","message":"Missing evidence","blocking":true}]}') from held_claim;
select is((select count(*)::int from public.linkedin_jobs where kind='refine' and status='pending'),0,'held work stays out of Codex queue');
set local role authenticated;
select throws_ok($$select public.linkedin_preparation_action(p.id,p.current_revision_id,r.id,'send_with_flags','') from public.linkedin_posts p join public.linkedin_preparations r on r.post_id=p.id where p.title='Held post'$$,'P0001','Record why this draft should go to Codex','override requires a recorded reason');
select public.linkedin_preparation_action(p.id,p.current_revision_id,r.id,'follow_up','This is a distinct application') from public.linkedin_posts p join public.linkedin_preparations r on r.post_id=p.id where p.title='Held post';
reset role;
select is((select count(*)::int from public.linkedin_jobs where kind='refine' and status='pending' and override_reason like 'follow_up:%'),1,'explicit follow-up preserves flags and reason');
create temp table held_verify as select public.linkedin_claim('refine') payload;
select public.linkedin_complete_verified((payload#>>'{job,id}')::uuid,(payload#>>'{job,lease_token}')::uuid,jsonb_build_object('preparation_id',payload#>>'{job,preparation_id}','candidate_hash',payload#>>'{preparation,candidate_hash}','verdict','needs_input','checked','["text","meaning","facts","voice"]'::jsonb,'notes','["Provide evidence"]'::jsonb,'toolsUsed','[]'::jsonb),repeat('b',64)) from held_verify;
select is((select count(*)::int from public.linkedin_revisions r join public.linkedin_posts p on p.id=r.post_id where p.title='Held post'),1,'needs input does not invent a proposed revision');
set local role authenticated;
select public.linkedin_set_voice('["Be specific and conversational."]');
reset role;
select is((select count(*)::int from public.linkedin_jobs where kind='prepare' and status='pending'),1,'voice change prepares eligible review drafts again');
create temp table expired as select public.linkedin_claim('prepare') payload;
update public.linkedin_jobs set lease_until=now()-interval '1 minute' where id=(select (payload#>>'{job,id}')::uuid from expired);
select public.linkedin_claim('prepare');
select is((select attempts from public.linkedin_jobs where id=(select (payload#>>'{job,id}')::uuid from expired)),2,'expired local leases retry safely');
select throws_ok($$select public.linkedin_complete_prepare((payload#>>'{job,id}')::uuid,(payload#>>'{job,lease_token}')::uuid,pg_temp.report(payload,'ready')) from expired$$,'40001','Job lease is no longer valid','old local worker cannot complete reclaimed work');
-- Version 2 roundtrip: immutable text, reports, and verification bindings survive.
create temp table backup as select jsonb_build_object('version',2,'posts',(select jsonb_agg(p) from public.linkedin_posts p),'revisions',(select jsonb_agg(r) from public.linkedin_revisions r),'jobs',(select jsonb_agg(j) from public.linkedin_jobs j),'preparations',(select jsonb_agg(r) from public.linkedin_preparations r),'voice_profiles',(select jsonb_agg(v) from public.linkedin_voice_profiles v),'publications','[]'::jsonb,'settings',(select jsonb_agg(s) from public.linkedin_settings s)) value;
set constraints all immediate;
truncate public.linkedin_posts cascade;
set constraints all deferred;
select lives_ok($$select public.linkedin_restore(value) from backup$$,'v2 restore supports deferred preparation references');
select is((select count(*) from public.linkedin_preparations),(select jsonb_array_length(value->'preparations')::bigint from backup),'all preparation reports restored');
select is((select count(*) from public.linkedin_revisions where preparation_id is not null),(select count(*) from backup,jsonb_array_elements(value->'revisions') r where r->>'preparation_id' is not null),'edit and proposal preparation bindings restored regardless of row order');
select is((select publishing_enabled from public.linkedin_settings),false,'restoration keeps publishing paused');

-- Editing generic voice rules before opt-in must not cancel the legacy workflow.
update public.linkedin_settings set local_preparation_enabled=false where id;
set local role authenticated;
select public.linkedin_create('legacy-voice','Legacy voice draft','Systems','A legacy draft');
select public.linkedin_set_voice('["Use precise language."]');
select is((select j.status from public.linkedin_jobs j join public.linkedin_posts p on p.id=j.post_id where p.title='Legacy voice draft' and j.kind='refine'),'pending','voice changes preserve unenrolled legacy jobs');
reset role;
select * from finish();
rollback;
