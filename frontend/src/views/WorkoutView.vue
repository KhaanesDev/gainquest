<template>
  <div class="layout" :class="{ 'workout-active': workout.isActive }">
    <nav class="navbar">
      <RouterLink to="/dashboard" class="nav-brand">
        <img src="/wordmark.png" alt="GainQuest" class="brand-logo" />
      </RouterLink>
      <div class="nav-links">
        <RouterLink to="/dashboard">Dashboard</RouterLink>
        <RouterLink to="/workout">Start Workout</RouterLink>
        <RouterLink to="/explore">Explore</RouterLink>
        <RouterLink to="/stats">Progress</RouterLink>
        <RouterLink to="/profile">Profile</RouterLink>
      </div>
    </nav>

    <!-- ── Category Picker ────────────────────────────────────────── -->
    <main v-if="!workout.isActive" class="main">
      <div class="page-header">
        <h2 class="page-title">Start Workout</h2>
        <p class="page-sub">What are you training today?</p>
      </div>

      <div class="category-grid">
        <button
          v-for="cat in WORKOUT_CATEGORIES"
          :key="cat.id"
          class="category-card"
          :style="{ '--cat-color': cat.color }"
          @click="startFromCategory(cat)"
        >
          <div class="card-top">
            <div class="card-info">
              <p class="cat-name">{{ cat.name }}</p>
              <p class="cat-meta">{{ cat.exercises.length }} exercises · ~{{ estTime(cat.exercises) }} min</p>
            </div>
            <MuscleDisplay :highlighted="cat.muscles" />
          </div>
          <p class="cat-exercises">
            {{ cat.exercises.slice(0, 3).map(e => e.name).join(' · ') }}
            <span v-if="cat.exercises.length > 3"> · +{{ cat.exercises.length - 3 }} more</span>
          </p>
          <p class="cat-muscles">
            {{ cat.muscles.map(m => m.replace('-', ' ')).join('  ·  ') }}
          </p>
        </button>

        <button class="category-card custom-card" @click="startCustom">
          <div class="card-top">
            <div class="card-info">
              <p class="cat-name">Custom</p>
              <p class="cat-meta">Your choice</p>
            </div>
          </div>
          <p class="cat-exercises">Start empty and add exercises as you go</p>
        </button>
      </div>
    </main>

    <!-- ── Active Workout ──────────────────────────────────────────── -->
    <main v-else class="main workout-main">
      <div class="workout-header">
        <div class="header-left">
          <input v-model="workout.workoutName" class="workout-name-input" />
          <p class="timer">{{ elapsed }}</p>
          <div class="pill xp">⚡ {{ workout.xpPreview }} XP</div>
        </div>
        <MuscleDisplay :heatmap="muscleHeatmap" size="sm" />
      </div>

      <div class="quick-actions">
        <button class="qa-btn" @click="workout.bulkSetTemplate(3, 10)">3×10</button>
        <button class="qa-btn" @click="workout.bulkSetTemplate(4, 8)">4×8</button>
        <button class="qa-btn" @click="workout.bulkSetTemplate(5, 5)">5×5</button>
        <button class="qa-btn" @click="workout.bulkSetTemplate(3, 12)">3×12</button>
        <div class="qa-divider" />
        <button class="qa-btn" @click="workout.bulkAdjustSets(1)">+1 set</button>
        <button class="qa-btn" @click="workout.bulkAdjustSets(-1)">−1 set</button>
      </div>

      <div class="exercises">
        <ExerciseCard
          v-for="ex in workout.exercises"
          :key="ex.id"
          :exercise="ex"
          @remove="workout.removeExercise(ex.id)"
          @complete-workout="handleComplete"
        />
        <div v-if="workout.exercises.length === 0" class="empty-hint">
          Tap "+ Add Exercise" to build your workout.
        </div>
      </div>

      <p v-if="saveError" class="save-error">{{ saveError }}</p>

      <div class="workout-footer">
        <button class="btn btn-secondary" @click="showAddExercise = true">+ Add Exercise</button>
        <button
          class="btn btn-complete"
          :disabled="workout.completedSetCount === 0 || workout.saving"
          @click="handleComplete"
        >
          {{ workout.saving ? 'Saving…' : 'Complete Workout' }}
        </button>
        <button
          class="btn btn-save-template"
          :disabled="workout.exercises.length === 0 || savingTemplate"
          @click="saveAsTemplate"
        >{{ templateSaved ? '✓ Saved' : savingTemplate ? 'Saving…' : 'Save as template' }}</button>
        <button class="btn btn-discard" @click="confirmDiscard">Discard</button>
      </div>
    </main>

    <AddExerciseModal
      v-if="showAddExercise"
      @add="workout.addExercise($event)"
      @close="showAddExercise = false"
    />

    <ConfirmModal
      v-if="showTemplateConflict"
      title="Workout in progress"
      message="You already have a workout in progress. Discard it and start this template instead?"
      confirm-label="Discard & start"
      cancel-label="Keep current"
      danger
      @confirm="confirmReplaceWorkout"
      @cancel="cancelReplaceWorkout"
    />

    <ConfirmModal
      v-if="showDiscard"
      title="Discard workout"
      message="Discard this workout? Your progress will be lost."
      confirm-label="Discard"
      cancel-label="Keep going"
      danger
      @confirm="doDiscard"
      @cancel="showDiscard = false"
    />

    <PromptModal
      v-if="showSaveTemplate"
      title="Save as template"
      message="Give your template a name so you can reuse it later."
      placeholder="e.g. Push Day"
      :default-value="workout.workoutName || 'My Template'"
      confirm-label="Save template"
      @confirm="doSaveTemplate"
      @cancel="showSaveTemplate = false"
    />

    <RewardModal v-if="reward" :reward="reward" @close="handleRewardClose" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import ExerciseCard from '@/components/ExerciseCard.vue'
import MuscleDisplay from '@/components/MuscleDisplay.vue'
import AddExerciseModal from '@/components/AddExerciseModal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import PromptModal from '@/components/PromptModal.vue'
import RewardModal from '@/components/RewardModal.vue'
import { useWorkoutStore, type WorkoutReward } from '@/stores/workout'
import { useTimer } from '@/composables/useTimer'
import { WORKOUT_CATEGORIES, type WorkoutCategory } from '@/data/workoutCategories'
import { getMusclesForExercise } from '@/data/exerciseMuscleMap'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { TemplateExercise } from '@/types/database'

const workout = useWorkoutStore()
const auth = useAuthStore()
const { startedAt } = storeToRefs(workout)
const router = useRouter()
const route = useRoute()
const { elapsed } = useTimer(startedAt)

const showAddExercise = ref(false)
const showTemplateConflict = ref(false)
const pendingTemplateId = ref<string | null>(null)
const savingTemplate = ref(false)
const templateSaved = ref(false)
const showSaveTemplate = ref(false)
const showDiscard = ref(false)

function saveAsTemplate() {
  if (!auth.user || workout.exercises.length === 0) return
  showSaveTemplate.value = true
}

async function doSaveTemplate(name: string) {
  showSaveTemplate.value = false
  if (!auth.user) return
  savingTemplate.value = true
  saveError.value = ''
  try {
    const exercises_data: TemplateExercise[] = workout.exercises
      .filter(e => e.name.trim())
      .map(e => {
        const working = e.sets.find(s => s.type === 'working')
        return {
          name: e.name.trim(),
          sets: e.sets.length,
          warmupSets: e.sets.filter(s => s.type === 'warmup').length,
          defaultReps: working?.reps ?? 10,
          type: e.type,
          defaultDuration: working?.durationSeconds ?? 60,
        }
      })
    const { error } = await supabase.from('workout_templates').insert({
      user_id: auth.user.id,
      name: name.trim(),
      exercises_data,
      is_public: false,
    })
    if (error) throw error
    templateSaved.value = true
    setTimeout(() => { templateSaved.value = false }, 2500)
  } catch (e: unknown) {
    saveError.value = e instanceof Error ? e.message : 'Could not save template'
  } finally {
    savingTemplate.value = false
  }
}

async function loadTemplate(id: string) {
  try {
    await workout.loadFromTemplateId(id)
  } catch {
    // Fall through to normal category picker
  }
  // Clear ?template= so a refresh doesn't reload or re-prompt.
  router.replace({ path: '/workout' })
}

function confirmReplaceWorkout() {
  showTemplateConflict.value = false
  const id = pendingTemplateId.value
  pendingTemplateId.value = null
  if (!id) return
  workout.discard()
  loadTemplate(id)
}

function cancelReplaceWorkout() {
  showTemplateConflict.value = false
  pendingTemplateId.value = null
  // Keep the current workout; drop the query so it doesn't linger.
  router.replace({ path: '/workout' })
}

onMounted(async () => {
  const templateId = route.query.template as string | undefined
  if (!templateId) return

  // A workout is already in progress — ask before replacing it.
  if (workout.isActive) {
    pendingTemplateId.value = templateId
    showTemplateConflict.value = true
    return
  }

  await loadTemplate(templateId)
})

const muscleHeatmap = computed(() => {
  const counts: Record<string, number> = {}
  for (const ex of workout.exercises) {
    for (const m of getMusclesForExercise(ex.name)) {
      counts[m] = (counts[m] ?? 0) + 1
    }
  }
  return counts
})

const reward = ref<WorkoutReward | null>(null)
const saveError = ref('')

function estTime(exercises: TemplateExercise[]) {
  const totalSets = exercises.reduce((sum, e) => sum + e.sets, 0)
  return Math.round(totalSets * 2.5 / 5) * 5 || 20
}

function startFromCategory(cat: WorkoutCategory) {
  workout.loadFromTemplate(cat.name, cat.exercises)
}

function startCustom() {
  workout.start('Custom Workout')
}

async function handleComplete() {
  saveError.value = ''
  try {
    reward.value = await workout.complete()
  } catch (e: unknown) {
    console.error('Complete workout error:', e)
    const msg =
      e instanceof Error ? e.message
      : (e && typeof e === 'object' && 'message' in e) ? String((e as { message: unknown }).message)
      : 'Failed to save'
    saveError.value = msg
  }
}

function handleRewardClose() {
  reward.value = null
  router.push('/dashboard')
}

function confirmDiscard() {
  showDiscard.value = true
}

function doDiscard() {
  showDiscard.value = false
  workout.discard()
}
</script>

<style scoped>
.layout { min-height: 100vh; display: flex; flex-direction: column; }

/* Active workout: lock the viewport so only the exercise list scrolls */
.layout.workout-active { height: 100vh; height: 100dvh; overflow: hidden; }

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

.nav-brand { display: flex; align-items: center; margin-right: auto; }
.brand-logo { height: 22px; width: auto; display: block; }
.nav-links { display: flex; gap: 20px; font-size: 14px; }
.nav-links a { color: var(--color-text-muted); }
.nav-links a.router-link-active { color: var(--color-text); }

/* ── Category Picker ─── */
.main {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  padding-bottom: 40px;
}

.page-header { margin-bottom: 24px; }
.page-title { font-size: 22px; font-weight: 800; }
.page-sub { color: var(--color-text-muted); font-size: 14px; margin-top: 4px; }

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.category-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--cat-color, var(--color-border));
  border-radius: var(--radius-lg);
  padding: 16px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: inherit;
  min-height: 140px;
}

.category-card:hover {
  background: var(--color-surface-2);
  border-color: var(--cat-color, var(--color-primary));
  border-left-color: var(--cat-color, var(--color-primary));
  transform: translateY(-1px);
}

.custom-card {
  --cat-color: var(--color-border);
  border-style: dashed;
  border-left-style: dashed;
}

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.card-info { flex: 1; min-width: 0; }

.cat-name {
  font-size: 16px;
  font-weight: 800;
  color: var(--cat-color, var(--color-text));
  line-height: 1.2;
}

.cat-meta {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 3px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.cat-exercises {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
  flex: 1;
}

.cat-muscles {
  font-size: 9px;
  color: var(--color-text-muted);
  opacity: 0.45;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-top: auto;
}

/* ── Active Workout ─── */
.workout-main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 20px 24px 0;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  overflow: hidden;
}

.workout-header {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
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

.workout-name-input:focus { border-bottom: 1px solid var(--color-border); }

.timer {
  font-size: 13px;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
  margin-top: 4px;
}

.header-left { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }

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


.quick-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  overflow-x: auto;
  padding: 0 0 10px;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  margin-bottom: 4px;
}
.quick-actions::-webkit-scrollbar { display: none; }

.qa-btn {
  flex-shrink: 0;
  padding: 6px 13px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  font-family: inherit;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.qa-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.qa-btn:active { background: rgba(124,58,237,0.1); }

.qa-divider {
  flex-shrink: 0;
  width: 1px;
  height: 20px;
  background: var(--color-border);
  margin: 0 2px;
}

.exercises {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 12px;
}

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
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 0;
  background: var(--color-bg);
  border-top: 1px solid var(--color-border);
}

.workout-footer .btn-secondary     { flex: 1; min-width: 120px; }
.workout-footer .btn-complete      { flex: 2; min-width: 160px; }
.workout-footer .btn-save-template { flex: 1; min-width: 120px; }
.workout-footer .btn-discard       { flex: 1; min-width: 100px; }

.btn-save-template {
  background: var(--color-surface-2);
  border: 1px solid rgba(124, 58, 237, 0.4);
  color: var(--color-primary);
  font-size: 13px;
}
.btn-save-template:hover:not(:disabled) { background: rgba(124, 58, 237, 0.12); }
.btn-save-template:disabled { opacity: 0.45; cursor: not-allowed; }

@media (max-width: 640px) {
  .main:not(.workout-main) { padding: 16px 16px var(--tab-space); }
  .category-grid { grid-template-columns: 1fr; }
  .workout-main { padding: 14px 16px 0; }
  /* Reserve room for the global bottom tab bar so the footer sits above it */
  .layout.workout-active { padding-bottom: calc(56px + env(safe-area-inset-bottom)); }
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
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 12px;
  flex: 0 0 auto;
}
.btn-discard:hover { border-color: #f87171; color: #f87171; }
</style>
