<template>
  <Teleport to="body">
    <div class="overlay" @click.self="emit('close')">
      <!-- Aurora backdrop -->
      <div class="aurora" aria-hidden="true">
        <div class="band band-1" />
        <div class="band band-2" />
        <div class="band band-3" />
      </div>

      <div class="modal">
        <div class="fireworks">
          <span v-for="i in 8" :key="i" class="spark" :style="sparkStyle(i)" />
        </div>

        <p class="complete-label">{{ $t('reward.complete') }}</p>
        <h2 class="title">{{ $t('reward.title') }}</h2>

        <div class="rewards">
          <div class="reward-item xp">
            <span class="reward-icon">⚡</span>
            <span class="reward-value">+{{ displayXp }}</span>
            <span class="reward-label">{{ $t('reward.xpEarned') }}</span>
          </div>
          <div class="reward-item muscles">
            <img src="/arm.png" alt="" class="reward-icon reward-arm" />
            <span class="reward-value">{{ reward.musclesTrained.length }}</span>
            <span class="reward-label">{{ $t('reward.musclesTrained', reward.musclesTrained.length) }}</span>
          </div>
        </div>

        <div v-if="reward.musclesTrained.length > 0" class="muscle-chips">
          <span v-for="m in reward.musclesTrained" :key="m" class="muscle-chip">
            {{ $t('muscles.' + m) }}
          </span>
        </div>

        <div v-if="reward.leveledUp" class="level-up">
          <span class="level-up-badge">{{ $t('reward.levelUp') }}</span>
          <span class="level-text">{{ $t('reward.levelWord') }} {{ reward.oldLevel }} → <strong>{{ reward.newLevel }}</strong></span>
        </div>

        <button class="btn-claim btn btn-primary" @click="emit('close')">
          {{ $t('reward.claimXp') }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { WorkoutReward } from '@/stores/workout'

const props = defineProps<{ reward: WorkoutReward }>()
const emit = defineEmits<{ close: [] }>()

// Satisfying count-up for the XP number.
const displayXp = ref(0)

onMounted(() => {
  const target = props.reward.xp
  if (target <= 0) { displayXp.value = target; return }
  const duration = 1000
  const start = performance.now()
  function tick(now: number) {
    const t = Math.min(1, (now - start) / duration)
    const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
    displayXp.value = Math.round(target * eased)
    if (t < 1) requestAnimationFrame(tick)
    else displayXp.value = target
  }
  requestAnimationFrame(tick)
})

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
  overflow: hidden;
  animation: fade-in 0.2s ease;
}

/* ── Aurora / northern lights ──────────────────────────────────── */
.aurora {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.band {
  position: absolute;
  left: -25%;
  right: -25%;
  height: 55%;
  filter: blur(60px);
  opacity: 0.38;
  mix-blend-mode: screen;
  will-change: transform;
}

.band-1 {
  top: 2%;
  background: linear-gradient(100deg, transparent 0%, #10b981 35%, #22d3ee 60%, transparent 100%);
  animation: drift-1 9s ease-in-out infinite alternate;
}
.band-2 {
  top: 22%;
  background: linear-gradient(75deg, transparent 0%, #7c3aed 45%, #a855f7 65%, transparent 100%);
  animation: drift-2 12s ease-in-out infinite alternate;
}
.band-3 {
  top: -8%;
  background: linear-gradient(120deg, transparent 0%, #06b6d4 40%, #10b981 70%, transparent 100%);
  animation: drift-3 10.5s ease-in-out infinite alternate;
}

@keyframes drift-1 {
  0%   { transform: translate(-8%, -6%) skewY(-7deg) scaleY(1); }
  100% { transform: translate(10%, 6%)  skewY(5deg)  scaleY(1.25); }
}
@keyframes drift-2 {
  0%   { transform: translate(6%, 4%)   skewY(6deg)  scaleY(1.1); }
  100% { transform: translate(-9%, -5%) skewY(-6deg) scaleY(0.9); }
}
@keyframes drift-3 {
  0%   { transform: translate(-5%, 5%)  skewY(-4deg) scaleY(1); }
  100% { transform: translate(8%, -4%)  skewY(8deg)  scaleY(1.3); }
}

@media (prefers-reduced-motion: reduce) {
  .band { animation: none; }
}

/* ── Modal ─────────────────────────────────────────────────────── */
.modal {
  position: relative;
  z-index: 1;
  background: rgba(21, 18, 30, 0.86);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 40px 32px;
  text-align: center;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 8px 50px rgba(0, 0, 0, 0.5);
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
  background: rgba(255, 255, 255, 0.04);
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

.xp .reward-value {
  color: var(--color-xp);
  text-shadow: 0 0 16px rgba(245, 158, 11, 0.55);
  animation: xp-glow 1.8s ease-in-out infinite;
}
.muscles .reward-value { color: var(--color-accent); }

@keyframes xp-glow {
  0%, 100% { text-shadow: 0 0 14px rgba(245, 158, 11, 0.4); }
  50%      { text-shadow: 0 0 24px rgba(245, 158, 11, 0.75); }
}

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
