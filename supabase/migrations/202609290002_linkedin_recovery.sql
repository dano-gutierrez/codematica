-- Preserve recovery settings and handle publication winning a cancellation race.
create or replace function public.linkedin_reconcile(p_post_id uuid,p_revision_id uuid,p_result jsonb) returns void language plpgsql security definer set search_path='' as $$
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
  if state='sent' and p.status='withdrawing' then
    update public.linkedin_posts set status='approved',updated_at=now() where id=p.id;
    update public.linkedin_jobs set status='failed',error='Buffer published before cancellation completed',lease_token=null,lease_until=null,updated_at=now()
      where post_id=p.id and revision_id=p_revision_id and kind='cancel' and status in ('pending','running','uncertain');
  end if;
  if state='cancelled' then
    update public.linkedin_posts set status='review',approved_revision_id=null,approved_by=null,approved_at=null,updated_at=now() where id=p.id;
  end if;
end $$;

create or replace function public.linkedin_restore(p_backup jsonb) returns void language plpgsql security definer set search_path='' as $$
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
  update public.linkedin_settings set
    author_context=coalesce(p_backup#>>'{settings,0,author_context}',author_context),
    buffer_channel_id=p_backup#>>'{settings,0,buffer_channel_id}',
    buffer_organization_id=p_backup#>>'{settings,0,buffer_organization_id}',
    timezone=coalesce(p_backup#>>'{settings,0,timezone}',timezone),
    worker_last_seen=null,publishing_enabled=false,worker_message='Restored; publishing paused pending reconciliation' where id;
end $$;
