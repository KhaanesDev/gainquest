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
              :key="videoId"
              :src="`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&rel=0&modestbranding=1`"
              allow="autoplay; encrypted-media"
              allowfullscreen
              frameborder="0"
              class="video-frame"
            />
          </div>
          <div v-else class="state muted">{{ $t('exercise.noVideo') }}</div>
        </div>

        <div v-if="videoIds.length > 1" class="modal-footer">
          <span class="video-count muted">{{ currentIndex + 1 }} / {{ videoIds.length }}</span>
          <button class="try-another" @click="nextVideo">↻ {{ $t('exercise.tryAnother') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{ name: string | null }>()
const emit = defineEmits<{ close: [] }>()

const videoIds = ref<string[]>([])
const currentIndex = ref(0)
const loading = ref(false)

const videoId = computed(() => videoIds.value[currentIndex.value] ?? null)

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY as string
const MAX_SECONDS = 65 // prefer clips up to ~1:05

// Cycle through the fetched results so a wrong video can be swapped without
// another API call (search.list costs the same quota for 1 or many results).
function nextVideo() {
  if (videoIds.value.length === 0) return
  currentIndex.value = (currentIndex.value + 1) % videoIds.value.length
}

// Parse an ISO 8601 duration (e.g. "PT1M5S") into seconds.
function parseDuration(iso: string): number {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso)
  if (!m) return Infinity
  return (+(m[1] ?? 0)) * 3600 + (+(m[2] ?? 0)) * 60 + (+(m[3] ?? 0))
}

watch(() => props.name, async (name) => {
  videoIds.value = []
  currentIndex.value = 0
  if (!name) return

  loading.value = true
  try {
    const q = encodeURIComponent(`how to ${name} exercise form`)
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${q}&type=video&videoDuration=short&maxResults=12&key=${API_KEY}`
    const searchData = await (await fetch(searchUrl)).json()
    const ids: string[] = (searchData.items ?? [])
      .map((it: { id?: { videoId?: string } }) => it.id?.videoId)
      .filter((id: string | undefined): id is string => !!id)

    if (ids.length === 0) { videoIds.value = []; return }

    // Fetch real durations (cheap: 1 quota unit) and keep clips <= MAX_SECONDS.
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids.join(',')}&key=${API_KEY}`
    const detailsData = await (await fetch(detailsUrl)).json()
    const seconds = new Map<string, number>(
      (detailsData.items ?? []).map((v: { id: string; contentDetails?: { duration?: string } }) =>
        [v.id, parseDuration(v.contentDetails?.duration ?? '')]
      )
    )

    const short = ids.filter(id => (seconds.get(id) ?? Infinity) <= MAX_SECONDS)
    // Fall back to the unfiltered short results if nothing is under the cap.
    videoIds.value = short.length > 0 ? short : ids
  } catch (e) {
    console.error('[YouTube] fetch failed', e)
    videoIds.value = []
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

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  border-top: 1px solid var(--color-border);
}

.video-count { font-size: 12px; font-weight: 600; }

.try-another {
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  background: rgba(124, 58, 237, 0.12);
  border: 1px solid rgba(124, 58, 237, 0.3);
  color: var(--color-primary);
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}
.try-another:hover { background: rgba(124, 58, 237, 0.22); }

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
