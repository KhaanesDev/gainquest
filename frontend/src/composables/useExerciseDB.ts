export interface Exercise {
  id: string
  name: string
  bodyPart: string
  target: string
  equipment: string
  gifUrl: string
  secondaryMuscles: string[]
  instructions: string[]
}

export interface MuscleInfo {
  label: string
  bodyPart: string
}

export const MUSCLES: Record<string, MuscleInfo> = {
  chest:         { label: 'Chest',        bodyPart: 'chest' },
  shoulders:     { label: 'Shoulders',    bodyPart: 'shoulders' },
  biceps:        { label: 'Biceps',       bodyPart: 'upper arms' },
  triceps:       { label: 'Triceps',      bodyPart: 'upper arms' },
  forearms:      { label: 'Forearms',     bodyPart: 'lower arms' },
  abs:           { label: 'Abs',          bodyPart: 'waist' },
  traps:         { label: 'Trapezius',    bodyPart: 'back' },
  lats:          { label: 'Lats',         bodyPart: 'back' },
  'lower-back':  { label: 'Lower Back',   bodyPart: 'back' },
  quads:         { label: 'Quads',        bodyPart: 'upper legs' },
  glutes:        { label: 'Glutes',       bodyPart: 'upper legs' },
  hamstrings:    { label: 'Hamstrings',   bodyPart: 'upper legs' },
  calves:        { label: 'Calves',       bodyPart: 'lower legs' },
}

// Maps our muscle IDs to ExerciseDB bodyPart slugs
export const MUSCLE_TO_BODY_PART: Record<string, string> = {
  chest:        'chest',
  shoulders:    'shoulders',
  biceps:       'upper arms',
  triceps:      'upper arms',
  forearms:     'lower arms',
  abs:          'waist',
  traps:        'back',
  lats:         'back',
  'lower-back': 'back',
  quads:        'upper legs',
  glutes:       'upper legs',
  hamstrings:   'upper legs',
  calves:       'lower legs',
}

const cache = new Map<string, Exercise[]>()

export async function fetchByBodyPart(bodyPart: string, limit = 15): Promise<Exercise[]> {
  const key = `${bodyPart}:${limit}`
  if (cache.has(key)) return cache.get(key)!

  const res = await fetch(
    `https://exercisedb.p.rapidapi.com/exercises/bodyPart/${encodeURIComponent(bodyPart)}?limit=${limit}&offset=0`,
    {
      headers: {
        'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
        'x-rapidapi-key': import.meta.env.VITE_EXERCISEDB_KEY as string,
      },
    }
  )

  if (!res.ok) throw new Error(`ExerciseDB error: ${res.status}`)
  const data: Exercise[] = await res.json()
  cache.set(key, data)
  return data
}

export async function fetchForMuscles(muscleIds: string[]): Promise<Exercise[]> {
  const bodyParts = [...new Set(muscleIds.map(id => MUSCLE_TO_BODY_PART[id]).filter(Boolean))]
  const results = await Promise.all(bodyParts.map(bp => fetchByBodyPart(bp)))
  const all = results.flat()
  // Deduplicate by id
  return [...new Map(all.map(e => [e.id, e])).values()]
}

export function capitalize(str: string) {
  return str.replace(/\b\w/g, c => c.toUpperCase())
}
