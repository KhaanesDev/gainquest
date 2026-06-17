<template>
  <nav v-if="auth.user" class="tab-bar">
    <RouterLink to="/dashboard" class="tab" :class="{ active: route.path === '/dashboard' }">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
      <span>Home</span>
    </RouterLink>

    <RouterLink to="/workout" class="tab" :class="{ active: route.path === '/workout' }">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v16M18 4v16M3 12h18M2 7h4M18 7h4M2 17h4M18 17h4"/></svg>
      <span>Workout</span>
    </RouterLink>

    <RouterLink to="/explore" class="tab" :class="{ active: route.path === '/explore' }">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <span>Explore</span>
    </RouterLink>

    <RouterLink to="/stats" class="tab" :class="{ active: route.path === '/stats' }">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      <span>Progress</span>
    </RouterLink>

    <RouterLink to="/profile" class="tab" :class="{ active: route.path === '/profile' }">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
      <span>Profile</span>
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()
</script>

<style scoped>
.tab-bar {
  display: none;
}

@media (max-width: 640px) {
  .tab-bar {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
    padding-bottom: env(safe-area-inset-bottom);
  }
}

.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 10px 4px;
  color: var(--color-text-muted);
  text-decoration: none;
  transition: color 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.tab svg {
  width: 22px;
  height: 22px;
}

.tab span {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.tab.active {
  color: var(--color-primary);
}
</style>
