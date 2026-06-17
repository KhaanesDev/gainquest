<template>
  <div class="display" :class="size">
    <!-- FRONT -->
    <svg viewBox="0 0 110 300" class="body-svg">
      <circle cx="55" cy="16" r="14" class="skeleton" />
      <rect x="51" y="30" width="8" height="9" rx="3" class="skeleton" />
      <ellipse cx="23" cy="60" rx="13" ry="17" v-bind="ms('shoulders')" />
      <ellipse cx="87" cy="60" rx="13" ry="17" v-bind="ms('shoulders')" />
      <path d="M36,42 L54,42 L54,88 Q44,93 35,88 Q31,82 31,56 Z" v-bind="ms('chest')" />
      <path d="M74,42 L56,42 L56,88 Q66,93 75,88 Q79,82 79,56 Z" v-bind="ms('chest')" />
      <rect x="11" y="77" width="12" height="36" rx="6" v-bind="ms('biceps')" />
      <rect x="87" y="77" width="12" height="36" rx="6" v-bind="ms('biceps')" />
      <rect x="12" y="116" width="10" height="28" rx="5" v-bind="ms('forearms')" />
      <rect x="88" y="116" width="10" height="28" rx="5" v-bind="ms('forearms')" />
      <rect x="38" y="88" width="34" height="46" rx="6" v-bind="ms('abs')" />
      <rect x="31" y="150" width="22" height="66" rx="8" v-bind="ms('quads')" />
      <rect x="57" y="150" width="22" height="66" rx="8" v-bind="ms('quads')" />
      <rect x="33" y="220" width="18" height="52" rx="7" v-bind="ms('calves')" />
      <rect x="59" y="220" width="18" height="52" rx="7" v-bind="ms('calves')" />
    </svg>
    <!-- BACK -->
    <svg viewBox="0 0 110 300" class="body-svg">
      <circle cx="55" cy="16" r="14" class="skeleton" />
      <rect x="51" y="30" width="8" height="9" rx="3" class="skeleton" />
      <path d="M40,36 L55,30 L70,36 L68,57 L55,61 L42,57 Z" v-bind="ms('traps')" />
      <ellipse cx="23" cy="60" rx="13" ry="17" v-bind="ms('shoulders')" />
      <ellipse cx="87" cy="60" rx="13" ry="17" v-bind="ms('shoulders')" />
      <path d="M30,64 L54,44 L54,106 Q40,112 32,102 Q28,90 28,70 Z" v-bind="ms('lats')" />
      <path d="M80,64 L56,44 L56,106 Q70,112 78,102 Q82,90 82,70 Z" v-bind="ms('lats')" />
      <rect x="38" y="106" width="34" height="22" rx="5" v-bind="ms('lower-back')" />
      <rect x="11" y="77" width="12" height="36" rx="6" v-bind="ms('triceps')" />
      <rect x="87" y="77" width="12" height="36" rx="6" v-bind="ms('triceps')" />
      <rect x="12" y="116" width="10" height="28" rx="5" v-bind="ms('forearms')" />
      <rect x="88" y="116" width="10" height="28" rx="5" v-bind="ms('forearms')" />
      <rect x="31" y="150" width="22" height="32" rx="8" v-bind="ms('glutes')" />
      <rect x="57" y="150" width="22" height="32" rx="8" v-bind="ms('glutes')" />
      <rect x="31" y="185" width="22" height="32" rx="8" v-bind="ms('hamstrings')" />
      <rect x="57" y="185" width="22" height="32" rx="8" v-bind="ms('hamstrings')" />
      <rect x="33" y="220" width="18" height="52" rx="7" v-bind="ms('calves')" />
      <rect x="59" y="220" width="18" height="52" rx="7" v-bind="ms('calves')" />
    </svg>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  highlighted?: string[]
  muscleXp?: Record<string, number>
  heatmap?: Record<string, number>
  size?: 'sm' | 'lg'
}>()

const TARGET_XP = 350

function ms(id: string): Record<string, string> {
  if (props.heatmap) {
    const count = props.heatmap[id] ?? 0
    if (count === 0) {
      return { fill: 'rgba(255,255,255,0.03)', stroke: 'rgba(255,255,255,0.08)', 'stroke-width': '1' }
    }
    const max = Math.max(1, ...Object.values(props.heatmap))
    const ratio = count / max
    // red (0°) → yellow (50°) → green (120°)
    const hue = Math.round(ratio * 120)
    return {
      fill: `hsla(${hue}, 85%, 42%, 0.8)`,
      stroke: `hsl(${hue}, 90%, 58%)`,
      'stroke-width': '1.5',
    }
  }

  if (props.muscleXp) {
    const xp = props.muscleXp[id] ?? 0
    if (xp === 0) {
      return { fill: 'rgba(255,255,255,0.04)', stroke: 'rgba(255,255,255,0.1)', 'stroke-width': '1' }
    }
    const ratio = Math.min(1, xp / TARGET_XP)
    const hue = Math.round(ratio * 120)
    return {
      fill: `hsla(${hue}, 75%, 38%, 0.85)`,
      stroke: `hsl(${hue}, 85%, 58%)`,
      'stroke-width': '1.5',
    }
  }

  const active = props.highlighted?.includes(id) ?? false
  if (active) {
    return { fill: 'rgba(124,58,237,0.45)', stroke: 'var(--color-primary)', 'stroke-width': '1.5' }
  }
  return { fill: 'rgba(255,255,255,0.03)', stroke: 'rgba(255,255,255,0.08)', 'stroke-width': '1' }
}
</script>

<style scoped>
.display {
  display: flex;
  gap: 3px;
  align-items: center;
  flex-shrink: 0;
}

.body-svg {
  display: block;
}

.display.sm .body-svg { width: 40px; height: auto; }
.display.lg .body-svg { width: 90px; height: auto; }

/* default (no size prop) = sm */
.display:not(.sm):not(.lg) .body-svg { width: 40px; height: auto; }

.skeleton {
  fill: var(--color-surface-2);
  stroke: var(--color-border);
  stroke-width: 1;
}
</style>
