-- Local inference stays on the operator's Mac. These tables contain editorial data only.
create table public.linkedin_voice_profiles (
  id uuid primary key default gen_random_uuid(), version text not null,
  rules jsonb not null check(jsonb_typeof(rules)='array' and jsonb_array_length(rules) between 1 and 20),
  created_at timestamptz not null default clock_timestamp()
);
insert into public.linkedin_voice_profiles(id,version,rules) values('40000000-0000-4000-8000-000000000001','dano-tone-v1',
 '["Use direct, conversational English and familiar words.","Lead with a concrete observation or useful question, then explain the practical next step.","Use contractions and first person naturally; never invent personal experiences or results.","Keep technical detail when it helps a reader make a decision.","Distinguish evidence from uncertainty: say might or seems when appropriate.","Keep humor light and occasional. Avoid hype, corporate jargon and stock AI phrases.","Clean up grammar and chat shorthand without making the tone stiff.","Preserve qualifications and tradeoffs. Do not copy company details or stories from voice examples."]');
alter table public.linkedin_settings add column local_preparation_enabled boolean not null default false,
  add column voice_profile_id uuid not null default '40000000-0000-4000-8000-000000000001' references public.linkedin_voice_profiles(id);
alter table public.linkedin_posts add column preparation_required boolean not null default false;
alter table public.linkedin_jobs drop constraint linkedin_jobs_kind_check;
alter table public.linkedin_jobs add constraint linkedin_jobs_kind_check check(kind in ('prepare','refine','schedule','cancel')),
  add column preparation_id uuid, add column override_reason text, add column verification jsonb;
alter table public.linkedin_revisions add column preparation_id uuid;
create table public.linkedin_preparations (
  id uuid primary key default gen_random_uuid(), job_id uuid not null unique references public.linkedin_jobs(id) deferrable initially deferred,
  post_id uuid not null references public.linkedin_posts(id), revision_id uuid not null,
  input_hash text not null check(input_hash ~ '^[a-f0-9]{64}$'), candidate_hash text not null check(candidate_hash ~ '^[a-f0-9]{64}$'),
  outcome text not null check(outcome in ('ready','held','stale')), analysis jsonb,
  issues jsonb not null, related jsonb not null, before jsonb not null, after jsonb not null, versions jsonb not null, metrics jsonb not null,
  created_at timestamptz not null default clock_timestamp(), foreign key(post_id,revision_id) references public.linkedin_revisions(post_id,id)
);
alter table public.linkedin_jobs add foreign key(preparation_id) references public.linkedin_preparations(id) deferrable initially deferred;
alter table public.linkedin_revisions add foreign key(preparation_id) references public.linkedin_preparations(id) deferrable initially deferred;
create index linkedin_preparation_history on public.linkedin_preparations(post_id,revision_id,created_at desc);
create trigger linkedin_preparation_immutable before update or delete on public.linkedin_preparations for each row execute function private.linkedin_immutable_revision();
create trigger linkedin_voice_immutable before update or delete on public.linkedin_voice_profiles for each row execute function private.linkedin_immutable_revision();
do $$ declare t text; begin
  foreach t in array array['linkedin_preparations','linkedin_voice_profiles'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public,anon,authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
    execute format('grant all on public.%I to service_role',t);
    execute format('create policy admin_read on public.%I for select to authenticated using ((select public.linkedin_is_admin()))',t);
  end loop;
end $$;

create sequence private.linkedin_change_version;
create function private.linkedin_changed() returns trigger language plpgsql security definer set search_path='' as $$
begin perform nextval('private.linkedin_change_version'); return null; end $$;
do $$ declare t text; begin
  foreach t in array array['linkedin_posts','linkedin_revisions','linkedin_jobs','linkedin_publications','linkedin_settings','linkedin_preparations','linkedin_voice_profiles'] loop
    execute format('create trigger linkedin_changed after insert or update or delete on public.%I for each statement execute function private.linkedin_changed()',t);
  end loop;
end $$;
create function private.linkedin_settings_json() returns jsonb language sql stable set search_path='' as $$
  select to_jsonb(s)||jsonb_build_object('voice_profile',to_jsonb(v)) from public.linkedin_settings s join public.linkedin_voice_profiles v on v.id=s.voice_profile_id where s.id;
$$;
create function public.linkedin_overview() returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if not public.linkedin_is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  return jsonb_build_object('version',(select last_value::text from private.linkedin_change_version),
    'posts',coalesce((select jsonb_agg(to_jsonb(p)||jsonb_build_object('preparation_outcome',(select r.outcome from public.linkedin_preparations r where r.post_id=p.id and r.revision_id=p.current_revision_id order by r.created_at desc,r.id desc limit 1)) order by p.created_at,p.id) from public.linkedin_posts p),'[]'),
    'revisions','[]'::jsonb,'preparations','[]'::jsonb,
    'jobs',coalesce((select jsonb_agg(to_jsonb(j)-'lease_token'-'verification'||jsonb_build_object('review_verdict',j.verification->>'verdict')) from (select distinct on(j.post_id,j.kind) j.* from public.linkedin_jobs j join public.linkedin_posts p on p.id=j.post_id where j.revision_id=p.current_revision_id or j.result_revision_id=p.current_revision_id order by j.post_id,j.kind,j.created_at desc,j.id desc) j),'[]'),
    'publications',coalesce((select jsonb_agg(p) from public.linkedin_publications p),'[]'),'settings',private.linkedin_settings_json());
end $$;
create function public.linkedin_detail(p_post_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if not public.linkedin_is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  return jsonb_build_object('posts',coalesce((select jsonb_agg(p) from public.linkedin_posts p where p.id=p_post_id),'[]'),
    'revisions',coalesce((select jsonb_agg(r order by r.created_at,r.id) from public.linkedin_revisions r where r.post_id=p_post_id),'[]'),
    'preparations',coalesce((select jsonb_agg(r order by r.created_at,r.id) from public.linkedin_preparations r where r.post_id=p_post_id),'[]'),
    'jobs',coalesce((select jsonb_agg(to_jsonb(j)-'lease_token' order by j.created_at desc,j.id desc) from public.linkedin_jobs j where j.post_id=p_post_id),'[]'),
    'publications',coalesce((select jsonb_agg(p) from public.linkedin_publications p where p.post_id=p_post_id),'[]'),'settings',private.linkedin_settings_json());
end $$;

create function private.linkedin_route_preparation() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_table_name='linkedin_posts' then
    new.preparation_required:=new.preparation_required or (select local_preparation_enabled from public.linkedin_settings where id);
  elsif tg_table_name='linkedin_jobs' then
    if new.kind='refine' and new.preparation_id is null and (select preparation_required from public.linkedin_posts where id=new.post_id) then new.kind:='prepare'; end if;
  elsif new.parent_revision_id is not null and new.kind='edit' and new.preparation_id is null then
    select r.preparation_id into new.preparation_id from public.linkedin_revisions r where r.id=new.parent_revision_id and r.post_id=new.post_id and r.body=new.body and r.first_comment=new.first_comment and r.prompt_hash=new.prompt_hash;
  end if;
  return new;
end $$;
create trigger linkedin_prepare_new_post before insert on public.linkedin_posts for each row execute function private.linkedin_route_preparation();
create trigger linkedin_prepare_job before insert on public.linkedin_jobs for each row execute function private.linkedin_route_preparation();
create trigger linkedin_preserve_verified_edit before insert on public.linkedin_revisions for each row execute function private.linkedin_route_preparation();

alter function public.linkedin_review(uuid,uuid,text,text,text,uuid,boolean) rename to linkedin_review_legacy;
revoke all on function public.linkedin_review_legacy(uuid,uuid,text,text,text,uuid,boolean) from public,anon,authenticated;
create function public.linkedin_review(p_post_id uuid,p_expected_revision uuid,p_action text,p_body text default null,p_first_comment text default null,p_proposal_id uuid default null,p_facts_confirmed boolean default false)
returns void language plpgsql security definer set search_path='' as $$
declare p public.linkedin_posts; r public.linkedin_revisions;
begin
  if not public.linkedin_is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  select * into strict p from public.linkedin_posts where id=p_post_id for update;
  if p.current_revision_id<>p_expected_revision then raise exception 'The draft changed. Refresh before continuing.' using errcode='40001'; end if;
  select * into strict r from public.linkedin_revisions where id=p_expected_revision;
  if p_action='approve' and p.preparation_required and (r.preparation_id is null or r.prompt_hash is null or r.analysis is null) then raise exception 'Adopt a Codex-verified preparation before approval.'; end if;
  if p_action='refine' and exists(select 1 from public.linkedin_jobs where post_id=p.id and revision_id=r.id and kind in ('prepare','refine') and status in ('pending','running')) then return; end if;
  perform public.linkedin_review_legacy(p_post_id,p_expected_revision,p_action,p_body,p_first_comment,p_proposal_id,p_facts_confirmed);
  if p_action='reject' then update public.linkedin_jobs set status='cancelled',lease_token=null,lease_until=null,updated_at=clock_timestamp() where post_id=p.id and kind='prepare' and status in ('pending','running'); end if;
end $$;

create function public.linkedin_enable_preparation() returns integer language plpgsql security definer set search_path='' as $$
declare n integer;
begin
  lock table public.linkedin_posts,public.linkedin_jobs in share row exclusive mode;
  if exists(select 1 from public.linkedin_jobs where kind in ('prepare','refine') and status='running') then raise exception 'Finish running editorial jobs before enabling preparation.'; end if;
  update public.linkedin_settings set local_preparation_enabled=true where id;
  update public.linkedin_posts set preparation_required=true,updated_at=clock_timestamp() where status='review';
  update public.linkedin_jobs j set status='cancelled',error='Superseded by local preparation',updated_at=clock_timestamp() from public.linkedin_posts p where p.id=j.post_id and p.status='review' and j.kind='refine' and j.status='pending' and j.preparation_id is null;
  insert into public.linkedin_jobs(post_id,revision_id,kind) select p.id,p.current_revision_id,'prepare' from public.linkedin_posts p where p.status='review' and not exists(select 1 from public.linkedin_preparations r where r.post_id=p.id and r.revision_id=p.current_revision_id and r.outcome<>'stale') on conflict do nothing;
  get diagnostics n=row_count; return n;
end $$;

create or replace function public.linkedin_claim(p_kind text) returns jsonb language plpgsql security definer set search_path='' as $$
declare j public.linkedin_jobs;
begin
  if p_kind not in ('prepare','refine','schedule','cancel') then raise exception 'Unknown job kind'; end if;
  update public.linkedin_jobs set status=case when kind in ('prepare','refine') then case when attempts<3 then 'pending' else 'failed' end else 'uncertain' end,
    error='Worker lease expired',lease_token=null,lease_until=null,updated_at=clock_timestamp() where status='running' and lease_until<now();
  update public.linkedin_publications p set status='unknown',error='Scheduling result requires reconciliation',updated_at=clock_timestamp() where p.status='scheduling' and exists(select 1 from public.linkedin_jobs expired_job where expired_job.post_id=p.post_id and expired_job.revision_id=p.revision_id and expired_job.kind='schedule' and expired_job.status='uncertain');
  if p_kind='schedule' and not exists(select 1 from public.linkedin_settings where id and publishing_enabled and buffer_channel_id is not null and buffer_organization_id is not null) then return null; end if;
  -- Never process a stale, rejected or newly approved draft.
  update public.linkedin_jobs pending_job set status='cancelled',error='Draft no longer eligible',updated_at=clock_timestamp() from public.linkedin_posts p where p.id=pending_job.post_id and pending_job.status='pending' and pending_job.kind in ('prepare','refine') and (p.status<>'review' or p.current_revision_id<>pending_job.revision_id);
  select * into j from public.linkedin_jobs where kind=p_kind and status='pending' and attempts<3 and available_at<=now() order by created_at,id for update skip locked limit 1;
  if not found then return null; end if;
  update public.linkedin_jobs set status='running',attempts=attempts+1,lease_token=gen_random_uuid(),lease_until=now()+interval '20 minutes',updated_at=clock_timestamp() where id=j.id returning * into j;
  return jsonb_build_object('job',to_jsonb(j),'revision',(select to_jsonb(r) from public.linkedin_revisions r where id=j.revision_id),'post',(select to_jsonb(p) from public.linkedin_posts p where id=j.post_id),'settings',private.linkedin_settings_json(),'publication',(select to_jsonb(p) from public.linkedin_publications p where post_id=j.post_id and revision_id=j.revision_id),'preparation',(select to_jsonb(r) from public.linkedin_preparations r where id=j.preparation_id));
end $$;

create function public.linkedin_complete_prepare(p_job_id uuid,p_token uuid,p_report jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare j public.linkedin_jobs; p public.linkedin_posts; r public.linkedin_preparations; outcome text; new_id uuid:=gen_random_uuid();
begin
  select * into strict p from public.linkedin_posts where id=(select post_id from public.linkedin_jobs where id=p_job_id) for update;
  select * into r from public.linkedin_preparations where job_id=p_job_id;
  if found then
    if r.input_hash=p_report->>'input_hash' and r.candidate_hash=p_report->>'candidate_hash' then return r.id; end if;
    raise exception 'This preparation already completed with different input.';
  end if;
  j:=private.linkedin_check_job(p_job_id,p_token);
  if j.kind<>'prepare' then raise exception 'Expected a preparation job'; end if;
  if p_report is null or octet_length(p_report::text)>131072 or coalesce(p_report->>'outcome','') not in ('ready','held') or jsonb_typeof(p_report->'issues') is distinct from 'array' or jsonb_typeof(p_report->'related') is distinct from 'array' or jsonb_typeof(p_report->'versions') is distinct from 'object' or p_report#>>'{versions,voice}' is null then raise exception 'Invalid preparation report'; end if;
  outcome:=p_report->>'outcome';
  if p.status<>'review' or p.current_revision_id<>j.revision_id or p_report#>>'{versions,voice}'<>(select voice_profile_id::text from public.linkedin_settings where id) then outcome:='stale'; end if;
  if p_report->'analysis'<>'null'::jsonb and p_report->>'candidate_hash' is distinct from encode(sha256(convert_to((p_report#>>'{analysis,rewrittenPost}')||E'\n--first-comment--\n'||coalesce(p_report#>>'{analysis,postingPlan,firstComment}',''),'UTF8')),'hex') then raise exception 'Candidate hash mismatch'; end if;
  if outcome='ready' and (p_report->'analysis' is null or p_report->'analysis'='null'::jsonb or exists(select 1 from jsonb_array_elements(p_report->'issues') i where (i->>'blocking')::boolean)) then raise exception 'Ready preparation contains unresolved issues'; end if;
  insert into public.linkedin_preparations(id,job_id,post_id,revision_id,input_hash,candidate_hash,outcome,analysis,issues,related,before,after,versions,metrics)
    values(new_id,j.id,j.post_id,j.revision_id,p_report->>'input_hash',p_report->>'candidate_hash',outcome,nullif(p_report->'analysis','null'::jsonb),p_report->'issues',p_report->'related',p_report->'before',p_report->'after',p_report->'versions',p_report->'metrics');
  update public.linkedin_jobs set status='succeeded',lease_token=null,lease_until=null,updated_at=clock_timestamp() where id=j.id;
  if outcome='ready' or (outcome='held' and nullif(j.override_reason,'') is not null and p_report->'analysis'<>'null'::jsonb) then
    insert into public.linkedin_jobs(post_id,revision_id,kind,preparation_id,override_reason) values(j.post_id,j.revision_id,'refine',new_id,j.override_reason) on conflict do nothing;
  end if;
  return new_id;
end $$;

alter function public.linkedin_complete_refine(uuid,uuid,jsonb,text) rename to linkedin_complete_refine_legacy;
revoke all on function public.linkedin_complete_refine_legacy(uuid,uuid,jsonb,text) from public,anon,authenticated,service_role;
create function public.linkedin_complete_refine(p_job_id uuid,p_token uuid,p_analysis jsonb,p_prompt_hash text) returns uuid language plpgsql security definer set search_path='' as $$
begin
  if exists(select 1 from public.linkedin_jobs where id=p_job_id and preparation_id is not null) then raise exception 'Use verified completion for prepared jobs.'; end if;
  return public.linkedin_complete_refine_legacy(p_job_id,p_token,p_analysis,p_prompt_hash);
end $$;
create function public.linkedin_complete_verified(p_job_id uuid,p_token uuid,p_review jsonb,p_prompt_hash text) returns uuid language plpgsql security definer set search_path='' as $$
declare j public.linkedin_jobs; p public.linkedin_posts; r public.linkedin_revisions; prep public.linkedin_preparations; result jsonb; patch jsonb; new_id uuid:=gen_random_uuid(); k text;
begin
  select * into strict p from public.linkedin_posts where id=(select post_id from public.linkedin_jobs where id=p_job_id) for update;
  j:=private.linkedin_check_job(p_job_id,p_token);
  if j.kind<>'refine' or j.preparation_id is null then raise exception 'Expected a prepared refinement job'; end if;
  select * into strict prep from public.linkedin_preparations where id=j.preparation_id;
  if p_review->>'preparation_id' is distinct from prep.id::text or p_review->>'candidate_hash' is distinct from prep.candidate_hash or prep.analysis is null then raise exception 'Verification does not match the prepared candidate.'; end if;
  if p.status<>'review' or p.current_revision_id<>j.revision_id or prep.versions->>'voice'<>(select voice_profile_id::text from public.linkedin_settings where id) then raise exception 'Prepared draft changed; prepare again.' using errcode='40001'; end if;
  if coalesce(p_review->>'verdict','') not in ('accept','patch','needs_input') or jsonb_typeof(p_review->'checked') is distinct from 'array' or not coalesce(p_review->'checked' @> '["text","meaning","facts","voice"]'::jsonb,false) or jsonb_array_length(p_review->'checked')<>4 or not coalesce(p_prompt_hash ~ '^[a-f0-9]{64}$',false) or jsonb_typeof(p_review->'notes') is distinct from 'array' or jsonb_typeof(coalesce(p_review->'toolsUsed','[]'::jsonb))<>'array' then raise exception 'Invalid verification'; end if;
  patch:=coalesce(p_review->'patch','{}'::jsonb);
  if jsonb_typeof(patch)<>'object' or (p_review->>'verdict'='patch' and patch='{}'::jsonb) then raise exception 'Invalid editorial replacements'; end if;
  if p_review->>'verdict'<>'patch' and patch<>'{}'::jsonb then raise exception 'Only patch verdicts contain replacements'; end if;
  for k in select jsonb_object_keys(patch) loop
    if k not in ('diagnosis','coreIdea','rewrittenPost','alternativeHooks','keyChanges','postingPlan','visualOutline','verificationNotes','assumptions','toolsUsed') then raise exception 'Unsupported editorial replacement'; end if;
  end loop;
  if p_review->>'verdict'='needs_input' then
    if jsonb_array_length(p_review->'notes')=0 then raise exception 'Explain what needs input'; end if;
    update public.linkedin_jobs set status='succeeded',verification=p_review,lease_token=null,lease_until=null,updated_at=clock_timestamp() where id=j.id;
    return null;
  end if;
  result:=prep.analysis||patch;
  result:=jsonb_set(result,'{verificationNotes}',coalesce(result->'verificationNotes','[]'::jsonb)||(p_review->'notes'));
  result:=jsonb_set(result,'{toolsUsed}',coalesce(prep.analysis->'toolsUsed','[]'::jsonb)||coalesce(p_review->'toolsUsed','[]'::jsonb));
  if result->>'rewrittenPost' is null or result->'diagnosis' is null or jsonb_array_length(result->'alternativeHooks')<>3 then raise exception 'Invalid final analysis'; end if;
  select * into strict r from public.linkedin_revisions where id=j.revision_id;
  insert into public.linkedin_revisions(id,post_id,parent_revision_id,kind,body,first_comment,sources,analysis,prompt_hash,preparation_id) values(new_id,j.post_id,r.id,'refine',result->>'rewrittenPost',coalesce(result#>>'{postingPlan,firstComment}',''),r.sources,result,p_prompt_hash,prep.id);
  update public.linkedin_jobs set status='succeeded',result_revision_id=new_id,verification=p_review,lease_token=null,lease_until=null,updated_at=clock_timestamp() where id=j.id;
  return new_id;
end $$;

create function public.linkedin_preparation_action(p_post_id uuid,p_expected_revision uuid,p_preparation_id uuid,p_action text,p_reason text) returns void language plpgsql security definer set search_path='' as $$
declare p public.linkedin_posts; prep public.linkedin_preparations;
begin
  if not public.linkedin_is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  select * into strict p from public.linkedin_posts where id=p_post_id for update;
  select * into strict prep from public.linkedin_preparations where id=p_preparation_id and post_id=p.id and revision_id=p_expected_revision;
  if p.current_revision_id<>p_expected_revision or p.status<>'review' or prep.outcome='stale' or prep.versions->>'voice'<>(select voice_profile_id::text from public.linkedin_settings where id) then raise exception 'Draft changed; prepare again.' using errcode='40001'; end if;
  if coalesce(p_action,'') not in ('follow_up','send_with_flags') or length(trim(coalesce(p_reason,''))) not between 5 and 1000 then raise exception 'Record why this draft should go to Codex'; end if;
  if exists(select 1 from public.linkedin_jobs where post_id=p.id and revision_id=p_expected_revision and kind in ('prepare','refine') and status in ('pending','running')) then return; end if;
  insert into public.linkedin_jobs(post_id,revision_id,kind,preparation_id,override_reason) values(p.id,p_expected_revision,case when prep.analysis is null then 'prepare' else 'refine' end,case when prep.analysis is null then null else prep.id end,p_action||': '||trim(p_reason));
end $$;
create function public.linkedin_set_voice(p_rules jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare new_id uuid:=gen_random_uuid();
begin
  if not public.linkedin_is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  if jsonb_typeof(p_rules) is distinct from 'array' or jsonb_array_length(p_rules) not between 1 and 20 or exists(select 1 from jsonb_array_elements(p_rules) r where jsonb_typeof(r)<>'string' or length(trim(r#>>'{}')) not between 1 and 500) then raise exception 'Use 1–20 generic voice rules, up to 500 characters each'; end if;
  insert into public.linkedin_voice_profiles(id,version,rules) values(new_id,'voice-'||new_id::text,p_rules);
  -- Pending work must use the new rules; running work will fail its completion check.
  update public.linkedin_jobs set status='cancelled',error='Voice profile changed',updated_at=clock_timestamp() where kind in ('prepare','refine') and status='pending' and post_id in (select id from public.linkedin_posts where preparation_required);
  update public.linkedin_settings set voice_profile_id=new_id where id;
  insert into public.linkedin_jobs(post_id,revision_id,kind) select id,current_revision_id,'prepare' from public.linkedin_posts p where preparation_required and status='review' and not exists(select 1 from public.linkedin_jobs j where j.post_id=p.id and j.kind in ('prepare','refine') and j.status='running') on conflict do nothing;
  return new_id;
end $$;

-- Preserve old backup imports while retaining all new immutable records in version 2.
alter function public.linkedin_restore(jsonb) rename to linkedin_restore_legacy;
revoke all on function public.linkedin_restore_legacy(jsonb) from public,anon,authenticated,service_role;
create function public.linkedin_restore(p_backup jsonb) returns void language plpgsql security definer set search_path='' as $$
declare b jsonb; v jsonb;
begin
  if coalesce((p_backup->>'version')::integer,0) not in (1,2) then raise exception 'Unsupported backup version'; end if;
  lock table public.linkedin_posts,public.linkedin_revisions,public.linkedin_jobs,public.linkedin_publications in exclusive mode;
  if exists(select 1 from public.linkedin_posts) then raise exception 'Restore requires an empty editorial collection; export existing data first.'; end if;
  update public.linkedin_settings set local_preparation_enabled=false where id;
  b:=jsonb_set(p_backup,'{version}','1');
  b:=jsonb_set(b,'{posts}',coalesce((select jsonb_agg(jsonb_build_object('preparation_required',false)||p) from jsonb_array_elements(b->'posts') p),'[]'::jsonb));
  perform public.linkedin_restore_legacy(b);
  for v in select value from jsonb_array_elements(coalesce(p_backup->'voice_profiles','[]')) loop
    if exists(select 1 from public.linkedin_voice_profiles where id=(v->>'id')::uuid and rules<>v->'rules') then raise exception 'Voice profile identity mismatch'; end if;
    insert into public.linkedin_voice_profiles select * from jsonb_populate_record(null::public.linkedin_voice_profiles,v) on conflict(id) do nothing;
  end loop;
  insert into public.linkedin_preparations select * from jsonb_populate_recordset(null::public.linkedin_preparations,coalesce(p_backup->'preparations','[]'));
  update public.linkedin_jobs set status=case when attempts<3 then 'pending' else 'failed' end,lease_token=null,lease_until=null where kind='prepare' and status in ('pending','running','uncertain');
  update public.linkedin_settings set voice_profile_id=coalesce((p_backup#>>'{settings,0,voice_profile_id}')::uuid,voice_profile_id),local_preparation_enabled=coalesce((p_backup#>>'{settings,0,local_preparation_enabled}')::boolean,false) where id;
end $$;

do $$ declare f record; begin
  for f in select oid::regprocedure signature,proname from pg_proc where pronamespace='public'::regnamespace and proname in ('linkedin_overview','linkedin_detail','linkedin_review','linkedin_enable_preparation','linkedin_claim','linkedin_complete_prepare','linkedin_complete_refine','linkedin_complete_verified','linkedin_preparation_action','linkedin_set_voice','linkedin_restore') loop
    execute format('revoke all on function %s from public,anon,authenticated',f.signature);
    execute format('grant execute on function %s to service_role',f.signature);
    if f.proname in ('linkedin_overview','linkedin_detail','linkedin_review','linkedin_preparation_action','linkedin_set_voice') then execute format('grant execute on function %s to authenticated',f.signature); end if;
  end loop;
end $$;
