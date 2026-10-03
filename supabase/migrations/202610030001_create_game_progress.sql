-- Additive game state. No answers, code, or per-attempt history is retained.
create table public.user_game_awards (
 user_id uuid not null references auth.users(id) on delete cascade,
 objective_id text not null check (objective_id ~ '^restore-the-signal/[a-z-]+/(main|mastery-1|mastery-2)$'),
 mode text not null check (mode in ('standard','assisted')),
 earned_at timestamptz not null,
 primary key (user_id, objective_id)
);
create table public.user_game_activity_days (
 user_id uuid not null references auth.users(id) on delete cascade,
 activity_day date not null,
 primary key(user_id,activity_day)
);
create table public.user_game_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 timezone text not null,
 cosmetic text not null default 'none' check(cosmetic in ('none','antenna','toolbelt','beacon')),
 updated_at timestamptz not null default now()
);
alter table public.user_game_awards enable row level security;
alter table public.user_game_activity_days enable row level security;
alter table public.user_game_preferences enable row level security;
create policy game_awards_owner on public.user_game_awards for select to authenticated using(user_id=(select auth.uid()));
create policy game_days_owner on public.user_game_activity_days for select to authenticated using(user_id=(select auth.uid()));
create policy game_preferences_owner on public.user_game_preferences for select to authenticated using(user_id=(select auth.uid()));
-- Writes use the bounded, transactional merge function to preserve earned rows.
create function public.get_game_progress() returns jsonb language sql stable security definer set search_path='' as $$
 select case when auth.uid() is null or not exists(select 1 from public.user_game_preferences where user_id=auth.uid()) then null else
 jsonb_build_object('version',1,'timezone',p.timezone,'cosmetic',p.cosmetic,'updatedAt',to_char(p.updated_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
 'awards',coalesce((select jsonb_object_agg(a.objective_id,jsonb_build_object('mode',a.mode,'earnedAt',to_char(a.earned_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))) from public.user_game_awards a where a.user_id=auth.uid()),'{}'::jsonb),
 'activityDays',coalesce((select jsonb_agg(d.activity_day order by d.activity_day) from public.user_game_activity_days d where d.user_id=auth.uid()),'[]'::jsonb)) end
 from (select 1) seed left join public.user_game_preferences p on p.user_id=auth.uid();
$$;
create function public.merge_game_progress(payload jsonb, expected_user uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); award record; day_value text; stars integer; preference_time timestamptz; level_slug text; previous_slug text; level_number integer;
levels text[]:=array['courtyard-defense','target-lock','open-the-gate','first-outpost','crossfire','threat-scanner','cache-canal','bridge-siege','rooftop-relay','mixed-horde','command-loop','restore-the-signal'];
begin
 if expected_user is not null and expected_user<>uid then raise exception 'Account changed' using errcode='42501';end if;
 if uid is null then raise exception 'Authentication required' using errcode='42501';end if;
 if pg_catalog.octet_length(payload::text)>200000 or payload is null or payload->>'version' is distinct from '1' or jsonb_typeof(payload->'awards') is distinct from 'object' or jsonb_typeof(payload->'activityDays') is distinct from 'array' then raise exception 'Invalid snapshot';end if;
 if (select count(*) from jsonb_object_keys(payload->'awards'))>36 or jsonb_array_length(payload->'activityDays')>10000 then raise exception 'Snapshot too large';end if;
 if not exists(select 1 from pg_catalog.pg_timezone_names where name=payload->>'timezone') then raise exception 'Invalid timezone';end if;
 -- Serialize merges for one account; independent devices union their earned objectives.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(uid::text,0));
 for award in select * from jsonb_each(payload->'awards') loop
   level_slug:=split_part(award.key,'/',2);level_number:=array_position(levels,level_slug);
   if level_number is null or split_part(award.key,'/',1)<>'restore-the-signal' then raise exception 'Unknown objective';end if;
   if level_number>1 then foreach previous_slug in array levels[1:level_number-1] loop
     if not(payload->'awards' ? ('restore-the-signal/'||previous_slug||'/main')) and not exists(select 1 from public.user_game_awards where user_id=uid and objective_id='restore-the-signal/'||previous_slug||'/main') then raise exception 'Missing preceding clear';end if;
   end loop;end if;
   if split_part(award.key,'/',3)<>'main' and not(payload->'awards' ? ('restore-the-signal/'||level_slug||'/main')) and not exists(select 1 from public.user_game_awards where user_id=uid and objective_id='restore-the-signal/'||level_slug||'/main') then raise exception 'Missing main clear';end if;
   insert into public.user_game_awards(user_id,objective_id,mode,earned_at) values(uid,award.key,award.value->>'mode',(award.value->>'earnedAt')::timestamptz)
   on conflict(user_id,objective_id) do update set earned_at=least(user_game_awards.earned_at,excluded.earned_at),mode=case when excluded.earned_at<user_game_awards.earned_at then excluded.mode else user_game_awards.mode end;
 end loop;
 for day_value in select jsonb_array_elements_text(payload->'activityDays') loop
   if day_value !~ '^\d{4}-\d{2}-\d{2}$' or day_value::date>(now() at time zone (payload->>'timezone'))::date then raise exception 'Invalid activity day';end if;
   insert into public.user_game_activity_days values(uid,day_value::date) on conflict do nothing;
 end loop;
 select count(*) into stars from public.user_game_awards where user_id=uid;
 if (payload->>'cosmetic'='antenna' and stars<6) or (payload->>'cosmetic'='toolbelt' and stars<18) or (payload->>'cosmetic'='beacon' and stars<30) then raise exception 'Cosmetic not earned';end if;
 preference_time:=(payload->>'updatedAt')::timestamptz;
 insert into public.user_game_preferences(user_id,timezone,cosmetic,updated_at) values(uid,payload->>'timezone',payload->>'cosmetic',preference_time)
 on conflict(user_id) do update set cosmetic=case when excluded.updated_at>=user_game_preferences.updated_at then excluded.cosmetic else user_game_preferences.cosmetic end,updated_at=greatest(user_game_preferences.updated_at,excluded.updated_at);
 return public.get_game_progress();
end;$$;
revoke all on function public.get_game_progress() from public,anon;
revoke all on function public.merge_game_progress(jsonb,uuid) from public,anon;
grant execute on function public.get_game_progress() to authenticated;
grant execute on function public.merge_game_progress(jsonb,uuid) to authenticated;
