-- Private opportunity tracking; additive and independent of anonymous learning.
create table public.interview_companies (id uuid primary key default gen_random_uuid(), name text not null, website text not null default '', unique(name,website));
create table public.interview_opportunities (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.interview_companies(id),
 version integer not null default 1 check(version>0), input jsonb not null, updated_at timestamptz not null default now()
);
create table public.interview_rounds (
 opportunity_id uuid not null references public.interview_opportunities(id), ordinal integer not null, input jsonb not null,
 primary key(opportunity_id,ordinal)
);
create table public.interview_profiles (version integer primary key check(version>0), input jsonb not null, created_at timestamptz not null default now());
create table public.interview_briefs (id uuid primary key default gen_random_uuid(), opportunity_id uuid not null references public.interview_opportunities(id), brief jsonb not null, context jsonb not null, created_at timestamptz not null default now());
create table private.interview_requests (actor text not null, key text not null, payload jsonb not null, result uuid not null, primary key(actor,key));
alter table private.interview_requests enable row level security;
revoke all on private.interview_requests from public,anon,authenticated;
do $$ declare t text; begin
 foreach t in array array['interview_companies','interview_opportunities','interview_rounds','interview_profiles','interview_briefs'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  execute format('grant all on public.%I to service_role',t);
  execute format('create policy admin_read on public.%I for select to authenticated using ((select public.linkedin_is_admin()))',t);
 end loop;
end $$;
create function private.interview_require_admin() returns void language plpgsql security definer set search_path='' as $$
begin if not public.linkedin_is_admin() and coalesce(auth.role(),'')<>'service_role' then raise exception 'Admin access required' using errcode='42501'; end if; end $$;
create function private.interview_immutable() returns trigger language plpgsql set search_path='' as $$ begin raise exception 'Interview revisions are immutable'; end $$;
create trigger interview_profile_immutable before update or delete on public.interview_profiles for each row execute function private.interview_immutable();
create trigger interview_brief_immutable before update or delete on public.interview_briefs for each row execute function private.interview_immutable();
create function public.interview_snapshot() returns jsonb language plpgsql security definer set search_path='' as $$
declare profile jsonb; begin
 perform private.interview_require_admin();
 select input||jsonb_build_object('version',version) into profile from public.interview_profiles order by version desc limit 1;
 return jsonb_build_object('graphSnapshot',(select snapshot_id from public.knowledge_state where id),'profile',coalesce(profile,'{"version":0,"resume":"","experience":""}'::jsonb),
 'profileHistory',coalesce((select jsonb_agg(input||jsonb_build_object('version',version) order by version desc) from public.interview_profiles),'[]'::jsonb),
 'opportunities',coalesce((select jsonb_agg(o.input||jsonb_build_object('id',o.id,'companyId',o.company_id,'version',o.version,'updatedAt',o.updated_at) order by o.updated_at desc,o.id) from public.interview_opportunities o),'[]'::jsonb),
 'revisions',coalesce((select jsonb_agg(jsonb_build_object('id',id,'createdAt',created_at,'brief',brief,'context',context) order by created_at desc,id) from public.interview_briefs),'[]'::jsonb));
end $$;
create function public.interview_save_profile(p_input jsonb,p_version integer) returns void language plpgsql security definer set search_path='' as $$
declare current_version integer; begin
 perform private.interview_require_admin(); perform pg_advisory_xact_lock(864004);
 if jsonb_typeof(p_input->'resume') is distinct from 'string' or jsonb_typeof(p_input->'experience') is distinct from 'string' or length(p_input->>'resume')>100000 or length(p_input->>'experience')>100000 then raise exception 'Invalid candidate profile' using errcode='22023'; end if;
 select coalesce(max(version),0) into current_version from public.interview_profiles;
 if p_version is distinct from current_version then raise exception 'Profile changed. Refresh before saving.'; end if;
 insert into public.interview_profiles(version,input) values(current_version+1,p_input);
end $$;
create function public.interview_save(p_input jsonb,p_id uuid,p_version integer,p_key text) returns uuid language plpgsql security definer set search_path='' as $$
declare v_actor text:=coalesce(auth.uid()::text,'service_role'); old private.interview_requests; cid uuid; result uuid; current_version integer; r jsonb; ordinal integer:=0; payload jsonb; field text;
begin
 perform private.interview_require_admin(); perform pg_advisory_xact_lock(864004);
 if p_key is null or length(p_key) not between 1 and 200 then raise exception 'Invalid request key' using errcode='22023'; end if;
 payload:=jsonb_build_object('input',p_input,'id',p_id,'version',p_version);
 select * into old from private.interview_requests where interview_requests.actor=v_actor and key='save:'||p_key;
 if found then if old.payload is distinct from payload then raise exception 'Request key reused with different input'; end if; return old.result; end if;
 if jsonb_typeof(p_input) is distinct from 'object' or jsonb_typeof(p_input->'company') is distinct from 'string' or jsonb_typeof(p_input->'position') is distinct from 'string' or length(trim(coalesce(p_input->>'company',''))) not between 1 and 300 or length(trim(coalesce(p_input->>'position',''))) not between 1 and 300 or coalesce(p_input->>'status','') not in ('potential','applied','interviewing','offer','closed','archived') or jsonb_typeof(p_input->'rounds') is distinct from 'array' or jsonb_array_length(p_input->'rounds')>50 then raise exception 'Invalid opportunity' using errcode='22023'; end if;
 for r in select value from jsonb_each(p_input) where key in ('website','jobUrl','notes','jobDescription','outcome') loop
  if jsonb_typeof(r) is distinct from 'string' or length(r#>>'{}')>100000 then raise exception 'Invalid opportunity field' using errcode='22023'; end if;
 end loop;
 if coalesce(p_input->>'website','')<>'' and p_input->>'website' !~ '^https?://[^[:space:]]+$' or coalesce(p_input->>'jobUrl','')<>'' and p_input->>'jobUrl' !~ '^https?://[^[:space:]]+$' then raise exception 'Invalid URL' using errcode='22023'; end if;
 for r in select value from jsonb_array_elements(p_input->'rounds') loop
  if jsonb_typeof(r) is distinct from 'object' or jsonb_typeof(r->'label') is distinct from 'string' or length(trim(coalesce(r->>'label',''))) not between 1 and 200 or not exists(select 1 from pg_timezone_names where name=r->>'timezone') then raise exception 'Invalid interview round' using errcode='22023'; end if;
  foreach field in array array['scheduledAt','timezone','format','interviewer','interviewerTitle','profileUrl','notes'] loop
   if jsonb_typeof(r->field) is distinct from 'string' or length(r->>field)>(case when field='notes' then 100000 else 500 end) then raise exception 'Invalid interview round' using errcode='22023'; end if;
  end loop;
  if coalesce(r->>'profileUrl','')<>'' and r->>'profileUrl' !~ '^https?://[^[:space:]]+$' then raise exception 'Invalid interviewer URL' using errcode='22023'; end if;
  if coalesce(r->>'scheduledAt','')<>'' then if r->>'scheduledAt' !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$' then raise exception 'Round date needs a UTC offset' using errcode='22023'; end if; perform (r->>'scheduledAt')::timestamptz; end if;
 end loop;
 if p_id is not null then select version into current_version from public.interview_opportunities where id=p_id for update; if not found or p_version is distinct from current_version then raise exception 'Opportunity changed. Refresh before saving.'; end if;
 elsif p_version is distinct from 0 then raise exception 'New opportunity needs version zero'; end if;
 insert into public.interview_companies(name,website) values(trim(p_input->>'company'),coalesce(p_input->>'website','')) on conflict(name,website) do update set name=excluded.name returning id into cid;
 if p_id is null then insert into public.interview_opportunities(company_id,input) values(cid,p_input) returning id into result;
 else update public.interview_opportunities set company_id=cid,input=p_input,version=version+1,updated_at=now() where id=p_id returning id into result; end if;
 -- Round rows are replaced only as part of the versioned opportunity save; each brief retains the opportunity context used to prepare it.
 delete from public.interview_rounds where opportunity_id=result;
 for r in select value from jsonb_array_elements(p_input->'rounds') loop insert into public.interview_rounds values(result,ordinal,r); ordinal:=ordinal+1; end loop;
 insert into private.interview_requests values(v_actor,'save:'||p_key,payload,result); return result;
end $$;
create function public.interview_import(p_brief jsonb,p_key text) returns uuid language plpgsql security definer set search_path='' as $$
declare v_actor text:=coalesce(auth.uid()::text,'service_role'); old private.interview_requests; result uuid; oid uuid; v integer; pv integer; field text; r jsonb; sid text; jid uuid;
begin
 perform private.interview_require_admin(); perform pg_advisory_xact_lock(864004);
 if p_key is null or length(p_key) not between 1 and 200 then raise exception 'Invalid request key' using errcode='22023'; end if;
 select * into old from private.interview_requests where interview_requests.actor=v_actor and key='import:'||p_key;
 if found then if old.payload is distinct from p_brief then raise exception 'Request key reused with different input'; end if; return old.result; end if;
 if jsonb_typeof(p_brief) is distinct from 'object' or p_brief#>>'{editing,skill}' is distinct from 'technical-edit' or p_brief#>'{editing,compared}' is distinct from 'true'::jsonb then raise exception 'Technical-edit comparison required' using errcode='22023'; end if;
 foreach field in array array['skillHash','draftHash','editedHash'] loop if coalesce(p_brief#>>array['editing',field],'') !~ '^[a-f0-9]{64}$' then raise exception 'Invalid editing provenance' using errcode='22023'; end if; end loop;
 if p_brief#>>'{editing,editedHash}' is distinct from private.knowledge_hash(p_brief->'sections') then raise exception 'Edited prose changed after technical-edit finalization' using errcode='22023'; end if;
 foreach field in array array['company','fit','likelyQuestions','questionsToAsk','studyPlan','uncertainty'] loop if jsonb_typeof(p_brief#>array['sections',field]) is distinct from 'string' or length(trim(coalesce(p_brief#>>array['sections',field],''))) not between 1 and 100000 then raise exception 'Incomplete preparation sections' using errcode='22023'; end if; end loop;
 if jsonb_typeof(p_brief->'sources') is distinct from 'array' or jsonb_array_length(p_brief->'sources') not between 1 and 100 or jsonb_typeof(p_brief->'resources') is distinct from 'array' or jsonb_array_length(p_brief->'resources')>50 or coalesce(p_brief#>>'{knowledge,status}','') not in ('pending','reviewed') or jsonb_typeof(p_brief#>'{knowledge,warnings}') is distinct from 'array' then raise exception 'Invalid preparation evidence' using errcode='22023'; end if;
 for r in select value from jsonb_array_elements(p_brief->'sources') loop
  if length(trim(coalesce(r->>'title',''))) not between 1 and 300 or coalesce(r->>'url','') !~ '^https?://[^[:space:]]+$' or coalesce(r->>'verifiedAt','') !~ '^\d{4}-\d{2}-\d{2}$' or coalesce(r->>'kind','') not in ('primary','secondary','candidate-account','supplied') then raise exception 'Invalid preparation source' using errcode='22023'; end if;
  perform (r->>'verifiedAt')::date;
 end loop;
 oid:=(p_brief->>'opportunityId')::uuid; select version into v from public.interview_opportunities where id=oid for update;
 select coalesce(max(version),0) into pv from public.interview_profiles;
 if v is null or (p_brief->>'opportunityVersion')::integer is distinct from v or (p_brief->>'profileVersion')::integer is distinct from pv then raise exception 'Preparation inputs changed. Generate against current context.'; end if;
 if p_brief#>>'{knowledge,status}'='reviewed' then
  sid:=p_brief#>>'{knowledge,snapshotId}'; jid:=(p_brief#>>'{knowledge,jobId}')::uuid;
  if sid is distinct from (select snapshot_id from public.knowledge_state where id) or not exists(select 1 from public.knowledge_jobs where id=jid and snapshot_id=sid and reviewed='accept' and status='succeeded' and reviewed_by is not null and reviewed_at is not null and report->>'candidate_hash'=candidate_hash and report->>'snapshot_id'=(select source_catalog_id from public.knowledge_snapshots where id=sid) and private.knowledge_report_valid(report,sid) and candidate->>'existingId'='interview-preparation:'||oid::text and candidate->>'body'=private.interview_body(p_brief)) then raise exception 'Current accepted knowledge assessment required'; end if;
 end if;
 for r in select value from jsonb_array_elements(p_brief->'resources') loop
  if coalesce(r->>'hash','') !~ '^[a-f0-9]{64}$' or length(trim(coalesce(r->>'quote','')))=0 or coalesce(r->>'route','')<>'' and r->>'route' !~ '^/(docs|paths|practice|interviews|diagrams)/[a-z0-9/-]+(\?path=[a-z0-9-]+)?$' then raise exception 'Invalid study resource' using errcode='22023'; end if;
  if not exists(select 1 from public.knowledge_resources kr join public.knowledge_state ks on ks.snapshot_id=kr.snapshot_id where ks.id and kr.id=r->>'resourceId' and kr.data->>'hash'=r->>'hash' and strpos(kr.data->>'text',r->>'quote')>0 and kr.data->>'visibility'='curriculum' and kr.data->>'title'=r->>'title' and (not r ? 'route' or kr.data->>'route'=r->>'route') and jsonb_typeof(r->'paths')='array' and jsonb_typeof(r->'skills')='array' and coalesce(kr.data->'paths','[]'::jsonb) @> (r->'paths') and coalesce(kr.data->'skills','[]'::jsonb) @> (r->'skills')) then raise exception 'Study resource evidence is stale or missing'; end if;
 end loop;
 insert into public.interview_briefs(opportunity_id,brief,context) select oid,p_brief,input from public.interview_opportunities where id=oid returning id into result;
 insert into private.interview_requests values(v_actor,'import:'||p_key,p_brief,result); return result;
end $$;
-- Same section order as the shared TypeScript candidate body; evidence binds edited prose.
create function private.interview_body(b jsonb) returns text language sql immutable set search_path='' as $$ select concat_ws(E'\n\n',b#>>'{sections,company}',b#>>'{sections,fit}',b#>>'{sections,likelyQuestions}',b#>>'{sections,questionsToAsk}',b#>>'{sections,studyPlan}',b#>>'{sections,uncertainty}') $$;
revoke all on function private.interview_require_admin(),private.interview_immutable(),private.interview_body(jsonb) from public,anon,authenticated,service_role;
revoke all on function public.interview_snapshot(),public.interview_save_profile(jsonb,integer),public.interview_save(jsonb,uuid,integer,text),public.interview_import(jsonb,text) from public,anon;
grant execute on function public.interview_snapshot(),public.interview_save_profile(jsonb,integer),public.interview_save(jsonb,uuid,integer,text),public.interview_import(jsonb,text) to authenticated,service_role;

create or replace function public.knowledge_submit(p_candidate jsonb,p_key uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare sid text; h text;
begin
  if not public.linkedin_is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  if jsonb_typeof(p_candidate) is distinct from 'object' or length(trim(coalesce(p_candidate->>'title',''))) not between 1 and 300 or length(trim(coalesce(p_candidate->>'body',''))) not between 10 and 100000 or coalesce(p_candidate->>'kind','document') not in ('document','section','path','unit','skill','exercise','interview-collection','interview-question','solution','diagram','feed','flashcard','source','concept','post','game-campaign','game-level','game-scenario','interview-preparation')
    then raise exception 'Invalid candidate'; end if;
  select snapshot_id into sid from public.knowledge_state where id;
  h:=private.knowledge_hash(p_candidate);
  insert into public.knowledge_jobs(id,candidate,candidate_hash,snapshot_id) values(p_key,p_candidate,h,sid) on conflict do nothing;
  if (select candidate from public.knowledge_jobs where id=p_key)<>p_candidate then raise exception 'Idempotency key belongs to another candidate'; end if;
  return p_key;
end $$;

create function public.interview_assess(p_brief jsonb,p_key uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare o public.interview_opportunities; candidate jsonb; sid text;
begin
 perform private.interview_require_admin(); perform pg_advisory_xact_lock(864004);
 select * into o from public.interview_opportunities where id=(p_brief->>'opportunityId')::uuid;
 if not found or o.version is distinct from (p_brief->>'opportunityVersion')::integer or (p_brief->>'profileVersion')::integer is distinct from (select coalesce(max(version),0) from public.interview_profiles) then raise exception 'Preparation inputs changed'; end if;
 if p_brief#>>'{editing,editedHash}' is distinct from private.knowledge_hash(p_brief->'sections') then raise exception 'Edited prose changed after technical-edit finalization' using errcode='22023'; end if;
 select snapshot_id into sid from public.knowledge_state where id;
 if sid is null then raise exception 'No active knowledge snapshot'; end if;
 candidate:=jsonb_build_object('title',left((o.input->>'company')||' — '||(o.input->>'position'),300),'body',private.interview_body(p_brief),'kind','interview-preparation','existingId','interview-preparation:'||o.id::text,'audience','Private candidate preparation');
 insert into public.knowledge_jobs(id,candidate,candidate_hash,snapshot_id) values(p_key,candidate,private.knowledge_hash(candidate),sid) on conflict do nothing;
 if (select j.candidate from public.knowledge_jobs j where j.id=p_key) is distinct from candidate then raise exception 'Idempotency key belongs to another candidate'; end if;
 return p_key;
end $$;
revoke all on function public.interview_assess(jsonb,uuid) from public,anon;
grant execute on function public.interview_assess(jsonb,uuid) to authenticated,service_role;
