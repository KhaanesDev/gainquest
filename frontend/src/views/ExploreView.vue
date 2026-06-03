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

    <main class="main">
      <div class="page-header">
        <h2 class="page-title">Exercise Explorer</h2>
        <p class="page-sub">Tap muscle groups to find exercises.</p>
      </div>

      <div class="explorer-layout">
        <!-- Left: body picker -->
        <div class="picker-panel">
          <MusclePicker :selected="selected" @toggle="toggleMuscle" />

          <!-- Selected badges -->
          <div v-if="selected.length > 0" class="badges">
            <button
              v-for="id in selected"
              :key="id"
              class="badge"
              @click="toggleMuscle(id)"
            >
              {{ MUSCLES[id]?.label }} ✕
            </button>
            <button class="badge clear" @click="selected = []">Clear all</button>
          </div>
          <p v-else class="hint">Tap any muscle to begin</p>

          <!-- Start workout CTA -->
          <button
            v-if="exercises.length > 0"
            class="btn btn-primary start-btn"
            @click="startWorkoutFromResults"
          >
            Start Workout with These
          </button>
        </div>

        <!-- Right: exercise results -->
        <div class="results-panel">
          <div v-if="selected.length === 0" class="empty-state">
            <p class="empty-icon">💪</p>
            <p>Select muscle groups on the left to see exercises.</p>
          </div>

          <div v-else-if="loading" class="loading">
            <div class="spinner" />
            <p>Loading exercises…</p>
          </div>

          <div v-else-if="error" class="error-state">
            <p>{{ error }}</p>
            <button class="btn btn-secondary" @click="load">Retry</button>
          </div>

          <template v-else>
            <p class="results-count">{{ exercises.length }} exercises found</p>
            <div class="exercise-grid">
              <div
                v-for="ex in exercises"
                :key="ex.id"
                class="exercise-card"
                :class="{ 'in-workout': addedIds.has(ex.id) }"
                @click="toggleExercise(ex)"
              >
                <div class="exercise-info">
                  <div class="exercise-header-row">
                    <p class="exercise-name">{{ capitalize(ex.name) }}</p>
                    <span v-if="ex.difficulty" class="diff-badge" :class="ex.difficulty">
                      {{ ex.difficulty }}
                    </span>
                  </div>
                  <div class="exercise-tags">
                    <span class="tag target">{{ capitalize(ex.target) }}</span>
                    <span class="tag equipment">{{ ex.equipment }}</span>
                    <span v-for="m in ex.secondaryMuscles.slice(0,2)" :key="m" class="tag secondary">
                      {{ m }}
                    </span>
                  </div>
                </div>
                <div class="card-footer">
                  <a
                    :href="`https://www.youtube.com/results?search_query=how+to+${encodeURIComponent(ex.name)}+exercise+form`"
                    target="_blank"
                    rel="noopener"
                    class="watch-btn"
                    @click.stop
                  >
                    ▶ Watch
                  </a>
                  <div class="add-indicator" :class="{ added: addedIds.has(ex.id) }">
                    {{ addedIds.has(ex.id) ? '✓ Added' : '+ Add' }}
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import MusclePicker from '@/components/MusclePicker.vue'
import {
  fetchForMuscles,
  capitalize,
  MUSCLES,
  type Exercise,
} from '@/composables/useExerciseDB'
import { useWorkoutStore } from '@/stores/workout'

const workout = useWorkoutStore()
const router = useRouter()

const selected = ref<string[]>([])
const exercises = ref<Exercise[]>([])
const addedIds = ref(new Set<string>())
const loading = ref(false)
const error = ref('')

function toggleMuscle(id: string) {
  const idx = selected.value.indexOf(id)
  if (idx >= 0) selected.value.splice(idx, 1)
  else selected.value.push(id)
}

function toggleExercise(ex: Exercise) {
  if (addedIds.value.has(ex.id)) addedIds.value.delete(ex.id)
  else addedIds.value.add(ex.id)
}

async function load() {
  if (selected.value.length === 0) {
    exercises.value = []
    return
  }
  loading.value = true
  error.value = ''
  try {
    exercises.value = await fetchForMuscles(selected.value)
    // Clear added state when results change
    addedIds.value = new Set()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load exercises'
  } finally {
    loading.value = false
  }
}

function startWorkoutFromResults() {
  const toAdd = addedIds.value.size > 0
    ? exercises.value.filter(e => addedIds.value.has(e.id))
    : exercises.value.slice(0, 8)

  const muscleLabel = selected.value.map(id => MUSCLES[id]?.label).filter(Boolean).join(' + ')
  workout.start(muscleLabel || 'Workout')

  for (const ex of toAdd) {
    workout.addExercise(capitalize(ex.name))
  }

  router.push('/workout')
}

// Debounce fetches so rapid clicks don't fire multiple requests
let fetchTimer: ReturnType<typeof setTimeout>
watch(selected, () => {
  clearTimeout(fetchTimer)
  fetchTimer = setTimeout(load, 300)
}, { deep: true })
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
.nav-links { display: flex; gap: 20px; font-size: 14px; flex-wrap: wrap; }
.nav-links a { color: var(--color-text-muted); }
.nav-links a.router-link-active { color: var(--color-text); }

.main {
  padding: 24px;
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
}

.page-header { margin-bottom: 24px; }
.page-title { font-size: 22px; font-weight: 800; }
.page-sub { color: var(--color-text-muted); font-size: 14px; margin-top: 4px; }

.explorer-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 32px;
  align-items: start;
}

@media (max-width: 700px) {
  .explorer-layout { grid-template-columns: 1fr; }
}

/* Picker panel */
.picker-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  position: sticky;
  top: 72px;
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.badge {
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  background: rgba(124, 58, 237, 0.15);
  border: 1px solid rgba(124, 58, 237, 0.4);
  color: var(--color-primary);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}

.badge:hover { background: rgba(124, 58, 237, 0.25); }

.badge.clear {
  background: var(--color-surface-2);
  border-color: var(--color-border);
  color: var(--color-text-muted);
}

.hint {
  font-size: 13px;
  color: var(--color-text-muted);
  text-align: center;
}

.start-btn {
  width: 100%;
  max-width: 280px;
  padding: 12px;
  font-size: 14px;
}

/* Results panel */
.results-panel { min-height: 300px; }

.empty-state, .loading, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--color-text-muted);
  text-align: center;
  font-size: 14px;
}

.empty-icon { font-size: 40px; }

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.results-count {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 12px;
}

.exercise-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}

.exercise-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.exercise-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

.exercise-card.in-workout {
  border-color: var(--color-accent);
  background: rgba(16, 185, 129, 0.05);
}

.exercise-info {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.exercise-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.exercise-name {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
  flex: 1;
}

.diff-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  text-transform: capitalize;
  white-space: nowrap;
  flex-shrink: 0;
}

.diff-badge.beginner     { background: rgba(16,185,129,0.15); color: var(--color-accent); }
.diff-badge.intermediate { background: rgba(245,158,11,0.15); color: var(--color-xp); }
.diff-badge.advanced     { background: rgba(239,68,68,0.15);  color: #f87171; }

.exercise-desc {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.exercise-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  border: 1px solid;
  text-transform: capitalize;
}

.tag.target {
  background: rgba(124, 58, 237, 0.1);
  border-color: rgba(124, 58, 237, 0.25);
  color: var(--color-primary);
}

.tag.equipment {
  background: var(--color-surface-2);
  border-color: var(--color-border);
  color: var(--color-text-muted);
}

.tag.secondary {
  background: rgba(148,163,184,0.1);
  border-color: rgba(148,163,184,0.2);
  color: var(--color-text-muted);
}

.card-footer {
  display: flex;
  border-top: 1px solid var(--color-border);
}

.watch-btn {
  flex: 1;
  padding: 8px 10px;
  font-size: 11px;
  font-weight: 700;
  text-align: center;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
  text-decoration: none;
  border-right: 1px solid var(--color-border);
  transition: background 0.15s;
}

.watch-btn:hover {
  background: rgba(239, 68, 68, 0.16);
}

.add-indicator {
  flex: 1;
  padding: 8px 10px;
  font-size: 11px;
  font-weight: 700;
  text-align: center;
  color: var(--color-text-muted);
  background: var(--color-surface-2);
  transition: all 0.15s;
  cursor: pointer;
}

.add-indicator.added {
  color: var(--color-accent);
  background: rgba(16, 185, 129, 0.08);
}
</style>
