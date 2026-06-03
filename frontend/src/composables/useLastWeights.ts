import type { WorkoutExercise } from '@/stores/workout'

const KEY = 'gq_weights'

function load(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  catch { return {} }
}

export function getLastWeight(name: string): number | null {
  return load()[name] ?? null
}

export function saveWorkoutWeights(exercises: WorkoutExercise[]) {
  const weights = load()
  for (const ex of exercises) {
    const last = [...ex.sets].reverse().find(s => s.completed && s.weightKg != null)
    if (last?.weightKg) weights[ex.name] = last.weightKg
  }
  localStorage.setItem(KEY, JSON.stringify(weights))
}
