<template>
  <div class="layout">
    <nav class="navbar">
      <span class="nav-brand">GainQuest</span>
      <div class="nav-links">
        <RouterLink to="/dashboard">Dashboard</RouterLink>
        <RouterLink to="/workout">Log Workout</RouterLink>
        <RouterLink to="/profile">Profile</RouterLink>
      </div>
      <button class="btn btn-secondary" @click="auth.signOut()">Sign out</button>
    </nav>

    <main class="main">
      <h2 class="page-title">Dashboard</h2>

      <div class="stats-grid">
        <div class="card stat-card">
          <p class="stat-label">Gaming Time Available</p>
          <p class="stat-value accent">{{ profile?.available_gaming_minutes ?? 0 }}m</p>
        </div>
        <div class="card stat-card">
          <p class="stat-label">XP</p>
          <p class="stat-value xp">{{ profile?.xp ?? 0 }}</p>
        </div>
        <div class="card stat-card">
          <p class="stat-label">Level</p>
          <p class="stat-value">{{ profile?.level ?? 1 }}</p>
        </div>
        <div class="card stat-card">
          <p class="stat-label">Streak</p>
          <p class="stat-value">{{ profile?.streak_days ?? 0 }} days</p>
        </div>
      </div>

      <div class="card cta-card">
        <h3>Ready to earn gaming time?</h3>
        <p>Complete a workout to unlock your reward.</p>
        <RouterLink to="/workout" class="btn btn-primary">Start Workout</RouterLink>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

const auth = useAuthStore()
const profile = ref<Profile | null>(null)

onMounted(async () => {
  if (!auth.user) return
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', auth.user.id)
    .single()
  profile.value = data
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

.main { padding: 32px 24px; max-width: 960px; margin: 0 auto; width: 100%; }
.page-title { font-size: 24px; font-weight: 700; margin-bottom: 24px; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card { text-align: center; }
.stat-label { font-size: 12px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
.stat-value { font-size: 32px; font-weight: 800; }
.stat-value.accent { color: var(--color-accent); }
.stat-value.xp { color: var(--color-xp); }

.cta-card { display: flex; flex-direction: column; gap: 8px; }
.cta-card h3 { font-size: 18px; font-weight: 700; }
.cta-card p { color: var(--color-text-muted); font-size: 14px; margin-bottom: 8px; }
</style>
