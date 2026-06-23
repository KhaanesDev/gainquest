<template>
  <div class="auth-page">
    <div class="auth-card card">
      <h1 class="auth-title">GainQuest</h1>
      <p class="auth-subtitle">{{ $t('auth.registerSubtitle') }}</p>

      <div v-if="confirmationSent" class="confirm-msg">
        <p class="confirm-icon">📧</p>
        <i18n-t keypath="auth.confirmAlmost" tag="p">
          <template #email><strong>{{ email }}</strong></template>
        </i18n-t>
        <p class="confirm-sub">{{ $t('auth.confirmSub') }}</p>
        <RouterLink to="/login" class="btn btn-primary w-full">{{ $t('auth.goToLogin') }}</RouterLink>
      </div>

      <template v-else>
        <form @submit.prevent="handleRegister" class="auth-form">
          <div class="field">
            <label>{{ $t('auth.username') }}</label>
            <input v-model="username" type="text" class="input" :placeholder="$t('auth.usernamePlaceholder')" required />
          </div>
          <div class="field">
            <label>{{ $t('auth.email') }}</label>
            <input v-model="email" type="email" class="input" :placeholder="$t('auth.emailPlaceholder')" required />
          </div>
          <div class="field">
            <label>{{ $t('auth.password') }}</label>
            <input v-model="password" type="password" class="input" :placeholder="$t('auth.minChars')" required minlength="8" />
          </div>
          <p v-if="error" class="error-msg">{{ error }}</p>
          <button type="submit" class="btn btn-primary w-full" :disabled="loading">
            {{ loading ? $t('auth.creatingAccount') : $t('auth.createAccount') }}
          </button>
        </form>

        <p class="auth-footer">
          {{ $t('auth.alreadyHaveAccount') }} <RouterLink to="/login">{{ $t('auth.logIn') }}</RouterLink>
        </p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()

const auth = useAuthStore()
const router = useRouter()

const username = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const confirmationSent = ref(false)

async function handleRegister() {
  error.value = ''
  loading.value = true
  try {
    const { needsConfirmation } = await auth.signUp(email.value, password.value, username.value)
    if (needsConfirmation) {
      confirmationSent.value = true
    } else {
      router.push('/dashboard')
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : t('auth.errors.registrationFailed')
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

.w-full { width: 100%; }
.error-msg { color: #f87171; font-size: 13px; }

.confirm-msg {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 14px;
  color: var(--color-text);
}
.confirm-icon { font-size: 40px; }
.confirm-sub { color: var(--color-text-muted); font-size: 13px; }
.confirm-msg .btn { margin-top: 8px; }

.auth-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: var(--color-text-muted);
}
</style>
