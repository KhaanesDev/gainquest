import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'
import { getLastWeight, saveWorkoutWeights } from '@/composables/useLastWeights'
import { getMusclesForExercise } from '@/data/exerciseMuscleMap'
import type { TemplateExercise } from '@/types/database'

export interface WorkoutSet {
  id: string
  type: 'warmup' | 'working'
  reps: number | null
  weightKg: number | null
  durationSeconds: number | null
  restAfterSeconds: number | null
  completed: boolean
}

export interface WorkoutExercise {
  id: string
  name: string
  type: 'reps' | 'timer'
  sets: WorkoutSet[]
}

export interface WorkoutReward {
  xp: number
  leveledUp: boolean
  newLevel: number
  oldLevel: number
  musclesTrained: string[]
}

let _id = 0
function uid() { return `tmp-${++_id}` }

function calcSetXP(set: WorkoutSet, exType: 'reps' | 'timer'): number {
  if (!set.completed) return 0
  let raw = 0
  if (exType === 'timer') {
    raw = 5 + Math.floor((set.durationSeconds ?? 0) / 4)
  } else if ((set.reps ?? 0) > 0) {
    raw = 10 + (set.reps ?? 0) + Math.floor((set.weightKg ?? 0) / 10)
  }
  if (raw === 0) return 0
  return set.type === 'warmup' ? Math.max(1, Math.round(raw * 0.25)) : raw
}

function calcXP(exercises: WorkoutExercise[]): number {
  let xp = 0
  let totalCompleted = 0
  for (const ex of exercises) {
    for (const set of ex.sets) {
      const setXp = calcSetXP(set, ex.type)
      if (setXp > 0) { xp += setXp; totalCompleted++ }
    }
  }
  if (totalCompleted > 0) xp += 100
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

  // XP earned by the last completed workout, consumed by the dashboard to
  // animate the XP bar filling. Survives the navigation to /dashboard.
  const pendingXpGain = ref(0)
  const completedSetCount = computed(() =>
    exercises.value.flatMap(e => e.sets).filter(s => s.completed).length
  )

  function makeSet(type: 'warmup' | 'working', reps: number | null, weightKg: number | null, durationSeconds: number): WorkoutSet {
    return { id: uid(), type, reps, weightKg, durationSeconds, restAfterSeconds: null, completed: false }
  }

  function start(name = 'My Workout') {
    workoutName.value = name
    startedAt.value = null
    exercises.value = []
    isActive.value = true
  }

  function markStarted() {
    if (!startedAt.value) startedAt.value = new Date()
  }

  function loadFromTemplate(name: string, templateExercises: TemplateExercise[]) {
    workoutName.value = name
    startedAt.value = null
    exercises.value = templateExercises.map(ex => {
      const warmup = ex.warmupSets ?? 0
      return {
        id: uid(),
        name: ex.name,
        type: (ex.type ?? 'reps') as 'reps' | 'timer',
        sets: Array.from({ length: ex.sets }, (_, i) => makeSet(
          i < warmup ? 'warmup' : 'working',
          ex.type === 'timer' ? null : ex.defaultReps,
          ex.type === 'timer' ? null : getLastWeight(ex.name),
          ex.defaultDuration ?? 60,
        )),
      }
    })
    isActive.value = true
  }

  function addExercise(name = '') {
    exercises.value.push({
      id: uid(),
      name,
      type: 'reps',
      sets: [makeSet('working', null, null, 60)],
    })
  }

  function removeExercise(id: string) {
    exercises.value = exercises.value.filter(e => e.id !== id)
  }

  function addSet(exerciseId: string, type: 'warmup' | 'working' = 'working') {
    const ex = exercises.value.find(e => e.id === exerciseId)
    if (!ex) return
    const prev = ex.sets[ex.sets.length - 1]
    const newSet = makeSet(type, prev?.reps ?? null, prev?.weightKg ?? null, prev?.durationSeconds ?? 60)
    if (type === 'warmup') {
      // Warmups belong at the top, after any existing warmups
      const firstWorking = ex.sets.findIndex(s => s.type === 'working')
      if (firstWorking === -1) ex.sets.push(newSet)
      else ex.sets.splice(firstWorking, 0, newSet)
    } else {
      ex.sets.push(newSet)
    }
  }

  function removeSet(exerciseId: string, setId: string) {
    const ex = exercises.value.find(e => e.id === exerciseId)
    if (!ex || ex.sets.length <= 1) return
    ex.sets = ex.sets.filter(s => s.id !== setId)
  }

  function toggleSet(exerciseId: string, setId: string) {
    const ex = exercises.value.find(e => e.id === exerciseId)
    const set = ex?.sets.find(s => s.id === setId)
    if (!set) return
    set.completed = !set.completed
    if (set.completed) markStarted()
  }

  function bulkAdjustSets(delta: number) {
    for (const ex of exercises.value) {
      if (delta > 0) {
        const prev = ex.sets[ex.sets.length - 1]
        for (let i = 0; i < delta; i++) {
          ex.sets.push(makeSet('working', prev?.reps ?? null, prev?.weightKg ?? null, prev?.durationSeconds ?? 60))
        }
      } else {
        const toRemove = Math.min(-delta, ex.sets.filter(s => !s.completed).length - 1)
        for (let i = 0; i < toRemove; i++) {
          let idx = -1
          for (let j = ex.sets.length - 1; j >= 0; j--) {
            if (!ex.sets[j].completed) { idx = j; break }
          }
          if (idx >= 0) ex.sets.splice(idx, 1)
        }
      }
    }
  }

  function bulkAdjustWeight(delta: number) {
    for (const ex of exercises.value) {
      for (const s of ex.sets) {
        if (!s.completed) {
          const next = Math.round(((s.weightKg ?? 0) + delta) * 10) / 10
          s.weightKg = next <= 0 ? null : next
        }
      }
    }
  }

  function bulkSetTemplate(sets: number, reps: number) {
    for (const ex of exercises.value) {
      for (const s of ex.sets) {
        if (s.type === 'working' && !s.completed) s.reps = reps
      }
      const completedWorking = ex.sets.filter(s => s.type === 'working' && s.completed).length
      const targetUncompleted = Math.max(0, sets - completedWorking)
      const currentUncompleted = ex.sets.filter(s => s.type === 'working' && !s.completed).length

      if (currentUncompleted < targetUncompleted) {
        const prev = ex.sets[ex.sets.length - 1]
        for (let i = currentUncompleted; i < targetUncompleted; i++) {
          ex.sets.push(makeSet('working', reps, prev?.weightKg ?? null, prev?.durationSeconds ?? 60))
        }
      } else if (currentUncompleted > targetUncompleted) {
        let toRemove = currentUncompleted - targetUncompleted
        for (let i = ex.sets.length - 1; i >= 0 && toRemove > 0; i--) {
          if (ex.sets[i].type === 'working' && !ex.sets[i].completed) {
            ex.sets.splice(i, 1)
            toRemove--
          }
        }
      }
    }
  }

  async function complete(): Promise<WorkoutReward> {
    if (!auth.user) throw new Error('Not authenticated')
    saving.value = true

    try {
      const xp = xpPreview.value

      const { data: session, error: sessionErr } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: auth.user.id,
          name: workoutName.value,
          started_at: (startedAt.value ?? new Date()).toISOString(),
          completed_at: new Date().toISOString(),
          xp_earned: xp,
        })
        .select()
        .single()

      if (sessionErr) {
        console.error('workout_sessions insert failed:', sessionErr)
        throw sessionErr
      }

      const exerciseRows = exercises.value
        .filter(ex => ex.name.trim() && ex.sets.some(s => s.completed))
        .map((ex, i) => {
          const done = ex.sets.filter(s => s.completed)
          const last = done[done.length - 1]
          return {
            session_id: session.id,
            name: ex.name.trim(),
            sets: done.length,
            reps: ex.type === 'timer' ? null : (last?.reps ?? null),
            weight_kg: ex.type === 'timer' ? null : (last?.weightKg ?? null),
            duration_seconds: ex.type === 'timer' ? (last?.durationSeconds ?? null) : null,
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
          streak_days: newStreak,
          last_workout_date: today,
        })
        .eq('id', auth.user.id)

      if (updateErr) throw updateErr

      const musclesTrained = [...new Set(
        exercises.value
          .filter(ex => ex.name.trim() && ex.sets.some(s => s.completed))
          .flatMap(ex => getMusclesForExercise(ex.name))
      )]

      saveWorkoutWeights(exercises.value)

      isActive.value = false
      exercises.value = []
      startedAt.value = null
      pendingXpGain.value = xp

      return { xp, leveledUp: newLevel > oldLevel, newLevel, oldLevel, musclesTrained }
    } finally {
      saving.value = false
    }
  }

  async function loadFromTemplateId(templateId: string) {
    const { data, error } = await supabase
      .from('workout_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (error || !data) throw new Error('Template not found')
    loadFromTemplate(data.name, (data.exercises_data ?? []) as TemplateExercise[])
  }

  function discard() {
    isActive.value = false
    exercises.value = []
    startedAt.value = null
  }

  // Read & clear the last workout's XP gain (one-shot, for the dashboard anim).
  function consumePendingXpGain() {
    const g = pendingXpGain.value
    pendingXpGain.value = 0
    return g
  }

  return {
    isActive, workoutName, startedAt, exercises, saving,
    xpPreview, completedSetCount,
    start, markStarted, loadFromTemplate, loadFromTemplateId, addExercise, removeExercise, addSet, removeSet, toggleSet, bulkAdjustSets, bulkAdjustWeight, bulkSetTemplate, complete, discard, consumePendingXpGain,
  }
})
