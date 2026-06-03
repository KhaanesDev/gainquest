-- Add exercises_data column to workout_templates
alter table public.workout_templates
add column if not exists exercises_data jsonb not null default '[]'::jsonb;

-- Seed all public program templates
insert into public.workout_templates (name, description, is_public, program_type, exercises_data) values

-- ── PPL ────────────────────────────────────────────────────────────────────
('Push Day', 'Chest, shoulders & triceps', true, 'PPL', '[
  {"name":"Bench Press","sets":4,"defaultReps":8},
  {"name":"Overhead Press","sets":3,"defaultReps":8},
  {"name":"Incline Dumbbell Press","sets":3,"defaultReps":10},
  {"name":"Lateral Raises","sets":3,"defaultReps":15},
  {"name":"Tricep Pushdowns","sets":3,"defaultReps":12}
]'),

('Pull Day', 'Back & biceps', true, 'PPL', '[
  {"name":"Deadlift","sets":3,"defaultReps":5},
  {"name":"Barbell Row","sets":4,"defaultReps":8},
  {"name":"Pull-ups","sets":3,"defaultReps":8},
  {"name":"Face Pulls","sets":3,"defaultReps":15},
  {"name":"Bicep Curls","sets":3,"defaultReps":12}
]'),

('Leg Day', 'Quads, hamstrings & glutes', true, 'PPL', '[
  {"name":"Squat","sets":4,"defaultReps":8},
  {"name":"Romanian Deadlift","sets":3,"defaultReps":10},
  {"name":"Leg Press","sets":3,"defaultReps":12},
  {"name":"Leg Curl","sets":3,"defaultReps":12},
  {"name":"Calf Raises","sets":4,"defaultReps":15}
]'),

-- ── Bro Split ──────────────────────────────────────────────────────────────
('Chest Day', 'Chest & triceps', true, 'Bro Split', '[
  {"name":"Bench Press","sets":4,"defaultReps":8},
  {"name":"Incline Bench Press","sets":3,"defaultReps":10},
  {"name":"Dumbbell Flyes","sets":3,"defaultReps":12},
  {"name":"Cable Crossovers","sets":3,"defaultReps":15},
  {"name":"Tricep Dips","sets":3,"defaultReps":12}
]'),

('Back Day', 'Back & biceps', true, 'Bro Split', '[
  {"name":"Deadlift","sets":3,"defaultReps":5},
  {"name":"Pull-ups","sets":4,"defaultReps":8},
  {"name":"Barbell Row","sets":4,"defaultReps":8},
  {"name":"Lat Pulldown","sets":3,"defaultReps":12},
  {"name":"Face Pulls","sets":3,"defaultReps":15}
]'),

('Shoulder Day', 'Shoulders & traps', true, 'Bro Split', '[
  {"name":"Overhead Press","sets":4,"defaultReps":8},
  {"name":"Lateral Raises","sets":4,"defaultReps":15},
  {"name":"Front Raises","sets":3,"defaultReps":12},
  {"name":"Rear Delt Flyes","sets":3,"defaultReps":15},
  {"name":"Shrugs","sets":3,"defaultReps":15}
]'),

('Arms Day', 'Biceps & triceps', true, 'Bro Split', '[
  {"name":"Barbell Curl","sets":4,"defaultReps":10},
  {"name":"Hammer Curl","sets":3,"defaultReps":12},
  {"name":"Preacher Curl","sets":3,"defaultReps":12},
  {"name":"Tricep Pushdowns","sets":4,"defaultReps":12},
  {"name":"Skull Crushers","sets":3,"defaultReps":10},
  {"name":"Overhead Tricep Extension","sets":3,"defaultReps":12}
]'),

('Leg Day', 'Quads, hamstrings & glutes', true, 'Bro Split', '[
  {"name":"Squat","sets":4,"defaultReps":8},
  {"name":"Romanian Deadlift","sets":3,"defaultReps":10},
  {"name":"Leg Press","sets":3,"defaultReps":12},
  {"name":"Leg Curl","sets":3,"defaultReps":12},
  {"name":"Calf Raises","sets":4,"defaultReps":15}
]'),

-- ── Upper / Lower ──────────────────────────────────────────────────────────
('Upper Day', 'Full upper body', true, 'Upper / Lower', '[
  {"name":"Bench Press","sets":4,"defaultReps":8},
  {"name":"Barbell Row","sets":4,"defaultReps":8},
  {"name":"Overhead Press","sets":3,"defaultReps":10},
  {"name":"Pull-ups","sets":3,"defaultReps":8},
  {"name":"Bicep Curls","sets":3,"defaultReps":12},
  {"name":"Tricep Pushdowns","sets":3,"defaultReps":12}
]'),

('Lower Day', 'Full lower body', true, 'Upper / Lower', '[
  {"name":"Squat","sets":4,"defaultReps":8},
  {"name":"Romanian Deadlift","sets":3,"defaultReps":10},
  {"name":"Leg Press","sets":3,"defaultReps":12},
  {"name":"Leg Curl","sets":3,"defaultReps":10},
  {"name":"Calf Raises","sets":4,"defaultReps":15}
]'),

-- ── Full Body ──────────────────────────────────────────────────────────────
('Full Body A', 'Squat, push, pull — Day A', true, 'Full Body', '[
  {"name":"Squat","sets":3,"defaultReps":5},
  {"name":"Bench Press","sets":3,"defaultReps":5},
  {"name":"Barbell Row","sets":3,"defaultReps":5}
]'),

('Full Body B', 'Squat, push, pull — Day B', true, 'Full Body', '[
  {"name":"Squat","sets":3,"defaultReps":5},
  {"name":"Overhead Press","sets":3,"defaultReps":5},
  {"name":"Deadlift","sets":1,"defaultReps":5}
]'),

-- ── 5×5 Strength ──────────────────────────────────────────────────────────
('5×5 Workout A', 'StrongLifts Day A', true, '5×5 Strength', '[
  {"name":"Squat","sets":5,"defaultReps":5},
  {"name":"Bench Press","sets":5,"defaultReps":5},
  {"name":"Barbell Row","sets":5,"defaultReps":5}
]'),

('5×5 Workout B', 'StrongLifts Day B', true, '5×5 Strength', '[
  {"name":"Squat","sets":5,"defaultReps":5},
  {"name":"Overhead Press","sets":5,"defaultReps":5},
  {"name":"Deadlift","sets":1,"defaultReps":5}
]'),

-- ── Quick ──────────────────────────────────────────────────────────────────
('Quick Push', 'Fast push session (~20 min)', true, 'Quick', '[
  {"name":"Bench Press","sets":3,"defaultReps":8},
  {"name":"Overhead Press","sets":3,"defaultReps":8},
  {"name":"Tricep Dips","sets":3,"defaultReps":12}
]'),

('Quick Pull', 'Fast pull session (~20 min)', true, 'Quick', '[
  {"name":"Pull-ups","sets":3,"defaultReps":8},
  {"name":"Barbell Row","sets":3,"defaultReps":8},
  {"name":"Bicep Curls","sets":3,"defaultReps":12}
]'),

('Quick Legs', 'Fast leg session (~20 min)', true, 'Quick', '[
  {"name":"Squat","sets":3,"defaultReps":8},
  {"name":"Deadlift","sets":2,"defaultReps":5},
  {"name":"Lunges","sets":3,"defaultReps":10}
]');
