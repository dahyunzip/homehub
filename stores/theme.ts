import { defineStore } from 'pinia'

export type Theme = 'light' | 'dark'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>('light')

  function apply(value: Theme) {
    theme.value = value
    if (import.meta.client) {
      document.documentElement.setAttribute('data-theme', value)
      localStorage.setItem('homehub_theme', value)
    }
  }

  function init() {
    if (import.meta.client) {
      const saved = localStorage.getItem('homehub_theme') as Theme | null
      apply(saved ?? 'light')
    }
  }

  return { theme, apply, init }
})
