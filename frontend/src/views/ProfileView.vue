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
          <h2 class="page-title">{{ profile?.username ?? '…' }}</h2>
          <p class="page-sub">{{ $t('profile.levelLine', { level: profile?.level ?? 1, xp: profile?.xp ?? 0, streak: profile?.streak_days ?? 0 }) }}</p>
        </div>
        <RouterLink to="/schedule" class="btn btn-secondary schedule-btn">{{ $t('profile.weeklySchedule') }}</RouterLink>
      </div>

      <!-- Templates section -->
      <section class="section">
        <div class="section-header">
          <h3 class="section-title">{{ $t('profile.myTemplates') }}</h3>
          <span class="template-count muted">{{ templates.length }}/10</span>
          <button
            v-if="!editor && templates.length < 10"
            class="btn-new"
            @click="startNew"
          >{{ $t('profile.new') }}</button>
        </div>

        <!-- Inline editor -->
        <div v-if="editor" class="editor card">
          <input
            v-model="editor.name"
            class="editor-name-input"
            :placeholder="$t('profile.templateNamePlaceholder')"
          />

          <div v-for="(ex, i) in editor.exercises" :key="ex.id" class="ex-item">
            <div class="ex-top">
              <input v-model="ex.name" class="ex-name-input" :placeholder="$t('profile.exercisePlaceholder', { n: i + 1 })" />
              <button
                class="type-toggle"
                :class="ex.type"
                @click="ex.type = ex.type === 'reps' ? 'timer' : 'reps'"
                :title="ex.type === 'reps' ? $t('profile.switchToTimer') : $t('profile.switchToReps')"
              >{{ ex.type === 'reps' ? 'R' : 'T' }}</button>
              <button class="btn-remove-ex" @click="editor.exercises.splice(i, 1)">✕</button>
            </div>
            <div class="ex-fields">
              <label class="fld">
                <span>{{ $t('profile.sets') }}</span>
                <input v-model.number="ex.sets" type="number" min="1" max="20" class="ex-num-input" />
              </label>
              <label v-if="ex.type === 'reps'" class="fld">
                <span>{{ $t('profile.reps') }}</span>
                <input v-model.number="ex.defaultReps" type="number" min="1" max="100" class="ex-num-input" />
              </label>
              <label v-else class="fld">
                <span>{{ $t('profile.duration') }}</span>
                <input :value="formatDuration(ex.defaultDuration)" class="ex-num-input duration" @change="e => onDurationChange(ex, e)" />
              </label>
              <label v-if="ex.type === 'reps'" class="fld">
                <span>{{ $t('profile.kg') }}</span>
                <input v-model.number="ex.defaultWeight" type="number" min="0" step="any" class="ex-num-input" placeholder="—" />
              </label>
              <label v-if="ex.type === 'reps'" class="fld" :title="$t('profile.progressionHint')">
                <span>{{ $t('profile.progression') }}</span>
                <input v-model.number="ex.weightStep" type="number" min="0" step="any" class="ex-num-input" placeholder="0" />
              </label>
            </div>
          </div>

          <button class="btn-add-ex" @click="showAddExercise = true">{{ $t('profile.addExercise') }}</button>

          <p v-if="saveError" class="save-error">⚠ {{ saveError }}</p>
          <div class="editor-footer">
            <button class="btn btn-secondary" @click="editor = null; saveError = ''">{{ $t('profile.cancel') }}</button>
            <button
              v-if="editor.id"
              class="btn btn-secondary"
              :disabled="saving || !editor.name.trim() || templates.length >= 10"
              @click="saveTemplate(true)"
              :title="$t('profile.saveAsCopyTitle')"
            >
              {{ $t('profile.saveAsCopy') }}
            </button>
            <button class="btn btn-primary" :disabled="saving || !editor.name.trim()" @click="saveTemplate(false)">
              {{ saving ? $t('profile.saving') : editor.id ? $t('profile.updateTemplate') : $t('profile.saveTemplate') }}
            </button>
          </div>
        </div>

        <!-- Template list -->
        <div v-if="loading" class="loading muted">{{ $t('profile.loading') }}</div>
        <div v-else class="template-list">
          <div v-for="t in templates" :key="t.id" class="template-card card">
            <div class="template-row">
              <div class="template-info">
                <p class="template-name">{{ t.name }}</p>
                <p class="template-exercises muted">{{ summarize(t) }}</p>
              </div>
              <div class="template-actions">
                <button class="btn-sm use" @click="useTemplate(t.id)">{{ $t('profile.use') }}</button>
                <button class="btn-sm" @click="startEdit(t)">{{ $t('profile.edit') }}</button>
                <button class="btn-sm danger" @click="confirmDelete(t.id)">✕</button>
              </div>
            </div>
          </div>
          <p v-if="templates.length === 0 && !editor" class="empty muted">
            {{ $t('profile.noTemplates') }}
          </p>
        </div>
      </section>

      <AddExerciseModal
        v-if="showAddExercise"
        @add="addExerciseByName"
        @close="showAddExercise = false"
      />

      <ConfirmModal
        v-if="showDelete"
        :title="$t('profile.deleteTitle')"
        :message="$t('profile.deleteMsg')"
        :confirm-label="$t('common.delete')"
        :cancel-label="$t('common.cancel')"
        danger
        @confirm="doDeleteTemplate"
        @cancel="showDelete = false"
      />

      <!-- Equipment / gym access -->
      <section class="section">
        <h3 class="section-title">{{ $t('profile.equipmentTitle') }}</h3>
        <button class="setting-row" @click="gymAccess = !gymAccess">
          <span class="setting-text">
            <span class="setting-label">{{ $t('profile.gymAccess') }}</span>
            <span class="setting-hint muted">{{ gymAccess ? $t('profile.gymOn') : $t('profile.gymOff') }}</span>
          </span>
          <span class="switch" :class="{ on: gymAccess }"><span class="knob" /></span>
        </button>
      </section>

      <!-- Language -->
      <section class="section">
        <h3 class="section-title">{{ $t('profile.language') }}</h3>
        <div class="lang-switch">
          <button class="lang-btn" :class="{ active: locale === 'en' }" @click="changeLocale('en')">
            <span class="flag">🇬🇧</span> English
          </button>
          <button class="lang-btn" :class="{ active: locale === 'no' }" @click="changeLocale('no')">
            <span class="flag">🇳🇴</span> Norsk
          </button>
        </div>
      </section>

      <!-- Account -->
      <section class="section">
        <h3 class="section-title">{{ $t('profile.account') }}</h3>
        <p class="account-email muted">{{ auth.user?.email }}</p>
        <button class="btn btn-logout" @click="handleSignOut">{{ $t('profile.signOut') }}</button>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { setLocale, type Locale } from '@/i18n'
import { gymAccess } from '@/composables/useSettings'
import AddExerciseModal from '@/components/AddExerciseModal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import type { Database, TemplateExercise } from '@/types/database'

const { t, locale } = useI18n({ useScope: 'global' })

function changeLocale(l: Locale) {
  setLocale(l)
}

type Profile = Database['public']['Tables']['profiles']['Row']
type WorkoutTemplate = Database['public']['Tables']['workout_templates']['Row']

interface EditorExercise {
  id: string
  name: string
  sets: number
  defaultReps: number
  type: 'reps' | 'timer'
  defaultDuration: number
  defaultWeight?: number
  weightStep?: number
}

interface Editor {
  id: string | null
  name: string
  exercises: EditorExercise[]
}

const auth = useAuthStore()
const router = useRouter()

async function handleSignOut() {
  await auth.signOut()
  router.push('/login')
}

function useTemplate(id: string) {
  router.push({ path: '/workout', query: { template: id } })
}

const profile = ref<Profile | null>(null)
const templates = ref<WorkoutTemplate[]>([])
const editor = ref<Editor | null>(null)
const loading = ref(true)
const saving = ref(false)
const saveError = ref('')
const showAddExercise = ref(false)
const showDelete = ref(false)
const pendingDeleteId = ref<string | null>(null)

let _eid = 0
function uid() { return `e-${++_eid}` }

function newEditorExercise(): EditorExercise {
  return { id: uid(), name: '', sets: 3, defaultReps: 10, type: 'reps', defaultDuration: 60, weightStep: 0 }
}

function startNew() {
  editor.value = { id: null, name: '', exercises: [newEditorExercise()] }
}

function startEdit(t: WorkoutTemplate) {
  editor.value = {
    id: t.id,
    name: t.name,
    exercises: (t.exercises_data ?? []).map(e => ({
      id: uid(),
      name: e.name,
      sets: e.sets,
      defaultReps: e.defaultReps ?? 10,
      type: (e.type ?? 'reps') as 'reps' | 'timer',
      defaultDuration: e.defaultDuration ?? 60,
      defaultWeight: e.defaultWeight,
      weightStep: e.weightStep ?? 0,
    })),
  }
}

function addExerciseByName(name: string) {
  editor.value?.exercises.push({ ...newEditorExercise(), name })
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function onDurationChange(ex: EditorExercise, e: Event) {
  const raw = (e.target as HTMLInputElement).value.trim()
  let seconds: number
  if (raw.includes(':')) {
    const [m, s] = raw.split(':').map(n => parseInt(n) || 0)
    seconds = m * 60 + s
  } else {
    seconds = parseInt(raw) || 60
  }
  ex.defaultDuration = Math.max(5, seconds)
  ;(e.target as HTMLInputElement).value = formatDuration(ex.defaultDuration)
}

function summarize(tmpl: WorkoutTemplate): string {
  const exes = (tmpl.exercises_data ?? []) as TemplateExercise[]
  if (exes.length === 0) return t('profile.noExercises')
  const names = exes.slice(0, 3).map(e => e.name).join(' · ')
  return exes.length > 3 ? `${names} · ${t('profile.andMore', { n: exes.length - 3 })}` : names
}

async function loadTemplates() {
  if (!auth.user) return
  const { data } = await supabase
    .from('workout_templates')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: true })
  templates.value = data ?? []
}

async function saveTemplate(asCopy = false) {
  if (!auth.user || !editor.value || !editor.value.name.trim()) return
  saving.value = true
  saveError.value = ''
  try {
    const exercises_data: TemplateExercise[] = editor.value.exercises
      .filter(e => e.name.trim())
      .map(({ id: _id, ...e }) => e)

    // Update in place only when editing an existing template and not copying.
    const isUpdate = editor.value.id && !asCopy

    let error
    if (isUpdate) {
      ;({ error } = await supabase
        .from('workout_templates')
        .update({ name: editor.value.name.trim(), exercises_data })
        .eq('id', editor.value.id!))
    } else {
      // New template, or a copy of an edited one saved to the user
      const name = asCopy && !/copy/i.test(editor.value.name)
        ? `${editor.value.name.trim()} (Copy)`
        : editor.value.name.trim()
      ;({ error } = await supabase.from('workout_templates').insert({
        user_id: auth.user.id,
        name,
        exercises_data,
        is_public: false,
      }))
    }

    if (error) throw error
    await loadTemplates()
    editor.value = null
  } catch (e: unknown) {
    saveError.value = e instanceof Error ? e.message : t('profile.saveFailed')
  } finally {
    saving.value = false
  }
}

function confirmDelete(id: string) {
  pendingDeleteId.value = id
  showDelete.value = true
}

async function doDeleteTemplate() {
  showDelete.value = false
  const id = pendingDeleteId.value
  pendingDeleteId.value = null
  if (!id) return
  await supabase.from('workout_templates').delete().eq('id', id)
  await loadTemplates()
}

onMounted(async () => {
  if (!auth.user) return
  const [{ data: p }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', auth.user.id).single(),
    loadTemplates(),
  ])
  profile.value = p
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
  max-width: 760px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

@media (max-width: 640px) {
  .main { padding: 16px 16px var(--tab-space); gap: 24px; }
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.page-title { font-size: 24px; font-weight: 800; }
.page-sub { font-size: 13px; color: var(--color-text-muted); margin-top: 4px; }

.schedule-btn { font-size: 13px; padding: 8px 14px; white-space: nowrap; }

/* Section */
.section { display: flex; flex-direction: column; gap: 12px; }

.account-email { font-size: 13px; }
.btn-logout {
  width: 100%;
  background: #0a0a0f;
  border: 1px solid rgba(239, 68, 68, 0.5);
  color: #f87171;
  font-weight: 700;
}
.btn-logout:hover { background: #000; border-color: #f87171; }

.lang-switch { display: flex; gap: 8px; }
.lang-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  transition: all 0.15s;
}
.lang-btn:hover { border-color: var(--color-primary); color: var(--color-text); }
.lang-btn.active {
  border-color: var(--color-primary);
  background: rgba(124, 58, 237, 0.12);
  color: var(--color-text);
}
.lang-btn .flag { font-size: 18px; line-height: 1; }

.setting-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius);
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s;
}
.setting-row:hover { border-color: var(--color-primary); }
.setting-text { display: flex; flex-direction: column; gap: 2px; }
.setting-label { font-size: 14px; font-weight: 700; color: var(--color-text); }
.setting-hint { font-size: 12px; }

.switch {
  flex-shrink: 0;
  width: 44px;
  height: 26px;
  border-radius: 999px;
  background: var(--color-border);
  position: relative;
  transition: background 0.18s;
}
.switch.on { background: var(--color-primary); }
.switch .knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.18s;
}
.switch.on .knob { transform: translateX(18px); }

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title {
  font-size: 11px;
  font-weight: 800;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  flex: 1;
}

.template-count {
  font-size: 12px;
  font-weight: 700;
}

.btn-new {
  padding: 5px 12px;
  background: rgba(124, 58, 237, 0.12);
  border: 1px solid rgba(124, 58, 237, 0.3);
  border-radius: 999px;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-new:hover { background: rgba(124, 58, 237, 0.22); }

/* Editor */
.editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
}

.editor-name-input {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 9px 12px;
  color: var(--color-text);
  font-size: 16px;
  font-weight: 700;
  font-family: inherit;
  outline: none;
  width: 100%;
}
.editor-name-input:focus { border-color: var(--color-primary); }
.editor-name-input::placeholder { font-weight: 400; color: var(--color-text-muted); }

.ex-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

.ex-top { display: flex; align-items: center; gap: 8px; }
.ex-top .ex-name-input { flex: 1; }

.ex-fields { display: flex; flex-wrap: wrap; gap: 8px; }
.fld { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 56px; }
.fld > span {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.ex-name-input {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 7px 10px;
  color: var(--color-text);
  font-size: 13px;
  font-family: inherit;
  outline: none;
  width: 100%;
  min-width: 0;
}
.ex-name-input:focus { border-color: var(--color-primary); }

.ex-num-input {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 7px 4px;
  color: var(--color-text);
  font-size: 13px;
  font-family: inherit;
  outline: none;
  text-align: center;
  width: 100%;
}
.ex-num-input::-webkit-inner-spin-button,
.ex-num-input::-webkit-outer-spin-button { -webkit-appearance: none; }
.ex-num-input:focus { border-color: var(--color-primary); }
.ex-num-input.duration { font-variant-numeric: tabular-nums; }

.ex-rep-cell {
  display: flex;
  gap: 4px;
  align-items: center;
}

.type-toggle {
  flex-shrink: 0;
  width: 26px;
  height: 28px;
  border-radius: var(--radius);
  border: 1px solid;
  font-size: 10px;
  font-weight: 800;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}

.type-toggle.reps {
  background: rgba(124, 58, 237, 0.1);
  border-color: rgba(124, 58, 237, 0.3);
  color: var(--color-primary);
}

.type-toggle.timer {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
  color: var(--color-xp);
}

.btn-remove-ex {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 12px;
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius);
  transition: color 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-remove-ex:hover { color: #f87171; }

.btn-add-ex {
  background: none;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius);
  padding: 6px 12px;
  color: var(--color-text-muted);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  align-self: flex-start;
}
.btn-add-ex:hover { border-color: var(--color-primary); color: var(--color-primary); }

.save-error {
  font-size: 12px;
  color: #f87171;
  padding: 8px 10px;
  background: rgba(248,113,113,0.08);
  border: 1px solid rgba(248,113,113,0.2);
  border-radius: var(--radius);
}

.editor-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 4px;
  border-top: 1px solid var(--color-border);
}

/* Template list */
.template-list { display: flex; flex-direction: column; gap: 8px; }

.template-card { padding: 0; overflow: hidden; }

.template-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
}

.template-info { flex: 1; min-width: 0; }
.template-name { font-size: 15px; font-weight: 700; }
.template-exercises { font-size: 12px; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.template-actions { display: flex; gap: 6px; flex-shrink: 0; }

.btn-sm {
  padding: 5px 10px;
  border-radius: var(--radius);
  font-size: 12px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid var(--color-border);
  background: var(--color-surface-2);
  color: var(--color-text-muted);
  transition: all 0.15s;
}
.btn-sm:hover { border-color: var(--color-primary); color: var(--color-primary); }
.btn-sm.danger:hover { border-color: #f87171; color: #f87171; }
.btn-sm.use {
  background: rgba(124, 58, 237, 0.12);
  border-color: rgba(124, 58, 237, 0.4);
  color: var(--color-primary);
}
.btn-sm.use:hover { background: rgba(124, 58, 237, 0.22); }

.loading, .empty { font-size: 13px; text-align: center; padding: 24px; }
.muted { color: var(--color-text-muted); }
</style>
