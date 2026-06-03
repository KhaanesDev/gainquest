<template>
  <div class="layout">
    <nav class="navbar">
      <RouterLink to="/dashboard" class="nav-brand">GainQuest</RouterLink>
      <div class="nav-links">
        <RouterLink to="/dashboard">Dashboard</RouterLink>
        <RouterLink to="/workout">Log Workout</RouterLink>
        <RouterLink to="/explore">Explore</RouterLink>
        <RouterLink to="/profile">Profile</RouterLink>
      </div>
    </nav>

    <main class="main">
      <h2 class="page-title">Profile</h2>
      <div class="card">
        <p style="color: var(--color-text-muted)">Profile details coming soon.</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.layout { min-height: 100vh; display: flex; flex-direction: column; }
.navbar { display: flex; align-items: center; gap: 24px; padding: 12px 24px; background: var(--color-surface); border-bottom: 1px solid var(--color-border); }
.nav-brand { font-weight: 800; font-size: 18px; color: var(--color-primary); margin-right: auto; }
.nav-links { display: flex; gap: 20px; font-size: 14px; }
.nav-links a { color: var(--color-text-muted); }
.nav-links a.router-link-active { color: var(--color-text); }
.main { padding: 32px 24px; max-width: 960px; margin: 0 auto; width: 100%; }
.page-title { font-size: 24px; font-weight: 700; margin-bottom: 24px; }
</style>
