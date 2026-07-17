create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_progress_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  surface text not null check (surface in ('document', 'diagram', 'practice', 'passive-feed', 'interview')),
  slug text not null,
  path_slug text not null default '',
  status text not null check (status in ('started', 'completed')),
  position jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, surface, slug, path_slug)
);

create index if not exists user_progress_items_user_seen_idx
  on public.user_progress_items (user_id, last_seen_at desc);

alter table public.user_profiles enable row level security;
alter table public.user_progress_items enable row level security;

grant select, insert, update, delete on public.user_profiles to authenticated;
grant select, insert, update, delete on public.user_progress_items to authenticated;

drop policy if exists "Users can read their own profile." on public.user_profiles;
create policy "Users can read their own profile."
on public.user_profiles for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own profile." on public.user_profiles;
create policy "Users can insert their own profile."
on public.user_profiles for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own profile." on public.user_profiles;
create policy "Users can update their own profile."
on public.user_profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own profile." on public.user_profiles;
create policy "Users can delete their own profile."
on public.user_profiles for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own progress." on public.user_progress_items;
create policy "Users can read their own progress."
on public.user_progress_items for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own progress." on public.user_progress_items;
create policy "Users can insert their own progress."
on public.user_progress_items for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own progress." on public.user_progress_items;
create policy "Users can update their own progress."
on public.user_progress_items for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own progress." on public.user_progress_items;
create policy "Users can delete their own progress."
on public.user_progress_items for delete
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

create or replace function public.preserve_user_progress_completion()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    new.first_seen_at = old.first_seen_at;

    if old.completed_at is not null and new.completed_at is null then
      new.completed_at = old.completed_at;
    end if;

    if old.status = 'completed' and new.status = 'started' then
      new.status = 'completed';
    end if;
  end if;

  new.updated_at = now();
  new.last_seen_at = coalesce(new.last_seen_at, now());

  return new;
end;
$$;

drop trigger if exists user_progress_items_preserve_completion on public.user_progress_items;
create trigger user_progress_items_preserve_completion
before insert or update on public.user_progress_items
for each row execute function public.preserve_user_progress_completion();
