<template>
  <div class="layout">
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

        </div>

        <!-- Right: exercise results -->
        <div class="results-panel">
          <!-- Cart summary — always visible when items added -->
          <div v-if="cartItems.length > 0" class="cart">
            <div class="cart-header" @click="cartOpen = !cartOpen">
              <span class="cart-title">🛒 Workout ({{ cartItems.length }})</span>
              <div class="cart-header-right">
                <button class="cart-clear" @click.stop="cartItems = []">Clear</button>
                <button class="btn btn-primary cart-start-inline" @click.stop="startWorkoutFromResults">Start</button>
                <span class="cart-chevron" :class="{ open: cartOpen }">›</span>
              </div>
            </div>
            <div v-if="cartOpen" class="cart-dropdown">
              <div v-for="ex in cartItems" :key="ex.id" class="cart-item">
                <span class="cart-item-name">{{ capitalize(ex.name) }}</span>
                <button class="cart-remove" @click="toggleExercise(ex)" aria-label="Remove">✕</button>
              </div>
            </div>
          </div>

          <div v-if="selected.length === 0" class="empty-state">
            <img src="/arm.png" alt="" class="empty-arm" />
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
                :class="{ 'in-workout': cartIds.has(ex.id) }"
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
                  <button
                    class="watch-btn"
                    @click.stop="demoExercise = ex.name"
                  >
                    ▶ Watch
                  </button>
                  <div class="add-indicator" :class="{ added: cartIds.has(ex.id) }">
                    {{ cartIds.has(ex.id) ? '✓ Added' : '+ Add' }}
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </main>

    <ExerciseDemoModal :name="demoExercise" @close="demoExercise = null" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import MusclePicker from '@/components/MusclePicker.vue'
import ExerciseDemoModal from '@/components/ExerciseDemoModal.vue'
import {
  fetchForMuscles,
  capitalize,
  MUSCLES,
  type Exercise,
} from '@/composables/useExerciseDB'
import { useWorkoutStore } from '@/stores/workout'

const workout = useWorkoutStore()
const router = useRouter()

const demoExercise = ref<string | null>(null)
const selected = ref<string[]>([])
const exercises = ref<Exercise[]>([])
const cartItems = ref<Exercise[]>([])
const cartOpen = ref(false)
const loading = ref(false)
const error = ref('')

const cartIds = computed(() => new Set(cartItems.value.map(e => e.id)))

function toggleMuscle(id: string) {
  const idx = selected.value.indexOf(id)
  if (idx >= 0) selected.value.splice(idx, 1)
  else selected.value.push(id)
}

function toggleExercise(ex: Exercise) {
  const idx = cartItems.value.findIndex(e => e.id === ex.id)
  if (idx >= 0) cartItems.value.splice(idx, 1)
  else cartItems.value.push(ex)
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
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load exercises'
  } finally {
    loading.value = false
  }
}

function startWorkoutFromResults() {
  const toAdd = cartItems.value.length > 0 ? cartItems.value : exercises.value.slice(0, 8)

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

.nav-brand { display: flex; align-items: center; margin-right: auto; }
.brand-logo { height: 22px; width: auto; display: block; }
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
  .main { padding-bottom: var(--tab-space); }
  .picker-panel { position: static; }
}

/* Picker panel */
.picker-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
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
.empty-arm { width: 96px; height: auto; opacity: 0.9; }

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Cart */
.cart {
  position: sticky;
  top: 0;
  z-index: 5;
  background: var(--color-surface);
  border: 1px solid rgba(124, 58, 237, 0.35);
  border-radius: var(--radius-lg);
  padding: 12px 14px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.25);
}

.cart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}

.cart-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary);
}

.cart-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cart-clear {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-muted);
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  padding: 2px 6px;
  border-radius: var(--radius);
  transition: color 0.15s;
}
.cart-clear:hover { color: var(--color-text); }

.cart-start-inline {
  padding: 5px 14px;
  font-size: 12px;
}

.cart-chevron {
  font-size: 18px;
  color: var(--color-text-muted);
  line-height: 1;
  transition: transform 0.2s;
  display: inline-block;
}
.cart-chevron.open { transform: rotate(90deg); }

.cart-dropdown {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px solid var(--color-border);
  margin-top: 10px;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(124, 58, 237, 0.1);
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 999px;
  padding: 3px 10px 3px 12px;
}

.cart-item-name {
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
  white-space: nowrap;
}

.cart-remove {
  font-size: 10px;
  color: var(--color-text-muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  font-family: inherit;
  transition: color 0.15s;
}
.cart-remove:hover { color: var(--color-text); }

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
