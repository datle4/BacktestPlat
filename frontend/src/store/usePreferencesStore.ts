import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemePreference = 'light' | 'dark' | 'system'

interface PreferencesState {
  theme: ThemePreference
  setTheme: (theme: ThemePreference) => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'backtestplat-preferences',
      partialize: ({ theme }) => ({ theme }),
    },
  ),
)

