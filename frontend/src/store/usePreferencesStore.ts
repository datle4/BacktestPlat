import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemePreference = 'light' | 'dark'

interface PreferencesState {
  theme: ThemePreference
  setTheme: (theme: ThemePreference) => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'backtestplat-preferences',
      partialize: ({ theme }) => ({ theme }),
      // Legacy 'system' preferences become light with the two-option control.
      merge: (persisted, current) => ({
        ...current,
        theme:
          typeof persisted === 'object' &&
          persisted !== null &&
          'theme' in persisted &&
          persisted.theme === 'dark'
            ? 'dark'
            : 'light',
      }),
    },
  ),
)
