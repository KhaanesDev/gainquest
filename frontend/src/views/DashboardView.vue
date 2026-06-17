<template>
  <div class="layout">
    <nav class="navbar">
      <span class="nav-brand">GainQuest</span>
      <div class="nav-links">
        <RouterLink to="/dashboard">Dashboard</RouterLink>
        <RouterLink to="/workout">Start Workout</RouterLink>
        <RouterLink to="/explore">Explore</RouterLink>
        <RouterLink to="/stats">Progress</RouterLink>
        <RouterLink to="/profile">Profile</RouterLink>
      </div>
      <button class="btn btn-secondary nav-signout" @click="auth.signOut()">Sign out</button>
    </nav>

    <main class="main">
      <div class="welcome">
        <h2 class="page-title">Hey, {{ profile?.username ?? '…' }}</h2>
        <p class="page-sub">Level {{ profile?.level ?? 1 }} · {{ xpToNextLevel }} XP to next level</p>
      </div>

      <!-- Muscle heatmap -->
      <div class="card heatmap-card">
        <div class="heatmap-header">
          <div>
            <p class="heatmap-title">Muscle Activity</p>
            <p class="heatmap-sub muted">Last 7 days</p>
          </div>
          <div class="heatmap-legend">
            <span class="legend-swatch" style="background: hsl(0,75%,38%)" />
            <span class="muted">Low</span>
            <span class="legend-bar" />
            <span class="legend-swatch" style="background: hsl(120,75%,38%)" />
            <span class="muted">High</span>
          </div>
        </div>
        <div class="heatmap-body">
          <MuscleDisplay :muscle-xp="muscleXpMap" size="lg" />
          <div class="heatmap-labels">
            <p class="label-front">Front</p>
            <p class="label-back">Back</p>
          </div>
        </div>
        <p v-if="noActivity" class="no-activity muted">No workouts logged yet — start one to see your progress!</p>
      </div>

      <!-- XP progress bar -->
      <div class="xp-bar-wrap card">
        <div class="xp-bar-labels">
          <span>⚡ {{ profile?.xp ?? 0 }} XP</span>
          <span class="muted">Level {{ (profile?.level ?? 1) + 1 }} at {{ nextLevelXP }} XP</span>
        </div>
        <div class="xp-bar-track">
          <div class="xp-bar-fill" :style="{ width: xpProgress + '%' }" />
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="card stat-card">
          <p class="stat-label">Streak</p>
          <p class="stat-value">{{ profile?.streak_days ?? 0 }}</p>
          <p class="stat-hint">days in a row</p>
        </div>
        <div class="card stat-card">
          <p class="stat-label">Total XP</p>
          <p class="stat-value xp">{{ profile?.xp ?? 0 }}</p>
          <p class="stat-hint">all time</p>
        </div>
        <div class="card stat-card">
          <p class="stat-label">Workouts</p>
          <p class="stat-value accent">{{ totalSessions }}</p>
          <p class="stat-hint">completed</p>
        </div>
      </div>

      <!-- Today's scheduled workout -->
      <div v-if="todaysTemplate" class="card today-card">
        <div class="today-info">
          <p class="today-label">TODAY'S WORKOUT</p>
          <h3 class="today-name">{{ todaysTemplate.name }}</h3>
          <p class="today-meta muted">{{ todaysTemplate.exercises_data?.length ?? 0 }} exercises</p>
        </div>
        <RouterLink :to="`/workout?template=${todaysTemplate.id}`" class="btn btn-primary today-btn">
          Start →
        </RouterLink>
      </div>

      <!-- CTA -->
      <div class="card cta-card">
        <div>
          <h3>Ready to grind?</h3>
          <p>Complete a workout to level up your body.</p>
        </div>
        <RouterLink to="/workout" class="btn btn-primary">Start Workout</RouterLink>
      </div>

      <!-- Recent sessions -->
      <div v-if="sessions.length > 0" class="recent">
        <h3 class="section-title">Recent Workouts</h3>
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
              <div v-if="!sessionExercises[s.id]" class="ex-loading muted">Loading…</div>
              <div
                v-else-if="sessionExercises[s.id].length === 0"
                class="ex-loading muted"
              >No exercises logged</div>
              <div v-else>
                <div
                  v-for="ex in sessionExercises[s.id]"
                  :key="ex.id"
                  class="ex-row"
                >
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
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import MuscleDisplay from '@/components/MuscleDisplay.vue'
import { getMusclesForExercise } from '@/data/exerciseMuscleMap'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type Session = Database['public']['Tables']['workout_sessions']['Row']
type Exercise = Database['public']['Tables']['exercises']['Row']
type WorkoutTemplate = Database['public']['Tables']['workout_templates']['Row']

const JS_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

const auth = useAuthStore()
const profile = ref<Profile | null>(null)
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

.nav-brand { font-weight: 800; font-size: 18px; color: var(--color-primary); margin-right: auto; }
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
.xp-bar-wrap { display: flex; flex-direction: column; gap: 8px; }
.xp-bar-labels { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; }
.xp-bar-track {
  height: 10px;
  background: var(--color-surface-2);
  border-radius: 999px;
  overflow: hidden;
}
.xp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-xp));
  border-radius: 999px;
  transition: width 0.6s ease;
  min-width: 4px;
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
