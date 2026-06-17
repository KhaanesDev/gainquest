<template>
  <div class="layout">
    <nav class="navbar">
      <RouterLink to="/dashboard" class="nav-brand">GainQuest</RouterLink>
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
        <h2 class="page-title">Progress</h2>
        <p class="page-sub">Your complete training history</p>
      </div>

      <div v-if="loading" class="loading muted">Loading…</div>

      <template v-else-if="sessions.length === 0">
        <div class="empty-state card">
          <p class="empty-icon">📈</p>
          <p>No workouts logged yet. Complete a session to start tracking your progress.</p>
          <RouterLink to="/workout" class="btn btn-primary">Start Workout</RouterLink>
        </div>
      </template>

      <template v-else>
        <!-- Summary stats -->
        <div class="summary-grid">
          <div class="card stat-card">
            <p class="stat-label">Total Workouts</p>
            <p class="stat-value accent">{{ sessions.length }}</p>
          </div>
          <div class="card stat-card">
            <p class="stat-label">Total XP</p>
            <p class="stat-value xp">{{ totalXp.toLocaleString() }}</p>
          </div>
          <div class="card stat-card">
            <p class="stat-label">Best Week</p>
            <p class="stat-value">{{ bestWeekCount }} <span class="stat-unit">sessions</span></p>
          </div>
          <div class="card stat-card">
            <p class="stat-label">Active Since</p>
            <p class="stat-value">{{ activeSince }}</p>
          </div>
        </div>

        <!-- XP Progression -->
        <div class="card chart-card">
          <h3 class="chart-title">XP Progression</h3>
          <p class="chart-sub muted">Cumulative XP earned over time</p>
          <div class="chart-wrap">
            <svg :viewBox="`0 0 ${CW} ${CH}`" class="chart-svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="xp-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.35"/>
                  <stop offset="100%" stop-color="#7c3aed" stop-opacity="0.02"/>
                </linearGradient>
                <linearGradient id="xp-line" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#7c3aed"/>
                  <stop offset="100%" stop-color="#a78bfa"/>
                </linearGradient>
              </defs>
              <line v-for="g in yGridLines" :key="g.y" :x1="LP" :y1="g.y" :x2="CW-RP" :y2="g.y" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
              <text v-for="g in yGridLines" :key="`yl-${g.y}`" :x="LP-6" :y="g.y+4" class="axis-label" text-anchor="end">{{ g.label }}</text>
              <text v-for="d in xDateLabels" :key="`xl-${d.x}`" :x="d.x" :y="CH-4" class="axis-label" text-anchor="middle">{{ d.label }}</text>
              <path :d="areaPath" fill="url(#xp-area)" />
              <path :d="linePath" fill="none" stroke="url(#xp-line)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
              <circle v-for="(pt, i) in linePoints" :key="i" :cx="pt.x" :cy="pt.y" r="3" fill="#7c3aed" stroke="#1a1a2e" stroke-width="1.5"/>
            </svg>
          </div>
        </div>

        <!-- Exercise Weight Progression -->
        <div v-if="exerciseOptions.length > 0" class="card chart-card">
          <div class="chart-header">
            <div>
              <h3 class="chart-title">Exercise Progression</h3>
              <p class="chart-sub muted">Weight lifted over time (kg)</p>
            </div>
            <select v-model="selectedExercise" class="ex-picker">
              <option v-for="opt in exerciseOptions" :key="opt.key" :value="opt.key">
                {{ opt.name }}
              </option>
            </select>
          </div>

          <div v-if="exLinePoints.length < 2" class="chart-empty muted">
            {{ exLinePoints.length === 1 ? 'Log this exercise again to see progression.' : 'No weight data for this exercise.' }}
          </div>

          <div v-else class="chart-wrap">
            <svg :viewBox="`0 0 ${CW} ${CH}`" class="chart-svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="ex-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#10b981" stop-opacity="0.3"/>
                  <stop offset="100%" stop-color="#10b981" stop-opacity="0.02"/>
                </linearGradient>
                <linearGradient id="ex-line" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#10b981"/>
                  <stop offset="100%" stop-color="#34d399"/>
                </linearGradient>
              </defs>
              <line v-for="g in exYGridLines" :key="g.y" :x1="LP" :y1="g.y" :x2="CW-RP" :y2="g.y" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
              <text v-for="g in exYGridLines" :key="`eyl-${g.y}`" :x="LP-6" :y="g.y+4" class="axis-label" text-anchor="end">{{ g.label }}</text>
              <text v-for="d in exXDateLabels" :key="`exl-${d.x}`" :x="d.x" :y="CH-4" class="axis-label" text-anchor="middle">{{ d.label }}</text>
              <path :d="exAreaPath" fill="url(#ex-area)"/>
              <path :d="exLinePath" fill="none" stroke="url(#ex-line)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
              <!-- Dots with weight tooltip via title -->
              <g v-for="(pt, i) in exLinePoints" :key="i">
                <circle :cx="pt.x" :cy="pt.y" r="4" fill="#10b981" stroke="#1a1a2e" stroke-width="1.5"/>
                <title>{{ pt.weight }}kg · {{ pt.dateLabel }}</title>
              </g>
            </svg>
          </div>
        </div>

        <!-- Weekly Frequency -->
        <div class="card chart-card">
          <h3 class="chart-title">Weekly Frequency</h3>
          <p class="chart-sub muted">Workouts completed per week</p>
          <div class="chart-wrap">
            <svg :viewBox="`0 0 ${BCW} ${BCH}`" class="chart-svg" preserveAspectRatio="none">
              <line v-for="g in barYGridLines" :key="g.y" :x1="BLP" :y1="g.y" :x2="BCW-BRP" :y2="g.y" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
              <text v-for="g in barYGridLines" :key="`byl-${g.y}`" :x="BLP-6" :y="g.y+4" class="axis-label" text-anchor="end">{{ g.label }}</text>
              <rect v-for="b in bars" :key="b.week" :x="b.x" :y="b.y" :width="b.width" :height="b.height" rx="3" :fill="b.isCurrentWeek ? '#10b981' : '#7c3aed'" :opacity="b.isCurrentWeek ? 0.9 : 0.65"/>
              <text v-for="b in labelledBars" :key="`bxl-${b.week}`" :x="b.x + b.width/2" :y="BCH-4" class="axis-label" text-anchor="middle">{{ b.label }}</text>
            </svg>
          </div>
        </div>

        <!-- Session log -->
        <div class="recent">
          <h3 class="section-title">Recent Workouts</h3>
          <div class="session-list">
            <div
              v-for="s in sessions.slice().reverse()"
              :key="s.id"
              class="card session-card"
              :class="{ expanded: expandedId === s.id }"
              @click="toggleSession(s.id)"
            >
              <div class="session-row">
                <div class="session-info">
                  <p class="session-name">{{ s.name }}</p>
                  <p class="session-date muted">{{ formatDate(s.completed_at) }}</p>
                </div>
                <div class="session-right">
                  <span class="tag xp">⚡ +{{ s.xp_earned }}</span>
                  <span class="chevron" :class="{ open: expandedId === s.id }">›</span>
                </div>
              </div>

              <div v-if="expandedId === s.id" class="exercise-list">
                <div v-if="!s.exercises || s.exercises.length === 0" class="ex-loading muted">
                  No exercises logged
                </div>
                <div v-else v-for="(ex, i) in sortedExercises(s.exercises)" :key="i" class="ex-row">
                  <span class="ex-name">{{ ex.name }}</span>
                  <span class="ex-detail muted">
                    {{ ex.sets }} sets
                    <template v-if="ex.reps"> · {{ ex.reps }} reps</template>
                    <template v-if="ex.weight_kg"> · {{ ex.weight_kg }} kg</template>
                    <template v-if="ex.duration_seconds"> · {{ formatDuration(ex.duration_seconds) }}</template>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

interface ExRow { name: string; sets: number; weight_kg: number | null; reps: number | null; duration_seconds: number | null; order_index: number | null }
interface Session { id: string; name: string; completed_at: string; xp_earned: number; exercises: ExRow[] }

const auth = useAuthStore()
const sessions = ref<Session[]>([])
const loading = ref(true)
const expandedId = ref<string | null>(null)

function toggleSession(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function sortedExercises(ex: ExRow[]) {
  return [...ex].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return sec > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${m}m`
}

// ── Chart constants (shared) ──────────────────────────────────────────────────
const CW = 600; const CH = 180
const LP = 52; const RP = 12; const TP = 16; const BP = 28

const BCW = 600; const BCH = 160
const BLP = 32; const BRP = 12; const BTP = 12; const BBP = 32

// ── Summary ───────────────────────────────────────────────────────────────────
const totalXp = computed(() => sessions.value.reduce((s, r) => s + r.xp_earned, 0))
const activeSince = computed(() => {
  if (!sessions.value.length) return '—'
  return new Date(sessions.value[0].completed_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
})

// ── Generic SVG helpers ───────────────────────────────────────────────────────
function toPoints(data: { date: Date; val: number }[]) {
  if (data.length < 2) return []
  const w = CW - LP - RP; const h = CH - TP - BP
  const minT = data[0].date.getTime(); const span = data[data.length - 1].date.getTime() - minT || 1
  const maxV = Math.max(...data.map(d => d.val)) || 1
  return data.map(d => ({
    x: LP + ((d.date.getTime() - minT) / span) * w,
    y: TP + h - (d.val / maxV) * h,
  }))
}

function toLinePath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return ''
  return 'M ' + pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')
}

function toAreaPath(linePath: string, pts: { x: number; y: number }[]) {
  if (!linePath) return ''
  const bottom = TP + (CH - TP - BP)
  return `${linePath} L ${pts[pts.length-1].x.toFixed(1)},${bottom} L ${pts[0].x.toFixed(1)},${bottom} Z`
}

function toYGridLines(maxVal: number) {
  if (!maxVal) return []
  const h = CH - TP - BP
  return Array.from({ length: 4 }, (_, i) => {
    const frac = (i + 1) / 4; const v = maxVal * frac
    return { y: TP + h - frac * h, label: v >= 1000 ? `${(v/1000).toFixed(1)}k` : String(Math.round(v)) }
  })
}

function toXDateLabels(data: { date: Date }[]) {
  if (data.length < 2) return []
  const w = CW - LP - RP
  const minT = data[0].date.getTime(); const span = data[data.length-1].date.getTime() - minT || 1
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const count = Math.min(data.length, 4)
  return Array.from({ length: count }, (_, i) => {
    const idx = Math.round(i * (data.length - 1) / (count - 1))
    return { x: LP + ((data[idx].date.getTime() - minT) / span) * w, label: fmt(data[idx].date) }
  })
}

// ── XP line chart ─────────────────────────────────────────────────────────────
const lineData = computed(() => {
  let cum = 0
  return sessions.value.map(s => ({ date: new Date(s.completed_at), val: (cum += s.xp_earned) }))
})
const linePoints  = computed(() => toPoints(lineData.value))
const linePath    = computed(() => toLinePath(linePoints.value))
const areaPath    = computed(() => toAreaPath(linePath.value, linePoints.value))
const yGridLines  = computed(() => toYGridLines(lineData.value[lineData.value.length - 1]?.val || 0))
const xDateLabels = computed(() => toXDateLabels(lineData.value))

// ── Exercise weight progression ───────────────────────────────────────────────
const exerciseMap = computed(() => {
  const map = new Map<string, { displayName: string; points: { date: Date; weight: number }[] }>()
  for (const s of sessions.value) {
    for (const ex of s.exercises ?? []) {
      if (!ex.weight_kg || ex.weight_kg <= 0) continue
      const key = ex.name.trim().toLowerCase()
      if (!map.has(key)) map.set(key, { displayName: ex.name.trim(), points: [] })
      map.get(key)!.points.push({ date: new Date(s.completed_at), weight: ex.weight_kg })
    }
  }
  return map
})

const exerciseOptions = computed(() =>
  Array.from(exerciseMap.value.entries())
    .sort(([, a], [, b]) => b.points.length - a.points.length)
    .map(([key, val]) => ({ key, name: val.displayName }))
)

const selectedExercise = ref('')

watch(exerciseOptions, opts => {
  if (opts.length && !selectedExercise.value) selectedExercise.value = opts[0].key
}, { immediate: true })

const exData = computed(() => {
  const entry = exerciseMap.value.get(selectedExercise.value)
  if (!entry) return []
  return entry.points
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(p => ({ date: p.date, val: p.weight, weight: p.weight, dateLabel: p.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) }))
})

const exLinePoints = computed(() => {
  const pts = toPoints(exData.value)
  return pts.map((p, i) => ({ ...p, weight: exData.value[i].weight, dateLabel: exData.value[i].dateLabel }))
})
const exLinePath    = computed(() => toLinePath(exLinePoints.value))
const exAreaPath    = computed(() => toAreaPath(exLinePath.value, exLinePoints.value))
const exYGridLines  = computed(() => toYGridLines(Math.max(...exData.value.map(d => d.val), 0)))
const exXDateLabels = computed(() => toXDateLabels(exData.value))

// ── Bar chart ─────────────────────────────────────────────────────────────────
const weeklyData = computed(() => {
  const map = new Map<string, number>()
  const mondayOf = (d: Date) => {
    const diff = d.getDay() === 0 ? -6 : 1 - d.getDay()
    const m = new Date(d); m.setDate(d.getDate() + diff); m.setHours(0,0,0,0)
    return m.toISOString().split('T')[0]
  }
  for (const s of sessions.value) map.set(mondayOf(new Date(s.completed_at)), (map.get(mondayOf(new Date(s.completed_at))) ?? 0) + 1)
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
})

const bestWeekCount = computed(() => Math.max(...weeklyData.value.map(([, c]) => c), 0))

const bars = computed(() => {
  const data = weeklyData.value.slice(-16)
  if (!data.length) return []
  const bw = BCW - BLP - BRP; const bh = BCH - BTP - BBP
  const maxC = Math.max(...data.map(([, c]) => c), 1)
  const step = bw / data.length; const barW = Math.max(4, step * 0.65)
  const todayWeek = (() => {
    const d = new Date(); const diff = d.getDay() === 0 ? -6 : 1 - d.getDay()
    const m = new Date(d); m.setDate(d.getDate() + diff); m.setHours(0,0,0,0)
    return m.toISOString().split('T')[0]
  })()
  return data.map(([week, count], i) => ({
    week, count,
    x: BLP + i * step + (step - barW) / 2,
    y: BTP + bh - (count / maxC) * bh,
    width: barW, height: (count / maxC) * bh,
    isCurrentWeek: week === todayWeek,
    label: new Date(week).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  }))
})

const labelledBars = computed(() => {
  const all = bars.value; if (!all.length) return []
  const step = Math.max(1, Math.ceil(all.length / 6))
  return all.filter((_, i) => i % step === 0 || i === all.length - 1)
})

const barYGridLines = computed(() => {
  const maxC = bestWeekCount.value || 1; const bh = BCH - BTP - BBP
  const steps = Math.min(maxC, 4)
  return Array.from({ length: steps }, (_, i) => {
    const frac = (i + 1) / steps
    return { y: BTP + bh - frac * bh, label: String(Math.round(maxC * frac)) }
  })
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

onMounted(async () => {
  if (!auth.user) return
  const { data } = await supabase
    .from('workout_sessions')
    .select('id, name, completed_at, xp_earned, exercises(name, sets, reps, weight_kg, duration_seconds, order_index)')
    .eq('user_id', auth.user.id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: true })
  sessions.value = (data ?? []) as Session[]
  loading.value = false
})
</script>

<style scoped>
.layout { min-height: 100vh; display: flex; flex-direction: column; }

.navbar {
  display: flex; align-items: center; gap: 24px;
  padding: 12px 24px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky; top: 0; z-index: 10;
}
.nav-brand { font-weight: 800; font-size: 18px; color: var(--color-primary); margin-right: auto; }
.nav-links { display: flex; gap: 20px; font-size: 14px; flex-wrap: wrap; }
.nav-links a { color: var(--color-text-muted); }
.nav-links a.router-link-active { color: var(--color-text); }

.main {
  padding: 28px 24px 60px;
  max-width: 760px; margin: 0 auto; width: 100%;
  display: flex; flex-direction: column; gap: 16px;
}
@media (max-width: 640px) {
  .main { padding: 16px 16px var(--tab-space); }
}

.page-title { font-size: 22px; font-weight: 800; }
.page-sub { font-size: 13px; color: var(--color-text-muted); margin-top: 4px; }
.muted { color: var(--color-text-muted); }
.loading { font-size: 13px; padding: 40px; text-align: center; }

.empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 48px 24px; text-align: center;
  color: var(--color-text-muted); font-size: 14px;
}
.empty-icon { font-size: 40px; }

.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
@media (max-width: 500px) { .summary-grid { grid-template-columns: repeat(2, 1fr); } }

.stat-card { text-align: center; padding: 14px 10px; }
.stat-label { font-size: 10px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
.stat-value { font-size: 22px; font-weight: 800; line-height: 1; }
.stat-value.xp { color: var(--color-xp); }
.stat-value.accent { color: var(--color-accent); }
.stat-unit { font-size: 11px; font-weight: 600; color: var(--color-text-muted); }

.chart-card { display: flex; flex-direction: column; gap: 4px; padding: 18px 16px 14px; }
.chart-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 4px; }
.chart-title { font-size: 14px; font-weight: 700; }
.chart-sub { font-size: 12px; }
.chart-empty { font-size: 13px; padding: 24px 0; text-align: center; }

.ex-picker {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 6px 10px;
  color: var(--color-text);
  font-size: 13px; font-weight: 600;
  font-family: inherit;
  outline: none; cursor: pointer;
  max-width: 200px;
  transition: border-color 0.15s;
}
.ex-picker:focus { border-color: var(--color-accent); }

.chart-wrap { width: 100%; }
.chart-svg { width: 100%; height: auto; display: block; }

.axis-label {
  font-size: 9px; fill: rgba(255,255,255,0.3);
  font-family: inherit; font-variant-numeric: tabular-nums;
}

/* Recent sessions (expandable) */
.section-title { font-size: 14px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
.recent { display: flex; flex-direction: column; }

.session-list { display: flex; flex-direction: column; gap: 8px; }

.session-card { padding: 0; cursor: pointer; transition: border-color 0.15s; overflow: hidden; }
.session-card:hover { border-color: var(--color-primary); }
.session-card.expanded { border-color: var(--color-primary); }

.session-row {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; padding: 14px 16px;
}
.session-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

.chevron {
  font-size: 18px; color: var(--color-text-muted);
  transition: transform 0.2s; line-height: 1; display: inline-block;
}
.chevron.open { transform: rotate(90deg); }

.session-name { font-weight: 600; font-size: 14px; }
.session-date { font-size: 12px; margin-top: 2px; }

.exercise-list {
  border-top: 1px solid var(--color-border);
  padding: 10px 16px 14px;
  display: flex; flex-direction: column; gap: 6px;
}
.ex-loading { font-size: 13px; padding: 4px 0; }
.ex-row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.ex-name { font-size: 13px; font-weight: 600; }
.ex-detail { font-size: 12px; }

.tag { font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; border: 1px solid; }
.tag.xp { background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.25); color: var(--color-xp); }
</style>
