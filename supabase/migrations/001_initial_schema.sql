-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  level integer not null default 1,
  xp integer not null default 0,
  total_gaming_minutes integer not null default 0,
  available_gaming_minutes integer not null default 0,
  streak_days integer not null default 0,
  last_workout_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Workout templates
create table public.workout_templates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  is_public boolean not null default false,
  program_type text, -- 'PPL', 'Full Body', '5x5', 'custom'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Workout sessions
create table public.workout_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  template_id uuid references public.workout_templates(id),
  name text not null,
  started_at timestamptz not null,
  completed_at timestamptz,
  xp_earned integer not null default 0,
  gaming_minutes_earned integer not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

-- Exercises within a session
create table public.exercises (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  name text not null,
  sets integer not null,
  reps integer,
  weight_kg numeric(6,2),
  duration_seconds integer,
  order_index integer not null default 0
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger set_templates_updated_at before update on public.workout_templates
  for each row execute procedure public.set_updated_at();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_templates enable row level security;
alter table public.exercises enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can view own sessions" on public.workout_sessions
  for select using (auth.uid() = user_id);

create policy "Users can insert own sessions" on public.workout_sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own sessions" on public.workout_sessions
  for update using (auth.uid() = user_id);

create policy "Users can view public templates" on public.workout_templates
  for select using (is_public = true or auth.uid() = user_id);

create policy "Users can manage own templates" on public.workout_templates
  for all using (auth.uid() = user_id);

create policy "Users can view own exercises" on public.exercises
  for select using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = exercises.session_id and s.user_id = auth.uid()
    )
  );

create policy "Users can manage own exercises" on public.exercises
  for all using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = exercises.session_id and s.user_id = auth.uid()
    )
  );
