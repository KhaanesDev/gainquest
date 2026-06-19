<template>
  <Teleport to="body">
    <div class="overlay" @click.self="emit('close')">
      <div class="panel" role="dialog">

        <!-- Header -->
        <div class="panel-header">
          <h3 class="panel-title">Add exercise</h3>
          <button class="close-btn" @click="emit('close')">✕</button>
        </div>

        <!-- Search -->
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input
            v-model="query"
            class="search-input"
            placeholder="Search exercises…"
          />
          <button v-if="query" class="search-clear" @click="query = ''">✕</button>
        </div>

        <!-- ── Search mode ──────────────────────────────────────── -->
        <div v-if="query.trim()" class="results">
          <div v-if="searching" class="state"><div class="spinner" /></div>
          <template v-else>
            <div
              v-for="ex in searchResults"
              :key="ex.id"
              class="ex-row"
              :class="{ added: addedIds.has(ex.id) }"
            >
              <span class="ex-info">
                <span class="ex-name">{{ capitalize(ex.name) }}</span>
                <span class="ex-target">{{ capitalize(ex.target) }}</span>
              </span>
              <button class="ex-watch" @click="demoName = ex.name" title="Watch demo">▶</button>
              <button class="ex-addbtn" @click="add(ex)">
                {{ addedIds.has(ex.id) ? '✓ Added' : '+ Add' }}
              </button>
            </div>

            <!-- Always allow adding the typed text verbatim -->
            <button class="ex-row custom-row" @click="addCustom">
              <span class="ex-info">
                <span class="ex-name">Add “{{ query.trim() }}”</span>
                <span class="ex-target">Custom exercise</span>
              </span>
              <span class="ex-addbtn static">+ Add</span>
            </button>
          </template>
        </div>

        <!-- ── Browse-by-muscle mode ────────────────────────────── -->
        <template v-else>
          <div class="picker-wrap">
            <MusclePicker :selected="selected" @toggle="toggleMuscle" />
            <p class="hint">
              {{ selected.length === 0 ? 'Tap a muscle to browse, or search above' : 'Tap an exercise to add it' }}
            </p>
          </div>

          <div class="results">
            <div v-if="loading" class="state"><div class="spinner" /></div>
            <div v-else-if="error" class="state error">
              <p>{{ error }}</p>
              <button class="retry" @click="load">Retry</button>
            </div>
            <template v-else-if="selected.length > 0">
              <div
                v-for="ex in exercises"
                :key="ex.id"
                class="ex-row"
                :class="{ added: addedIds.has(ex.id) }"
              >
                <span class="ex-info">
                  <span class="ex-name">{{ capitalize(ex.name) }}</span>
                  <span class="ex-target">{{ capitalize(ex.target) }}</span>
                </span>
                <button class="ex-watch" @click="demoName = ex.name" title="Watch demo">▶</button>
                <button class="ex-addbtn" @click="add(ex)">
                  {{ addedIds.has(ex.id) ? '✓ Added' : '+ Add' }}
                </button>
              </div>
            </template>
          </div>
        </template>

        <!-- Footer -->
        <div class="panel-footer">
          <button class="btn-done" @click="emit('close')">
            Done<span v-if="addedCount > 0"> · {{ addedCount }} added</span>
          </button>
        </div>
      </div>
    </div>

    <ExerciseDemoModal :name="demoName" @close="demoName = null" />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import MusclePicker from './MusclePicker.vue'
import ExerciseDemoModal from './ExerciseDemoModal.vue'
import { fetchForMuscles, searchExercises, capitalize, type Exercise } from '@/composables/useExerciseDB'

const emit = defineEmits<{ close: []; add: [name: string] }>()

const query = ref('')
const searchResults = ref<Exercise[]>([])
const searching = ref(false)

const selected = ref<string[]>([])
const exercises = ref<Exercise[]>([])
const loading = ref(false)
const error = ref('')

const addedIds = ref<Set<string>>(new Set())
const addedCount = ref(0)
const demoName = ref<string | null>(null)

function toggleMuscle(id: string) {
  const idx = selected.value.indexOf(id)
  if (idx >= 0) selected.value.splice(idx, 1)
  else selected.value.push(id)
}

function add(ex: Exercise) {
  emit('add', capitalize(ex.name))
  addedIds.value.add(ex.id)
  addedCount.value++
}

function addCustom() {
  const name = query.value.trim()
  if (!name) return
  emit('add', name)
  addedCount.value++
  query.value = ''
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

let muscleTimer: ReturnType<typeof setTimeout>
watch(selected, () => {
  clearTimeout(muscleTimer)
  muscleTimer = setTimeout(load, 300)
}, { deep: true })

let searchTimer: ReturnType<typeof setTimeout>
watch(query, (q) => {
  clearTimeout(searchTimer)
  const term = q.trim()
  if (term.length < 2) {
    searchResults.value = []
    searching.value = false
    return
  }
  searching.value = true
  searchTimer = setTimeout(async () => {
    try {
      searchResults.value = await searchExercises(term)
    } catch {
      searchResults.value = []
    } finally {
      searching.value = false
    }
  }, 300)
})
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 200;
}

@media (min-width: 560px) {
  .overlay { align-items: center; padding: 20px; }
}

.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slide-up 0.22s ease;
}

@media (min-width: 560px) {
  .panel { border-radius: var(--radius-lg); animation: pop-in 0.22s ease; }
}

@keyframes slide-up {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
@keyframes pop-in {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}
.panel-title { font-size: 17px; font-weight: 800; }

.close-btn {
  width: 30px; height: 30px;
  background: none; border: none;
  color: var(--color-text-muted);
  font-size: 15px; cursor: pointer;
  border-radius: var(--radius);
  display: flex; align-items: center; justify-content: center;
  transition: color 0.15s;
}
.close-btn:hover { color: var(--color-text); }

/* Search */
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 16px;
  padding: 0 12px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  flex-shrink: 0;
  transition: border-color 0.15s;
}
.search-bar:focus-within { border-color: var(--color-primary); }
.search-icon { font-size: 13px; opacity: 0.7; }
.search-input {
  flex: 1; min-width: 0;
  background: none; border: none;
  color: var(--color-text);
  font-size: 14px; font-family: inherit;
  padding: 10px 0; outline: none;
}
.search-input::placeholder { color: var(--color-text-muted); }
.search-clear {
  background: none; border: none;
  color: var(--color-text-muted);
  font-size: 13px; cursor: pointer; padding: 4px;
}
.search-clear:hover { color: var(--color-text); }

/* Picker (compact — ~half the Explore size) */
.picker-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 4px 16px 6px;
  flex-shrink: 0;
}
.picker-wrap :deep(.body-views) { gap: 12px; }
.picker-wrap :deep(.body-svg) { width: 84px; }
.picker-wrap :deep(.view-label) { font-size: 10px; }

.hint {
  font-size: 12px;
  color: var(--color-text-muted);
  text-align: center;
}

.results {
  flex: 1;
  overflow-y: auto;
  padding: 4px 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px 20px;
  color: var(--color-text-muted);
  font-size: 13px;
}
.spinner {
  width: 26px; height: 26px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.retry {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  border-radius: var(--radius);
  padding: 6px 14px;
  font-size: 13px; font-family: inherit; cursor: pointer;
}

.ex-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px 8px 12px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-family: inherit;
  text-align: left;
  transition: all 0.12s;
}
.ex-row.added { border-color: var(--color-accent); background: rgba(16,185,129,0.06); }
.custom-row { border-style: dashed; cursor: pointer; }
.custom-row:hover { border-color: var(--color-primary); }

.ex-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.ex-name { font-size: 14px; font-weight: 700; color: var(--color-text); }
.ex-target { font-size: 11px; color: var(--color-text-muted); text-transform: capitalize; }

.ex-watch {
  flex-shrink: 0;
  padding: 6px 10px;
  border-radius: var(--radius);
  font-size: 12px; font-weight: 700;
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.25);
  color: #f87171;
  font-family: inherit; cursor: pointer;
  transition: background 0.12s;
}
.ex-watch:hover { background: rgba(239,68,68,0.18); }

.ex-addbtn {
  flex-shrink: 0;
  padding: 6px 12px;
  border-radius: var(--radius);
  font-size: 12px; font-weight: 700;
  background: rgba(124,58,237,0.12);
  border: 1px solid rgba(124,58,237,0.3);
  color: var(--color-primary);
  font-family: inherit; cursor: pointer;
  transition: background 0.12s;
}
.ex-addbtn:hover { background: rgba(124,58,237,0.22); }
.ex-addbtn.static { pointer-events: none; }
.ex-row.added .ex-addbtn { background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.3); color: var(--color-accent); }

.panel-footer {
  padding: 12px 16px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}
.btn-done {
  width: 100%;
  padding: 12px;
  border-radius: var(--radius);
  font-size: 14px; font-weight: 700;
  background: var(--color-primary);
  border: none;
  color: white;
  font-family: inherit; cursor: pointer;
  transition: opacity 0.15s;
}
.btn-done:hover { opacity: 0.9; }
</style>
