<template>
  <Teleport to="body">
    <div class="overlay" @click.self="emit('close')">
      <div class="modal">
        <div class="fireworks">
          <span v-for="i in 8" :key="i" class="spark" :style="sparkStyle(i)" />
        </div>

        <p class="complete-label">WORKOUT COMPLETE</p>
        <h2 class="title">Muscles levelled up!</h2>

        <div class="rewards">
          <div class="reward-item xp">
            <span class="reward-icon">⚡</span>
            <span class="reward-value">+{{ reward.xp }}</span>
            <span class="reward-label">XP Earned</span>
          </div>
          <div class="reward-item muscles">
            <img src="/arm.png" alt="" class="reward-icon reward-arm" />
            <span class="reward-value">{{ reward.musclesTrained.length }}</span>
            <span class="reward-label">Muscle{{ reward.musclesTrained.length !== 1 ? 's' : '' }} Trained</span>
          </div>
        </div>

        <div v-if="reward.musclesTrained.length > 0" class="muscle-chips">
          <span v-for="m in reward.musclesTrained" :key="m" class="muscle-chip">
            {{ m.replace('-', ' ') }}
          </span>
        </div>

        <div v-if="reward.leveledUp" class="level-up">
          <span class="level-up-badge">LEVEL UP!</span>
          <span class="level-text">Level {{ reward.oldLevel }} → <strong>{{ reward.newLevel }}</strong></span>
        </div>

        <button class="btn-claim btn btn-primary" @click="emit('close')">
          CLAIM XP
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { WorkoutReward } from '@/stores/workout'

defineProps<{ reward: WorkoutReward }>()
const emit = defineEmits<{ close: [] }>()

function sparkStyle(i: number) {
  const angle = (i / 8) * 360
  const dist = 60 + Math.random() * 40
  return {
    '--angle': `${angle}deg`,
    '--dist': `${dist}px`,
    '--delay': `${(i * 0.08).toFixed(2)}s`,
  }
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
  animation: fade-in 0.2s ease;
}

.modal {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 40px 32px;
  text-align: center;
  max-width: 400px;
  width: 100%;
  position: relative;
  animation: pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fireworks {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.spark {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-xp);
  animation: spark-out 0.8s ease-out var(--delay) both;
}

.spark:nth-child(even) { background: var(--color-primary); }
.spark:nth-child(3n)   { background: var(--color-accent); }

.complete-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.15em;
  color: var(--color-accent);
  margin-bottom: 8px;
}

.title {
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 32px;
}

.rewards {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 20px;
}

.reward-item {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.reward-icon { font-size: 28px; margin-bottom: 4px; }
.reward-arm { width: 30px; height: auto; }

.reward-value {
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
}

.xp .reward-value { color: var(--color-xp); }
.muscles .reward-value { color: var(--color-accent); }

.reward-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
}

.muscle-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-bottom: 20px;
}

.muscle-chip {
  font-size: 11px;
  font-weight: 700;
  text-transform: capitalize;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: var(--color-accent);
}

.level-up {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: rgba(124, 58, 237, 0.15);
  border: 1px solid rgba(124, 58, 237, 0.3);
  border-radius: var(--radius);
  padding: 10px 16px;
  margin-bottom: 24px;
}

.level-up-badge {
  background: var(--color-primary);
  color: white;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  padding: 3px 8px;
  border-radius: 4px;
}

.level-text { font-size: 14px; color: var(--color-text); }

.btn-claim {
  width: 100%;
  padding: 14px;
  font-size: 15px;
  letter-spacing: 0.05em;
}

@keyframes fade-in {
  from { opacity: 0 } to { opacity: 1 }
}

@keyframes pop-in {
  from { opacity: 0; transform: scale(0.8) }
  to   { opacity: 1; transform: scale(1) }
}

@keyframes spark-out {
  0%   { transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0) scale(1); opacity: 1 }
  100% { transform: translate(-50%, -50%) rotate(var(--angle)) translateX(var(--dist)) scale(0); opacity: 0 }
}
</style>
