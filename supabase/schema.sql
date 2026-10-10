-- Edge database schema for Supabase.
-- Run this once in your Supabase project: Dashboard > SQL Editor > New query > paste > Run.

-- Public profile for each account
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 24),
  school text check (char_length(school) <= 80),
  grad_year int check (grad_year between 2020 and 2040),
  target_role text check (target_role in ('trader', 'researcher', 'developer', 'undecided')),
  show_on_leaderboard boolean not null default true,
  created_at timestamptz not null default now()
);

-- Synced practice progress (one row per user)
create table if not exists public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  xp int not null default 0,
  solved_count int not null default 0,
  streak int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.progress enable row level security;

-- Each user can read and change only their own rows
drop policy if exists "own profile read" on public.profiles;
drop policy if exists "own profile write" on public.profiles;
drop policy if exists "own profile update" on public.profiles;
create policy "own profile read" on public.profiles for select using (auth.uid() = id);
create policy "own profile write" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own progress read" on public.progress;
drop policy if exists "own progress write" on public.progress;
drop policy if exists "own progress update" on public.progress;
create policy "own progress read" on public.progress for select using (auth.uid() = user_id);
create policy "own progress write" on public.progress for insert with check (auth.uid() = user_id);
create policy "own progress update" on public.progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Create a profile automatically when someone signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare n text;
begin
  n := left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), nullif(split_part(new.email, '@', 1), ''), 'player'), 24);
  if char_length(n) < 2 then n := n || '_1'; end if;
  insert into public.profiles (id, display_name) values (new.id, n)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Public leaderboard: only names and scores of players who opted in
create or replace function public.leaderboard()
returns table (display_name text, xp int, solved_count int, streak int)
language sql security definer set search_path = public stable as $$
  select p.display_name, g.xp, g.solved_count, g.streak
  from public.progress g join public.profiles p on p.id = g.user_id
  where p.show_on_leaderboard
  order by g.xp desc, g.solved_count desc
  limit 50;
$$;
grant execute on function public.leaderboard() to anon, authenticated;

-- Weekly leagues: XP earned since Monday 00:00 UTC, plus last week's total
alter table public.progress add column if not exists week_start date;
alter table public.progress add column if not exists week_xp int not null default 0;
alter table public.progress add column if not exists prev_week_start date;
alter table public.progress add column if not exists prev_week_xp int not null default 0;

-- League table for a given week (defaults to the current one). is_me marks the caller's row.
create or replace function public.league(p_week date default null)
returns table (rank bigint, display_name text, week_xp int, is_me boolean)
language sql security definer set search_path = public stable as $$
  with w as (select coalesce(p_week, date_trunc('week', now() at time zone 'utc')::date) as d),
  scores as (
    select p.display_name, g.user_id,
      case when g.week_start = w.d then g.week_xp
           when g.prev_week_start = w.d then g.prev_week_xp
           else 0 end as x
    from public.progress g
    join public.profiles p on p.id = g.user_id
    cross join w
    where p.show_on_leaderboard
  )
  select row_number() over (order by x desc, display_name), display_name, x, user_id = auth.uid()
  from scores where x > 0
  order by x desc, display_name
  limit 50;
$$;
grant execute on function public.league(date) to anon, authenticated;

-- Let a signed-in user permanently delete their own account and data
create or replace function public.delete_me()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_me() from public, anon;
grant execute on function public.delete_me() to authenticated;
