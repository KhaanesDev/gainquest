<template>
  <div class="auth-page">
    <div class="auth-card card">
      <h1 class="auth-title">GainQuest</h1>
      <p class="auth-subtitle">Level up your muscles.</p>

      <form v-if="!resetMode" @submit.prevent="handleLogin" class="auth-form">
        <div class="field">
          <label>Email</label>
          <input v-model="email" type="email" class="input" placeholder="you@example.com" required />
        </div>
        <div class="field">
          <label>Password</label>
          <input v-model="password" type="password" class="input" placeholder="••••••••" required />
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button type="submit" class="btn btn-primary w-full" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Log in' }}
        </button>
        <button type="button" class="link-btn" @click="enterResetMode">Forgot password?</button>
      </form>

      <!-- Forgot password mode -->
      <form v-else @submit.prevent="handleReset" class="auth-form">
        <p class="reset-hint">Enter your email and we'll send you a reset link.</p>
        <div class="field">
          <label>Email</label>
          <input v-model="email" type="email" class="input" placeholder="you@example.com" required />
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <p v-if="resetSent" class="success-msg">Reset link sent! Check your inbox.</p>
        <button type="submit" class="btn btn-primary w-full" :disabled="loading || resetSent">
          {{ loading ? 'Sending...' : 'Send reset link' }}
        </button>
        <button type="button" class="link-btn" @click="resetMode = false">Back to login</button>
      </form>

      <p v-if="!resetMode" class="auth-footer">
        No account? <RouterLink to="/register">Sign up</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const resetMode = ref(false)
const resetSent = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await auth.signIn(email.value, password.value)
    router.push('/dashboard')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Login failed'
  } finally {
    loading.value = false
  }
}

function enterResetMode() {
  error.value = ''
  resetSent.value = false
  resetMode.value = true
}

async function handleReset() {
  error.value = ''
  loading.value = true
  try {
    await auth.resetPassword(email.value)
    resetSent.value = true
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Could not send reset link'
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

.auth-card {
  width: 100%;
  max-width: 400px;
}

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

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.w-full {
  width: 100%;
}

.error-msg {
  color: #f87171;
  font-size: 13px;
}

.success-msg {
  color: var(--color-accent);
  font-size: 13px;
}

.reset-hint {
  font-size: 13px;
  color: var(--color-text-muted);
}

.link-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  text-align: center;
  padding: 4px;
  transition: color 0.15s;
}
.link-btn:hover { color: var(--color-primary); }

.auth-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: var(--color-text-muted);
}
</style>
