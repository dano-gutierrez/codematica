-- Private editorial collection. Client writes go through revision-aware RPCs only.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.app_admins (
  user_id uuid primary key references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);
alter table private.app_admins enable row level security;

create function public.linkedin_is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from private.app_admins where user_id = (select auth.uid()));
$$;
revoke all on function public.linkedin_is_admin() from public;
grant execute on function public.linkedin_is_admin() to anon, authenticated;

create table public.linkedin_posts (
  id uuid primary key default gen_random_uuid(), seed_key text not null unique,
  title text not null check (length(trim(title)) > 0), topic text not null,
  status text not null default 'review' check (status in ('review','approved','rejected','withdrawing')),
  current_revision_id uuid not null, approved_revision_id uuid,
  approved_by uuid references auth.users(id) on delete restrict, approved_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((approved_revision_id is null and approved_by is null and approved_at is null and status in ('review','rejected')) or
         (approved_revision_id is not null and approved_by is not null and approved_at is not null and status in ('approved','withdrawing')))
);
create table public.linkedin_revisions (
  id uuid primary key default gen_random_uuid(), post_id uuid not null references public.linkedin_posts(id) on delete restrict,
  parent_revision_id uuid, kind text not null check(kind in ('initial','edit','refine')),
  body text not null check (length(trim(body)) between 1 and 3000), first_comment text not null default '' check(length(first_comment) <= 1248),
  sources jsonb not null check (jsonb_typeof(sources) = 'array' and jsonb_array_length(sources) > 0),
  analysis jsonb, facts_confirmed boolean not null default false, prompt_hash text,
  created_by uuid references auth.users(id) on delete restrict, created_at timestamptz not null default now(),
  unique(post_id,id), foreign key(post_id,parent_revision_id) references public.linkedin_revisions(post_id,id)
);
alter table public.linkedin_posts add constraint linkedin_current_revision_fk foreign key(id,current_revision_id) references public.linkedin_revisions(post_id,id) deferrable initially deferred;
alter table public.linkedin_posts add constraint linkedin_approved_revision_fk foreign key(id,approved_revision_id) references public.linkedin_revisions(post_id,id) deferrable initially deferred;
create table public.linkedin_jobs (
  id uuid primary key default gen_random_uuid(), post_id uuid not null references public.linkedin_posts(id) on delete restrict,
  revision_id uuid not null, kind text not null check(kind in ('refine','schedule','cancel')),
  status text not null default 'pending' check(status in ('pending','running','succeeded','failed','cancelled','uncertain')),
  attempts integer not null default 0 check(attempts between 0 and 3), available_at timestamptz not null default now(),
  lease_token uuid, lease_until timestamptz, error text, result_revision_id uuid references public.linkedin_revisions(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(post_id,revision_id) references public.linkedin_revisions(post_id,id)
);
create unique index linkedin_one_active_job on public.linkedin_jobs(post_id,revision_id,kind) where status in ('pending','running','uncertain');
create index linkedin_job_queue on public.linkedin_jobs(kind,available_at,created_at) where status='pending';
create table public.linkedin_publications (
  id uuid primary key default gen_random_uuid(), post_id uuid not null references public.linkedin_posts(id) on delete restrict,
  revision_id uuid not null, buffer_id text unique,
  status text not null check(status in ('scheduling','scheduled','sent','error','unknown','cancelled')),
  scheduled_at timestamptz, sent_at timestamptz, url text, error text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(post_id,revision_id) references public.linkedin_revisions(post_id,id), unique(post_id,revision_id)
);
create table public.linkedin_settings (
  id boolean primary key default true check(id),
  author_context text not null default 'English educational posts for practicing engineers. Focus: system design and production engineering. Goal: credible thought leadership and useful learning. Plain voice. Do not invent personal experience or results.',
  buffer_channel_id text, buffer_organization_id text, timezone text not null default 'America/Los_Angeles',
  publishing_enabled boolean not null default false,
  worker_last_seen timestamptz, worker_message text
);
insert into public.linkedin_settings(id) values(true);

-- RLS is defense in depth; neither authenticated admins nor other users can write tables directly.
do $$ declare t text; begin
  foreach t in array array['linkedin_posts','linkedin_revisions','linkedin_jobs','linkedin_publications','linkedin_settings'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public, anon, authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
    execute format('grant all on public.%I to service_role',t);
    execute format('create policy admin_read on public.%I for select to authenticated using ((select public.linkedin_is_admin()))',t);
  end loop;
end $$;
create function private.linkedin_immutable_revision() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'Editorial revisions are immutable' using errcode='55000'; end $$;
create trigger linkedin_revision_immutable before update or delete on public.linkedin_revisions for each row execute function private.linkedin_immutable_revision();

create function public.linkedin_snapshot() returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if not public.linkedin_is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  return jsonb_build_object(
    'posts',coalesce((select jsonb_agg(p order by p.created_at,p.id) from public.linkedin_posts p),'[]'::jsonb),
    'revisions',coalesce((select jsonb_agg(r order by r.created_at,r.id) from public.linkedin_revisions r),'[]'::jsonb),
    'jobs',coalesce((select jsonb_agg(j order by j.created_at desc) from public.linkedin_jobs j),'[]'::jsonb),
    'publications',coalesce((select jsonb_agg(p order by p.created_at desc) from public.linkedin_publications p),'[]'::jsonb),
    'settings',(select to_jsonb(s) from public.linkedin_settings s where id));
end $$;

create function public.linkedin_review(p_post_id uuid,p_expected_revision uuid,p_action text,p_body text default null,p_first_comment text default null,p_proposal_id uuid default null,p_facts_confirmed boolean default false)
returns void language plpgsql security definer set search_path='' as $$
declare p public.linkedin_posts; r public.linkedin_revisions; proposal public.linkedin_revisions; new_id uuid; pub public.linkedin_publications;
begin
  if not public.linkedin_is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  select * into strict p from public.linkedin_posts where id=p_post_id for update;
  if p.current_revision_id <> p_expected_revision then raise exception 'The draft changed. Refresh before continuing.' using errcode='40001'; end if;
  select * into strict r from public.linkedin_revisions where id=p.current_revision_id;
  if p_action='withdraw' then
    if p.status not in ('approved','withdrawing') then return; end if;
    select * into pub from public.linkedin_publications where post_id=p.id and revision_id=p.approved_revision_id;
    if pub.status='sent' then raise exception 'This post has already been published.'; end if;
    if exists(select 1 from public.linkedin_jobs where post_id=p.id and kind='schedule' and status in ('running','uncertain')) then
      raise exception 'Scheduling is in progress or uncertain. Reconcile it before withdrawing.';
    end if;
    update public.linkedin_jobs set status='cancelled',updated_at=now() where post_id=p.id and kind='schedule' and status='pending';
    if pub.status in ('scheduling','unknown') then raise exception 'Reconcile the Buffer result before withdrawing.'; end if;
    if pub.buffer_id is not null and pub.status <> 'cancelled' then
      insert into public.linkedin_jobs(post_id,revision_id,kind) values(p.id,p.approved_revision_id,'cancel') on conflict do nothing;
      update public.linkedin_posts set status='withdrawing',updated_at=now() where id=p.id;
    else
      update public.linkedin_posts set status='review',approved_revision_id=null,approved_by=null,approved_at=null,updated_at=now() where id=p.id;
    end if;
    return;
  end if;
  if p.status in ('approved','withdrawing') then raise exception 'Return this post to review before editing or refining.'; end if;
  if p_action='save' then
    new_id:=gen_random_uuid();
    insert into public.linkedin_revisions(id,post_id,parent_revision_id,kind,body,first_comment,sources,analysis,facts_confirmed,created_by)
    values(new_id,p.id,r.id,'edit',trim(p_body),coalesce(p_first_comment,''),r.sources,r.analysis,p_facts_confirmed,auth.uid());
    update public.linkedin_posts set current_revision_id=new_id,status='review',updated_at=now() where id=p.id;
  elsif p_action='use' then
    select * into strict proposal from public.linkedin_revisions where id=p_proposal_id and post_id=p.id and kind='refine';
    if proposal.parent_revision_id<>r.id then raise exception 'This proposal is based on an older draft. Refine the current revision.' using errcode='40001'; end if;
    update public.linkedin_posts set current_revision_id=proposal.id,status='review',updated_at=now() where id=p.id;
  elsif p_action='refine' then
    insert into public.linkedin_jobs(post_id,revision_id,kind) values(p.id,r.id,'refine') on conflict do nothing;
  elsif p_action='reject' then
    update public.linkedin_posts set status='rejected',updated_at=now() where id=p.id;
    update public.linkedin_jobs set status='cancelled',lease_token=null,lease_until=null,updated_at=now() where post_id=p.id and kind='refine' and status in ('pending','running');
  elsif p_action='approve' then
    if r.body ~* '\[(ADD|VERIFY|TODO)\y[^\]]*\]' or (not r.facts_confirmed and coalesce(jsonb_array_length(r.analysis->'verificationNotes'),0)>0) then raise exception 'Resolve placeholders and verify flagged facts before approval.'; end if;
    -- A cancelled external publication stays in history; renewed approval gets a fresh identity.
    if exists(select 1 from public.linkedin_publications where post_id=p.id and revision_id=r.id and status='cancelled') then
      new_id:=gen_random_uuid();
      insert into public.linkedin_revisions(id,post_id,parent_revision_id,kind,body,first_comment,sources,analysis,facts_confirmed,created_by)
        values(new_id,p.id,r.id,'edit',r.body,r.first_comment,r.sources,r.analysis,r.facts_confirmed,auth.uid());
      r.id:=new_id;
    end if;
    update public.linkedin_posts set current_revision_id=r.id,status='approved',approved_revision_id=r.id,approved_by=auth.uid(),approved_at=now(),updated_at=now() where id=p.id;
    insert into public.linkedin_jobs(post_id,revision_id,kind) values(p.id,r.id,'schedule') on conflict do nothing;
  else raise exception 'Unknown editorial action'; end if;
end $$;

-- The following RPCs are service-role only. Local scripts never expose this key to a client.
create function public.linkedin_bootstrap_admin(p_user_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then raise exception 'A verified personal account is required'; end if;
  insert into private.app_admins(user_id) values(p_user_id) on conflict do nothing;
end $$;
create function public.linkedin_configure(p_channel text,p_organization text,p_enabled boolean default false,p_timezone text default 'America/Los_Angeles') returns void language sql security definer set search_path='' as $$
  update public.linkedin_settings set buffer_channel_id=p_channel,buffer_organization_id=p_organization,publishing_enabled=p_enabled,timezone=p_timezone where id;
$$;
create function public.linkedin_import(p_posts jsonb) returns integer language plpgsql security definer set search_path='' as $$
declare item jsonb; post_id uuid; revision_id uuid; inserted integer:=0;
begin
  for item in select value from jsonb_array_elements(p_posts) loop
    post_id:=gen_random_uuid(); revision_id:=gen_random_uuid();
    insert into public.linkedin_posts(id,seed_key,title,topic,current_revision_id) values(post_id,item->>'seed_key',item->>'title',item->>'topic',revision_id) on conflict(seed_key) do nothing;
    if found then
      insert into public.linkedin_revisions(id,post_id,kind,body,first_comment,sources,analysis) values(revision_id,post_id,'initial',item->>'body',coalesce(item->>'first_comment',''),item->'sources',null);
      inserted:=inserted+1;
    end if;
  end loop;
  return inserted;
end $$;
create function public.linkedin_heartbeat(p_message text default null) returns void language sql security definer set search_path='' as $$
  update public.linkedin_settings set worker_last_seen=now(),worker_message=p_message where id;
$$;

create function public.linkedin_claim(p_kind text) returns jsonb language plpgsql security definer set search_path='' as $$
declare j public.linkedin_jobs;
begin
  if p_kind not in ('refine','schedule','cancel') then raise exception 'Unknown job kind'; end if;
  update public.linkedin_jobs set status=case when kind='refine' then case when attempts<3 then 'pending' else 'failed' end else 'uncertain' end,
    error='Worker lease expired',lease_token=null,lease_until=null,updated_at=now()
    where status='running' and lease_until < now();
  update public.linkedin_publications p set status='unknown',error='Scheduling result requires reconciliation',updated_at=now()
    where p.status='scheduling' and exists(select 1 from public.linkedin_jobs expired_job where expired_job.post_id=p.post_id and expired_job.revision_id=p.revision_id and expired_job.kind='schedule' and expired_job.status='uncertain');
  if p_kind='schedule' and not exists(select 1 from public.linkedin_settings where id and publishing_enabled and buffer_channel_id is not null and buffer_organization_id is not null) then return null; end if;
  select * into j from public.linkedin_jobs where kind=p_kind and status='pending' and attempts<3 and available_at<=now() order by created_at,id for update skip locked limit 1;
  if not found then return null; end if;
  update public.linkedin_jobs set status='running',attempts=attempts+1,lease_token=gen_random_uuid(),lease_until=now()+interval '20 minutes',updated_at=now() where id=j.id returning * into j;
  return jsonb_build_object('job',to_jsonb(j),'revision',(select to_jsonb(r) from public.linkedin_revisions r where id=j.revision_id),'post',(select to_jsonb(p) from public.linkedin_posts p where id=j.post_id),'settings',(select to_jsonb(s) from public.linkedin_settings s where id),'publication',(select to_jsonb(p) from public.linkedin_publications p where post_id=j.post_id and revision_id=j.revision_id));
end $$;
create function private.linkedin_check_job(p_id uuid,p_token uuid) returns public.linkedin_jobs language plpgsql set search_path='' as $$
declare j public.linkedin_jobs;
begin
  select * into strict j from public.linkedin_jobs where id=p_id for update;
  if j.status<>'running' or j.lease_token is distinct from p_token or j.lease_until<now() then raise exception 'Job lease is no longer valid' using errcode='40001'; end if;
  return j;
end $$;
create function public.linkedin_renew(p_job_id uuid,p_token uuid) returns void language plpgsql security definer set search_path='' as $$
begin
  perform private.linkedin_check_job(p_job_id,p_token);
  update public.linkedin_jobs set lease_until=now()+interval '20 minutes' where id=p_job_id;
end $$;
create function public.linkedin_complete_refine(p_job_id uuid,p_token uuid,p_analysis jsonb,p_prompt_hash text) returns uuid language plpgsql security definer set search_path='' as $$
declare j public.linkedin_jobs; r public.linkedin_revisions; new_id uuid:=gen_random_uuid();
begin
  j:=private.linkedin_check_job(p_job_id,p_token);
  if j.kind<>'refine' then raise exception 'Expected a refinement job'; end if;
  if p_analysis->>'rewrittenPost' is null or p_analysis->'diagnosis' is null or jsonb_array_length(p_analysis->'alternativeHooks')<>3 or length(p_prompt_hash)<>64 then raise exception 'Invalid analysis'; end if;
  select * into strict r from public.linkedin_revisions where id=j.revision_id;
  insert into public.linkedin_revisions(id,post_id,parent_revision_id,kind,body,first_comment,sources,analysis,prompt_hash)
    values(new_id,j.post_id,r.id,'refine',p_analysis->>'rewrittenPost',coalesce(p_analysis#>>'{postingPlan,firstComment}',''),r.sources,p_analysis,p_prompt_hash);
  update public.linkedin_jobs set status='succeeded',result_revision_id=new_id,lease_token=null,lease_until=null,updated_at=now() where id=j.id;
  return new_id;
end $$;
create function public.linkedin_begin_publish(p_job_id uuid,p_token uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare j public.linkedin_jobs; p public.linkedin_posts; pub_id uuid;
begin
  select * into strict p from public.linkedin_posts where id=(select post_id from public.linkedin_jobs where id=p_job_id) for update;
  j:=private.linkedin_check_job(p_job_id,p_token);
  if j.kind<>'schedule' or p.status<>'approved' or p.approved_revision_id<>j.revision_id then raise exception 'The exact revision is no longer approved'; end if;
  if not exists(select 1 from public.linkedin_settings where id and publishing_enabled) then raise exception 'Publishing is paused'; end if;
  if exists(select 1 from public.linkedin_publications where post_id=p.id and revision_id=j.revision_id) then raise exception 'A publication already exists. Reconcile instead of sending again.'; end if;
  insert into public.linkedin_publications(post_id,revision_id,status) values(p.id,j.revision_id,'scheduling') returning id into pub_id;
  return pub_id;
end $$;
create function public.linkedin_fail(p_job_id uuid,p_token uuid,p_error text,p_uncertain boolean default false) returns void language plpgsql security definer set search_path='' as $$
declare j public.linkedin_jobs;
begin
  j:=private.linkedin_check_job(p_job_id,p_token);
  -- Publication calls are not automatically retried, even if an API reports an error.
  update public.linkedin_jobs set status=case when p_uncertain or kind in ('schedule','cancel') then 'uncertain' when attempts<3 then 'pending' else 'failed' end,
    error=left(p_error,2000),available_at=now()+interval '1 hour',lease_token=null,lease_until=null,updated_at=now() where id=j.id;
  update public.linkedin_publications set status='unknown',error=left(p_error,2000),updated_at=now() where post_id=j.post_id and revision_id=j.revision_id and status='scheduling';
end $$;
create function public.linkedin_reconcile(p_post_id uuid,p_revision_id uuid,p_result jsonb) returns void language plpgsql security definer set search_path='' as $$
declare p public.linkedin_posts; pub public.linkedin_publications; state text:=p_result->>'status';
begin
  if state not in ('scheduled','sent','error','cancelled') then raise exception 'Unsupported publication status'; end if;
  select * into strict p from public.linkedin_posts where id=p_post_id for update;
  select * into strict pub from public.linkedin_publications where post_id=p.id and revision_id=p_revision_id for update;
  if pub.status='sent' and state<>'sent' then raise exception 'Cannot reverse a published post'; end if;
  if state='cancelled' and p.status<>'withdrawing' then raise exception 'Cancellation must be requested by an admin'; end if;
  if state<>'cancelled' and (p.approved_revision_id is distinct from p_revision_id or nullif(p_result->>'buffer_id','') is null) then raise exception 'Approved revision and Buffer identity required'; end if;
  if pub.buffer_id is not null and pub.buffer_id is distinct from p_result->>'buffer_id' then raise exception 'Buffer identity does not match'; end if;
  update public.linkedin_publications set buffer_id=coalesce(pub.buffer_id,p_result->>'buffer_id'),status=state,
    scheduled_at=(p_result->>'scheduled_at')::timestamptz,sent_at=(p_result->>'sent_at')::timestamptz,url=p_result->>'url',error=p_result->>'error',updated_at=now() where id=pub.id;
  update public.linkedin_jobs set status='succeeded',error=null,lease_token=null,lease_until=null,updated_at=now()
    where post_id=p.id and revision_id=p_revision_id and kind=case when state='cancelled' then 'cancel' else 'schedule' end and status in ('running','uncertain');
  if state='cancelled' then
    update public.linkedin_posts set status='review',approved_revision_id=null,approved_by=null,approved_at=null,updated_at=now() where id=p.id;
  end if;
end $$;

-- Restore is additive and only accepts an empty editorial collection. Auth identities are not restored.
create function public.linkedin_restore(p_backup jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
  lock table public.linkedin_posts,public.linkedin_revisions,public.linkedin_jobs,public.linkedin_publications in exclusive mode;
  if exists(select 1 from public.linkedin_posts) then raise exception 'Restore requires an empty editorial collection; export existing data first.'; end if;
  if (p_backup->>'version')::integer<>1 then raise exception 'Unsupported backup version'; end if;
  insert into public.linkedin_posts select * from jsonb_populate_recordset(null::public.linkedin_posts,p_backup->'posts');
  insert into public.linkedin_revisions select * from jsonb_populate_recordset(null::public.linkedin_revisions,p_backup->'revisions');
  insert into public.linkedin_jobs select * from jsonb_populate_recordset(null::public.linkedin_jobs,p_backup->'jobs');
  insert into public.linkedin_publications select * from jsonb_populate_recordset(null::public.linkedin_publications,p_backup->'publications');
  update public.linkedin_jobs set status=case when kind='refine' and attempts<3 then 'pending' when kind='refine' then 'failed' else 'uncertain' end,
    lease_token=null,lease_until=null,error='Restored: reconcile external state before resuming',updated_at=now() where status in ('running','pending','uncertain');
  update public.linkedin_publications set status='unknown',error='Restored: verify current Buffer state',updated_at=now() where status in ('scheduling','scheduled');
  update public.linkedin_settings set publishing_enabled=false,worker_message='Restored; publishing paused pending reconciliation' where id;
end $$;

-- Remove PostgreSQL's default PUBLIC execute grant from every editorial RPC.
do $$ declare f record; begin
  for f in select p.oid::regprocedure as signature,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'linkedin_%' loop
    execute format('revoke all on function %s from public,anon,authenticated',f.signature);
    execute format('grant execute on function %s to service_role',f.signature);
    if f.proname in ('linkedin_is_admin','linkedin_snapshot','linkedin_review') then execute format('grant execute on function %s to authenticated',f.signature); end if;
    if f.proname='linkedin_is_admin' then execute format('grant execute on function %s to anon',f.signature); end if;
  end loop;
end $$;
