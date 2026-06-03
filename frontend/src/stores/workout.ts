import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export interface WorkoutSet {
  id: string
  reps: number | null
  weightKg: number | null
  completed: boolean
}

export interface WorkoutExercise {
  id: string
  name: string
  sets: WorkoutSet[]
}

export interface WorkoutReward {
  xp: number
  gamingMinutes: number
  leveledUp: boolean
  newLevel: number
  oldLevel: number
}

let _id = 0
function uid() { return `tmp-${++_id}` }

function calcXP(exercises: WorkoutExercise[]): number {
  let xp = 0
  let totalCompleted = 0
  for (const ex of exercises) {
    for (const set of ex.sets) {
      if (set.completed && (set.reps ?? 0) > 0) {
        // 10 base + 1 per rep + 1 per 10kg lifted
        xp += 10 + (set.reps ?? 0) + Math.floor((set.weightKg ?? 0) / 10)
        totalCompleted++
      }
    }
  }
  if (totalCompleted > 0) xp += 100 // session completion bonus
  return xp
}

function xpToLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 50)) + 1
}

export const useWorkoutStore = defineStore('workout', () => {
  const auth = useAuthStore()

  const isActive = ref(false)
  const workoutName = ref('My Workout')
  const startedAt = ref<Date | null>(null)
  const exercises = ref<WorkoutExercise[]>([])
  const saving = ref(false)

  const xpPreview = computed(() => calcXP(exercises.value))
  const gamingPreview = computed(() => Math.max(30, Math.floor(xpPreview.value / 5)))
  const completedSetCount = computed(() =>
    exercises.value.flatMap(e => e.sets).filter(s => s.completed).length
  )

  function start(name = 'My Workout') {
    workoutName.value = name
    startedAt.value = new Date()
    exercises.value = []
    isActive.value = true
  }

  function addExercise(name = '') {
    exercises.value.push({
      id: uid(),
      name,
      sets: [{ id: uid(), reps: null, weightKg: null, completed: false }],
    })
  }

  function removeExercise(id: string) {
    exercises.value = exercises.value.filter(e => e.id !== id)
  }

  function addSet(exerciseId: string) {
    const ex = exercises.value.find(e => e.id === exerciseId)
    if (!ex) return
    const prev = ex.sets[ex.sets.length - 1]
    ex.sets.push({
      id: uid(),
      reps: prev?.reps ?? null,
      weightKg: prev?.weightKg ?? null,
      completed: false,
    })
  }

  function removeSet(exerciseId: string, setId: string) {
    const ex = exercises.value.find(e => e.id === exerciseId)
    if (!ex || ex.sets.length <= 1) return
    ex.sets = ex.sets.filter(s => s.id !== setId)
  }

  function toggleSet(exerciseId: string, setId: string) {
    const ex = exercises.value.find(e => e.id === exerciseId)
    const set = ex?.sets.find(s => s.id === setId)
    if (set) set.completed = !set.completed
  }

  async function complete(): Promise<WorkoutReward> {
    if (!auth.user) throw new Error('Not authenticated')
    saving.value = true

    try {
      const xp = xpPreview.value
      const minutes = gamingPreview.value

      const { data: session, error: sessionErr } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: auth.user.id,
          name: workoutName.value,
          started_at: startedAt.value!.toISOString(),
          completed_at: new Date().toISOString(),
          xp_earned: xp,
          gaming_minutes_earned: minutes,
        })
        .select()
        .single()

      if (sessionErr) throw sessionErr

      const exerciseRows = exercises.value
        .filter(ex => ex.name.trim() && ex.sets.some(s => s.completed))
        .map((ex, i) => {
          const done = ex.sets.filter(s => s.completed)
          const last = done[done.length - 1]
          return {
            session_id: session.id,
            name: ex.name.trim(),
            sets: done.length,
            reps: last?.reps ?? null,
            weight_kg: last?.weightKg ?? null,
            order_index: i,
          }
        })

      if (exerciseRows.length > 0) {
        const { error: exErr } = await supabase.from('exercises').insert(exerciseRows)
        if (exErr) throw exErr
      }

      const { data: profile, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', auth.user.id)
        .single()

      if (profErr) throw profErr

      const newXP = profile.xp + xp
      const oldLevel = profile.level
      const newLevel = xpToLevel(newXP)
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      const last = profile.last_workout_date

      const newStreak =
        last === yesterday ? profile.streak_days + 1
        : last === today   ? profile.streak_days
        : 1

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          xp: newXP,
          level: newLevel,
          available_gaming_minutes: profile.available_gaming_minutes + minutes,
          total_gaming_minutes: profile.total_gaming_minutes + minutes,
          streak_days: newStreak,
          last_workout_date: today,
        })
        .eq('id', auth.user.id)

      if (updateErr) throw updateErr

      isActive.value = false
      exercises.value = []
      startedAt.value = null

      return { xp, gamingMinutes: minutes, leveledUp: newLevel > oldLevel, newLevel, oldLevel }
    } finally {
      saving.value = false
    }
  }

  function discard() {
    isActive.value = false
    exercises.value = []
    startedAt.value = null
  }

  return {
    isActive, workoutName, startedAt, exercises, saving,
    xpPreview, gamingPreview, completedSetCount,
    start, addExercise, removeExercise, addSet, removeSet, toggleSet, complete, discard,
  }
})
