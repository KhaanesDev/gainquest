<template>
  <div class="layout">
    <nav class="navbar">
      <RouterLink to="/dashboard" class="nav-brand">GainQuest</RouterLink>
      <div class="nav-links">
        <RouterLink to="/dashboard">Dashboard</RouterLink>
        <RouterLink to="/workout">Log Workout</RouterLink>
        <RouterLink to="/explore">Explore</RouterLink>
        <RouterLink to="/profile">Profile</RouterLink>
      </div>
    </nav>

    <!-- ── Template Picker ─────────────────────────────────────────── -->
    <main v-if="!workout.isActive" class="main">
      <h2 class="page-title">Log Workout</h2>

      <div v-if="loading" class="loading">Loading templates…</div>

      <template v-else>
        <div v-for="group in templateGroups" :key="group.type" class="group">
          <div class="group-header">
            <span class="group-badge" :style="{ background: groupColor(group.type) }">
              {{ group.type }}
            </span>
          </div>
          <div class="template-grid">
            <button
              v-for="t in group.templates"
              :key="t.id"
              class="template-card"
              @click="startFromTemplate(t)"
            >
              <p class="t-name">{{ t.name }}</p>
              <p class="t-exercises">
                {{ t.exercises_data.slice(0, 3).map(e => e.name).join(' · ') }}
                <span v-if="t.exercises_data.length > 3"> · +{{ t.exercises_data.length - 3 }} more</span>
              </p>
              <div class="t-meta">
                <span>{{ t.exercises_data.length }} exercises</span>
                <span>~{{ estTime(t.exercises_data) }} min</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Custom workout -->
        <div class="group">
          <div class="group-header">
            <span class="group-badge custom">Custom</span>
          </div>
          <div class="template-grid">
            <button class="template-card custom-card" @click="startCustom">
              <p class="t-name">Start Empty</p>
              <p class="t-exercises">Build your own workout from scratch</p>
              <div class="t-meta"><span>You decide</span></div>
            </button>
          </div>
        </div>
      </template>
    </main>

    <!-- ── Active Workout ──────────────────────────────────────────── -->
    <main v-else class="main workout-main">
      <div class="workout-header">
        <div>
          <input v-model="workout.workoutName" class="workout-name-input" />
          <p class="timer">{{ elapsed }}</p>
        </div>
        <div class="header-pills">
          <div class="pill xp">⚡ {{ workout.xpPreview }} XP</div>
          <div class="pill gaming">🎮 {{ workout.gamingPreview }}m</div>
        </div>
      </div>

      <div class="exercises">
        <ExerciseCard
          v-for="ex in workout.exercises"
          :key="ex.id"
          :exercise="ex"
          @remove="workout.removeExercise(ex.id)"
          @add-set="workout.addSet(ex.id)"
          @remove-set="sid => workout.removeSet(ex.id, sid)"
          @toggle-set="sid => workout.toggleSet(ex.id, sid)"
        />
        <div v-if="workout.exercises.length === 0" class="empty-hint">
          Tap "+ Add Exercise" to build your workout.
        </div>
      </div>

      <p v-if="saveError" class="save-error">{{ saveError }}</p>

      <div class="workout-footer">
        <button class="btn btn-secondary" @click="workout.addExercise('')">+ Add Exercise</button>
        <button
          class="btn btn-complete"
          :disabled="workout.completedSetCount === 0 || workout.saving"
          @click="handleComplete"
        >
          {{ workout.saving ? 'Saving…' : 'Complete Workout' }}
        </button>
      </div>

      <button class="btn-discard" @click="confirmDiscard">Discard workout</button>
    </main>

    <RewardModal v-if="reward" :reward="reward" @close="handleRewardClose" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ExerciseCard from '@/components/ExerciseCard.vue'
import RewardModal from '@/components/RewardModal.vue'
import { useWorkoutStore, type WorkoutReward } from '@/stores/workout'
import { useTimer } from '@/composables/useTimer'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Template = Database['public']['Tables']['workout_templates']['Row']

const workout = useWorkoutStore()
const router = useRouter()
const { elapsed } = useTimer(workout.startedAt as any)

const templates = ref<Template[]>([])
const loading = ref(true)
const reward = ref<WorkoutReward | null>(null)
const saveError = ref('')

const PROGRAM_ORDER = ['PPL', 'Bro Split', 'Upper / Lower', 'Full Body', '5×5 Strength', 'Quick']

const templateGroups = computed(() => {
  const map = new Map<string, Template[]>()
  for (const t of templates.value) {
    const key = t.program_type ?? 'Other'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(t)
  }
  return PROGRAM_ORDER
    .filter(p => map.has(p))
    .map(p => ({ type: p, templates: map.get(p)! }))
})

const GROUP_COLORS: Record<string, string> = {
  'PPL':           '#7c3aed',
  'Bro Split':     '#2563eb',
  'Upper / Lower': '#ea580c',
  'Full Body':     '#059669',
  '5×5 Strength':  '#dc2626',
  'Quick':         '#ca8a04',
}

function groupColor(type: string) {
  return GROUP_COLORS[type] ?? '#475569'
}

function estTime(exercises: Template['exercises_data']) {
  const totalSets = exercises.reduce((sum, e) => sum + e.sets, 0)
  return Math.round(totalSets * 2.5 / 5) * 5 || 20
}

onMounted(async () => {
  const { data } = await supabase
    .from('workout_templates')
    .select('*')
    .eq('is_public', true)
    .order('program_type')
  templates.value = data ?? []
  loading.value = false
})

function startFromTemplate(t: Template) {
  workout.loadFromTemplate(t.name, t.exercises_data)
}

function startCustom() {
  workout.start('Custom Workout')
}

async function handleComplete() {
  saveError.value = ''
  try {
    reward.value = await workout.complete()
  } catch (e: unknown) {
    saveError.value = e instanceof Error ? e.message : 'Failed to save'
  }
}

function handleRewardClose() {
  reward.value = null
  router.push('/dashboard')
}

function confirmDiscard() {
  if (confirm('Discard this workout? Progress will be lost.')) {
    workout.discard()
  }
}
</script>

<style scoped>
.layout { min-height: 100vh; display: flex; flex-direction: column; }

.navbar {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 12px 24px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.nav-brand { font-weight: 800; font-size: 18px; color: var(--color-primary); margin-right: auto; }
.nav-links { display: flex; gap: 20px; font-size: 14px; }
.nav-links a { color: var(--color-text-muted); }
.nav-links a.router-link-active { color: var(--color-text); }

/* ── Template Picker ─── */
.main {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  padding-bottom: 40px;
}

.page-title { font-size: 22px; font-weight: 800; margin-bottom: 24px; }

.loading { color: var(--color-text-muted); text-align: center; padding: 60px 0; }

.group { margin-bottom: 28px; }

.group-header { margin-bottom: 10px; }

.group-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: white;
}

.group-badge.custom {
  background: var(--color-border);
  color: var(--color-text-muted);
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}

.template-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family: inherit;
}

.template-card:hover {
  border-color: var(--color-primary);
  background: var(--color-surface-2);
  transform: translateY(-1px);
}

.custom-card:hover {
  border-color: var(--color-border);
  border-style: dashed;
}

.t-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text);
}

.t-exercises {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.t-meta {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ── Active Workout ─── */
.workout-main {
  padding-bottom: 100px;
}

.workout-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.workout-name-input {
  background: none;
  border: none;
  color: var(--color-text);
  font-size: 20px;
  font-weight: 800;
  font-family: inherit;
  outline: none;
  padding: 0;
  max-width: 280px;
  width: 100%;
}

.workout-name-input:focus {
  border-bottom: 1px solid var(--color-border);
}

.timer {
  font-size: 13px;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
  margin-top: 4px;
}

.header-pills { display: flex; gap: 8px; flex-shrink: 0; }

.pill {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  border: 1px solid;
}

.pill.xp {
  background: rgba(245,158,11,0.1);
  border-color: rgba(245,158,11,0.3);
  color: var(--color-xp);
}

.pill.gaming {
  background: rgba(16,185,129,0.1);
  border-color: rgba(16,185,129,0.3);
  color: var(--color-accent);
}

.exercises { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }

.empty-hint {
  text-align: center;
  padding: 40px 20px;
  color: var(--color-text-muted);
  font-size: 14px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
}

.save-error {
  color: #f87171;
  font-size: 13px;
  text-align: center;
  margin-bottom: 8px;
}

.workout-footer {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  display: flex;
  gap: 10px;
  padding: 14px 20px;
  background: var(--color-bg);
  border-top: 1px solid var(--color-border);
  z-index: 10;
}

.btn-complete {
  flex: 1;
  background: var(--color-accent);
  color: white;
  padding: 12px;
  font-size: 15px;
  font-weight: 700;
  border-radius: var(--radius);
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
  font-family: inherit;
}

.btn-complete:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-complete:not(:disabled):hover { opacity: 0.9; }

.btn-discard {
  display: block;
  margin: 10px auto 0;
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  text-decoration: underline;
}

.btn-discard:hover { color: #f87171; }
</style>
