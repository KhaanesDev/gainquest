import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const initialized = ref(false)

  function isEmailConfirmed(u: User | null): boolean {
    return !!(u?.email_confirmed_at ?? u?.confirmed_at)
  }

  async function initialize() {
    if (initialized.value) return

    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user ?? null

    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
    })

    initialized.value = true
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (!isEmailConfirmed(data.user)) {
      await supabase.auth.signOut()
      user.value = null
      throw new Error('Please confirm your email before logging in. Check your inbox.')
    }
    user.value = data.user
  }

  async function signUp(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    if (error) throw error

    // When email confirmation is enabled, Supabase returns a user with an
    // empty identities array if the email is already registered (to avoid
    // leaking which emails exist). Treat that as a duplicate.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      throw new Error('An account with this email already exists.')
    }

    // If a session was returned, email confirmation is off → log straight in.
    // Otherwise the user must confirm via email first.
    user.value = data.session?.user ?? null
    return { needsConfirmation: !data.session }
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
  }

  return { user, initialized, initialize, isEmailConfirmed, signIn, signUp, resetPassword, updatePassword, signOut }
})
