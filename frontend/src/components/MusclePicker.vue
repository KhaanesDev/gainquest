<template>
  <div class="picker">
    <div class="body-views">
      <!-- FRONT -->
      <div class="body-view">
        <p class="view-label">Front</p>
        <svg viewBox="0 0 110 300" class="body-svg" xmlns="http://www.w3.org/2000/svg">
          <!-- non-interactive skeleton -->
          <circle cx="55" cy="16" r="14" class="skeleton" />
          <rect x="51" y="30" width="8" height="9" rx="3" class="skeleton" />

          <!-- Chest -->
          <path d="M36,42 L54,42 L54,88 Q44,93 35,88 Q31,82 31,56 Z"
            class="muscle" v-bind="ms('chest')" @click="toggle('chest')">
            <title>Chest</title></path>
          <path d="M74,42 L56,42 L56,88 Q66,93 75,88 Q79,82 79,56 Z"
            class="muscle" v-bind="ms('chest')" @click="toggle('chest')">
            <title>Chest</title></path>

          <!-- Biceps -->
          <rect x="11" y="77" width="12" height="36" rx="6"
            class="muscle" v-bind="ms('biceps')" @click="toggle('biceps')">
            <title>Biceps</title></rect>
          <rect x="87" y="77" width="12" height="36" rx="6"
            class="muscle" v-bind="ms('biceps')" @click="toggle('biceps')">
            <title>Biceps</title></rect>

          <!-- Forearms -->
          <rect x="12" y="116" width="10" height="28" rx="5"
            class="muscle" v-bind="ms('forearms')" @click="toggle('forearms')">
            <title>Forearms</title></rect>
          <rect x="88" y="116" width="10" height="28" rx="5"
            class="muscle" v-bind="ms('forearms')" @click="toggle('forearms')">
            <title>Forearms</title></rect>

          <!-- Abs -->
          <rect x="38" y="88" width="34" height="46" rx="6"
            class="muscle" v-bind="ms('abs')" @click="toggle('abs')">
            <title>Abs</title></rect>

          <!-- Quads -->
          <rect x="31" y="150" width="22" height="66" rx="8"
            class="muscle" v-bind="ms('quads')" @click="toggle('quads')">
            <title>Quads</title></rect>
          <rect x="57" y="150" width="22" height="66" rx="8"
            class="muscle" v-bind="ms('quads')" @click="toggle('quads')">
            <title>Quads</title></rect>

          <!-- Calves front -->
          <rect x="33" y="220" width="18" height="52" rx="7"
            class="muscle" v-bind="ms('calves')" @click="toggle('calves')">
            <title>Calves</title></rect>
          <rect x="59" y="220" width="18" height="52" rx="7"
            class="muscle" v-bind="ms('calves')" @click="toggle('calves')">
            <title>Calves</title></rect>

          <!-- Shoulders rendered last so they win clicks over chest in overlap area -->
          <ellipse cx="23" cy="60" rx="13" ry="17"
            class="muscle" v-bind="ms('shoulders')" @click="toggle('shoulders')">
            <title>Shoulders</title></ellipse>
          <ellipse cx="87" cy="60" rx="13" ry="17"
            class="muscle" v-bind="ms('shoulders')" @click="toggle('shoulders')">
            <title>Shoulders</title></ellipse>

          <!-- Inline labels on hovered/selected muscles -->
          <text v-if="selected.includes('chest')"    x="55" y="70" class="svg-label" text-anchor="middle">Chest</text>
          <text v-if="selected.includes('abs')"      x="55" y="114" class="svg-label" text-anchor="middle">Abs</text>
          <text v-if="selected.includes('quads')"    x="55" y="186" class="svg-label" text-anchor="middle">Quads</text>
          <text v-if="selected.includes('calves')"   x="55" y="248" class="svg-label" text-anchor="middle">Calves</text>
          <text v-if="selected.includes('biceps')"   x="17" y="97" class="svg-label" text-anchor="middle">Bi</text>
          <text v-if="selected.includes('forearms')" x="17" y="133" class="svg-label" text-anchor="middle">FA</text>
          <text v-if="selected.includes('shoulders')" x="23" y="60" class="svg-label" text-anchor="middle">SH</text>
        </svg>
      </div>

      <!-- BACK -->
      <div class="body-view">
        <p class="view-label">Back</p>
        <svg viewBox="0 0 110 300" class="body-svg" xmlns="http://www.w3.org/2000/svg">
          <!-- skeleton -->
          <circle cx="55" cy="16" r="14" class="skeleton" />
          <rect x="51" y="30" width="8" height="9" rx="3" class="skeleton" />

          <!-- Lats -->
          <path d="M30,64 L54,44 L54,106 Q40,112 32,102 Q28,90 28,70 Z"
            class="muscle" v-bind="ms('lats')" @click="toggle('lats')">
            <title>Lats</title></path>
          <path d="M80,64 L56,44 L56,106 Q70,112 78,102 Q82,90 82,70 Z"
            class="muscle" v-bind="ms('lats')" @click="toggle('lats')">
            <title>Lats</title></path>

          <!-- Lower Back -->
          <rect x="38" y="106" width="34" height="22" rx="5"
            class="muscle" v-bind="ms('lower-back')" @click="toggle('lower-back')">
            <title>Lower Back</title></rect>

          <!-- Triceps -->
          <rect x="11" y="77" width="12" height="36" rx="6"
            class="muscle" v-bind="ms('triceps')" @click="toggle('triceps')">
            <title>Triceps</title></rect>
          <rect x="87" y="77" width="12" height="36" rx="6"
            class="muscle" v-bind="ms('triceps')" @click="toggle('triceps')">
            <title>Triceps</title></rect>

          <!-- Forearms back -->
          <rect x="12" y="116" width="10" height="28" rx="5"
            class="muscle" v-bind="ms('forearms')" @click="toggle('forearms')">
            <title>Forearms</title></rect>
          <rect x="88" y="116" width="10" height="28" rx="5"
            class="muscle" v-bind="ms('forearms')" @click="toggle('forearms')">
            <title>Forearms</title></rect>

          <!-- Glutes -->
          <rect x="31" y="150" width="22" height="32" rx="8"
            class="muscle" v-bind="ms('glutes')" @click="toggle('glutes')">
            <title>Glutes</title></rect>
          <rect x="57" y="150" width="22" height="32" rx="8"
            class="muscle" v-bind="ms('glutes')" @click="toggle('glutes')">
            <title>Glutes</title></rect>

          <!-- Hamstrings -->
          <rect x="31" y="185" width="22" height="32" rx="8"
            class="muscle" v-bind="ms('hamstrings')" @click="toggle('hamstrings')">
            <title>Hamstrings</title></rect>
          <rect x="57" y="185" width="22" height="32" rx="8"
            class="muscle" v-bind="ms('hamstrings')" @click="toggle('hamstrings')">
            <title>Hamstrings</title></rect>

          <!-- Calves back -->
          <rect x="33" y="220" width="18" height="52" rx="7"
            class="muscle" v-bind="ms('calves')" @click="toggle('calves')">
            <title>Calves</title></rect>
          <rect x="59" y="220" width="18" height="52" rx="7"
            class="muscle" v-bind="ms('calves')" @click="toggle('calves')">
            <title>Calves</title></rect>

          <!-- Rear Delts rendered after lats so they win in overlap -->
          <ellipse cx="23" cy="60" rx="13" ry="17"
            class="muscle" v-bind="ms('shoulders')" @click="toggle('shoulders')">
            <title>Rear Deltoids</title></ellipse>
          <ellipse cx="87" cy="60" rx="13" ry="17"
            class="muscle" v-bind="ms('shoulders')" @click="toggle('shoulders')">
            <title>Rear Deltoids</title></ellipse>

          <!-- Traps rendered last so it wins over lats in upper-back overlap -->
          <path d="M40,36 L55,30 L70,36 L68,57 L55,61 L42,57 Z"
            class="muscle" v-bind="ms('traps')" @click="toggle('traps')">
            <title>Trapezius</title></path>

          <!-- Labels -->
          <text v-if="selected.includes('traps')"      x="55" y="47" class="svg-label" text-anchor="middle">Traps</text>
          <text v-if="selected.includes('lats')"       x="55" y="82" class="svg-label" text-anchor="middle">Lats</text>
          <text v-if="selected.includes('lower-back')" x="55" y="120" class="svg-label" text-anchor="middle">Low Back</text>
          <text v-if="selected.includes('glutes')"     x="55" y="169" class="svg-label" text-anchor="middle">Glutes</text>
          <text v-if="selected.includes('hamstrings')" x="55" y="204" class="svg-label" text-anchor="middle">Hams</text>
          <text v-if="selected.includes('calves')"     x="55" y="248" class="svg-label" text-anchor="middle">Calves</text>
          <text v-if="selected.includes('triceps')"    x="17" y="97" class="svg-label" text-anchor="middle">Tri</text>
          <text v-if="selected.includes('shoulders')"  x="23" y="60" class="svg-label" text-anchor="middle">SH</text>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  selected: string[]
  // Count of cart exercises working each muscle id; drives fill intensity.
  heatmap?: Record<string, number>
}>()
const emit = defineEmits<{ toggle: [id: string] }>()

function toggle(id: string) {
  emit('toggle', id)
}

// Exercises hitting one muscle before it reaches full intensity. Absolute
// (not relative to the cart) so colour reflects actual volume per muscle.
const INTENSITY_CAP = 4

// Returns SVG fill/stroke for a muscle: fill intensifies with how many cart
// exercises hit it, and the selected (filter) muscle keeps a bold outline.
function ms(id: string): Record<string, string> {
  const count = props.heatmap?.[id] ?? 0
  const isSelected = props.selected.includes(id)

  let fill = 'var(--color-surface-2)'
  let stroke = 'var(--color-border)'
  let strokeWidth = '1'

  if (count > 0) {
    const ratio = Math.min(count, INTENSITY_CAP) / INTENSITY_CAP
    // red (0°) → yellow (60°) → green (120°), matching the workout heatmap
    const hue = Math.round(ratio * 120)
    fill = `hsla(${hue}, 85%, 42%, 0.85)`
    stroke = `hsl(${hue}, 90%, 58%)`
    strokeWidth = '1.5'
  }

  if (isSelected) {
    stroke = 'var(--color-primary)'
    strokeWidth = '2.5'
    if (count === 0) fill = 'rgba(124, 58, 237, 0.4)'
  }

  return { fill, stroke, 'stroke-width': strokeWidth }
}
</script>

<style scoped>
.picker { display: flex; flex-direction: column; align-items: center; gap: 12px; }

.body-views {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.body-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.view-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
}

.body-svg {
  width: 160px;
  height: auto;
  display: block;
}

.skeleton {
  fill: var(--color-surface-2);
  stroke: var(--color-border);
  stroke-width: 1;
}

.muscle {
  cursor: pointer;
  transition: fill 0.2s, stroke 0.2s, filter 0.15s;
}

/* Fill/stroke are bound inline (intensity + selection), so hover uses
   brightness to give feedback without overriding the computed fill. */
.muscle:hover {
  filter: brightness(1.35);
}

.svg-label {
  font-size: 6px;
  font-weight: 700;
  fill: white;
  pointer-events: none;
  letter-spacing: 0.02em;
}
</style>
