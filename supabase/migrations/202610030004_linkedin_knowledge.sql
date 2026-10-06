-- Enrollment is durable. Every prepared candidate, review and send binds to one graph projection.
alter table public.linkedin_settings add column knowledge_enabled boolean not null default false;
alter table public.linkedin_posts add column knowledge_required boolean not null default false;
alter table public.linkedin_preparations add column knowledge jsonb,
  add column knowledge_hash text check(knowledge_hash ~ '^[a-f0-9]{64}$');

create function private.knowledge_compact(j public.knowledge_jobs) returns jsonb language sql stable set search_path='' as $$
  select jsonb_build_object('snapshot_id',j.report->'snapshot_id','candidate_hash',j.candidate_hash,'projection_id',j.snapshot_id,'job_id',j.id,
    'action',j.report->'action','warnings',j.report->'warnings','placement',j.report->'placement','semantic_complete',j.report->'semantic_complete',
    'matches',coalesce((select jsonb_agg((select jsonb_object_agg(key,value) from jsonb_each(m) where key in ('id','kind','title','hash','text','sourcePath','paths','skills','relation'))||jsonb_build_object('text',left(m->>'text',900)) order by ord) from jsonb_array_elements(j.report->'matches') with ordinality a(m,ord) where ord<=6),'[]'),
    'relationships',coalesce((select jsonb_agg(e order by ord) from jsonb_array_elements(j.report->'relationships') with ordinality a(e,ord) where ord<=8),'[]'));
$$;
create function private.knowledge_context_current(context jsonb,post_id uuid,revision_id uuid) returns boolean language plpgsql stable set search_path='' as $$
declare j public.knowledge_jobs; sid text;
begin
  if context is null or jsonb_typeof(context) is distinct from 'object' or coalesce(context->>'job_id','') !~ '^[a-f0-9-]{36}$' then return false; end if;
  select * into j from public.knowledge_jobs where id::text=context->>'job_id';
  select snapshot_id into sid from public.knowledge_state where id;
  return coalesce(j.status='succeeded' and j.snapshot_id=sid and j.candidate->>'existingId'='post:'||post_id::text and j.candidate->>'revisionId'=revision_id::text
    and j.report->>'snapshot_id'=(select source_catalog_id from public.knowledge_snapshots where id=sid)
    and context=private.knowledge_compact(j) and private.knowledge_report_valid(j.report,sid),false);
end $$;
create function private.linkedin_knowledge_current(prep_id uuid,post_id uuid) returns boolean language sql stable set search_path='' as $$
  select coalesce((select p.knowledge_hash=private.knowledge_hash(p.knowledge) and private.knowledge_context_current(p.knowledge,post_id,p.revision_id) from public.linkedin_preparations p where p.id=prep_id and p.post_id=post_id),false);
$$;
revoke all on function private.knowledge_report_valid(jsonb,text),private.knowledge_compact(public.knowledge_jobs),private.knowledge_context_current(jsonb,uuid,uuid),private.linkedin_knowledge_current(uuid,uuid) from public,anon,authenticated,service_role;

create function public.linkedin_enable_knowledge() returns integer language plpgsql security definer set search_path='' as $$
declare n integer;
begin
  lock table public.linkedin_posts,public.linkedin_jobs in share row exclusive mode;
  perform 1 from public.knowledge_state where id and snapshot_id is not null for share;
  if not found or not exists(select 1 from public.linkedin_settings where id and local_preparation_enabled) then raise exception 'Activate a graph and local preparation before enrollment'; end if;
  if exists(select 1 from public.linkedin_jobs where kind in ('prepare','refine') and status='running') then raise exception 'Finish running editorial jobs before enabling knowledge'; end if;
  update public.linkedin_settings set knowledge_enabled=true where id;
  update public.linkedin_posts set knowledge_required=true,preparation_required=true,updated_at=clock_timestamp() where status='review';
  update public.linkedin_jobs j set status='cancelled',error='Superseded by knowledge preparation',updated_at=clock_timestamp() from public.linkedin_posts p where p.id=j.post_id and p.status='review' and j.kind in ('prepare','refine') and j.status='pending';
  insert into public.linkedin_jobs(post_id,revision_id,kind) select id,current_revision_id,'prepare' from public.linkedin_posts where status='review' on conflict do nothing;
  get diagnostics n=row_count; return n;
end $$;
create function private.linkedin_route_knowledge() returns trigger language plpgsql security definer set search_path='' as $$
begin
  new.knowledge_required:=coalesce(new.knowledge_required,false) or coalesce((select knowledge_enabled from public.linkedin_settings where id),false);
  new.preparation_required:=coalesce(new.preparation_required,false) or new.knowledge_required;
  return new;
end $$;
create trigger linkedin_knowledge_new_post before insert on public.linkedin_posts for each row execute function private.linkedin_route_knowledge();
revoke all on function private.linkedin_route_knowledge() from public,anon,authenticated,service_role;

create or replace function public.linkedin_complete_prepare(p_job_id uuid,p_token uuid,p_report jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare j public.linkedin_jobs; p public.linkedin_posts; r public.linkedin_preparations; outcome text; new_id uuid:=gen_random_uuid();
begin
  select * into strict p from public.linkedin_posts where id=(select post_id from public.linkedin_jobs where id=p_job_id) for update;
  perform 1 from public.knowledge_state where id for share;
  if p.knowledge_required and (p_report->>'knowledge_hash' is distinct from private.knowledge_hash(p_report->'knowledge') or not private.knowledge_context_current(p_report->'knowledge',p.id,(select revision_id from public.linkedin_jobs where id=p_job_id))) then raise exception 'Current graph evidence required for preparation'; end if;
  select * into r from public.linkedin_preparations where job_id=p_job_id;
  if found then
    if r.input_hash=p_report->>'input_hash' and r.candidate_hash=p_report->>'candidate_hash' then return r.id; end if;
    raise exception 'This preparation already completed with different input.';
  end if;
  j:=private.linkedin_check_job(p_job_id,p_token);
  if j.kind<>'prepare' then raise exception 'Expected a preparation job'; end if;
  if p_report is null or octet_length(p_report::text)>131072 or coalesce(p_report->>'outcome','') not in ('ready','held') or jsonb_typeof(p_report->'issues') is distinct from 'array' or jsonb_typeof(p_report->'related') is distinct from 'array' or jsonb_typeof(p_report->'versions') is distinct from 'object' or p_report#>>'{versions,voice}' is null then raise exception 'Invalid preparation report'; end if;
  outcome:=p_report->>'outcome';
  if p.knowledge_required and outcome='ready' and p_report#>>'{knowledge,action}' in ('needs_review','skip_duplicate') then raise exception 'Graph holds require human review'; end if;
  if p.status<>'review' or p.current_revision_id<>j.revision_id or p_report#>>'{versions,voice}'<>(select voice_profile_id::text from public.linkedin_settings where id) then outcome:='stale'; end if;
  if p_report->'analysis'<>'null'::jsonb and p_report->>'candidate_hash' is distinct from encode(sha256(convert_to((p_report#>>'{analysis,rewrittenPost}')||E'\n--first-comment--\n'||coalesce(p_report#>>'{analysis,postingPlan,firstComment}',''),'UTF8')),'hex') then raise exception 'Candidate hash mismatch'; end if;
  if outcome='ready' and (p_report->'analysis' is null or p_report->'analysis'='null'::jsonb or exists(select 1 from jsonb_array_elements(p_report->'issues') i where (i->>'blocking')::boolean)) then raise exception 'Ready preparation contains unresolved issues'; end if;
  insert into public.linkedin_preparations(id,job_id,post_id,revision_id,input_hash,candidate_hash,outcome,analysis,issues,related,before,after,versions,metrics,knowledge,knowledge_hash)
    values(new_id,j.id,j.post_id,j.revision_id,p_report->>'input_hash',p_report->>'candidate_hash',outcome,nullif(p_report->'analysis','null'::jsonb),p_report->'issues',p_report->'related',p_report->'before',p_report->'after',p_report->'versions',p_report->'metrics',p_report->'knowledge',p_report->>'knowledge_hash');
  update public.linkedin_jobs set status='succeeded',lease_token=null,lease_until=null,updated_at=clock_timestamp() where id=j.id;
  if outcome='ready' or (outcome='held' and nullif(j.override_reason,'') is not null and p_report->'analysis'<>'null'::jsonb) then
    insert into public.linkedin_jobs(post_id,revision_id,kind,preparation_id,override_reason) values(j.post_id,j.revision_id,'refine',new_id,j.override_reason) on conflict do nothing;
  end if;
  return new_id;
end $$;

-- Retain the foundation's revision, lease, verification and approval checks behind graph guards.
alter function public.linkedin_complete_verified(uuid,uuid,jsonb,text) rename to linkedin_verified_without_knowledge;
alter function public.linkedin_verified_without_knowledge(uuid,uuid,jsonb,text) set schema private;
create function public.linkedin_complete_verified(p_job_id uuid,p_token uuid,p_review jsonb,p_prompt_hash text) returns uuid language plpgsql security definer set search_path='' as $$
declare p public.linkedin_posts; prep public.linkedin_preparations;
begin
  select * into strict p from public.linkedin_posts where id=(select post_id from public.linkedin_jobs where id=p_job_id) for update;
  perform 1 from public.knowledge_state where id for share;
  select r.* into prep from public.linkedin_preparations r join public.linkedin_jobs j on j.preparation_id=r.id where j.id=p_job_id;
  if p.knowledge_required and (not private.linkedin_knowledge_current(prep.id,p.id) or p_review->>'knowledge_hash' is distinct from prep.knowledge_hash) then raise exception 'Verification requires unchanged graph evidence'; end if;
  return private.linkedin_verified_without_knowledge(p_job_id,p_token,p_review,p_prompt_hash);
end $$;
alter function public.linkedin_review(uuid,uuid,text,text,text,uuid,boolean) rename to linkedin_review_without_knowledge;
alter function public.linkedin_review_without_knowledge(uuid,uuid,text,text,text,uuid,boolean) set schema private;
create function public.linkedin_review(p_post_id uuid,p_expected_revision uuid,p_action text,p_body text default null,p_first_comment text default null,p_proposal_id uuid default null,p_facts_confirmed boolean default false) returns void language plpgsql security definer set search_path='' as $$
declare p public.linkedin_posts; prep_id uuid;
begin
  if not public.linkedin_is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  select * into strict p from public.linkedin_posts where id=p_post_id for update;
  perform 1 from public.knowledge_state where id for share;
  if p.knowledge_required and p_action in ('use','approve') then
    select preparation_id into prep_id from public.linkedin_revisions where post_id=p.id and id=case when p_action='use' then p_proposal_id else p_expected_revision end;
    if not private.linkedin_knowledge_current(prep_id,p.id) then raise exception 'Prepare and verify against the current graph before adoption or approval'; end if;
  end if;
  perform private.linkedin_review_without_knowledge(p_post_id,p_expected_revision,p_action,p_body,p_first_comment,p_proposal_id,p_facts_confirmed);
end $$;
alter function public.linkedin_begin_publish(uuid,uuid) rename to linkedin_publish_without_knowledge;
alter function public.linkedin_publish_without_knowledge(uuid,uuid) set schema private;
create function public.linkedin_begin_publish(p_job_id uuid,p_token uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare p public.linkedin_posts; prep_id uuid;
begin
  select * into strict p from public.linkedin_posts where id=(select post_id from public.linkedin_jobs where id=p_job_id) for update;
  perform 1 from public.knowledge_state where id for share;
  select r.preparation_id into prep_id from public.linkedin_revisions r join public.linkedin_jobs j on j.revision_id=r.id where j.id=p_job_id and r.post_id=p.id;
  if p.knowledge_required and not private.linkedin_knowledge_current(prep_id,p.id) then raise exception 'Publication requires unchanged graph evidence'; end if;
  return private.linkedin_publish_without_knowledge(p_job_id,p_token);
end $$;
revoke all on function private.linkedin_verified_without_knowledge(uuid,uuid,jsonb,text),private.linkedin_review_without_knowledge(uuid,uuid,text,text,text,uuid,boolean),private.linkedin_publish_without_knowledge(uuid,uuid) from public,anon,authenticated,service_role;
revoke all on function public.linkedin_enable_knowledge(),public.linkedin_complete_verified(uuid,uuid,jsonb,text),public.linkedin_review(uuid,uuid,text,text,text,uuid,boolean),public.linkedin_begin_publish(uuid,uuid) from public,anon,authenticated;
grant execute on function public.linkedin_enable_knowledge(),public.linkedin_complete_verified(uuid,uuid,jsonb,text),public.linkedin_review(uuid,uuid,text,text,text,uuid,boolean),public.linkedin_begin_publish(uuid,uuid) to service_role;
grant execute on function public.linkedin_review(uuid,uuid,text,text,text,uuid,boolean) to authenticated;

-- An adopted/fact-confirmed revision keeps the report from its verified preparation.
create or replace function public.knowledge_for_post(p_post uuid,p_revision uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if not public.linkedin_is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  return (select to_jsonb(j)-'lease_token' from public.knowledge_jobs j
    where j.candidate->>'existingId'='post:'||p_post::text and (
      j.candidate->>'revisionId'=p_revision::text or exists (
        select 1 from public.linkedin_revisions r join public.linkedin_preparations p on p.id=r.preparation_id
        where r.id=p_revision and r.post_id=p_post and p.post_id=p_post and p.knowledge->>'job_id'=j.id::text))
    order by (j.candidate->>'revisionId'=p_revision::text) desc,j.created_at desc limit 1);
end $$;
