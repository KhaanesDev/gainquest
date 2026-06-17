import type { TemplateExercise } from '@/types/database'

export interface WorkoutCategory {
  id: string
  name: string
  color: string
  muscles: string[]
  exercises: TemplateExercise[]
}

export const WORKOUT_CATEGORIES: WorkoutCategory[] = [
  {
    id: 'leg-day',
    name: 'Leg Day',
    color: '#ea580c',
    muscles: ['quads', 'hamstrings', 'glutes', 'calves'],
    exercises: [
      { name: 'Barbell Squat',     sets: 4, defaultReps: 8 },
      { name: 'Leg Press',         sets: 3, defaultReps: 12 },
      { name: 'Romanian Deadlift', sets: 3, defaultReps: 10 },
      { name: 'Walking Lunge',     sets: 3, defaultReps: 12 },
      { name: 'Leg Curl',          sets: 3, defaultReps: 12 },
      { name: 'Calf Raise',        sets: 4, defaultReps: 15 },
    ],
  },
  {
    id: 'push-day',
    name: 'Push Day',
    color: '#2563eb',
    muscles: ['chest', 'shoulders', 'triceps'],
    exercises: [
      { name: 'Bench Press',               sets: 4, defaultReps: 8 },
      { name: 'Overhead Press',            sets: 3, defaultReps: 10 },
      { name: 'Incline Dumbbell Press',    sets: 3, defaultReps: 10 },
      { name: 'Lateral Raise',             sets: 3, defaultReps: 15 },
      { name: 'Tricep Pushdown',           sets: 3, defaultReps: 12 },
      { name: 'Overhead Tricep Extension', sets: 3, defaultReps: 12 },
    ],
  },
  {
    id: 'pull-day',
    name: 'Pull Day',
    color: '#059669',
    muscles: ['lats', 'traps', 'biceps', 'forearms'],
    exercises: [
      { name: 'Deadlift',     sets: 4, defaultReps: 5 },
      { name: 'Pull-ups',     sets: 4, defaultReps: 8 },
      { name: 'Barbell Row',  sets: 4, defaultReps: 8 },
      { name: 'Lat Pulldown', sets: 3, defaultReps: 12 },
      { name: 'Face Pull',    sets: 3, defaultReps: 15 },
      { name: 'Barbell Curl', sets: 3, defaultReps: 12 },
    ],
  },
  {
    id: 'chest-triceps',
    name: 'Chest & Triceps',
    color: '#dc2626',
    muscles: ['chest', 'triceps'],
    exercises: [
      { name: 'Bench Press',     sets: 4, defaultReps: 8 },
      { name: 'Incline Press',   sets: 3, defaultReps: 10 },
      { name: 'Cable Fly',       sets: 3, defaultReps: 15 },
      { name: 'Chest Dip',       sets: 3, defaultReps: 10 },
      { name: 'Skull Crusher',   sets: 3, defaultReps: 12 },
      { name: 'Tricep Pushdown', sets: 3, defaultReps: 15 },
    ],
  },
  {
    id: 'back-biceps',
    name: 'Back & Biceps',
    color: '#0891b2',
    muscles: ['lats', 'traps', 'lower-back', 'biceps'],
    exercises: [
      { name: 'Barbell Row',      sets: 4, defaultReps: 8 },
      { name: 'Lat Pulldown',     sets: 3, defaultReps: 12 },
      { name: 'Seated Cable Row', sets: 3, defaultReps: 12 },
      { name: 'Face Pull',        sets: 3, defaultReps: 15 },
      { name: 'Barbell Curl',     sets: 3, defaultReps: 12 },
      { name: 'Hammer Curl',      sets: 3, defaultReps: 12 },
    ],
  },
  {
    id: 'shoulders',
    name: 'Shoulders',
    color: '#7c3aed',
    muscles: ['shoulders', 'traps'],
    exercises: [
      { name: 'Overhead Press', sets: 4, defaultReps: 8 },
      { name: 'Lateral Raise',  sets: 4, defaultReps: 15 },
      { name: 'Front Raise',    sets: 3, defaultReps: 12 },
      { name: 'Rear Delt Fly',  sets: 3, defaultReps: 15 },
      { name: 'Shrug',          sets: 3, defaultReps: 15 },
      { name: 'Arnold Press',   sets: 3, defaultReps: 10 },
    ],
  },
  {
    id: 'arms',
    name: 'Arms',
    color: '#db2777',
    muscles: ['biceps', 'triceps', 'forearms'],
    exercises: [
      { name: 'Barbell Curl',              sets: 4, defaultReps: 12 },
      { name: 'Skull Crusher',             sets: 4, defaultReps: 12 },
      { name: 'Hammer Curl',               sets: 3, defaultReps: 12 },
      { name: 'Tricep Dip',                sets: 3, defaultReps: 10 },
      { name: 'Preacher Curl',             sets: 3, defaultReps: 12 },
      { name: 'Overhead Tricep Extension', sets: 3, defaultReps: 12 },
    ],
  },
  {
    id: 'core',
    name: 'Core',
    color: '#ca8a04',
    muscles: ['abs', 'lower-back'],
    exercises: [
      { name: 'Plank',             sets: 3, defaultReps: 0, type: 'timer', defaultDuration: 60 },
      { name: 'Hanging Leg Raise', sets: 3, defaultReps: 12 },
      { name: 'Russian Twist',     sets: 3, defaultReps: 20 },
      { name: 'Ab Wheel Rollout',  sets: 3, defaultReps: 10 },
      { name: 'Dead Bug',          sets: 3, defaultReps: 10 },
      { name: 'Cable Crunch',      sets: 3, defaultReps: 15 },
    ],
  },
  {
    id: 'full-body',
    name: 'Full Body',
    color: '#10b981',
    muscles: ['chest', 'lats', 'shoulders', 'quads', 'hamstrings', 'glutes', 'abs'],
    exercises: [
      { name: 'Barbell Squat',  sets: 4, defaultReps: 5 },
      { name: 'Deadlift',       sets: 3, defaultReps: 5 },
      { name: 'Bench Press',    sets: 3, defaultReps: 8 },
      { name: 'Barbell Row',    sets: 3, defaultReps: 8 },
      { name: 'Overhead Press', sets: 3, defaultReps: 8 },
      { name: 'Pull-ups',       sets: 3, defaultReps: 8 },
    ],
  },
]
