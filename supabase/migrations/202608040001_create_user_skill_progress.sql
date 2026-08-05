create table if not exists public.user_skill_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  path_slug text not null,
  skill_id text not null,
  best_score double precision not null default 0 check (best_score >= 0 and best_score <= 1),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  review_box smallint not null default 0 check (review_box >= 0 and review_box <= 5),
  mastery_state text not null default 'new' check (mastery_state in ('new', 'learning', 'reviewing', 'mastered')),
  last_practiced_at timestamptz not null default now(),
  next_review_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, path_slug, skill_id)
);

create index if not exists user_skill_progress_due_idx
  on public.user_skill_progress (user_id, next_review_at asc);

alter table public.user_skill_progress enable row level security;

grant select, insert, update on public.user_skill_progress to authenticated;

drop policy if exists "Users can read their own skill progress." on public.user_skill_progress;
create policy "Users can read their own skill progress."
on public.user_skill_progress for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own skill progress." on public.user_skill_progress;
create policy "Users can insert their own skill progress."
on public.user_skill_progress for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own skill progress." on public.user_skill_progress;
create policy "Users can update their own skill progress."
on public.user_skill_progress for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace function public.preserve_user_skill_progress()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    new.best_score = greatest(old.best_score, new.best_score);
    new.attempt_count = greatest(old.attempt_count, new.attempt_count);
  end if;

  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_skill_progress_preserve_best on public.user_skill_progress;
create trigger user_skill_progress_preserve_best
before insert or update on public.user_skill_progress
for each row execute function public.preserve_user_skill_progress();
