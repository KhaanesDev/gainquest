import { gymAccess } from './useSettings'

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

const DIFFICULTY_ORDER: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 }

// Specific ExerciseDB target(s) per muscle id — used to pull focused exercises
// the broad bodyPart lists miss (e.g. "spine" for lower back).
const MUSCLE_TARGETS: Record<string, string[]> = {
  chest: ['pectorals'],
  shoulders: ['delts'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearms: ['forearms'],
  abs: ['abs', 'serratus anterior'],
  traps: ['traps', 'levator scapulae'],
  lats: ['lats', 'upper back'],
  'lower-back': ['spine'],
  quads: ['quads'],
  glutes: ['glutes'],
  hamstrings: ['hamstrings'],
  calves: ['calves'],
}

async function fetchByTarget(target: string, limit = 20): Promise<Exercise[]> {
  const key = `target:${target}:${limit}`
  if (cache.has(key)) return cache.get(key)!

  const res = await fetch(`/api/exercises/target/${encodeURIComponent(target)}?limit=${limit}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data: Exercise[] = await res.json()
  cache.set(key, data)
  return data
}

// Equipment that doesn't require a gym (bodyweight + minimal home gear).
const NO_GYM_EQUIPMENT = new Set([
  'body weight', 'band', 'resistance band',
  'stability ball', 'medicine ball', 'bosu ball', 'wheel roller', 'rope',
])
const isNoGym = (ex: Exercise) => NO_GYM_EQUIPMENT.has((ex.equipment ?? '').toLowerCase())
// When the user has no gym access, keep only no-gym exercises.
const applyGym = (list: Exercise[]) => gymAccess.value ? list : list.filter(isNoGym)

export async function fetchForMuscles(muscleIds: string[]): Promise<Exercise[]> {
  const selected = new Set(muscleIds)
  const targets = [...new Set(muscleIds.flatMap(id => MUSCLE_TARGETS[id] ?? []))]
  const bodyParts = [...new Set(
    muscleIds.map(id => MUSCLES[id]?.bodyPart).filter(Boolean)
  )]

  // Target hits are the focused ones; bodyPart adds breadth. A failing target
  // shouldn't blank the page, so swallow those individually.
  const [targetResults, bodyResults] = await Promise.all([
    Promise.all(targets.map(t => fetchByTarget(t).catch(() => [] as Exercise[]))),
    Promise.all(bodyParts.map(bp => fetchByBodyPart(bp))),
  ])
  const all = [...new Map(
    [...targetResults.flat(), ...bodyResults.flat()].map(e => [e.id, e])
  ).values()]

  // Rank exercises that *primarily* target a selected muscle first, then ones
  // where it's only a secondary muscle, then everything else from the body
  // part — so the chosen muscle gets full focus up top.
  function focusRank(ex: Exercise): number {
    const primary = TARGET_TO_MUSCLE[ex.target?.toLowerCase()?.trim()]
    if (primary && selected.has(primary)) return 0
    const secondary = (ex.secondaryMuscles ?? []).some(
      m => selected.has(TARGET_TO_MUSCLE[m.toLowerCase().trim()])
    )
    return secondary ? 1 : 2
  }
  const diffRank = (d?: string) => DIFFICULTY_ORDER[d ?? ''] ?? 3

  // Within each focus tier, order easy → hard (beginner, intermediate, advanced).
  return applyGym(all).sort((a, b) =>
    focusRank(a) - focusRank(b) || diffRank(a.difficulty) - diffRank(b.difficulty)
  )
}

// Typeahead search by exercise name (used by the Add Exercise picker).
export async function searchExercises(name: string): Promise<Exercise[]> {
  const q = name.trim().toLowerCase()
  if (q.length < 2) return []
  const key = `search:${q}`
  if (cache.has(key)) return applyGym(cache.get(key)!)

  const res = await fetch(`/api/exercises/name/${encodeURIComponent(q)}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data: Exercise[] = await res.json()
  cache.set(key, data)
  return applyGym(data)
}

// Friendlier display names for a few jargon-y ExerciseDB muscle names.
const MUSCLE_LABELS: Record<string, string> = {
  spine: 'lower back',
}

export function prettyMuscle(name: string): string {
  if (!name) return name
  return MUSCLE_LABELS[name.toLowerCase().trim()] ?? name
}

export function capitalize(str: string) {
  return str.replace(/\b\w/g, c => c.toUpperCase())
}
