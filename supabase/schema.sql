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
  -- display_name comes from email sign-up; full_name / name come from Google sign-in
  n := left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
                     nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
                     nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
                     nullif(split_part(new.email, '@', 1), ''), 'player'), 24);
  if char_length(n) < 2 then n := n || '_1'; end if;
  if not public.name_is_ok(n) then n := 'player_' || left(replace(new.id::text, '-', ''), 6); end if;
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

-- Problem reports and site feedback. Anyone can send; nobody can read through the API.
-- You read them in the Supabase dashboard: Table Editor > feedback.
create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  kind text not null check (kind in ('wrong_answer', 'unclear', 'typo', 'bug', 'idea', 'other')),
  problem_key text check (char_length(problem_key) <= 64),
  message text not null check (char_length(message) between 3 and 2000),
  contact text check (char_length(contact) <= 254),
  page text check (char_length(page) <= 200)
);
alter table public.feedback enable row level security;
drop policy if exists "anyone can send feedback" on public.feedback;
create policy "anyone can send feedback" on public.feedback for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

-- Weekly-puzzle email list. Anyone can subscribe; nobody can read the list through the API.
-- Export it from Table Editor > subscribers (filter out rows with unsubscribed_at set).
create table if not exists public.subscribers (
  email text primary key check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz not null default now(),
  source text check (char_length(source) <= 40),
  unsubscribed_at timestamptz
);
alter table public.subscribers enable row level security;
drop policy if exists "anyone can subscribe" on public.subscribers;
create policy "anyone can subscribe" on public.subscribers for insert to anon, authenticated
  with check (unsubscribed_at is null);

-- Let a signed-in user permanently delete their own account and data
create or replace function public.delete_me()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_me() from public, anon;
grant execute on function public.delete_me() to authenticated;

-- Explicit table permissions for the website's API roles (row level security above still
-- limits each user to their own rows; newer Supabase projects don't grant these by default)
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.progress to authenticated;
grant insert on public.feedback to anon, authenticated;
grant insert on public.subscribers to anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Abuse protection. Everything below is safe to run again.
-- ---------------------------------------------------------------------------------------------

-- Display names appear on the public leaderboard: no control characters, markup, slurs or
-- obvious profanity (also caught through spacing and 1337-speak), and no posing as staff.
create or replace function public.name_is_ok(n text)
returns boolean language plpgsql immutable set search_path = public as $$
declare
  low text := translate(lower(coalesce(n, '')), '013457@$!|', 'oieastasii');
  flat text := regexp_replace(low, '[^a-z]', '', 'g');
  words text[] := regexp_split_to_array(trim(regexp_replace(low, '[^a-z]+', ' ', 'g')), ' ');
  -- blocked anywhere in the name, even with spaces or symbols between the letters
  bad_any text[] := array['nigger', 'nigga', 'faggot', 'fagot', 'retard', 'tranny', 'fuck', 'cunt', 'bitch',
    'whore', 'asshole', 'dildo', 'jizz', 'wetback', 'beaner', 'hitler', 'pussy', 'wanker', 'twat', 'kkk',
    'bullshit', 'motherf', 'blowjob', 'handjob', 'cumshot'];
  -- blocked as whole words only (they sit inside ordinary words and names: grape, therapist, Yoshitaka)
  bad_word text[] := array['fag', 'fags', 'spic', 'kike', 'chink', 'gook', 'coon', 'paki', 'dyke', 'rape',
    'raped', 'rapist', 'nazi', 'nazis', 'heil', 'dick', 'cock', 'cum', 'porn', 'penis', 'shit', 'shitty', 'slut',
    'sex', 'sexy', 'ass', 'tits', 'boobs', 'anal', 'semen', 'incel', 'admin', 'administrator', 'moderator', 'staff'];
  w text;
begin
  if n is null or n ~ '[[:cntrl:]<>]' then return false; end if;
  foreach w in array bad_any loop
    if position(w in flat) > 0 then return false; end if;
  end loop;
  return not (words && bad_word);
end $$;

create or replace function public.check_profile_name()
returns trigger language plpgsql set search_path = public as $$
begin
  new.display_name := trim(regexp_replace(new.display_name, '\s+', ' ', 'g'));
  if not public.name_is_ok(new.display_name) then
    raise exception 'That display name isn''t allowed. Pick another one.' using errcode = '22023';
  end if;
  return new;
end $$;
drop trigger if exists check_profile_name on public.profiles;
create trigger check_profile_name before insert or update of display_name on public.profiles
  for each row execute function public.check_profile_name();

-- Scores: each player writes their own progress row, so the server caps what a save can claim.
-- At most 6,000 XP a day (a long, intense day of practice earns about half that), streaks grow by
-- at most one a day, and weekly league XP can only grow by XP actually credited. Saves that claim
-- more are trimmed to the limit rather than refused, so syncing never breaks.
alter table public.progress add column if not exists gain_day date;
alter table public.progress add column if not exists gain_today int not null default 0;

create or replace function public.guard_progress()
returns trigger language plpgsql set search_path = public as $$
declare
  day_cap constant int := 6000;
  today date := (now() at time zone 'utc')::date;
  this_week date := date_trunc('week', now() at time zone 'utc')::date;
  used int;
  gain int := 0;
begin
  if pg_column_size(new.data) > 1000000 then
    raise exception 'Progress is too large to sync.' using errcode = '22023';
  end if;
  new.xp := greatest(new.xp, 0);
  new.week_xp := greatest(new.week_xp, 0);
  new.prev_week_xp := greatest(new.prev_week_xp, 0);
  new.streak := greatest(new.streak, 0);

  if tg_op = 'INSERT' then
    -- first sync of practice done before signing in
    new.xp := least(new.xp, 20000);
    new.streak := least(new.streak, 400);
    new.week_xp := least(new.week_xp, new.xp, day_cap * 7);
    new.prev_week_xp := least(new.prev_week_xp, new.xp, day_cap * 7);
    new.gain_day := today;
    new.gain_today := 0;
  else
    used := case when old.gain_day = today then old.gain_today else 0 end;
    if new.xp > old.xp then
      gain := least(new.xp - old.xp, greatest(day_cap - used, 0));
      new.xp := old.xp + gain;
    end if;
    new.gain_day := today;
    new.gain_today := used + gain;
    new.streak := least(new.streak, old.streak + greatest(today - (old.updated_at at time zone 'utc')::date, 0) + 1);

    if new.week_start is not distinct from old.week_start then
      new.week_xp := least(new.week_xp, old.week_xp + gain);
      new.prev_week_start := old.prev_week_start;
      new.prev_week_xp := old.prev_week_xp;
    elsif old.week_start is null or new.week_start > old.week_start then
      -- a new week started since the last save
      new.week_xp := least(new.week_xp, gain);
      if new.prev_week_start is not distinct from old.week_start then
        new.prev_week_xp := least(new.prev_week_xp, coalesce(old.week_xp, 0) + gain);
      elsif new.prev_week_start is not distinct from old.prev_week_start then
        new.prev_week_xp := least(new.prev_week_xp, old.prev_week_xp);
      else
        new.prev_week_xp := least(new.prev_week_xp, gain);
      end if;
    else
      -- an out-of-date device reporting an older week: keep what the server has
      new.week_start := old.week_start;
      new.week_xp := old.week_xp;
      new.prev_week_start := old.prev_week_start;
      new.prev_week_xp := old.prev_week_xp;
    end if;
  end if;

  if new.week_start > this_week then new.week_start := null; new.week_xp := 0; end if;
  if new.prev_week_start >= this_week then new.prev_week_start := null; new.prev_week_xp := 0; end if;
  new.solved_count := least(greatest(new.solved_count, 0), new.xp / 2);
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists guard_progress on public.progress;
create trigger guard_progress before insert or update on public.progress
  for each row execute function public.guard_progress();

-- Forms anyone can send (feedback, weekly-recap signup): a per-sender and an overall hourly limit.
-- Senders are told apart by a one-way hash of their IP address and the date; the hashes are kept
-- for a day and can't be read through the API.
create table if not exists public.rate_hits (
  kind text not null,
  who text not null,
  at timestamptz not null default now()
);
create index if not exists rate_hits_kind_at on public.rate_hits (kind, at);
alter table public.rate_hits enable row level security;
revoke all on public.rate_hits from anon, authenticated;

create or replace function public.rate_limit(p_kind text, p_per_sender int, p_overall int)
returns void language plpgsql security definer set search_path = public as $$
declare
  h json := nullif(current_setting('request.headers', true), '')::json;
  v_who text := md5(coalesce(h ->> 'cf-connecting-ip', split_part(h ->> 'x-forwarded-for', ',', 1), 'unknown')
                    || ':' || p_kind || ':' || current_date::text);
begin
  delete from public.rate_hits where at < now() - interval '1 day';
  if (select count(*) from public.rate_hits where kind = p_kind and who = v_who and at > now() - interval '1 hour') >= p_per_sender
     or (select count(*) from public.rate_hits where kind = p_kind and at > now() - interval '1 hour') >= p_overall then
    raise exception 'Too many submissions right now. Try again in an hour.' using errcode = '22023';
  end if;
  insert into public.rate_hits (kind, who) values (p_kind, v_who);
end $$;
revoke all on function public.rate_limit(text, int, int) from public, anon, authenticated;

create or replace function public.limit_feedback()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.rate_limit('feedback', 10, 300);
  return new;
end $$;
drop trigger if exists limit_feedback on public.feedback;
create trigger limit_feedback before insert on public.feedback
  for each row execute function public.limit_feedback();

-- Recap signups: rate limited, and signing up an address that's already on the list quietly does
-- nothing, so the form can't be used to check whether someone is subscribed. Once confirmation
-- emails exist, send recaps only to rows with confirmed_at set; until then anyone could type in
-- someone else's address.
alter table public.subscribers add column if not exists confirmed_at timestamptz;

create or replace function public.limit_subscribe()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.rate_limit('subscribe', 5, 200);
  new.email := lower(trim(new.email));
  new.confirmed_at := null;
  if exists (select 1 from public.subscribers where email = new.email) then return null; end if;
  return new;
end $$;
drop trigger if exists limit_subscribe on public.subscribers;
create trigger limit_subscribe before insert on public.subscribers
  for each row execute function public.limit_subscribe();
