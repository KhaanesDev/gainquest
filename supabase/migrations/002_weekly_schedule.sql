-- Add exercises_data to workout_templates (referenced in types but missing from schema)
alter table public.workout_templates
  add column if not exists exercises_data jsonb not null default '[]'::jsonb;

-- Add weekly_schedule to profiles: { "monday": "<template_id>", ... }
alter table public.profiles
  add column if not exists weekly_schedule jsonb not null default '{}'::jsonb;
