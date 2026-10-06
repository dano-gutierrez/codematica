begin;
select no_plan();
select ok(not has_function_privilege('authenticated','public.linkedin_enable_knowledge()','EXECUTE'),'Only the worker can enroll posts');
select ok(not has_function_privilege('service_role','private.linkedin_publish_without_knowledge(uuid,uuid)','EXECUTE'),'Worker cannot bypass graph publication guard');
select throws_ok($$select public.linkedin_enable_knowledge()$$,'P0001','Activate a graph and local preparation before enrollment','Enrollment requires graph and preparation');
select is(private.knowledge_canonical('{"z":[true,null,2],"a":"Quotes \\\" and 日本語"}'),'{"a":"Quotes \\\" and 日本語","z":[true,null,2]}','Canonical hashes preserve Unicode and literal escapes');
select public.knowledge_publish(jsonb_build_object('id',repeat('a',64),'source_catalog_id',repeat('b',64),'resources','[]'::jsonb,'relationships','[]'::jsonb,'semantic_complete',false));
insert into auth.users(id,email,email_confirmed_at,created_at,updated_at) values('11111111-1111-4111-8111-111111111111','graph-prepare@example.test',now(),now(),now());
select public.linkedin_bootstrap_admin('11111111-1111-4111-8111-111111111111');
select public.linkedin_enable_preparation();
select public.linkedin_enable_knowledge();
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
select public.linkedin_create('knowledge-prepared','Graph-backed post','Systems','Original graph body');
select is((select knowledge_required from public.linkedin_posts),true,'New posts retain graph enrollment');
reset role;
create temp table claim as select public.linkedin_claim('prepare') payload;
create function pg_temp.graph_report(c jsonb) returns jsonb language sql as $$
  select jsonb_build_object('snapshot_id',repeat('b',64),'candidate_hash',private.knowledge_hash(jsonb_build_object('title',c#>>'{post,title}','body',c#>>'{revision,body}','kind','post','existingId','post:'||(c#>>'{post,id}'),'revisionId',c#>>'{revision,id}')),
    'action','needs_review','matches','[]'::jsonb,'relationships','[]'::jsonb,'warnings','["Incomplete graph"]'::jsonb,'placement','{}'::jsonb,'semantic_complete',false);
$$;
select throws_ok($$select public.knowledge_save_post((payload#>>'{post,id}')::uuid,(payload#>>'{revision,id}')::uuid,pg_temp.graph_report(payload)||jsonb_build_object('candidate_hash',repeat('f',64))) from claim$$,'P0001','Knowledge candidate hash mismatch','Post report must bind the actual text and revision');
select throws_ok($$select public.knowledge_save_post((payload#>>'{post,id}')::uuid,(payload#>>'{revision,id}')::uuid,pg_temp.graph_report(payload)||'{"matches":[{"id":"invented","hash":"bad","text":"fabricated"}]}') from claim$$,'P0001','Invalid knowledge evidence','Invented matches are rejected');
create temp table graph_job as select public.knowledge_save_post((payload#>>'{post,id}')::uuid,(payload#>>'{revision,id}')::uuid,pg_temp.graph_report(payload)) data from claim;
create temp table graph_context as select private.knowledge_compact(j) data from public.knowledge_jobs j where j.id=(select (data->>'id')::uuid from graph_job);
create function pg_temp.prep(c jsonb, context jsonb) returns jsonb language sql as $$
  select jsonb_build_object('input_hash',repeat('a',64),'candidate_hash',encode(sha256(convert_to('Prepared graph body'||E'\n--first-comment--\n','UTF8')),'hex'),
    'outcome','held','analysis',jsonb_build_object('rewrittenPost','Prepared graph body','postingPlan',jsonb_build_object('firstComment',''),'diagnosis','{}'::jsonb,'alternativeHooks','["a","b","c"]'::jsonb,'verificationNotes','[]'::jsonb),
    'issues','[]'::jsonb,'related','[]'::jsonb,'before','{}'::jsonb,'after','{}'::jsonb,'versions',jsonb_build_object('writer','test','judge','test','prompt',repeat('a',64),'voice',c#>>'{settings,voice_profile,id}'),'metrics','{}'::jsonb,
    'knowledge',context,'knowledge_hash',private.knowledge_hash(context));
$$;
select throws_ok($$select public.linkedin_complete_prepare((payload#>>'{job,id}')::uuid,(payload#>>'{job,lease_token}')::uuid,pg_temp.prep(payload,null)) from claim$$,'P0001','Current graph evidence required for preparation','Missing graph cannot advance preparation');
select throws_ok($$select public.linkedin_complete_prepare((payload#>>'{job,id}')::uuid,(payload#>>'{job,lease_token}')::uuid,pg_temp.prep(payload,(select data||'{"warnings":[]}' from graph_context))) from claim$$,'P0001','Current graph evidence required for preparation','Warnings cannot be removed in the compact handoff');
select lives_ok($$select public.linkedin_complete_prepare((payload#>>'{job,id}')::uuid,(payload#>>'{job,lease_token}')::uuid,pg_temp.prep(payload,(select data from graph_context))) from claim$$,'Bound graph context survives preparation');
select is((select count(*)::integer from public.linkedin_jobs where kind='refine'),0,'Graph hold cannot queue Codex without a reason');
set local role authenticated;
select public.linkedin_preparation_action(p.id,p.current_revision_id,r.id,'send_with_flags','Synthetic review confirms this is useful cross-format reuse') from public.linkedin_posts p join public.linkedin_preparations r on r.post_id=p.id;
reset role;
create temp table verify_claim as select public.linkedin_claim('refine') payload;
create function pg_temp.verification(c jsonb) returns jsonb language sql as $$
  select jsonb_build_object('preparation_id',c#>>'{job,preparation_id}','candidate_hash',c#>>'{preparation,candidate_hash}','knowledge_hash',c#>>'{preparation,knowledge_hash}','verdict','accept','checked','["text","meaning","facts","voice"]'::jsonb,'notes','[]'::jsonb,'toolsUsed','[]'::jsonb);
$$;
select throws_ok($$select public.linkedin_complete_verified((payload#>>'{job,id}')::uuid,(payload#>>'{job,lease_token}')::uuid,pg_temp.verification(payload)-'knowledge_hash',repeat('b',64)) from verify_claim$$,'P0001','Verification requires unchanged graph evidence','Codex must acknowledge the graph hash');
select lives_ok($$select public.linkedin_complete_verified((payload#>>'{job,id}')::uuid,(payload#>>'{job,lease_token}')::uuid,pg_temp.verification(payload),repeat('b',64)) from verify_claim$$,'Full candidate verification can propose a revision');
-- Advance the projection without altering authored catalog IDs: even newly discovered edges invalidate review.
select public.knowledge_publish(jsonb_build_object('id',repeat('c',64),'source_catalog_id',repeat('b',64),'resources','[]'::jsonb,'relationships','[]'::jsonb,'semantic_complete',false));
set local role authenticated;
select throws_ok($$select public.linkedin_review(p.id,p.current_revision_id,'use',p_proposal_id=>r.id) from public.linkedin_posts p join public.linkedin_revisions r on r.post_id=p.id and r.kind='refine'$$,'P0001','Prepare and verify against the current graph before adoption or approval','Stale projection rejects adoption');
reset role;
update public.knowledge_state set snapshot_id=repeat('a',64) where id;
set local role authenticated;
select lives_ok($$select public.linkedin_review(p.id,p.current_revision_id,'use',p_proposal_id=>r.id) from public.linkedin_posts p join public.linkedin_revisions r on r.post_id=p.id and r.kind='refine'$$,'unchanged graph proposal can be adopted');
select public.linkedin_review(id,current_revision_id,'save',p_body=>'Prepared graph body',p_first_comment=>'',p_facts_confirmed=>true) from public.linkedin_posts;
reset role;
select is((select public.knowledge_for_post(id,current_revision_id)->>'id' from public.linkedin_posts),(select data->>'id' from graph_job),'Adoption and fact confirmation retain the supporting graph report');
set local role authenticated;
select lives_ok($$select public.linkedin_review(id,current_revision_id,'approve') from public.linkedin_posts$$,'Fact confirmation preserves graph and verification binding');
reset role;
update public.linkedin_settings set publishing_enabled=true,buffer_channel_id='inert-channel',buffer_organization_id='inert-org' where id;
create temp table schedule_claim as select public.linkedin_claim('schedule') payload;
update public.knowledge_state set snapshot_id=repeat('c',64) where id;
select throws_ok($$select public.linkedin_begin_publish((payload#>>'{job,id}')::uuid,(payload#>>'{job,lease_token}')::uuid) from schedule_claim$$,'P0001','Publication requires unchanged graph evidence','A newly stale graph blocks Buffer before any mutation');
select is((select count(*)::integer from public.linkedin_publications),0,'Stale graph creates no publication');
update public.knowledge_state set snapshot_id=repeat('a',64) where id;
select lives_ok($$select public.linkedin_begin_publish((payload#>>'{job,id}')::uuid,(payload#>>'{job,lease_token}')::uuid) from schedule_claim$$,'Exact approved graph-bound revision can begin inert publication');
select is((select status from public.linkedin_publications),'scheduling','Publication has exact revision identity');
select * from finish();
rollback;
