import { ref, watch } from 'vue'
import { lsGet, lsSet } from '@/lib/storage'

const GYM_KEY = 'gq-gym-access'
const stored = lsGet(GYM_KEY)

// Whether the user has access to a gym / training centre. When false, exercise
// discovery is limited to bodyweight & minimal-equipment ("calisthenics") moves.
export const gymAccess = ref(stored === null ? true : stored === 'true')

watch(gymAccess, v => lsSet(GYM_KEY, String(v)))
