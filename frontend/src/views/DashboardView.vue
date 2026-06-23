<template>
  <div class="layout">
    <nav class="navbar">
      <span class="nav-brand">
        <img src="/wordmark.png" alt="GainQuest" class="brand-logo" />
      </span>
      <div class="nav-links">
        <RouterLink to="/dashboard">{{ $t('nav.dashboard') }}</RouterLink>
        <RouterLink to="/workout">{{ $t('nav.startWorkout') }}</RouterLink>
        <RouterLink to="/explore">{{ $t('nav.explore') }}</RouterLink>
        <RouterLink to="/stats">{{ $t('nav.progress') }}</RouterLink>
        <RouterLink to="/profile">{{ $t('nav.profile') }}</RouterLink>
      </div>
      <button class="btn btn-secondary nav-signout" @click="auth.signOut()">Sign out</button>
    </nav>

    <main class="main">
      <div class="welcome">
        <h2 class="page-title">{{ $t('dashboard.greeting', { name: profile?.username ?? '…' }) }}</h2>
        <p class="page-sub">{{ $t('dashboard.toNextLevel', { level: profile?.level ?? 1, xp: xpToNextLevel }) }}</p>
      </div>

      <!-- Muscle heatmap -->
      <div class="card heatmap-card">
        <div class="heatmap-header">
          <div>
            <p class="heatmap-title">{{ $t('dashboard.muscleActivity') }}</p>
            <p class="heatmap-sub muted">{{ $t('dashboard.last7Days') }}</p>
          </div>
          <div class="heatmap-legend">
            <span class="legend-swatch" style="background: hsl(0,75%,38%)" />
            <span class="muted">{{ $t('dashboard.low') }}</span>
            <span class="legend-bar" />
            <span class="legend-swatch" style="background: hsl(120,75%,38%)" />
            <span class="muted">{{ $t('dashboard.high') }}</span>
          </div>
        </div>
        <div class="heatmap-body">
          <MuscleDisplay :muscle-xp="muscleXpMap" size="lg" />
          <div class="heatmap-labels">
            <p class="label-front">{{ $t('dashboard.front') }}</p>
            <p class="label-back">{{ $t('dashboard.back') }}</p>
          </div>
        </div>
        <p v-if="noActivity" class="no-activity muted">{{ $t('dashboard.noActivity') }}</p>
      </div>

      <!-- XP progress bar -->
      <div class="xp-bar-wrap card" :class="{ earning: showGain }">
        <div v-if="showGain" class="xp-gain-chip">+{{ xpGain }} XP</div>
        <div class="xp-bar-labels">
          <span>⚡ {{ profile?.xp ?? 0 }} XP</span>
          <span class="muted">{{ $t('dashboard.nextLevelAt', { level: (profile?.level ?? 1) + 1, xp: nextLevelXP }) }}</span>
        </div>
        <div class="xp-bar-track-area">
          <div class="xp-bar-track">
            <div class="xp-bar-fill" :style="{ width: displayProgress + '%' }" />
          </div>
          <div v-if="showGain" class="xp-lightning" :style="{ '--intensity': intensity }">
            <svg
              v-for="i in boltCount"
              :key="i"
              class="bolt"
              :style="boltStyle(i)"
              viewBox="0 0 20 40"
              aria-hidden="true"
            >
              <polygon points="11,0 3,22 9,22 7,40 17,14 11,14" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="card stat-card">
          <p class="stat-label">{{ $t('dashboard.streak') }}</p>
          <p class="stat-value">{{ profile?.streak_days ?? 0 }}</p>
          <p class="stat-hint">{{ $t('dashboard.daysInRow') }}</p>
        </div>
        <div class="card stat-card">
          <p class="stat-label">{{ $t('dashboard.totalXp') }}</p>
          <p class="stat-value xp">{{ profile?.xp ?? 0 }}</p>
          <p class="stat-hint">{{ $t('dashboard.allTime') }}</p>
        </div>
        <div class="card stat-card">
          <p class="stat-label">{{ $t('dashboard.workouts') }}</p>
          <p class="stat-value accent">{{ totalSessions }}</p>
          <p class="stat-hint">{{ $t('dashboard.completed') }}</p>
        </div>
      </div>

      <!-- Today's scheduled workout -->
      <div v-if="todaysTemplate" class="card today-card">
        <div class="today-info">
          <p class="today-label">{{ $t('dashboard.todaysWorkout') }}</p>
          <h3 class="today-name">{{ todaysTemplate.name }}</h3>
          <p class="today-meta muted">{{ $t('dashboard.exercises', { n: todaysTemplate.exercises_data?.length ?? 0 }) }}</p>
        </div>
        <RouterLink :to="`/workout?template=${todaysTemplate.id}`" class="btn btn-primary today-btn">
          {{ $t('dashboard.start') }}
        </RouterLink>
      </div>

      <!-- CTA -->
      <div class="card cta-card">
        <div>
          <h3>{{ $t('dashboard.readyTitle') }}</h3>
          <p>{{ $t('dashboard.readySub') }}</p>
        </div>
        <RouterLink to="/workout" class="btn btn-primary">{{ $t('dashboard.startWorkout') }}</RouterLink>
      </div>

      <!-- Recent sessions -->
      <div v-if="sessions.length > 0" class="recent">
        <h3 class="section-title">{{ $t('dashboard.recentWorkouts') }}</h3>
        <div class="session-list">
          <div
            v-for="s in sessions"
            :key="s.id"
            class="card session-card"
            :class="{ expanded: expandedId === s.id }"
            @click="toggleSession(s.id)"
          >
            <div class="session-row">
              <div class="session-info">
                <p class="session-name">{{ s.name }}</p>
                <p class="session-date muted">{{ formatDate(s.completed_at ?? s.created_at) }}</p>
              </div>
              <div class="session-right">
                <span class="tag xp">⚡ +{{ s.xp_earned }}</span>
                <span class="chevron" :class="{ open: expandedId === s.id }">›</span>
              </div>
            </div>

            <div v-if="expandedId === s.id" class="exercise-list">
              <div v-if="!sessionExercises[s.id]" class="ex-loading muted">{{ $t('dashboard.loading') }}</div>
              <div
                v-else-if="sessionExercises[s.id].length === 0"
                class="ex-loading muted"
              >{{ $t('dashboard.noExercisesLogged') }}</div>
              <div v-else>
                <div
                  v-for="ex in sessionExercises[s.id]"
                  :key="ex.id"
                  class="ex-row"
                >
                  <span class="ex-name">{{ ex.name }}</span>
                  <span class="ex-detail muted">
                    {{ ex.sets }} {{ $t('stats.setsWord') }}
                    <template v-if="ex.reps"> · {{ ex.reps }} {{ $t('stats.repsWord') }}</template>
                    <template v-if="ex.weight_kg"> · {{ ex.weight_kg }} kg</template>
                    <template v-if="ex.duration_seconds"> · {{ formatDuration(ex.duration_seconds) }}</template>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useWorkoutStore } from '@/stores/workout'
import MuscleDisplay from '@/components/MuscleDisplay.vue'
import { getMusclesForExercise } from '@/data/exerciseMuscleMap'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type Session = Database['public']['Tables']['workout_sessions']['Row']
type Exercise = Database['public']['Tables']['exercises']['Row']
type WorkoutTemplate = Database['public']['Tables']['workout_templates']['Row']

const JS_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

const auth = useAuthStore()
const workout = useWorkoutStore()
const profile = ref<Profile | null>(null)

// XP-bar fill animation state
const displayProgress = ref(0)
const xpGain = ref(0)
const showGain = ref(false)
const intensity = ref(0)
const boltCount = ref(0)

function boltStyle(i: number) {
  const pct = ((i - 0.5) / Math.max(1, boltCount.value)) * 100
  return {
    left: `calc(${pct.toFixed(1)}% - 6px)`,
    animationDelay: `${(0.25 + (i - 1) * 0.07).toFixed(2)}s`,
  }
}
const sessions = ref<Session[]>([])
const totalSessions = ref(0)
const muscleXpMap = ref<Record<string, number>>({})
const todaysTemplate = ref<WorkoutTemplate | null>(null)
const expandedId = ref<string | null>(null)
const sessionExercises = ref<Record<string, Exercise[]>>({})

const noActivity = computed(() => Object.keys(muscleXpMap.value).length === 0)

function levelToMinXP(level: number) {
  return Math.pow(level - 1, 2) * 50
}

const nextLevelXP = computed(() => levelToMinXP((profile.value?.level ?? 1) + 1))
const currentLevelMinXP = computed(() => levelToMinXP(profile.value?.level ?? 1))
const xpProgress = computed(() => {
  if (!profile.value) return 0
  const range = nextLevelXP.value - currentLevelMinXP.value
  const progress = profile.value.xp - currentLevelMinXP.value
  return Math.min(100, Math.round((progress / range) * 100))
})
const xpToNextLevel = computed(() => Math.max(0, nextLevelXP.value - (profile.value?.xp ?? 0)))

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return sec > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${m}m`
}

async function toggleSession(id: string) {
  if (expandedId.value === id) {
    expandedId.value = null
    return
  }
  expandedId.value = id
  if (sessionExercises.value[id]) return

  const { data } = await supabase
    .from('exercises')
    .select('*')
    .eq('session_id', id)
    .order('order_index')

  sessionExercises.value[id] = data ?? []
}

async function loadMuscleActivity(userId: string) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: recentSessions } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('user_id', userId)
    .gte('completed_at', weekAgo)
    .not('completed_at', 'is', null)

  const sessionIds = recentSessions?.map(s => s.id) ?? []
  if (sessionIds.length === 0) return

  const { data: exData } = await supabase
    .from('exercises')
    .select('name, sets, reps, weight_kg')
    .in('session_id', sessionIds)

  const xpMap: Record<string, number> = {}
  for (const ex of exData ?? []) {
    const muscles = getMusclesForExercise(ex.name)
    if (muscles.length === 0) continue
    const xpPerSet = 10 + (ex.reps ?? 0) + Math.floor((ex.weight_kg ?? 0) / 10)
    const totalXp = xpPerSet * ex.sets
    for (const m of muscles) {
      xpMap[m] = (xpMap[m] ?? 0) + totalXp
    }
  }

  muscleXpMap.value = xpMap
}

onMounted(async () => {
  if (!auth.user) return

  const [{ data: p }, { data: s }, { count }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', auth.user.id).single(),
    supabase.from('workout_sessions')
      .select('*')
      .eq('user_id', auth.user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(5),
    supabase.from('workout_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', auth.user.id)
      .not('completed_at', 'is', null),
  ])

  profile.value = p
  sessions.value = s ?? []
  totalSessions.value = count ?? 0

  // If we just earned XP, animate the bar filling from where it was before.
  const gain = workout.consumePendingXpGain()
  if (gain > 0 && profile.value) {
    const range = nextLevelXP.value - currentLevelMinXP.value
    const startPct = range > 0
      ? Math.max(0, Math.min(100, Math.round(((profile.value.xp - gain) - currentLevelMinXP.value) / range * 100)))
      : 0
    displayProgress.value = startPct
    xpGain.value = gain
    // Lightning scales with the size of the XP gain.
    intensity.value = Math.min(1, gain / 350)
    boltCount.value = Math.min(8, 2 + Math.round(gain / 45))
    showGain.value = true
    // Wait a paint at the start width, then transition to the new fill.
    await nextTick()
    requestAnimationFrame(() => requestAnimationFrame(() => {
      displayProgress.value = xpProgress.value
    }))
    setTimeout(() => { showGain.value = false }, 2600)
  } else {
    displayProgress.value = xpProgress.value
  }

  const todayKey = JS_DAYS[new Date().getDay()]
  const templateId = (p?.weekly_schedule ?? {})[todayKey]
  if (templateId) {
    const { data: tmpl } = await supabase
      .from('workout_templates')
      .select('*')
      .eq('id', templateId)
      .single()
    todaysTemplate.value = tmpl
  }

  await loadMuscleActivity(auth.user.id)
})
</script>

<style scoped>
.layout { min-height: 100vh; display: flex; flex-direction: column; }

.navbar {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 12px 24px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.nav-brand { display: flex; align-items: center; margin-right: auto; }
.brand-logo { height: 22px; width: auto; display: block; }
.nav-links { display: flex; gap: 20px; font-size: 14px; }
.nav-links a { color: var(--color-text-muted); }
.nav-links a.router-link-active { color: var(--color-text); }
.nav-signout { font-size: 13px; padding: 7px 14px; }

.main {
  padding: 28px 24px 48px;
  max-width: 760px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 640px) {
  .main { padding: 16px 16px var(--tab-space); }
  .stats-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .stat-card { padding: 12px 8px; }
  .stat-value { font-size: 22px; }
  .heatmap-body { gap: 6px; }
}

.welcome { margin-bottom: 4px; }
.page-title { font-size: 24px; font-weight: 800; }
.page-sub { color: var(--color-text-muted); font-size: 14px; margin-top: 4px; }
.muted { color: var(--color-text-muted); }

/* Heatmap card */
.heatmap-card { display: flex; flex-direction: column; gap: 16px; }

.heatmap-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.heatmap-title { font-size: 15px; font-weight: 700; }
.heatmap-sub { font-size: 12px; margin-top: 2px; }

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  flex-shrink: 0;
}

.legend-swatch {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  display: inline-block;
  opacity: 0.9;
}

.legend-bar {
  width: 48px;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(90deg, hsl(0,75%,38%), hsl(60,75%,38%), hsl(120,75%,38%));
  opacity: 0.85;
}

.heatmap-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.heatmap-labels {
  display: flex;
  gap: 3px;
  width: calc(90px * 2 + 3px);
}

.label-front, .label-back {
  width: 90px;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.no-activity { font-size: 13px; text-align: center; padding: 8px 0; }

/* XP bar */
.xp-bar-wrap { display: flex; flex-direction: column; gap: 8px; position: relative; }
.xp-bar-labels { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; }
.xp-bar-track {
  height: 10px;
  background: var(--color-surface-2);
  border-radius: 999px;
  overflow: hidden;
  transition: box-shadow 0.3s ease;
}
.xp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-xp));
  border-radius: 999px;
  transition: width 0.9s cubic-bezier(0.22, 1, 0.36, 1);
  min-width: 4px;
  position: relative;
  overflow: hidden;
}

/* XP-gain celebration */
.xp-bar-wrap.earning .xp-bar-track {
  box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.35), 0 0 18px rgba(245, 158, 11, 0.35);
}
.xp-bar-wrap.earning .xp-bar-fill {
  box-shadow: 0 0 14px rgba(245, 158, 11, 0.7);
}
.xp-bar-wrap.earning .xp-bar-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.55), transparent);
  transform: translateX(-100%);
  animation: xp-shimmer 1s ease 0.35s 2;
}

.xp-gain-chip {
  position: absolute;
  top: 4px;
  right: 14px;
  background: var(--color-xp);
  color: #1a1206;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.02em;
  padding: 3px 10px;
  border-radius: 999px;
  box-shadow: 0 0 16px rgba(245, 158, 11, 0.6);
  pointer-events: none;
  animation: xp-pack-in 1.7s cubic-bezier(0.5, 0, 0.5, 1) forwards;
}

@keyframes xp-pack-in {
  0%   { transform: translateY(-30px) scale(0.9); opacity: 0; }
  14%  { transform: translateY(-30px) scale(1);   opacity: 1; }
  55%  { transform: translateY(-30px) scale(1);   opacity: 1; }
  100% { transform: translateY(16px)  scale(0.5); opacity: 0; }
}

@keyframes xp-shimmer {
  to { transform: translateX(100%); }
}

/* Lightning — intensity (0–1) scales brightness & glow; boltCount scales count */
.xp-bar-track-area { position: relative; }
.xp-lightning {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 30px;
  pointer-events: none;
}
.bolt {
  position: absolute;
  bottom: -2px;
  width: 12px;
  height: 28px;
  opacity: 0;
  animation: bolt-zap 0.9s ease-out forwards;
}
.bolt polygon {
  fill: #fde68a;
  filter: drop-shadow(0 0 calc(2px + var(--intensity, 0.4) * 7px) rgba(245, 158, 11, 0.95));
}

@keyframes bolt-zap {
  0%        { opacity: 0; transform: translateY(6px) scaleY(0.6); }
  10%       { opacity: calc(0.45 + var(--intensity, 0.4) * 0.55); transform: translateY(0) scaleY(1); }
  18%       { opacity: 0; }
  32%       { opacity: calc(0.35 + var(--intensity, 0.4) * 0.5); }
  44%       { opacity: 0; }
  60%       { opacity: calc(0.25 + var(--intensity, 0.4) * 0.4); }
  74%, 100% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .xp-gain-chip { animation: none; opacity: 0; }
  .xp-bar-wrap.earning .xp-bar-fill::after { animation: none; }
  .xp-lightning { display: none; }
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-card { text-align: center; padding: 16px 12px; }
.stat-label { font-size: 11px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
.stat-value { font-size: 28px; font-weight: 800; line-height: 1; }
.stat-value.accent { color: var(--color-accent); }
.stat-value.xp { color: var(--color-xp); }
.stat-hint { font-size: 11px; color: var(--color-text-muted); margin-top: 4px; }

/* Today's workout */
.today-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  border-color: rgba(124, 58, 237, 0.4);
  background: rgba(124, 58, 237, 0.05);
}
.today-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-primary);
  margin-bottom: 4px;
}
.today-name { font-size: 18px; font-weight: 800; }
.today-meta { font-size: 12px; margin-top: 2px; }
.today-btn { white-space: nowrap; }

/* CTA */
.cta-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.cta-card h3 { font-size: 16px; font-weight: 700; }
.cta-card p { font-size: 13px; color: var(--color-text-muted); margin-top: 2px; }

/* Recent sessions */
.section-title { font-size: 14px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }

.session-list { display: flex; flex-direction: column; gap: 8px; }

.session-card {
  padding: 0;
  cursor: pointer;
  transition: border-color 0.15s;
  overflow: hidden;
}

.session-card:hover { border-color: var(--color-primary); }
.session-card.expanded { border-color: var(--color-primary); }

.session-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
}

.session-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.chevron {
  font-size: 18px;
  color: var(--color-text-muted);
  transition: transform 0.2s;
  line-height: 1;
  display: inline-block;
}

.chevron.open { transform: rotate(90deg); }

.session-name { font-weight: 600; font-size: 14px; }
.session-date { font-size: 12px; margin-top: 2px; }

.exercise-list {
  border-top: 1px solid var(--color-border);
  padding: 10px 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ex-loading { font-size: 13px; padding: 4px 0; }

.ex-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.ex-name { font-size: 13px; font-weight: 600; }
.ex-detail { font-size: 12px; }

.tag {
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid;
}

.tag.xp {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.25);
  color: var(--color-xp);
}
</style>
