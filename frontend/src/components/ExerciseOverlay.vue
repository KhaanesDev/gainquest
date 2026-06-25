<template>
  <Teleport to="body">
    <div class="overlay" @click.self="emit('close')">
      <div class="panel" role="dialog">

        <!-- Header -->
        <div class="panel-header">
          <input v-model="exercise.name" class="ex-name-input" :placeholder="$t('exercise.namePlaceholder')" />
          <button class="type-pill" :class="exercise.type" @click="switchType">
            {{ exercise.type === 'reps' ? $t('exercise.reps') : $t('exercise.timer') }}
          </button>
          <button class="close-btn" @click="emit('close')">✕</button>
        </div>

        <!-- Column labels -->
        <div class="col-labels" :class="exercise.type">
          <span></span>
          <template v-if="exercise.type === 'reps'">
            <span>{{ $t('exercise.repsLabel') }}</span>
            <span>{{ $t('exercise.kgLabel') }}</span>
          </template>
          <span v-else class="span-timer">{{ $t('exercise.durationLabel') }}</span>
          <span></span>
        </div>

        <!-- Set list -->
        <div class="sets-body" ref="setsBodyEl">
          <template v-for="(set, i) in exercise.sets" :key="set.id">

            <!-- Set row -->
            <div class="set-row"
              :class="[{ completed: set.completed, 'drag-over': dragActive && dragOver === i }, set.type, exercise.type]"
            >
              <button
                class="type-badge"
                :class="[set.type, { dragging: dragActive && dragIndex === i }]"
                :disabled="set.completed"
                @pointerdown="startDrag($event, i)"
                @click="onBadgeClick(set)"
                :title="$t('exercise.dragTitle')"
              >{{ setBadge(set, i) }}</button>

              <!-- Reps mode -->
              <template v-if="exercise.type === 'reps'">
                <div class="reps-stepper" :class="{ disabled: set.completed }">
                  <button class="step-btn" :disabled="set.completed" @click="adjustReps(set, -1)">−</button>
                  <input
                    v-model.number="set.reps"
                    type="number" min="1" max="999"
                    class="reps-val"
                    placeholder="—"
                    :disabled="set.completed"
                  />
                  <button class="step-btn" :disabled="set.completed" @click="adjustReps(set, 1)">+</button>
                </div>
                <div class="weight-stepper" :class="{ disabled: set.completed }">
                  <button class="step-btn" :disabled="set.completed" @click="adjustWeight(set, -2.5)">−</button>
                  <input
                    type="number" min="0" step="any"
                    class="weight-val"
                    :placeholder="prevWeight(i)"
                    :value="set.weightKg ?? ''"
                    :disabled="set.completed"
                    @focus="e => (e.target as HTMLInputElement).select()"
                    @change="e => onWeightChange(set, e)"
                  />
                  <button class="step-btn" :disabled="set.completed" @click="adjustWeight(set, 2.5)">+</button>
                </div>
              </template>

              <!-- Timer mode -->
              <template v-else>
                <div class="timer-cell" :class="{ running: getTimer(set).running }">
                  <template v-if="!getTimer(set).running">
                    <button class="step-btn" :disabled="set.completed" @click="adjustDuration(set, -15)">−</button>
                    <input
                      type="text" inputmode="decimal"
                      class="timer-val"
                      :value="formatDur(set.durationSeconds ?? 60)"
                      :disabled="set.completed"
                      @change="e => onDurationChange(set, e)"
                    />
                    <button class="step-btn" :disabled="set.completed" @click="adjustDuration(set, 15)">+</button>
                  </template>
                  <span v-else class="timer-countdown">{{ formatDur(getTimer(set).remaining) }}</span>
                </div>
                <button
                  class="btn-start-stop" :class="{ running: getTimer(set).running }"
                  :disabled="set.completed"
                  @click="toggleTimer(set)"
                >{{ getTimer(set).running ? '■' : '▶' }}</button>
              </template>

              <!-- Complete -->
              <button class="btn-check" :class="{ active: set.completed }" @click="onToggleSet(set, i)">✓</button>
            </div>

          </template>
        </div>

        <!-- Action bar: Done → rest countdown → GO → next set -->
        <div class="action-bar" :class="{ resting: restRunning, go: restDone }">
          <template v-if="restRunning">
            <button class="rest-add" @click="addRestTime(15)">+15s</button>
            <span class="rest-count">{{ formatDur(restRemaining) }}</span>
            <button class="rest-skip" @click="endRest">{{ $t('exercise.skip') }}</button>
          </template>
          <button v-else-if="restDone" class="action-main go-btn" @click="endRest">
            <img src="/arm.png" alt="" class="action-arm" />
            {{ $t('exercise.go') }}
          </button>
          <button v-else-if="nextSet" class="action-main done-btn" @click="completeCurrent">
            {{ $t('exercise.completeSet') }}
          </button>
          <button
            v-else
            class="action-main complete-btn"
            @click="allDone ? emit('complete-workout') : emit('close')"
          >
            {{ allDone ? '🏆 ' + $t('exercise.complete') : $t('exercise.done') }}
          </button>
        </div>

        <!-- Footer -->
        <div class="panel-footer">
          <div class="footer-sets">
            <button class="btn-footer warmup" @click="workout.addSet(exercise.id, 'warmup')">{{ $t('exercise.addWarmup') }}</button>
            <button class="btn-footer" @click="workout.addSet(exercise.id, 'working')">{{ $t('exercise.addSet') }}</button>
          </div>
          <div class="footer-right">
            <button v-if="exercise.name.trim()" class="btn-watch" @click="showDemo = true">▶ {{ $t('exercise.watch') }}</button>
            <button class="btn-remove-ex" @click="emit('remove'); emit('close')">{{ $t('exercise.remove') }}</button>
          </div>
        </div>
      </div>
    </div>

    <ExerciseDemoModal v-if="showDemo" :name="exercise.name" @close="showDemo = false" />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onBeforeUnmount, useTemplateRef } from 'vue'
import type { WorkoutExercise, WorkoutSet } from '@/stores/workout'
import { useWorkoutStore } from '@/stores/workout'
import ExerciseDemoModal from './ExerciseDemoModal.vue'

const props = defineProps<{ exercise: WorkoutExercise }>()
const emit = defineEmits<{ close: []; remove: []; 'complete-workout': [] }>()

const workout = useWorkoutStore()
const showDemo = ref(false)
const setsBodyEl = useTemplateRef<HTMLElement>('setsBodyEl')

// ── Drag to reorder (via the set number badge) ─────────────────────────────────
const dragIndex = ref<number | null>(null)
const dragOver = ref<number | null>(null)
const dragActive = ref(false)
let dragStartY = 0
let suppressClick = false

function startDrag(e: PointerEvent, i: number) {
  suppressClick = false
  dragStartY = e.clientY
  dragActive.value = false
  dragIndex.value = i
  dragOver.value = i
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp, { once: true })
  window.addEventListener('pointercancel', onPointerUp, { once: true })
}

function onPointerMove(e: PointerEvent) {
  if (dragIndex.value === null) return
  // Only enter drag mode once the pointer has moved past a small threshold,
  // so a plain tap still toggles warmup/working.
  if (!dragActive.value) {
    if (Math.abs(e.clientY - dragStartY) < 6) return
    dragActive.value = true
  }
  if (!setsBodyEl.value) return
  const rows = setsBodyEl.value.querySelectorAll<HTMLElement>('.set-row')
  for (let i = 0; i < rows.length; i++) {
    const rect = rows[i].getBoundingClientRect()
    if (e.clientY >= rect.top && e.clientY < rect.bottom) {
      dragOver.value = i
      break
    }
  }
}

function onPointerUp() {
  window.removeEventListener('pointermove', onPointerMove)
  if (
    dragActive.value &&
    dragIndex.value !== null &&
    dragOver.value !== null &&
    dragIndex.value !== dragOver.value
  ) {
    const sets = props.exercise.sets
    const [moved] = sets.splice(dragIndex.value, 1)
    sets.splice(dragOver.value, 0, moved)
    suppressClick = true // swallow the click that follows a drag
  }
  dragActive.value = false
  dragIndex.value = null
  dragOver.value = null
}

function onBadgeClick(set: WorkoutSet) {
  if (suppressClick) {
    suppressClick = false
    return
  }
  toggleSetType(set)
}

// The next set to complete (first uncompleted) — drives the Done button.
const nextSet = computed(() => props.exercise.sets.find(s => !s.completed) ?? null)

function completeCurrent() {
  const set = nextSet.value
  if (!set) return
  onToggleSet(set, props.exercise.sets.indexOf(set))
}

const allDone = computed(() =>
  workout.exercises.length > 0 &&
  workout.exercises.every(ex => ex.sets.length > 0 && ex.sets.every(s => s.completed))
)

// ── Set badges ────────────────────────────────────────────────────────────────
function setBadge(set: WorkoutSet, index: number): string {
  if (set.type === 'warmup') {
    const warmupIndex = props.exercise.sets.slice(0, index).filter(s => s.type === 'warmup').length
    return `W${warmupIndex + 1}`
  }
  const workingIndex = props.exercise.sets.slice(0, index).filter(s => s.type === 'working').length
  return String(workingIndex + 1)
}

function toggleSetType(set: WorkoutSet) {
  set.type = set.type === 'warmup' ? 'working' : 'warmup'
}

// ── Type switch ───────────────────────────────────────────────────────────────
function switchType() {
  props.exercise.sets.forEach(s => stopSetTimer(s.id))
  props.exercise.type = props.exercise.type === 'reps' ? 'timer' : 'reps'
}

// ── Weight helpers ────────────────────────────────────────────────────────────
function getInheritedWeight(index: number): number | null {
  for (let i = index - 1; i >= 0; i--) {
    if (props.exercise.sets[i].weightKg !== null) return props.exercise.sets[i].weightKg
  }
  return null
}

function prevWeight(index: number): string {
  const w = getInheritedWeight(index)
  return w !== null ? String(w) : 'BW'
}

function adjustReps(set: WorkoutSet, delta: number) {
  set.reps = Math.max(1, (set.reps ?? 0) + delta)
}

function adjustWeight(set: WorkoutSet, delta: number) {
  const idx = props.exercise.sets.indexOf(set)
  const base = set.weightKg ?? getInheritedWeight(idx) ?? 0
  const next = Math.round((base + delta) * 10) / 10
  set.weightKg = next <= 0 ? null : next
}

function onWeightChange(set: WorkoutSet, e: Event) {
  const val = (e.target as HTMLInputElement).valueAsNumber
  set.weightKg = isNaN(val) || val <= 0 ? null : val
}

// ── Set timers ────────────────────────────────────────────────────────────────
const setTimers = reactive<Record<string, { remaining: number; running: boolean }>>({})
const setIntervals: Record<string, ReturnType<typeof setInterval>> = {}

function getTimer(set: WorkoutSet) {
  if (!setTimers[set.id]) {
    setTimers[set.id] = { remaining: set.durationSeconds ?? 60, running: false }
  }
  return setTimers[set.id]
}

function adjustDuration(set: WorkoutSet, delta: number) {
  const next = Math.max(5, (set.durationSeconds ?? 60) + delta)
  set.durationSeconds = next
  const t = setTimers[set.id]
  if (t && !t.running) t.remaining = next
}

function onDurationChange(set: WorkoutSet, e: Event) {
  const raw = (e.target as HTMLInputElement).value.trim()
  let seconds: number
  if (raw.includes(':')) {
    const [m, s] = raw.split(':').map(n => parseInt(n) || 0)
    seconds = m * 60 + s
  } else {
    seconds = parseInt(raw) || 0
  }
  seconds = Math.max(5, seconds)
  set.durationSeconds = seconds
  const t = setTimers[set.id]
  if (t && !t.running) t.remaining = seconds
  ;(e.target as HTMLInputElement).value = formatDur(seconds)
}

function toggleTimer(set: WorkoutSet) {
  const t = getTimer(set)
  if (t.running) {
    stopSetTimer(set.id)
    t.remaining = set.durationSeconds ?? 60
  } else {
    if (t.remaining <= 0) t.remaining = set.durationSeconds ?? 60
    t.running = true
    setIntervals[set.id] = setInterval(() => {
      t.remaining--
      if (t.remaining <= 0) {
        stopSetTimer(set.id)
        t.remaining = 0
        if (!set.completed) {
          workout.toggleSet(props.exercise.id, set.id)
          if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
        }
      }
    }, 1000)
  }
}

function stopSetTimer(id: string) {
  if (setIntervals[id]) { clearInterval(setIntervals[id]); delete setIntervals[id] }
  if (setTimers[id]) setTimers[id].running = false
}

// ── Complete set ──────────────────────────────────────────────────────────────
function onToggleSet(set: WorkoutSet, index: number) {
  const completing = !set.completed

  if (props.exercise.type === 'timer') {
    stopSetTimer(set.id)
    if (set.completed && setTimers[set.id]) {
      setTimers[set.id].remaining = set.durationSeconds ?? 60
    }
  } else if (completing && set.weightKg === null) {
    const inherited = getInheritedWeight(index)
    if (inherited !== null) set.weightKg = inherited
  }

  workout.toggleSet(props.exercise.id, set.id)

  // Auto-start the shared rest timer when a set is completed — but not after
  // the last set (no point resting when there's nothing left to do).
  if (completing && nextSet.value) startRest()
}

// ── Shared rest timer (one timer reused between every set) ──────────────────────
const restRemaining = ref(0)
const restRunning = ref(false)
const restDone = ref(false)
let restInterval: ReturnType<typeof setInterval> | undefined

function startRest() {
  clearInterval(restInterval)
  restDone.value = false
  restRemaining.value = workout.restSeconds
  if (restRemaining.value <= 0) { restRunning.value = false; return }
  restRunning.value = true
  restInterval = setInterval(() => {
    restRemaining.value--
    if (restRemaining.value <= 0) {
      clearInterval(restInterval)
      restRunning.value = false
      restRemaining.value = 0
      restDone.value = true
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100])
    }
  }, 1000)
}

function addRestTime(s: number) {
  restRemaining.value = Math.max(0, restRemaining.value + s)
}

function endRest() {
  clearInterval(restInterval)
  restRunning.value = false
  restDone.value = false
  restRemaining.value = 0
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDur(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

onBeforeUnmount(() => {
  Object.values(setIntervals).forEach(clearInterval)
  clearInterval(restInterval)
  window.removeEventListener('pointermove', onPointerMove)
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
  padding: 0;
}

@media (min-width: 560px) {
  .overlay { align-items: center; padding: 20px; }
}

.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
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

/* Header */
.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.ex-name-input {
  flex: 1;
  background: none;
  border: none;
  color: var(--color-text);
  font-size: 17px;
  font-weight: 800;
  font-family: inherit;
  outline: none;
  min-width: 0;
}

.ex-name-input::placeholder { color: var(--color-text-muted); font-weight: 400; }
.ex-name-input:focus { border-bottom: 1px solid var(--color-border); }

.type-pill {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: 1px solid;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.15s;
}
.type-pill.reps { background: rgba(124,58,237,0.1); border-color: rgba(124,58,237,0.3); color: var(--color-primary); }
.type-pill.timer { background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.3); color: var(--color-xp); }
.type-pill:hover { opacity: 0.75; }

.close-btn {
  width: 30px; height: 30px;
  background: none; border: none;
  color: var(--color-text-muted);
  font-size: 15px; cursor: pointer;
  border-radius: var(--radius);
  display: flex; align-items: center; justify-content: center;
  transition: color 0.15s;
  flex-shrink: 0;
}
.close-btn:hover { color: var(--color-text); }

/* Col labels */
.col-labels {
  display: grid;
  gap: 8px;
  padding: 6px 16px 4px;
  font-size: 10px;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  flex-shrink: 0;
}
.col-labels.reps  { grid-template-columns: 40px 1fr 1.2fr 36px; }
.col-labels.timer { grid-template-columns: 40px 1fr 40px 36px; }
.span-timer { grid-column: 2 / 4; }

/* Scrollable set list */
.sets-body {
  flex: 1;
  overflow-y: auto;
  padding: 4px 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Set row */
.set-row {
  display: grid;
  gap: 8px;
  align-items: center;
  padding: 4px 0;
  border-radius: var(--radius);
  transition: background 0.12s;
}
.set-row.reps  { grid-template-columns: 40px 1fr 1.2fr 36px; }
.set-row.timer { grid-template-columns: 40px 1fr 40px 36px; }
.set-row.completed { background: rgba(16,185,129,0.06); }
.set-row.warmup.completed { background: rgba(148,163,184,0.08); }

/* Type badge */
.type-badge {
  width: 36px; height: 36px;
  border-radius: var(--radius);
  border: 1px solid;
  font-size: 11px;
  font-weight: 800;
  font-family: inherit;
  cursor: grab;
  touch-action: none;
  transition: all 0.12s;
  display: flex; align-items: center; justify-content: center;
}
.type-badge.dragging {
  cursor: grabbing;
  opacity: 0.5;
  transform: scale(1.1);
}
.set-row.drag-over {
  outline: 2px dashed var(--color-primary);
  outline-offset: -2px;
  border-radius: var(--radius);
}
.type-badge.working {
  background: rgba(124,58,237,0.1);
  border-color: rgba(124,58,237,0.25);
  color: var(--color-primary);
}
.type-badge.warmup {
  background: rgba(148,163,184,0.1);
  border-color: rgba(148,163,184,0.2);
  color: var(--color-text-muted);
}
.type-badge:disabled { cursor: default; opacity: 0.6; }

/* Reps stepper */
.reps-stepper {
  display: flex; align-items: stretch;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: border-color 0.15s;
}
.reps-stepper:focus-within { border-color: var(--color-primary); }
.reps-stepper.disabled { opacity: 0.5; }

.reps-val {
  flex: 1; min-width: 0;
  background: none; border: none;
  border-left: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border);
  color: var(--color-text);
  font-size: 14px; font-family: inherit;
  text-align: center; padding: 8px 2px; outline: none;
}
.reps-val::placeholder { color: var(--color-text-muted); }
.reps-val::-webkit-inner-spin-button, .reps-val::-webkit-outer-spin-button { -webkit-appearance: none; }

/* Weight stepper */
.weight-stepper {
  display: flex; align-items: stretch;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: border-color 0.15s;
}
.weight-stepper:focus-within { border-color: var(--color-primary); }
.weight-stepper.disabled { opacity: 0.5; }

.step-btn {
  width: 32px; flex-shrink: 0;
  background: none; border: none;
  color: var(--color-text-muted);
  font-size: 17px; font-weight: 500;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.1s, color 0.1s;
  font-family: inherit;
  touch-action: manipulation;
}
.step-btn:hover:not(:disabled) { background: rgba(124,58,237,0.12); color: var(--color-primary); }
.step-btn:disabled { cursor: not-allowed; opacity: 0.4; }

.weight-val {
  flex: 1; min-width: 0;
  background: none; border: none;
  border-left: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border);
  color: var(--color-text);
  font-size: 14px; font-family: inherit;
  text-align: center; padding: 8px 2px; outline: none;
}
.weight-val::placeholder { color: var(--color-text-muted); font-size: 11px; }
.weight-val::-webkit-inner-spin-button, .weight-val::-webkit-outer-spin-button { -webkit-appearance: none; }

/* Timer cell */
.timer-cell {
  display: flex; align-items: center;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
  height: 36px;
  transition: border-color 0.15s;
}
.timer-cell.running { border-color: rgba(245,158,11,0.5); background: rgba(245,158,11,0.05); }

.timer-val {
  flex: 1; min-width: 0;
  text-align: center;
  font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums;
  color: var(--color-text);
  background: none; border: none;
  border-left: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border);
  padding: 0 4px; height: 100%; outline: none; font-family: inherit;
}

.timer-countdown {
  flex: 1; text-align: center;
  font-size: 18px; font-weight: 800; font-variant-numeric: tabular-nums;
  color: var(--color-xp);
}

.btn-start-stop {
  width: 40px; height: 36px;
  background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.3);
  border-radius: var(--radius);
  color: var(--color-xp);
  font-size: 14px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; font-family: inherit;
}
.btn-start-stop.running { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #f87171; }
.btn-start-stop:disabled { opacity: 0.4; cursor: not-allowed; }

/* Complete button */
.btn-check {
  width: 36px; height: 36px;
  border-radius: var(--radius);
  border: 2px solid var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  font-size: 14px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s;
}
.btn-check:hover { border-color: var(--color-accent); color: var(--color-accent); }
.btn-check.active { background: var(--color-accent); border-color: var(--color-accent); color: white; }

/* Rest rows */
.rest-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 2px 0 2px 44px;
  padding: 6px 10px;
  background: rgba(245,158,11,0.06);
  border: 1px solid rgba(245,158,11,0.2);
  border-radius: var(--radius);
  transition: all 0.15s;
}
.rest-row.running {
  background: rgba(245,158,11,0.1);
  border-color: rgba(245,158,11,0.4);
}
.rest-row.done {
  animation: go-pulse 1.1s ease-in-out infinite;
  border-color: rgba(16,185,129,0.6);
}

@keyframes go-pulse {
  0%, 100% {
    background: rgba(16,185,129,0.08);
    border-color: rgba(16,185,129,0.45);
    box-shadow: none;
  }
  50% {
    background: rgba(16,185,129,0.2);
    border-color: var(--color-accent);
    box-shadow: 0 0 18px rgba(16,185,129,0.35), inset 0 0 12px rgba(16,185,129,0.06);
  }
}

.go-icon { width: 26px; height: auto; flex-shrink: 0; }

.go-label {
  font-size: 22px;
  font-weight: 900;
  color: var(--color-accent);
  letter-spacing: 0.1em;
  flex: 1;
}

.go-sub {
  font-size: 11px;
  font-weight: 700;
  color: rgba(16,185,129,0.65);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.rest-icon { font-size: 13px; flex-shrink: 0; }

.rest-stepper {
  display: flex; align-items: center; gap: 4px; flex: 1;
}

.rest-step {
  width: 24px; height: 24px;
  background: none; border: 1px solid var(--color-border);
  border-radius: 4px; color: var(--color-text-muted);
  font-size: 14px; cursor: pointer; font-family: inherit;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.12s;
}
.rest-step:hover:not(:disabled) { border-color: var(--color-xp); color: var(--color-xp); }
.rest-step:disabled { opacity: 0.4; cursor: default; }

.rest-time {
  font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums;
  color: var(--color-xp); min-width: 48px; text-align: center;
  background: none; border: none; font-family: inherit; cursor: pointer;
  padding: 2px 6px; border-radius: var(--radius);
  transition: background 0.12s;
}
.rest-time:hover:not(:disabled) { background: rgba(245,158,11,0.12); }
.rest-time--open { background: rgba(245,158,11,0.15); }
.rest-row.done .rest-time { color: var(--color-accent); }

.rest-picker {
  flex-basis: 100%;
  padding: 4px 0 2px;
}

.rest-row {
  flex-wrap: wrap;
}

.rest-action {
  padding: 4px 10px;
  background: rgba(245,158,11,0.12);
  border: 1px solid rgba(245,158,11,0.3);
  border-radius: var(--radius);
  color: var(--color-xp);
  font-size: 11px; font-weight: 700; font-family: inherit;
  cursor: pointer; transition: all 0.12s; flex-shrink: 0;
}
.rest-action:hover { background: rgba(245,158,11,0.2); }
.rest-action.stop { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #f87171; }

.rest-remove {
  background: none; border: none;
  color: var(--color-text-muted); font-size: 11px;
  cursor: pointer; padding: 4px;
  border-radius: var(--radius);
  transition: color 0.12s; flex-shrink: 0;
}
.rest-remove:hover { color: #f87171; }

/* Add rest row */
.add-rest-row {
  display: flex;
  justify-content: center;
  margin: 0 0 0 44px;
}

.btn-add-rest {
  background: none;
  border: 1px dashed rgba(245,158,11,0.25);
  border-radius: 999px;
  padding: 3px 12px;
  font-size: 11px; font-weight: 700;
  color: rgba(245,158,11,0.5);
  font-family: inherit; cursor: pointer;
  transition: all 0.15s;
}
.btn-add-rest:hover {
  border-color: rgba(245,158,11,0.6);
  color: var(--color-xp);
}

/* Complete CTA */
.complete-cta {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  background: rgba(16,185,129,0.12);
  border-top: 1px solid rgba(16,185,129,0.3);
  cursor: pointer;
  animation: cta-enter 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both, cta-glow 1.4s ease-in-out 0.35s infinite;
  transition: background 0.15s;
  flex-shrink: 0;
}
.complete-cta:hover { background: rgba(16,185,129,0.22); }
.complete-cta.all-done {
  background: rgba(16,185,129,0.18);
  border-top-color: rgba(16,185,129,0.5);
}
.complete-cta.all-done .cta-label { font-size: 16px; }

@keyframes cta-enter {
  from { opacity: 0; transform: translateY(10px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0)   scale(1); }
}

@keyframes cta-glow {
  0%, 100% { box-shadow: none; }
  50% { box-shadow: 0 -4px 20px rgba(16,185,129,0.25); }
}

.cta-icon { font-size: 20px; }

.cta-label {
  flex: 1;
  font-size: 15px;
  font-weight: 800;
  color: var(--color-accent);
  letter-spacing: 0.02em;
}

.cta-arrow {
  font-size: 18px;
  color: var(--color-accent);
  font-weight: 700;
}

/* Footer */
/* Action bar (Done → rest countdown → GO) */
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}
.action-bar.resting { border-top-color: rgba(245,158,11,0.3); background: rgba(245,158,11,0.08); }
.action-bar.go {
  border-top-color: rgba(16,185,129,0.5);
  background: rgba(16,185,129,0.12);
  animation: go-pulse 1.1s ease-in-out infinite;
}
.action-main {
  flex: 1;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 14px;
  border-radius: var(--radius);
  font-size: 16px; font-weight: 800;
  font-family: inherit; cursor: pointer;
  border: none;
  background: var(--color-primary);
  color: #fff;
  transition: opacity 0.15s;
}
.action-main:hover { opacity: 0.92; }
.action-main.go-btn, .action-main.complete-btn { background: var(--color-accent); }
.action-arm { width: 24px; height: auto; }
.rest-count {
  flex: 1;
  text-align: center;
  font-size: 24px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--color-xp);
}
.rest-add, .rest-skip {
  flex-shrink: 0;
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 13px; font-weight: 700;
  font-family: inherit; cursor: pointer;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  transition: all 0.15s;
}
.rest-add:hover { border-color: var(--color-xp); color: var(--color-xp); }
.rest-skip {
  background: rgba(124,58,237,0.12);
  border-color: rgba(124,58,237,0.3);
  color: var(--color-primary);
}
.rest-skip:hover { background: rgba(124,58,237,0.22); }

.panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 16px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

.footer-sets { display: flex; gap: 6px; }
.footer-right { display: flex; gap: 6px; }

.btn-footer {
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 12px; font-weight: 700;
  border: 1px solid var(--color-border);
  background: var(--color-surface-2);
  color: var(--color-text-muted);
  font-family: inherit; cursor: pointer;
  transition: all 0.15s;
}
.btn-footer:hover { border-color: var(--color-primary); color: var(--color-primary); }
.btn-footer.warmup:hover { border-color: rgba(148,163,184,0.5); color: var(--color-text-muted); }

.btn-watch {
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px; font-weight: 700;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.25);
  color: #f87171;
  font-family: inherit; cursor: pointer;
  transition: background 0.15s;
}
.btn-watch:hover { background: rgba(239,68,68,0.2); }

.btn-remove-ex {
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px; font-weight: 700;
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-family: inherit; cursor: pointer;
  transition: all 0.15s;
}
.btn-remove-ex:hover { border-color: #f87171; color: #f87171; }
</style>
