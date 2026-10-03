-- Manual drafts enter analysis atomically. Existing material drafts retain their contract.
alter table public.linkedin_posts add column origin text not null default 'material' check(origin in ('material','manual'));
alter table public.linkedin_revisions drop constraint linkedin_revisions_sources_check;
alter table public.linkedin_revisions add constraint linkedin_revisions_sources_check check(jsonb_typeof(sources)='array');

create function private.linkedin_utf16_length(value text) returns integer language sql immutable strict set search_path='' as $$
  select coalesce(sum(case when c='' then 0 when ascii(c)>65535 then 2 else 1 end),0)::integer from regexp_split_to_table(value,'') c;
$$;
-- Preserve immutable history; the new limits apply to all future revisions.
alter table public.linkedin_revisions add constraint linkedin_body_utf16 check(private.linkedin_utf16_length(body)<=3000) not valid;
alter table public.linkedin_revisions add constraint linkedin_comment_utf16 check(private.linkedin_utf16_length(first_comment)<=1248) not valid;
create function private.linkedin_require_sources() returns trigger language plpgsql set search_path='' as $$
begin
  if jsonb_array_length(new.sources)=0 and not exists(select 1 from public.linkedin_posts where id=new.post_id and origin='manual') then
    raise exception 'Material drafts require source snapshots' using errcode='23514';
  end if;
  return new;
end $$;
create trigger linkedin_require_sources before insert on public.linkedin_revisions for each row execute function private.linkedin_require_sources();

create function public.linkedin_create(p_request_key text,p_title text,p_topic text,p_body text) returns uuid
language plpgsql security definer set search_path='' as $$
declare post_id uuid:=gen_random_uuid(); revision_id uuid:=gen_random_uuid(); existing public.linkedin_posts; initial public.linkedin_revisions; key text;
begin
  if not public.linkedin_is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  if p_request_key is null or p_request_key !~ '^[a-zA-Z0-9-]{1,100}$' or
     p_title is null or length(trim(p_title)) not between 1 and 200 or
     p_topic is null or length(trim(p_topic)) not between 1 and 100 or
     p_body is null or private.linkedin_utf16_length(trim(p_body)) not between 1 and 3000 then
    raise exception 'Provide a title, topic and post within the text limits.' using errcode='22023';
  end if;
  key:='manual:' || auth.uid()::text || ':' || p_request_key;
  -- The unique key serializes concurrent retries, including an unknown network outcome.
  insert into public.linkedin_posts(id,seed_key,title,topic,current_revision_id,origin)
    values(post_id,key,trim(p_title),trim(p_topic),revision_id,'manual') on conflict(seed_key) do nothing;
  if not found then
    select * into strict existing from public.linkedin_posts where seed_key=key;
    select * into strict initial from public.linkedin_revisions where linkedin_revisions.post_id=existing.id and kind='initial';
    if existing.title<>trim(p_title) or existing.topic<>trim(p_topic) or initial.body<>trim(p_body) then
      raise exception 'This request already created a different draft. Refresh the collection.';
    end if;
    return existing.id;
  end if;
  insert into public.linkedin_revisions(id,post_id,kind,body,sources,created_by)
    values(revision_id,post_id,'initial',trim(p_body),'[]',auth.uid());
  insert into public.linkedin_jobs(post_id,revision_id,kind) values(post_id,revision_id,'refine');
  return post_id;
end $$;
revoke all on function public.linkedin_create(text,text,text,text) from public,anon,authenticated;
grant execute on function public.linkedin_create(text,text,text,text) to authenticated,service_role;

create or replace function public.linkedin_review(p_post_id uuid,p_expected_revision uuid,p_action text,p_body text default null,p_first_comment text default null,p_proposal_id uuid default null,p_facts_confirmed boolean default false)
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
    insert into public.linkedin_revisions(id,post_id,parent_revision_id,kind,body,first_comment,sources,analysis,facts_confirmed,prompt_hash,created_by)
    values(new_id,p.id,r.id,'edit',trim(p_body),coalesce(p_first_comment,''),r.sources,case when p.origin='manual' and (trim(p_body) is distinct from r.body or coalesce(p_first_comment,'')<>r.first_comment) then null else r.analysis end,p_facts_confirmed,case when trim(p_body)=r.body and coalesce(p_first_comment,'')=r.first_comment then r.prompt_hash else null end,auth.uid());
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
    if p.origin='manual' and (r.analysis is null or nullif(r.prompt_hash,'') is null) then raise exception 'Analyze this manual post and use the proposed revision before approval.'; end if;
    if r.body ~* '\[(ADD|VERIFY|TODO)\y[^\]]*\]' or (not r.facts_confirmed and coalesce(jsonb_array_length(r.analysis->'verificationNotes'),0)>0) then raise exception 'Resolve placeholders and verify flagged facts before approval.'; end if;
    -- A cancelled external publication stays in history; renewed approval gets a fresh identity.
    if exists(select 1 from public.linkedin_publications where post_id=p.id and revision_id=r.id and status='cancelled') then
      new_id:=gen_random_uuid();
      insert into public.linkedin_revisions(id,post_id,parent_revision_id,kind,body,first_comment,sources,analysis,facts_confirmed,prompt_hash,created_by)
        values(new_id,p.id,r.id,'edit',r.body,r.first_comment,r.sources,r.analysis,r.facts_confirmed,r.prompt_hash,auth.uid());
      r.id:=new_id;
    end if;
    update public.linkedin_posts set current_revision_id=r.id,status='approved',approved_revision_id=r.id,approved_by=auth.uid(),approved_at=now(),updated_at=now() where id=p.id;
    insert into public.linkedin_jobs(post_id,revision_id,kind) values(p.id,r.id,'schedule') on conflict do nothing;
  else raise exception 'Unknown editorial action'; end if;
end $$;


-- Backups made before origin existed remain restorable.
create or replace function public.linkedin_restore(p_backup jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
  lock table public.linkedin_posts,public.linkedin_revisions,public.linkedin_jobs,public.linkedin_publications in exclusive mode;
  if exists(select 1 from public.linkedin_posts) then raise exception 'Restore requires an empty editorial collection; export existing data first.'; end if;
  if (p_backup->>'version')::integer<>1 then raise exception 'Unsupported backup version'; end if;
  insert into public.linkedin_posts select * from jsonb_populate_recordset(null::public.linkedin_posts,coalesce((select jsonb_agg(jsonb_build_object('origin','material') || value) from jsonb_array_elements(p_backup->'posts')), '[]'::jsonb));
  insert into public.linkedin_revisions select * from jsonb_populate_recordset(null::public.linkedin_revisions,p_backup->'revisions');
  insert into public.linkedin_jobs select * from jsonb_populate_recordset(null::public.linkedin_jobs,p_backup->'jobs');
  insert into public.linkedin_publications select * from jsonb_populate_recordset(null::public.linkedin_publications,p_backup->'publications');
  update public.linkedin_jobs set status=case when kind='refine' and attempts<3 then 'pending' when kind='refine' then 'failed' else 'uncertain' end,
    lease_token=null,lease_until=null,error='Restored: reconcile external state before resuming',updated_at=now() where status in ('running','pending','uncertain');
  update public.linkedin_publications set status='unknown',error='Restored: verify current Buffer state',updated_at=now() where status in ('scheduling','scheduled');
  update public.linkedin_settings set
    author_context=coalesce(p_backup#>>'{settings,0,author_context}',author_context),
    buffer_channel_id=p_backup#>>'{settings,0,buffer_channel_id}',
    buffer_organization_id=p_backup#>>'{settings,0,buffer_organization_id}',
    timezone=coalesce(p_backup#>>'{settings,0,timezone}',timezone),
    worker_last_seen=null,publishing_enabled=false,worker_message='Restored; publishing paused pending reconciliation' where id;
end $$;
