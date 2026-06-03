<template>
  <div class="exercise-card">
    <div class="exercise-header">
      <input
        v-model="exercise.name"
        class="exercise-name-input"
        placeholder="Exercise name (e.g. Bench Press)"
      />
      <button class="btn-icon danger" @click="emit('remove')" title="Remove exercise">✕</button>
    </div>

    <div class="sets-table">
      <div class="sets-header">
        <span>SET</span>
        <span>REPS</span>
        <span>KG</span>
        <span></span>
      </div>

      <div
        v-for="(set, i) in exercise.sets"
        :key="set.id"
        class="set-row"
        :class="{ completed: set.completed }"
      >
        <span class="set-num">{{ i + 1 }}</span>
        <input
          v-model.number="set.reps"
          type="number"
          min="1"
          max="999"
          class="set-input"
          placeholder="—"
          :disabled="set.completed"
        />
        <input
          v-model.number="set.weightKg"
          type="number"
          min="0"
          max="999"
          step="0.5"
          class="set-input"
          placeholder="BW"
          :disabled="set.completed"
        />
        <div class="set-actions">
          <button
            class="btn-check"
            :class="{ active: set.completed }"
            @click="emit('toggle-set', set.id)"
            title="Mark complete"
          >✓</button>
          <button
            v-if="exercise.sets.length > 1"
            class="btn-icon small"
            @click="emit('remove-set', set.id)"
            title="Remove set"
          >✕</button>
        </div>
      </div>
    </div>

    <button class="btn-add-set" @click="emit('add-set')">+ Add Set</button>
  </div>
</template>

<script setup lang="ts">
import type { WorkoutExercise } from '@/stores/workout'

defineProps<{ exercise: WorkoutExercise }>()
const emit = defineEmits<{
  remove: []
  'add-set': []
  'remove-set': [setId: string]
  'toggle-set': [setId: string]
}>()
</script>

<style scoped>
.exercise-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.exercise-header {
  display: flex;
  gap: 8px;
  align-items: center;
}

.exercise-name-input {
  flex: 1;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 8px 12px;
  color: var(--color-text);
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  outline: none;
}

.exercise-name-input:focus {
  border-color: var(--color-primary);
}

.exercise-name-input::placeholder {
  color: var(--color-text-muted);
  font-weight: 400;
}

.sets-table {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sets-header {
  display: grid;
  grid-template-columns: 32px 1fr 1fr 64px;
  gap: 8px;
  padding: 0 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.set-row {
  display: grid;
  grid-template-columns: 32px 1fr 1fr 64px;
  gap: 8px;
  align-items: center;
  padding: 6px 4px;
  border-radius: var(--radius);
  transition: background 0.15s;
}

.set-row.completed {
  background: rgba(16, 185, 129, 0.08);
}

.set-num {
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-muted);
}

.set-row.completed .set-num {
  color: var(--color-accent);
}

.set-input {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 7px 8px;
  color: var(--color-text);
  font-size: 14px;
  font-family: inherit;
  text-align: center;
  outline: none;
  width: 100%;
  transition: border-color 0.15s;
}

.set-input:focus {
  border-color: var(--color-primary);
}

.set-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.set-input::placeholder {
  color: var(--color-text-muted);
}

/* remove number input arrows */
.set-input::-webkit-inner-spin-button,
.set-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
}

.set-actions {
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: flex-end;
}

.btn-check {
  width: 32px;
  height: 32px;
  border-radius: var(--radius);
  border: 2px solid var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-check:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.btn-check.active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
}

.btn-icon {
  width: 28px;
  height: 28px;
  border-radius: var(--radius);
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-icon:hover {
  background: var(--color-surface-2);
  color: var(--color-text);
}

.btn-icon.danger:hover {
  background: rgba(248, 113, 113, 0.1);
  color: #f87171;
}

.btn-icon.small {
  width: 22px;
  height: 22px;
  font-size: 10px;
}

.btn-add-set {
  align-self: flex-start;
  background: none;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius);
  padding: 6px 14px;
  color: var(--color-text-muted);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-add-set:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
</style>
