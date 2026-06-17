<template>
  <RouterView />
  <AppTabBar />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppTabBar from '@/components/AppTabBar.vue'
</script>
