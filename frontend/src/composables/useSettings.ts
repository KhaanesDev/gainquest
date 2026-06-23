import { ref, watch } from 'vue'

const GYM_KEY = 'gq-gym-access'
const stored = localStorage.getItem(GYM_KEY)

// Whether the user has access to a gym / training centre. When false, exercise
// discovery is limited to bodyweight & minimal-equipment ("calisthenics") moves.
export const gymAccess = ref(stored === null ? true : stored === 'true')

watch(gymAccess, v => localStorage.setItem(GYM_KEY, String(v)))
