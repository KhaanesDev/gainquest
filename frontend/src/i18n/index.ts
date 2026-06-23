import { createI18n } from 'vue-i18n'
import en from './en'
import no from './no'

export type Locale = 'en' | 'no'

const STORAGE_KEY = 'gq-locale'

function detectLocale(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'en' || saved === 'no') return saved
  const browser = (navigator.language || '').toLowerCase()
  return browser.startsWith('nb') || browser.startsWith('nn') || browser.startsWith('no')
    ? 'no'
    : 'en'
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: detectLocale(),
  fallbackLocale: 'en',
  messages: { en, no },
})

export function setLocale(locale: Locale) {
  i18n.global.locale.value = locale
  localStorage.setItem(STORAGE_KEY, locale)
  document.documentElement.lang = locale
}

export function currentLocale(): Locale {
  return i18n.global.locale.value as Locale
}

// Apply <html lang> on startup.
document.documentElement.lang = currentLocale()
