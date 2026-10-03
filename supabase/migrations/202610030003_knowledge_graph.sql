create function private.knowledge_canonical(v jsonb) returns text language plpgsql immutable strict set search_path='' as $$
declare result text;
begin
  if jsonb_typeof(v)='object' then
    select '{'||coalesce(string_agg(to_json(key)::text||':'||private.knowledge_canonical(value),',' order by key collate "C"),'')||'}' into result from jsonb_each(v);
  elsif jsonb_typeof(v)='array' then
    select '['||coalesce(string_agg(private.knowledge_canonical(value),',' order by ord),'')||']' into result from jsonb_array_elements(v) with ordinality a(value,ord);
  else result:=v::text; end if;
  return result;
end $$;
create function private.knowledge_hash(v jsonb) returns text language sql immutable strict set search_path='' as $$
  select encode(extensions.digest(private.knowledge_canonical(v),'sha256'),'hex');
$$;
revoke all on function private.knowledge_canonical(jsonb),private.knowledge_hash(jsonb) from public,anon,authenticated,service_role;

-- Derived graph projections and private evaluations; authored content stays in Git.
create table public.knowledge_snapshots (
  id text primary key check(id ~ '^[a-f0-9]{64}$'),
  source_catalog_id text not null check(source_catalog_id ~ '^[a-f0-9]{64}$'),
  metadata jsonb not null, created_at timestamptz not null default now()
);
create table public.knowledge_resources (
  snapshot_id text not null references public.knowledge_snapshots(id),
  id text not null, data jsonb not null,
  search_text tsvector generated always as (to_tsvector('english',coalesce(data->>'title','')||' '||coalesce(data->>'text',''))) stored,
  primary key(snapshot_id,id)
);
create index knowledge_resources_search on public.knowledge_resources using gin(search_text);
create table public.knowledge_relationships (
  snapshot_id text not null references public.knowledge_snapshots(id), id text not null,
  source text not null, target text not null, provenance text not null check(provenance in ('explicit','inferred','approved')), data jsonb not null,
  primary key(snapshot_id,id),
  foreign key(snapshot_id,source) references public.knowledge_resources(snapshot_id,id),
  foreign key(snapshot_id,target) references public.knowledge_resources(snapshot_id,id)
);
create index knowledge_relationships_source on public.knowledge_relationships(snapshot_id,source);
create index knowledge_relationships_target on public.knowledge_relationships(snapshot_id,target);
create table public.knowledge_state (
  id boolean primary key default true check(id), snapshot_id text references public.knowledge_snapshots(id), worker_seen timestamptz
);
insert into public.knowledge_state(id) values(true);
create table public.knowledge_jobs (
  id uuid primary key, candidate jsonb not null, candidate_hash text not null,
  snapshot_id text references public.knowledge_snapshots(id),
  status text not null default 'pending' check(status in ('pending','running','succeeded','failed')),
  attempts integer not null default 0 check(attempts between 0 and 3),
  lease_token uuid, leased_until timestamptz, report jsonb, error text,
  reviewed text check(reviewed in ('accept','reject')), reviewed_by uuid references auth.users(id), reviewed_at timestamptz, applied_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index knowledge_jobs_pending on public.knowledge_jobs(status,created_at);
do $$ declare t text; begin
  foreach t in array array['knowledge_snapshots','knowledge_resources','knowledge_relationships','knowledge_state','knowledge_jobs'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public,anon,authenticated',t);
    if t<>'knowledge_jobs' then execute format('grant select on public.%I to authenticated',t); end if;
    execute format('grant all on public.%I to service_role',t);
    execute format('create policy knowledge_admin_read on public.%I for select to authenticated using ((select public.linkedin_is_admin()))',t);
  end loop;
end $$;

create function private.knowledge_report_valid(report jsonb,sid text) returns boolean language plpgsql stable set search_path='' as $$
begin
  if jsonb_typeof(report) is distinct from 'object' or report->>'action' is null or report->>'action' not in ('update_existing','create_resource','create_path','skip_duplicate','split','needs_review')
    or jsonb_typeof(report->'matches') is distinct from 'array' or jsonb_array_length(report->'matches')>16
    or jsonb_typeof(report->'relationships') is distinct from 'array' or jsonb_array_length(report->'relationships')>16
    or jsonb_typeof(report->'warnings') is distinct from 'array' or jsonb_array_length(report->'warnings')>20
    or jsonb_typeof(report->'placement') is distinct from 'object'
    or report->'semantic_complete' is distinct from (select metadata->'semantic_complete' from public.knowledge_snapshots where id=sid)
    or exists(select 1 from jsonb_array_elements(report->'matches') m where not exists(select 1 from public.knowledge_resources r where r.snapshot_id=sid and r.id=m->>'id' and r.data->>'hash'=m->>'hash' and r.data->>'text'=m->>'text'))
    or exists(select 1 from jsonb_each_text(report->'placement') v where not exists(select 1 from public.knowledge_resources r where r.snapshot_id=sid and r.id=v.value))
  then return false; end if;
  return true;
end $$;

revoke all on function private.knowledge_report_valid(jsonb,text) from public,anon,authenticated,service_role;

create function public.knowledge_publish(p_snapshot jsonb) returns text language plpgsql security definer set search_path='' as $$
declare sid text:=p_snapshot->>'id'; resources jsonb:=p_snapshot->'resources'; edges jsonb:=p_snapshot->'relationships';
begin
  if jsonb_typeof(resources) is distinct from 'array' or jsonb_typeof(edges) is distinct from 'array' or
    exists(select 1 from jsonb_array_elements(edges) e where not exists(select 1 from jsonb_array_elements(resources) r where r->>'id'=e->>'source') or not exists(select 1 from jsonb_array_elements(resources) r where r->>'id'=e->>'target')) or
    (select count(*) from jsonb_array_elements(resources))<>(select count(distinct r->>'id') from jsonb_array_elements(resources) r) or
    exists(select 1 from jsonb_array_elements(resources) r where coalesce(r->>'hash','') !~ '^[a-f0-9]{64}$' or coalesce(r->>'visibility','') not in ('curriculum','private'))
  or (select count(*) from jsonb_array_elements(edges))<>(select count(distinct e->>'id') from jsonb_array_elements(edges) e)
    or exists(select 1 from jsonb_array_elements(resources) r where coalesce(r->>'id','')='' or jsonb_typeof(r->'text') is distinct from 'string')
  then raise exception 'Invalid graph references' using errcode='23514'; end if;
  if exists(select 1 from public.knowledge_snapshots where id=sid and metadata is distinct from p_snapshot-'resources'-'relationships')
    or exists(select 1 from public.knowledge_resources r join jsonb_array_elements(resources) v on r.id=v->>'id' where r.snapshot_id=sid and r.data is distinct from v)
    or exists(select 1 from public.knowledge_relationships r join jsonb_array_elements(edges) v on r.id=v->>'id' where r.snapshot_id=sid and r.data is distinct from v)
    then raise exception 'Immutable snapshot differs'; end if;
  insert into public.knowledge_snapshots(id,source_catalog_id,metadata) values(sid,p_snapshot->>'source_catalog_id',p_snapshot-'resources'-'relationships') on conflict(id) do nothing;
  insert into public.knowledge_resources(snapshot_id,id,data) select sid,r->>'id',r from jsonb_array_elements(resources) r on conflict do nothing;
  insert into public.knowledge_relationships(snapshot_id,id,source,target,provenance,data) select sid,e->>'id',e->>'source',e->>'target',e->>'provenance',e from jsonb_array_elements(edges) e on conflict do nothing;
  if (select count(*) from public.knowledge_resources where snapshot_id=sid)<>jsonb_array_length(resources) or (select count(*) from public.knowledge_relationships where snapshot_id=sid)<>jsonb_array_length(edges) then raise exception 'Snapshot count mismatch'; end if;
  update public.knowledge_state set snapshot_id=sid,worker_seen=now() where id;
  return sid;
end $$;

create function public.knowledge_browse(p_query text default '',p_filters jsonb default '{}',p_cursor text default null,p_focus text default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare sid text; rows jsonb; ids text[]; next_id text; meta jsonb;
begin
  if not public.linkedin_is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  select snapshot_id into sid from public.knowledge_state where id;
  select metadata||jsonb_build_object('created_at',created_at,'id',id) into meta from public.knowledge_snapshots where id=sid;
  select coalesce(jsonb_agg(data order by id),'[]'),array_agg(id),case when count(*)=100 then max(id) end into rows,ids,next_id from (
    select r.id,r.data from public.knowledge_resources r where snapshot_id=sid
      and (p_cursor is null or r.id>p_cursor)
      and (p_query='' or r.search_text @@ plainto_tsquery('english',p_query))
      and (coalesce(p_filters->>'kind','')='' or r.data->>'kind'=p_filters->>'kind')
      and (coalesce(p_filters->>'status','')='' or r.data->>'status'=p_filters->>'status')
      and (coalesce(p_filters->>'visibility','')='' or r.data->>'visibility'=p_filters->>'visibility')
      and (coalesce(p_filters->>'path','')='' or (r.data->'paths') ? (p_filters->>'path'))
      and (coalesce(p_filters->>'skill','')='' or (r.data->'skills') ? (p_filters->>'skill') or r.id=p_filters->>'skill')
      and (p_filters->>'detail'='show' or coalesce(p_filters->>'kind','')<>'' or r.data->>'kind' not in ('section','solution','flashcard'))
      and (coalesce(p_filters->>'provenance','')='' or exists(select 1 from public.knowledge_relationships e where e.snapshot_id=sid and r.id in (e.source,e.target) and e.provenance=p_filters->>'provenance'))
      and (p_focus is null or r.id=p_focus or exists(select 1 from public.knowledge_relationships e where e.snapshot_id=sid and (e.source=p_focus and e.target=r.id or e.target=p_focus and e.source=r.id)))
    order by r.id limit 100
  ) r;
  return jsonb_build_object('snapshot',meta,'resources',rows,'relationships',coalesce((select jsonb_agg(data order by id) from public.knowledge_relationships where snapshot_id=sid and source=any(ids) and target=any(ids) and (coalesce(p_filters->>'provenance','')='' or provenance=p_filters->>'provenance')),'[]'),'next',next_id,'worker',(select jsonb_build_object('last_seen',worker_seen) from public.knowledge_state where id));
end $$;

create function public.knowledge_submit(p_candidate jsonb,p_key uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare sid text; h text;
begin
  if not public.linkedin_is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  if jsonb_typeof(p_candidate) is distinct from 'object' or length(trim(coalesce(p_candidate->>'title',''))) not between 1 and 300 or length(trim(coalesce(p_candidate->>'body',''))) not between 10 and 100000 or coalesce(p_candidate->>'kind','document') not in ('document','section','path','unit','skill','exercise','interview-collection','interview-question','solution','diagram','feed','flashcard','source','concept','post','game-campaign','game-level','game-scenario')
    then raise exception 'Invalid candidate'; end if;
  select snapshot_id into sid from public.knowledge_state where id;
  h:=private.knowledge_hash(p_candidate);
  insert into public.knowledge_jobs(id,candidate,candidate_hash,snapshot_id) values(p_key,p_candidate,h,sid) on conflict do nothing;
  if (select candidate from public.knowledge_jobs where id=p_key)<>p_candidate then raise exception 'Idempotency key belongs to another candidate'; end if;
  return p_key;
end $$;

create function public.knowledge_claim() returns jsonb language plpgsql security definer set search_path='' as $$
declare j public.knowledge_jobs; sid text;
begin
  update public.knowledge_state set worker_seen=now() where id;
  select snapshot_id into sid from public.knowledge_state where id;
  if sid is null then return null; end if;
  update public.knowledge_jobs set status='failed',error='Lease expired after maximum attempts',updated_at=now() where status='running' and leased_until<now() and attempts>=3;
  select * into j from public.knowledge_jobs where (status='pending' or status='running' and leased_until<now()) and attempts<3 order by created_at,id for update skip locked limit 1;
  if not found then return null; end if;
  update public.knowledge_jobs set status='running',attempts=attempts+1,lease_token=gen_random_uuid(),leased_until=now()+interval '15 minutes',snapshot_id=sid,updated_at=now(),error=null where id=j.id returning * into j;
  return to_jsonb(j)||jsonb_build_object('source_catalog_id',(select source_catalog_id from public.knowledge_snapshots where id=sid));
end $$;

create function public.knowledge_complete(p_id uuid,p_token uuid,p_report jsonb) returns void language plpgsql security definer set search_path='' as $$
declare j public.knowledge_jobs; sid text; source_id text;
begin
  select * into strict j from public.knowledge_jobs where id=p_id for update;
  select snapshot_id into sid from public.knowledge_state where id for share;
  select source_catalog_id into source_id from public.knowledge_snapshots where id=sid;
  if j.status<>'running' or j.lease_token is distinct from p_token or j.leased_until<now() then raise exception 'Expired knowledge lease'; end if;
  if sid is distinct from j.snapshot_id or p_report->>'snapshot_id' is distinct from source_id or p_report->>'candidate_hash' is distinct from j.candidate_hash then raise exception 'Stale knowledge result'; end if;
  if exists(select 1 from public.linkedin_posts p where 'post:'||p.id::text=j.candidate->>'existingId' and p.current_revision_id::text is distinct from j.candidate->>'revisionId') then raise exception 'Post revision changed'; end if;
  if not private.knowledge_report_valid(p_report,sid) then raise exception 'Invalid knowledge evidence'; end if;
  update public.knowledge_jobs set status='succeeded',report=p_report,lease_token=null,leased_until=null,updated_at=now() where id=p_id;
end $$;

create function public.knowledge_fail(p_id uuid,p_token uuid,p_error text) returns void language plpgsql security definer set search_path='' as $$
begin
  update public.knowledge_jobs set status='failed',error=left(p_error,1000),lease_token=null,leased_until=null,updated_at=now() where id=p_id and status='running' and lease_token=p_token;
end $$;

create function public.knowledge_job(p_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if not public.linkedin_is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  return (select to_jsonb(j)-'lease_token' from public.knowledge_jobs j where id=p_id);
end $$;

create function public.knowledge_review(p_id uuid,p_hash text,p_snapshot text,p_decision text) returns void language plpgsql security definer set search_path='' as $$
declare j public.knowledge_jobs; sid text;
begin
  if not public.linkedin_is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  if p_decision not in ('accept','reject') then raise exception 'Invalid review decision'; end if;
  select * into strict j from public.knowledge_jobs where id=p_id for update;
  select snapshot_id into sid from public.knowledge_state where id for share;
  if j.status<>'succeeded' or j.snapshot_id is distinct from sid or j.candidate_hash is distinct from p_hash or j.report->>'snapshot_id' is distinct from p_snapshot then raise exception 'Stale knowledge review'; end if;
  if exists(select 1 from public.linkedin_posts p where 'post:'||p.id::text=j.candidate->>'existingId' and p.current_revision_id::text is distinct from j.candidate->>'revisionId') then raise exception 'Post revision changed'; end if;
  update public.knowledge_jobs set reviewed=p_decision,reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() where id=p_id;
end $$;

create function public.knowledge_for_post(p_post uuid,p_revision uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if not public.linkedin_is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  return (select to_jsonb(j)-'lease_token' from public.knowledge_jobs j where candidate->>'existingId'='post:'||p_post::text and candidate->>'revisionId'=p_revision::text order by created_at desc limit 1);
end $$;

-- These rows are an approval ledger, not authored curriculum or publication commands.
create table public.knowledge_private_relationships (
  id text primary key, data jsonb not null, job_id uuid not null references public.knowledge_jobs(id), approved_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);
alter table public.knowledge_private_relationships enable row level security;
revoke all on public.knowledge_private_relationships from public,anon,authenticated;
grant all on public.knowledge_private_relationships to service_role;

create function public.knowledge_jobs_recent() returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if not public.linkedin_is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  return coalesce((select jsonb_agg((to_jsonb(j)-'report'-'lease_token'-'candidate')||jsonb_build_object('candidate',jsonb_build_object('title',j.candidate->>'title','kind',j.candidate->>'kind')) order by created_at desc) from (select * from public.knowledge_jobs order by created_at desc limit 30) j),'[]');
end $$;

create function public.knowledge_save_post(p_post uuid,p_revision uuid,p_report jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare sid text; source_id text; candidate jsonb; h text; jid uuid:=gen_random_uuid();
begin
  perform 1 from public.linkedin_posts where id=p_post for update;
  select snapshot_id into sid from public.knowledge_state where id for share;
  select source_catalog_id into source_id from public.knowledge_snapshots where id=sid;
  if source_id is null or p_report->>'snapshot_id' is distinct from source_id then raise exception 'Stale knowledge result'; end if;
  select jsonb_build_object('title',p.title,'body',r.body||case when coalesce(r.first_comment,'')<>'' then E'\n\n'||r.first_comment else '' end,'kind','post','existingId','post:'||p.id::text,'revisionId',r.id::text) into candidate
    from public.linkedin_posts p join public.linkedin_revisions r on r.id=p.current_revision_id where p.id=p_post and r.id=p_revision;
  if candidate is null then raise exception 'Post revision changed'; end if;
  h:=private.knowledge_hash(candidate);
  if p_report->>'candidate_hash' is distinct from h then raise exception 'Knowledge candidate hash mismatch'; end if;
  if not private.knowledge_report_valid(p_report,sid) then raise exception 'Invalid knowledge evidence'; end if;
  insert into public.knowledge_jobs(id,candidate,candidate_hash,snapshot_id,status,report) values(jid,candidate,h,sid,'succeeded',p_report);
  return jsonb_build_object('id',jid,'snapshot_id',sid,'candidate_hash',h);
end $$;

create function public.knowledge_apply_private(p_id uuid) returns integer language plpgsql security definer set search_path='' as $$
declare j public.knowledge_jobs; sid text; e jsonb; added integer:=0;
begin
  select * into strict j from public.knowledge_jobs where id=p_id for update;
  perform 1 from public.linkedin_posts where 'post:'||id::text=j.candidate->>'existingId' for update;
  select snapshot_id into sid from public.knowledge_state where id for share;
  if j.reviewed is distinct from 'accept' or j.snapshot_id is distinct from sid or j.applied_at is not null then raise exception 'Stale or unapplied review required'; end if;
  for e in select value from jsonb_array_elements(j.report->'relationships') loop
    if not exists(select 1 from public.knowledge_resources where snapshot_id=sid and id=e->>'source' and data->>'visibility'='private') then continue; end if;
    if not exists(select 1 from public.knowledge_resources where snapshot_id=sid and id=e->>'target') or jsonb_array_length(e->'evidence')=0
      or exists(select 1 from jsonb_array_elements(e->'evidence') v where not exists(select 1 from public.knowledge_resources r where r.snapshot_id=sid and r.id=v->>'resourceId' and r.data->>'hash'=v->>'hash' and length(v->>'quote')>0 and strpos(r.data->>'text',v->>'quote')>0))
      then raise exception 'Stale relationship evidence'; end if;
    if exists(select 1 from public.linkedin_posts p where 'post:'||p.id::text=e->>'source' and p.current_revision_id::text is distinct from j.candidate->>'revisionId') then raise exception 'Post revision changed'; end if;
    insert into public.knowledge_private_relationships(id,data,job_id,approved_by) values(e->>'id',e||'{"provenance":"approved"}',j.id,j.reviewed_by) on conflict(id) do update set data=excluded.data,job_id=excluded.job_id,approved_by=excluded.approved_by;
    added:=added+1;
  end loop;
  -- The sidecar worker marks completion only after all private and curriculum edges succeed.
  return added;
end $$;
create function public.knowledge_approved_private() returns jsonb language sql security definer set search_path='' as $$ select coalesce(jsonb_agg(data),'[]') from public.knowledge_private_relationships $$;
revoke all on function public.knowledge_jobs_recent() from public,anon;
grant execute on function public.knowledge_jobs_recent() to authenticated;
revoke all on function public.knowledge_save_post(uuid,uuid,jsonb),public.knowledge_apply_private(uuid),public.knowledge_approved_private() from public,anon,authenticated;
grant execute on function public.knowledge_save_post(uuid,uuid,jsonb),public.knowledge_apply_private(uuid),public.knowledge_approved_private() to service_role;

revoke all on function public.knowledge_publish(jsonb),public.knowledge_claim(),public.knowledge_complete(uuid,uuid,jsonb),public.knowledge_fail(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.knowledge_publish(jsonb),public.knowledge_claim(),public.knowledge_complete(uuid,uuid,jsonb),public.knowledge_fail(uuid,uuid,text) to service_role;
revoke all on function public.knowledge_browse(text,jsonb,text,text),public.knowledge_submit(jsonb,uuid),public.knowledge_job(uuid),public.knowledge_review(uuid,text,text,text),public.knowledge_for_post(uuid,uuid) from public,anon;
grant execute on function public.knowledge_browse(text,jsonb,text,text),public.knowledge_submit(jsonb,uuid),public.knowledge_job(uuid),public.knowledge_review(uuid,text,text,text),public.knowledge_for_post(uuid,uuid) to authenticated;
