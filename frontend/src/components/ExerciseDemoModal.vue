<template>
  <Teleport to="body">
    <div v-if="name" class="overlay" @click.self="emit('close')">
      <div class="modal" role="dialog" :aria-label="name">
        <div class="modal-header">
          <h3 class="modal-title">{{ name }}</h3>
          <button class="close-btn" @click="emit('close')" aria-label="Close">✕</button>
        </div>

        <div class="modal-body">
          <div v-if="loading" class="state">
            <div class="spinner" />
          </div>
          <div v-else-if="videoId" class="video-wrap">
            <iframe
              :src="`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&rel=0&modestbranding=1`"
              allow="autoplay; encrypted-media"
              allowfullscreen
              frameborder="0"
              class="video-frame"
            />
          </div>
          <div v-else class="state muted">No video found for this exercise.</div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ name: string | null }>()
const emit = defineEmits<{ close: [] }>()

const videoId = ref<string | null>(null)
const loading = ref(false)

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY as string

watch(() => props.name, async (name) => {
  videoId.value = null
  if (!name) return

  loading.value = true
  try {
    const q = encodeURIComponent(`how to ${name} exercise form`)
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${q}&type=video&videoDuration=short&maxResults=1&key=${API_KEY}`
    const res = await fetch(url)
    const data = await res.json()
    console.log('[YouTube]', res.status, JSON.stringify(data).slice(0, 300))
    videoId.value = data.items?.[0]?.id?.videoId ?? null
  } catch (e) {
    console.error('[YouTube] fetch failed', e)
    videoId.value = null
  } finally {
    loading.value = false
  }
}, { immediate: true })
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}

.modal {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 560px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.modal-title {
  font-size: 15px;
  font-weight: 700;
  text-transform: capitalize;
}

.close-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  border-radius: var(--radius);
  transition: color 0.15s;
  flex-shrink: 0;
}
.close-btn:hover { color: var(--color-text); }

.modal-body {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  min-height: 200px;
}

.video-wrap {
  width: 100%;
  aspect-ratio: 16 / 9;
}

.video-frame {
  width: 100%;
  height: 100%;
  display: block;
  border: none;
}

.state {
  padding: 40px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--color-text-muted);
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
