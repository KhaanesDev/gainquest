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
  chest:        { label: 'Chest',       bodyPart: 'pectorals' },
  shoulders:    { label: 'Shoulders',   bodyPart: 'delts' },
  biceps:       { label: 'Biceps',      bodyPart: 'biceps' },
  triceps:      { label: 'Triceps',     bodyPart: 'triceps' },
  forearms:     { label: 'Forearms',    bodyPart: 'forearms' },
  abs:          { label: 'Abs',         bodyPart: 'abs' },
  traps:        { label: 'Trapezius',   bodyPart: 'traps' },
  lats:         { label: 'Lats',        bodyPart: 'lats' },
  'lower-back': { label: 'Lower Back',  bodyPart: 'spine' },
  quads:        { label: 'Quads',       bodyPart: 'quads' },
  glutes:       { label: 'Glutes',      bodyPart: 'glutes' },
  hamstrings:   { label: 'Hamstrings',  bodyPart: 'hamstrings' },
  calves:       { label: 'Calves',      bodyPart: 'calves' },
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

export function capitalize(str: string) {
  return str.replace(/\b\w/g, c => c.toUpperCase())
}
