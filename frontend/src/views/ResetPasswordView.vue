<template>
  <div class="auth-page">
    <div class="auth-card card">
      <h1 class="auth-title">GainQuest</h1>
      <p class="auth-subtitle">{{ $t('auth.resetSubtitle') }}</p>

      <form v-if="!done" @submit.prevent="handleUpdate" class="auth-form">
        <div class="field">
          <label>{{ $t('auth.newPassword') }}</label>
          <input v-model="password" type="password" class="input" :placeholder="$t('auth.minChars')" required minlength="8" />
        </div>
        <div class="field">
          <label>{{ $t('auth.confirmPassword') }}</label>
          <input v-model="confirm" type="password" class="input" :placeholder="$t('auth.repeatPassword')" required minlength="8" />
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button type="submit" class="btn btn-primary w-full" :disabled="loading">
          {{ loading ? $t('auth.savingPassword') : $t('auth.updatePassword') }}
        </button>
      </form>

      <div v-else class="confirm-msg">
        <p class="confirm-icon">✅</p>
        <p>{{ $t('auth.passwordUpdated') }}</p>
        <RouterLink to="/dashboard" class="btn btn-primary w-full">{{ $t('auth.goToDashboard') }}</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()

const auth = useAuthStore()

const password = ref('')
const confirm = ref('')
const error = ref('')
const loading = ref(false)
const done = ref(false)

async function handleUpdate() {
  error.value = ''
  if (password.value !== confirm.value) {
    error.value = t('auth.passwordsNoMatch')
    return
  }
  loading.value = true
  try {
    await auth.updatePassword(password.value)
    done.value = true
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : t('auth.errors.updateFailed')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.auth-card { width: 100%; max-width: 400px; }

.auth-title {
  font-size: 28px;
  font-weight: 800;
  color: var(--color-primary);
  text-align: center;
}

.auth-subtitle {
  text-align: center;
  color: var(--color-text-muted);
  margin-top: 4px;
  margin-bottom: 24px;
  font-size: 14px;
}

.auth-form { display: flex; flex-direction: column; gap: 16px; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.w-full { width: 100%; }
.error-msg { color: #f87171; font-size: 13px; }

.confirm-msg {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 14px;
}
.confirm-icon { font-size: 40px; }
.confirm-msg .btn { margin-top: 8px; }
</style>
