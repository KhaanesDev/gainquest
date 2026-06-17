<template>
  <div
    class="sw"
    :class="{ 'sw--disabled': disabled }"
    @wheel.prevent="onWheel"
    @mousedown.prevent="onMouseDown"
    @touchstart.prevent="onTouchStart"
    @touchmove.prevent="onTouchMove"
    @touchend="onTouchEnd"
  >
    <div class="sw-band" />
    <div class="sw-track" :style="trackStyle">
      <div
        v-for="(val, i) in items"
        :key="i"
        class="sw-item"
        :style="getItemStyle(i)"
      >{{ formatValue(val) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: number | null
  max?: number
  step?: number
  disabled?: boolean
  customItems?: number[]
  formatFn?: (v: number | null) => string
}>(), {
  max: 300,
  step: 0.5,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const ITEM_H = 28   // px per item
const VISIBLE = 5   // visible items
const CENTER = Math.floor(VISIBLE / 2) // = 2, the center slot index

// Items: customItems if provided, else null (BW) + step increments
const items = computed<Array<number | null>>(() => {
  if (props.customItems) return props.customItems
  const arr: Array<number | null> = [null]
  for (let w = props.step; w <= props.max + 1e-9; w += props.step) {
    arr.push(parseFloat(w.toFixed(1)))
  }
  return arr
})

const minY = computed(() => CENTER * ITEM_H - (items.value.length - 1) * ITEM_H)
const maxY = computed(() => CENTER * ITEM_H)

// null → 0, 0 → 0, x → nearest index
function valueToIndex(v: number | null): number {
  if (v === null || v === 0) return 0
  if (props.customItems) {
    let best = 0
    let bestDiff = Infinity
    for (let i = 0; i < props.customItems.length; i++) {
      const diff = Math.abs(props.customItems[i] - (v ?? 0))
      if (diff < bestDiff) { bestDiff = diff; best = i }
    }
    return best
  }
  const i = Math.round(v / props.step)
  return Math.max(0, Math.min(items.value.length - 1, i))
}

const currentIndex = ref(valueToIndex(props.modelValue))
const trackY = ref(CENTER * ITEM_H - currentIndex.value * ITEM_H)
const isSnapping = ref(false)
let snapTimer: ReturnType<typeof setTimeout> | null = null

watch(() => props.modelValue, v => {
  const i = valueToIndex(v)
  if (i !== currentIndex.value) goToIndex(i, true)
})

// Continuous visual center (may be fractional during drag)
const visualIndex = computed(() => (CENTER * ITEM_H - trackY.value) / ITEM_H)

const trackStyle = computed(() => ({
  transform: `translateY(${trackY.value}px)`,
  transition: isSnapping.value ? 'transform 0.18s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
}))

function goToIndex(i: number, animate: boolean) {
  const clamped = Math.max(0, Math.min(items.value.length - 1, i))
  currentIndex.value = clamped
  const target = CENTER * ITEM_H - clamped * ITEM_H
  if (snapTimer) clearTimeout(snapTimer)
  if (animate) {
    isSnapping.value = true
    trackY.value = target
    snapTimer = setTimeout(() => { isSnapping.value = false }, 240)
  } else {
    isSnapping.value = false
    trackY.value = target
  }
  emit('update:modelValue', items.value[clamped])
}

function snapFromTrackY() {
  const i = Math.round((CENTER * ITEM_H - trackY.value) / ITEM_H)
  goToIndex(i, true)
}

// ── Mouse wheel ────────────────────────────────────────────────────────────
function onWheel(e: WheelEvent) {
  if (props.disabled) return
  goToIndex(currentIndex.value + (e.deltaY > 0 ? 1 : -1), true)
}

// ── Mouse drag ─────────────────────────────────────────────────────────────
let dragStartClientY = 0
let dragStartTrackY = 0

function onMouseDown(e: MouseEvent) {
  if (props.disabled) return
  dragStartClientY = e.clientY
  dragStartTrackY = trackY.value
  isSnapping.value = false
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e: MouseEvent) {
  const raw = dragStartTrackY + (e.clientY - dragStartClientY)
  trackY.value = Math.max(minY.value, Math.min(maxY.value, raw))
}

function onMouseUp() {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  snapFromTrackY()
}

// ── Touch drag ─────────────────────────────────────────────────────────────
let touchStartClientY = 0
let touchStartTrackY = 0

function onTouchStart(e: TouchEvent) {
  if (props.disabled) return
  touchStartClientY = e.touches[0].clientY
  touchStartTrackY = trackY.value
  isSnapping.value = false
}

function onTouchMove(e: TouchEvent) {
  const raw = touchStartTrackY + (e.touches[0].clientY - touchStartClientY)
  trackY.value = Math.max(minY.value, Math.min(maxY.value, raw))
}

function onTouchEnd() {
  snapFromTrackY()
}

// ── Item styles (update live as track moves) ────────────────────────────────
function getItemStyle(i: number) {
  const dist = Math.abs(i - visualIndex.value)
  const opacity = Math.max(0.04, 1 - dist * 0.36)
  const scale = Math.max(0.66, 1.08 - dist * 0.14)
  return {
    opacity,
    transform: `scale(${scale})`,
    fontWeight: dist < 0.5 ? '700' : '400',
    color: dist < 0.5 ? 'var(--color-text)' : 'var(--color-text-muted)',
  }
}

function formatValue(v: number | null) {
  if (props.formatFn) return props.formatFn(v)
  if (v === null) return 'BW'
  return v % 1 === 0 ? String(v) : v.toFixed(1)
}

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  if (snapTimer) clearTimeout(snapTimer)
})
</script>

<style scoped>
.sw {
  position: relative;
  height: 140px; /* VISIBLE * ITEM_H = 5 * 28 */
  overflow: hidden;
  cursor: grab;
  user-select: none;
  touch-action: none;
  border-radius: var(--radius);
  /* fade top/bottom edges without needing to match parent background */
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 28%,
    black 72%,
    transparent 100%
  );
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 28%,
    black 72%,
    transparent 100%
  );
}

.sw--disabled {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
}

.sw:active {
  cursor: grabbing;
}

/* ── Track ─────────────────────────────────────────────────────────────── */
.sw-track {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2;
}

.sw-item {
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  pointer-events: none;
  will-change: transform, opacity;
}

/* ── Center selection band ─────────────────────────────────────────────── */
.sw-band {
  position: absolute;
  /* top of center slot = CENTER * ITEM_H = 2 * 28 = 56px */
  top: 56px;
  left: 4px;
  right: 4px;
  height: 28px;
  background: var(--color-surface-2);
  border-top: 1px solid rgba(124, 58, 237, 0.25);
  border-bottom: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 5px;
  z-index: 1;
}

</style>
