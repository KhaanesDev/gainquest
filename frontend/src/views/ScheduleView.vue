<template>
  <div class="layout">
    <nav class="navbar">
      <RouterLink to="/dashboard" class="nav-brand">
        <img src="/wordmark.png" alt="GainQuest" class="brand-logo" />
      </RouterLink>
      <div class="nav-links">
        <RouterLink to="/dashboard">{{ $t('nav.dashboard') }}</RouterLink>
        <RouterLink to="/workout">{{ $t('nav.startWorkout') }}</RouterLink>
        <RouterLink to="/explore">{{ $t('nav.explore') }}</RouterLink>
        <RouterLink to="/stats">{{ $t('nav.progress') }}</RouterLink>
        <RouterLink to="/profile">{{ $t('nav.profile') }}</RouterLink>
      </div>
    </nav>

    <main class="main">
      <div class="page-header">
        <div>
          <h2 class="page-title">{{ $t('schedule.title') }}</h2>
          <p class="page-sub">{{ $t('schedule.sub') }}</p>
        </div>
        <RouterLink to="/profile" class="btn btn-secondary back-btn">{{ $t('schedule.backTemplates') }}</RouterLink>
      </div>

      <div v-if="loading" class="loading muted">{{ $t('schedule.loading') }}</div>

      <div v-if="loadError" class="error-msg">⚠ {{ loadError }}</div>

      <template v-else>
        <div v-if="templates.length === 0" class="empty-state card">
          <p class="empty-icon">📋</p>
          <p>{{ $t('schedule.needTemplate') }}</p>
          <RouterLink to="/profile" class="btn btn-primary">{{ $t('schedule.createTemplate') }}</RouterLink>
        </div>

        <div v-else class="schedule-card card">
          <div
            v-for="day in DAYS"
            :key="day.key"
            class="day-row"
            :class="{ today: isToday(day.key) }"
          >
            <div class="day-label-wrap">
              <span class="day-short">{{ $t('schedule.days.' + day.key) }}</span>
              <span v-if="isToday(day.key)" class="today-badge">{{ $t('schedule.today') }}</span>
            </div>
            <select v-model="schedule[day.key]" class="day-select">
              <option value="">{{ $t('schedule.restDay') }}</option>
              <option v-for="t in templates" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
            <button
              v-if="schedule[day.key]"
              class="btn-clear"
              @click="schedule[day.key] = ''"
              :title="$t('schedule.clearDay')"
            >✕</button>
            <div v-else class="btn-clear-spacer" />
          </div>
        </div>

        <div class="footer">
          <p v-if="saveError" class="error-msg">⚠ {{ saveError }}</p>
          <p v-else-if="saved" class="saved-msg">{{ $t('schedule.saved') }}</p>
          <button
            class="btn btn-primary save-btn"
            :disabled="saving || templates.length === 0"
            @click="saveSchedule"
          >
            {{ saving ? $t('schedule.saving') : $t('schedule.save') }}
          </button>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { Database } from '@/types/database'

const { t } = useI18n({ useScope: 'global' })

type WorkoutTemplate = Database['public']['Tables']['workout_templates']['Row']

const DAYS = [
  { key: 'monday',    short: 'Mon', label: 'Monday' },
  { key: 'tuesday',   short: 'Tue', label: 'Tuesday' },
  { key: 'wednesday', short: 'Wed', label: 'Wednesday' },
  { key: 'thursday',  short: 'Thu', label: 'Thursday' },
  { key: 'friday',    short: 'Fri', label: 'Friday' },
  { key: 'saturday',  short: 'Sat', label: 'Saturday' },
  { key: 'sunday',    short: 'Sun', label: 'Sunday' },
]

const DAY_KEYS = DAYS.map(d => d.key)
const JS_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function isToday(key: string) {
  return JS_DAYS[new Date().getDay()] === key
}

const auth = useAuthStore()
const templates = ref<WorkoutTemplate[]>([])
const schedule = reactive<Record<string, string>>(Object.fromEntries(DAY_KEYS.map(d => [d, ''])))
const loading = ref(true)
const saving = ref(false)
const saved = ref(false)
const loadError = ref('')
const saveError = ref('')

async function saveSchedule() {
  if (!auth.user) return
  saving.value = true
  saved.value = false
  saveError.value = ''
  try {
    const cleanSchedule = Object.fromEntries(
      Object.entries(schedule).filter(([, v]) => v)
    )
    const { error } = await supabase
      .from('profiles')
      .update({ weekly_schedule: cleanSchedule })
      .eq('id', auth.user.id)
    if (error) throw error
    saved.value = true
    setTimeout(() => { saved.value = false }, 2500)
  } catch (e: unknown) {
    saveError.value = e instanceof Error ? e.message : t('schedule.saveFailed')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (!auth.user) return
  const [{ data: p, error: pErr }, { data: tmpl, error: tErr }] = await Promise.all([
    supabase.from('profiles').select('weekly_schedule').eq('id', auth.user.id).single(),
    supabase.from('workout_templates').select('*').eq('user_id', auth.user.id).order('created_at'),
  ])

  if (pErr || tErr) {
    loadError.value = (pErr ?? tErr)?.message ?? t('schedule.loadFailed')
  }

  templates.value = tmpl ?? []

  const ws = ((p as { weekly_schedule?: Record<string, string> } | null)?.weekly_schedule ?? {})
  for (const key of DAY_KEYS) {
    schedule[key] = ws[key] ?? ''
  }

  loading.value = false
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
  position: sticky;
  top: 0;
  z-index: 10;
}

.nav-brand { display: flex; align-items: center; margin-right: auto; }
.brand-logo { height: 22px; width: auto; display: block; }
.nav-links { display: flex; gap: 20px; font-size: 14px; flex-wrap: wrap; }
.nav-links a { color: var(--color-text-muted); }
.nav-links a.router-link-active { color: var(--color-text); }

.main {
  padding: 28px 24px 60px;
  max-width: 520px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (max-width: 640px) {
  .main { padding: 16px 16px var(--tab-space); }
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.page-title { font-size: 22px; font-weight: 800; }
.page-sub { font-size: 13px; color: var(--color-text-muted); margin-top: 4px; }
.back-btn { font-size: 13px; padding: 8px 14px; white-space: nowrap; }

.loading, .muted { color: var(--color-text-muted); font-size: 13px; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 24px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 14px;
}
.empty-icon { font-size: 36px; }

.schedule-card {
  padding: 0;
  overflow: hidden;
}

.day-row {
  display: grid;
  grid-template-columns: 72px 1fr 32px;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-border);
  transition: background 0.12s;
}

.day-row:last-child { border-bottom: none; }

.day-row.today {
  background: rgba(124, 58, 237, 0.05);
}

.day-label-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.day-short {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-muted);
  width: 32px;
}

.day-row.today .day-short { color: var(--color-primary); }

.today-badge {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-primary);
  background: rgba(124, 58, 237, 0.12);
  border: 1px solid rgba(124, 58, 237, 0.25);
  padding: 2px 5px;
  border-radius: 4px;
}

.day-select {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 8px 10px;
  color: var(--color-text);
  font-size: 13px;
  font-family: inherit;
  outline: none;
  width: 100%;
  cursor: pointer;
  transition: border-color 0.15s;
}

.day-select:focus { border-color: var(--color-primary); }

.btn-clear {
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 12px;
  cursor: pointer;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.12s;
}
.btn-clear:hover { color: #f87171; }

.btn-clear-spacer { width: 28px; }

.footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.saved-msg {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-accent);
}

.error-msg {
  font-size: 13px;
  font-weight: 600;
  color: #f87171;
  padding: 10px 14px;
  background: rgba(248,113,113,0.08);
  border: 1px solid rgba(248,113,113,0.25);
  border-radius: var(--radius);
}

.save-btn {
  padding: 10px 24px;
  font-size: 14px;
}
</style>
