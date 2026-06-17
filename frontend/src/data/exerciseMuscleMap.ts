import { WORKOUT_CATEGORIES } from './workoutCategories'

const _map = new Map<string, string[]>()

for (const cat of WORKOUT_CATEGORIES) {
  for (const ex of cat.exercises) {
    const key = ex.name.toLowerCase()
    const existing = _map.get(key) ?? []
    const merged = Array.from(new Set([...existing, ...cat.muscles]))
    _map.set(key, merged)
  }
}

// Extra exercises not covered by the categories above
const EXTRA: Record<string, string[]> = {
  'squat':                    ['quads', 'glutes', 'hamstrings'],
  'deadlift':                 ['hamstrings', 'glutes', 'lower-back', 'traps'],
  'bench press':              ['chest', 'triceps', 'shoulders'],
  'pull-up':                  ['lats', 'biceps'],
  'pull up':                  ['lats', 'biceps'],
  'chin-up':                  ['lats', 'biceps'],
  'chin up':                  ['lats', 'biceps'],
  'dip':                      ['chest', 'triceps'],
  'push-up':                  ['chest', 'triceps', 'shoulders'],
  'push up':                  ['chest', 'triceps', 'shoulders'],
  'hip thrust':               ['glutes', 'hamstrings'],
  'glute bridge':             ['glutes'],
  'leg extension':            ['quads'],
  'rdl':                      ['hamstrings', 'glutes', 'lower-back'],
  'hack squat':               ['quads', 'glutes'],
  'sumo deadlift':            ['glutes', 'hamstrings', 'lower-back'],
  'incline bench press':      ['chest', 'shoulders', 'triceps'],
  'decline bench press':      ['chest', 'triceps'],
  'dumbbell curl':            ['biceps'],
  'cable curl':               ['biceps'],
  'cable row':                ['lats', 'biceps', 'traps'],
  't-bar row':                ['lats', 'traps', 'biceps'],
  'chest fly':                ['chest'],
  'pec deck':                 ['chest'],
  'rear delt fly':            ['shoulders', 'traps'],
  'face pull':                ['shoulders', 'traps'],
  'good morning':             ['hamstrings', 'lower-back', 'glutes'],
  'nordic curl':              ['hamstrings'],
  'sissy squat':              ['quads'],
  'standing calf raise':      ['calves'],
  'seated calf raise':        ['calves'],
  'ab crunch':                ['abs'],
  'sit-up':                   ['abs'],
  'sit up':                   ['abs'],
  'leg raise':                ['abs'],
  'back extension':           ['lower-back', 'glutes'],
  'hyperextension':           ['lower-back', 'glutes'],
  'close-grip bench press':   ['triceps', 'chest'],
  'zz curl':                  ['biceps'],
  'incline curl':             ['biceps'],
  'spider curl':              ['biceps'],
  'cable fly':                ['chest'],
  'crossover':                ['chest'],
  'serratus crunch':          ['abs'],
  'landmine press':           ['chest', 'shoulders'],
  'push press':               ['shoulders', 'triceps'],
  'upright row':              ['shoulders', 'traps'],
  'trap bar deadlift':        ['hamstrings', 'glutes', 'quads', 'lower-back'],
}

for (const [name, muscles] of Object.entries(EXTRA)) {
  if (!_map.has(name)) _map.set(name, muscles)
}

export function getMusclesForExercise(name: string): string[] {
  const key = name.toLowerCase().trim()
  if (_map.has(key)) return _map.get(key)!

  // Fuzzy: check if any known key is a substring of the name
  for (const [k, v] of _map) {
    if (key.includes(k) || k.includes(key)) return v
  }

  return []
}
