export interface Exercise {
  id: string
  name: string
  bodyPart: string
  target: string
  equipment: string
  gifUrl?: string
  secondaryMuscles: string[]
  instructions: string[]
  description?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | string
  category?: string
}

export interface MuscleInfo {
  label: string
  bodyPart: string
}

export const MUSCLES: Record<string, MuscleInfo> = {
  chest:        { label: 'Chest',       bodyPart: 'chest' },
  shoulders:    { label: 'Shoulders',   bodyPart: 'shoulders' },
  biceps:       { label: 'Biceps',      bodyPart: 'upper arms' },
  triceps:      { label: 'Triceps',     bodyPart: 'upper arms' },
  forearms:     { label: 'Forearms',    bodyPart: 'lower arms' },
  abs:          { label: 'Abs',         bodyPart: 'waist' },
  traps:        { label: 'Trapezius',   bodyPart: 'back' },
  lats:         { label: 'Lats',        bodyPart: 'back' },
  'lower-back': { label: 'Lower Back',  bodyPart: 'back' },
  quads:        { label: 'Quads',       bodyPart: 'upper legs' },
  glutes:       { label: 'Glutes',      bodyPart: 'upper legs' },
  hamstrings:   { label: 'Hamstrings',  bodyPart: 'upper legs' },
  calves:       { label: 'Calves',      bodyPart: 'lower legs' },
}

// Maps ExerciseDB muscle names (target + secondaryMuscles) to the muscle IDs
// used by the body figure. Unknown names (e.g. "cardiovascular system") are
// ignored.
const TARGET_TO_MUSCLE: Record<string, string> = {
  pectorals: 'chest',
  'serratus anterior': 'abs',
  abs: 'abs',
  spine: 'lower-back',
  'lower back': 'lower-back',
  lats: 'lats',
  'upper back': 'lats',
  rhomboids: 'traps',
  traps: 'traps',
  'levator scapulae': 'traps',
  delts: 'shoulders',
  deltoids: 'shoulders',
  'rotator cuff': 'shoulders',
  biceps: 'biceps',
  triceps: 'triceps',
  forearms: 'forearms',
  quads: 'quads',
  quadriceps: 'quads',
  hamstrings: 'hamstrings',
  glutes: 'glutes',
  abductors: 'glutes',
  adductors: 'quads',
  calves: 'calves',
}

// Resolve which body-figure muscle IDs an exercise works (primary + secondary).
export function musclesForExercise(ex: Pick<Exercise, 'target' | 'secondaryMuscles'>): string[] {
  const ids = new Set<string>()
  const primary = TARGET_TO_MUSCLE[ex.target?.toLowerCase()?.trim()]
  if (primary) ids.add(primary)
  for (const m of ex.secondaryMuscles ?? []) {
    const id = TARGET_TO_MUSCLE[m.toLowerCase().trim()]
    if (id) ids.add(id)
  }
  return [...ids]
}

const cache = new Map<string, Exercise[]>()

async function fetchByBodyPart(bodyPart: string, limit = 15): Promise<Exercise[]> {
  const key = `${bodyPart}:${limit}`
  if (cache.has(key)) return cache.get(key)!

  const res = await fetch(
    `/api/exercises/bodyPart/${encodeURIComponent(bodyPart)}?limit=${limit}`
  )

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error('[ExerciseDB] HTTP', res.status, text)
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 120)}`)
  }
  const data: Exercise[] = await res.json()
  cache.set(key, data)
  return data
}

export async function fetchForMuscles(muscleIds: string[]): Promise<Exercise[]> {
  const bodyParts = [...new Set(
    muscleIds.map(id => MUSCLES[id]?.bodyPart).filter(Boolean)
  )]
  const results = await Promise.all(bodyParts.map(bp => fetchByBodyPart(bp)))
  const all = results.flat()
  return [...new Map(all.map(e => [e.id, e])).values()]
}

// Typeahead search by exercise name (used by the Add Exercise picker).
export async function searchExercises(name: string): Promise<Exercise[]> {
  const q = name.trim().toLowerCase()
  if (q.length < 2) return []
  const key = `search:${q}`
  if (cache.has(key)) return cache.get(key)!

  const res = await fetch(`/api/exercises/name/${encodeURIComponent(q)}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data: Exercise[] = await res.json()
  cache.set(key, data)
  return data
}

export function capitalize(str: string) {
  return str.replace(/\b\w/g, c => c.toUpperCase())
}
