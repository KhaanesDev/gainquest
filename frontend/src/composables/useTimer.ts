import { ref, onUnmounted } from 'vue'
import type { Ref } from 'vue'

export function useTimer(startTime: Ref<Date | null>) {
  const elapsed = ref('00:00')

  const interval = setInterval(() => {
    if (!startTime.value) return
    const secs = Math.floor((Date.now() - startTime.value.getTime()) / 1000)
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    elapsed.value = `${m}:${s}`
  }, 1000)

  onUnmounted(() => clearInterval(interval))

  return { elapsed }
}
