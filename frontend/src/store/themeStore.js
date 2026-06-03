import { create } from 'zustand'

function getInitialTheme() {
  try {
    const stored = localStorage.getItem('devbill-theme')
    if (stored === 'dark' || stored === 'light') return stored
  } catch { /* noop */ }
  return 'light'
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

const initial = getInitialTheme()
applyTheme(initial)

export const useThemeStore = create((set) => ({
  theme: initial,
  toggle: () => set((state) => {
    const next = state.theme === 'light' ? 'dark' : 'light'
    applyTheme(next)
    try { localStorage.setItem('devbill-theme', next) } catch {}
    return { theme: next }
  }),
  setLight: () => {
    applyTheme('light')
    try { localStorage.setItem('devbill-theme', 'light') } catch {}
    set({ theme: 'light' })
  },
  setDark: () => {
    applyTheme('dark')
    try { localStorage.setItem('devbill-theme', 'dark') } catch {}
    set({ theme: 'dark' })
  },
}))
