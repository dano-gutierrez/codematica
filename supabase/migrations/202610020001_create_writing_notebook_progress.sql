create table public.user_writing_notebook_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  notebook_id text not null check (length(notebook_id) between 1 and 200 and notebook_id ~ '^[a-z0-9/-]+$'),
  sheet_id text not null check (length(sheet_id) between 1 and 200 and sheet_id ~ '^[a-z0-9/-]+$'),
  prompt text not null check (char_length(prompt) between 1 and 5 and prompt !~ '[[:space:]]'),
  best_count integer not null default 0 check (best_count between 0 and 24 * char_length(prompt)),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, notebook_id, sheet_id)
);
alter table public.user_writing_notebook_progress enable row level security;
revoke all on public.user_writing_notebook_progress from public, anon, authenticated;
grant select, insert, update on public.user_writing_notebook_progress to authenticated;
create policy "Learners read their notebook progress" on public.user_writing_notebook_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "Learners insert their notebook progress" on public.user_writing_notebook_progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Learners update their notebook progress" on public.user_writing_notebook_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create function public.preserve_writing_notebook_progress() returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    if new.prompt <> old.prompt then raise exception 'Notebook prompt is immutable; use a new sheet identifier.'; end if;
    new.best_count = greatest(old.best_count, new.best_count);
    new.completed_at = old.completed_at;
  end if;
  if new.best_count = 24 * char_length(new.prompt) then new.completed_at = coalesce(new.completed_at, now()); else new.completed_at = null; end if;
  new.updated_at = now();
  return new;
end;
$$;
create trigger preserve_writing_notebook_progress before insert or update on public.user_writing_notebook_progress for each row execute function public.preserve_writing_notebook_progress();
comment on table public.user_writing_notebook_progress is 'Bounded writing milestones only. Handwriting remains on the learner device.';
