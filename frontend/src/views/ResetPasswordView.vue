<template>
  <div class="auth-page">
    <div class="auth-card card">
      <h1 class="auth-title">GainQuest</h1>
      <p class="auth-subtitle">Set a new password</p>

      <form v-if="!done" @submit.prevent="handleUpdate" class="auth-form">
        <div class="field">
          <label>New password</label>
          <input v-model="password" type="password" class="input" placeholder="Min 8 characters" required minlength="8" />
        </div>
        <div class="field">
          <label>Confirm password</label>
          <input v-model="confirm" type="password" class="input" placeholder="Repeat password" required minlength="8" />
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button type="submit" class="btn btn-primary w-full" :disabled="loading">
          {{ loading ? 'Saving...' : 'Update password' }}
        </button>
      </form>

      <div v-else class="confirm-msg">
        <p class="confirm-icon">✅</p>
        <p>Your password has been updated.</p>
        <RouterLink to="/dashboard" class="btn btn-primary w-full">Go to dashboard</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const password = ref('')
const confirm = ref('')
const error = ref('')
const loading = ref(false)
const done = ref(false)

async function handleUpdate() {
  error.value = ''
  if (password.value !== confirm.value) {
    error.value = 'Passwords do not match.'
    return
  }
  loading.value = true
  try {
    await auth.updatePassword(password.value)
    done.value = true
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Could not update password'
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
