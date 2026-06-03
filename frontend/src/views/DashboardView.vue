<template>
  <div class="layout">
    <nav class="navbar">
      <span class="nav-brand">GainQuest</span>
      <div class="nav-links">
        <RouterLink to="/dashboard">Dashboard</RouterLink>
        <RouterLink to="/workout">Log Workout</RouterLink>
        <RouterLink to="/explore">Explore</RouterLink>
        <RouterLink to="/profile">Profile</RouterLink>
      </div>
      <button class="btn btn-secondary nav-signout" @click="auth.signOut()">Sign out</button>
    </nav>

    <main class="main">
      <div class="welcome">
        <h2 class="page-title">Hey, {{ profile?.username ?? '…' }}</h2>
        <p class="page-sub">Level {{ profile?.level ?? 1 }} · {{ xpToNextLevel }} XP to next level</p>
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
          <p class="stat-label">Gaming Time</p>
          <p class="stat-value accent">{{ formatTime(profile?.available_gaming_minutes ?? 0) }}</p>
          <p class="stat-hint">available</p>
        </div>
        <div class="card stat-card">
          <p class="stat-label">Streak</p>
          <p class="stat-value">{{ profile?.streak_days ?? 0 }}</p>
          <p class="stat-hint">days in a row</p>
        </div>
        <div class="card stat-card">
          <p class="stat-label">Total Earned</p>
          <p class="stat-value gaming">{{ formatTime(profile?.total_gaming_minutes ?? 0) }}</p>
          <p class="stat-hint">all time</p>
        </div>
      </div>

      <!-- CTA -->
      <div class="card cta-card">
        <div>
          <h3>Ready to grind?</h3>
          <p>Complete a workout to unlock gaming time.</p>
        </div>
        <RouterLink to="/workout" class="btn btn-primary">Start Workout</RouterLink>
      </div>

      <!-- Recent sessions -->
      <div v-if="sessions.length > 0" class="recent">
        <h3 class="section-title">Recent Workouts</h3>
        <div class="session-list">
          <div v-for="s in sessions" :key="s.id" class="card session-card">
            <div class="session-info">
              <p class="session-name">{{ s.name }}</p>
              <p class="session-date muted">{{ formatDate(s.completed_at ?? s.created_at) }}</p>
            </div>
            <div class="session-rewards">
              <span class="tag xp">⚡ +{{ s.xp_earned }}</span>
              <span class="tag gaming">🎮 +{{ s.gaming_minutes_earned }}m</span>
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
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type Session = Database['public']['Tables']['workout_sessions']['Row']

const auth = useAuthStore()
const profile = ref<Profile | null>(null)
const sessions = ref<Session[]>([])

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

function formatTime(minutes: number) {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

onMounted(async () => {
  if (!auth.user) return

  const [{ data: p }, { data: s }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', auth.user.id).single(),
    supabase.from('workout_sessions')
      .select('*')
      .eq('user_id', auth.user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(5),
  ])

  profile.value = p
  sessions.value = s ?? []
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

.welcome { margin-bottom: 4px; }
.page-title { font-size: 24px; font-weight: 800; }
.page-sub { color: var(--color-text-muted); font-size: 14px; margin-top: 4px; }
.muted { color: var(--color-text-muted); }

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
.stat-value.gaming { color: var(--color-accent); }
.stat-hint { font-size: 11px; color: var(--color-text-muted); margin-top: 4px; }

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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  flex-wrap: wrap;
}

.session-name { font-weight: 600; font-size: 14px; }
.session-date { font-size: 12px; margin-top: 2px; }

.session-rewards { display: flex; gap: 8px; }

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

.tag.gaming {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.25);
  color: var(--color-accent);
}
</style>
