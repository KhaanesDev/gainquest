<template>
  <div class="layout">
    <nav class="navbar">
      <RouterLink to="/dashboard" class="nav-brand">GainQuest</RouterLink>
      <div class="nav-links">
        <RouterLink to="/dashboard">Dashboard</RouterLink>
        <RouterLink to="/workout">Log Workout</RouterLink>
        <RouterLink to="/profile">Profile</RouterLink>
      </div>
    </nav>

    <!-- Start screen -->
    <main v-if="!workout.isActive" class="main center">
      <div class="start-card card">
        <h2 class="start-title">Start a Workout</h2>
        <p class="start-sub">Log your session and earn gaming time.</p>
        <div class="field">
          <label>Workout Name</label>
          <input v-model="pendingName" class="input" placeholder="e.g. Push Day, Leg Day…" @keyup.enter="beginWorkout" />
        </div>
        <button class="btn btn-primary start-btn" @click="beginWorkout">
          Start Workout
        </button>
      </div>
    </main>

    <!-- Active workout -->
    <main v-else class="main">
      <div class="workout-header">
        <div>
          <input v-model="workout.workoutName" class="workout-name-input" />
          <p class="timer">{{ elapsed }}</p>
        </div>
        <div class="header-preview">
          <div class="preview-pill xp">⚡ {{ workout.xpPreview }} XP</div>
          <div class="preview-pill gaming">🎮 {{ workout.gamingPreview }}m</div>
        </div>
      </div>

      <div class="exercises">
        <ExerciseCard
          v-for="ex in workout.exercises"
          :key="ex.id"
          :exercise="ex"
          @remove="workout.removeExercise(ex.id)"
          @add-set="workout.addSet(ex.id)"
          @remove-set="(sid) => workout.removeSet(ex.id, sid)"
          @toggle-set="(sid) => workout.toggleSet(ex.id, sid)"
        />

        <div v-if="workout.exercises.length === 0" class="empty-hint">
          Add your first exercise below to get started.
        </div>
      </div>

      <div class="workout-footer">
        <button class="btn btn-secondary" @click="addExercise">+ Add Exercise</button>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ExerciseCard from '@/components/ExerciseCard.vue'
import RewardModal from '@/components/RewardModal.vue'
import { useWorkoutStore, type WorkoutReward } from '@/stores/workout'
import { useTimer } from '@/composables/useTimer'

const workout = useWorkoutStore()
const router = useRouter()
const { elapsed } = useTimer(workout.startedAt as any)

const pendingName = ref('My Workout')
const reward = ref<WorkoutReward | null>(null)
const error = ref('')

function beginWorkout() {
  workout.start(pendingName.value || 'My Workout')
}

function addExercise() {
  workout.addExercise('')
}

async function handleComplete() {
  error.value = ''
  try {
    reward.value = await workout.complete()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to save workout'
    console.error(e)
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

.main {
  flex: 1;
  padding: 24px;
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
  padding-bottom: 100px;
}

.main.center {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 24px;
}

/* Start screen */
.start-card {
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.start-title { font-size: 22px; font-weight: 800; }
.start-sub { color: var(--color-text-muted); font-size: 14px; margin-top: -8px; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 12px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

.start-btn { width: 100%; padding: 13px; font-size: 15px; }

/* Active workout */
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
  font-size: 22px;
  font-weight: 800;
  font-family: inherit;
  outline: none;
  padding: 0;
  width: 100%;
  max-width: 300px;
}

.workout-name-input:hover,
.workout-name-input:focus {
  border-bottom: 1px solid var(--color-border);
}

.timer {
  font-size: 14px;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
  margin-top: 4px;
}

.header-preview {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.preview-pill {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  border: 1px solid;
}

.preview-pill.xp {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
  color: var(--color-xp);
}

.preview-pill.gaming {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
  color: var(--color-accent);
}

.exercises {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.empty-hint {
  text-align: center;
  padding: 40px 20px;
  color: var(--color-text-muted);
  font-size: 14px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
}

.workout-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
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
}

.btn-complete:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-complete:not(:disabled):hover {
  opacity: 0.9;
}

.btn-discard {
  display: block;
  margin: 8px auto 0;
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
