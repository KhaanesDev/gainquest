<template>
  <div class="exercise-card" :class="{ done: isDone }" @click="open = true">
    <div class="card-main">
      <p class="ex-name">{{ exercise.name || 'Unnamed Exercise' }}</p>
      <p class="ex-meta muted">
        <template v-if="warmupCount > 0">W{{ warmupCount }} + {{ workingCount }} sets</template>
        <template v-else>{{ exercise.sets.length }} sets</template>
        <span v-if="completedCount > 0"> · {{ completedCount }} done</span>
      </p>
    </div>
    <div class="card-right">
      <div class="progress-pill" :class="{ complete: isDone }">
        {{ completedCount }}/{{ exercise.sets.length }}
      </div>
      <span class="chevron">›</span>
    </div>
  </div>

  <ExerciseOverlay
    v-if="open"
    :exercise="exercise"
    @close="open = false"
    @remove="emit('remove')"
    @complete-workout="emit('complete-workout')"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { WorkoutExercise } from '@/stores/workout'
import ExerciseOverlay from './ExerciseOverlay.vue'

const props = defineProps<{ exercise: WorkoutExercise }>()
const emit = defineEmits<{ remove: []; 'complete-workout': [] }>()

const open = ref(false)

const completedCount = computed(() => props.exercise.sets.filter(s => s.completed).length)
const warmupCount = computed(() => props.exercise.sets.filter(s => s.type === 'warmup').length)
const workingCount = computed(() => props.exercise.sets.filter(s => s.type === 'working').length)
const isDone = computed(() => props.exercise.sets.length > 0 && completedCount.value === props.exercise.sets.length)
</script>

<style scoped>
.exercise-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
}

.exercise-card:hover {
  border-color: var(--color-primary);
  background: var(--color-surface-2);
}
.exercise-card.done {
  border-color: rgba(16,185,129,0.35);
  background: rgba(16,185,129,0.04);
}

.card-main { flex: 1; min-width: 0; }

.ex-name {
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ex-meta {
  font-size: 12px;
  margin-top: 3px;
}

.muted { color: var(--color-text-muted); }

.card-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.progress-pill {
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--color-surface-2);
  color: var(--color-text-muted);
  transition: all 0.15s;
}

.progress-pill.complete {
  background: rgba(16,185,129,0.12);
  border-color: rgba(16,185,129,0.3);
  color: var(--color-accent);
  animation: pill-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes pill-pop {
  0%   { transform: scale(0.75); opacity: 0.4; }
  60%  { transform: scale(1.18); }
  100% { transform: scale(1);    opacity: 1; }
}

.chevron {
  font-size: 20px;
  color: var(--color-text-muted);
  line-height: 1;
}
</style>
