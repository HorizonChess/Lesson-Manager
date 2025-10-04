import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface AppState {
  isDarkMode: boolean
  isRTL: boolean
  toggleDarkMode: () => void
  toggleRTL: () => void
}

// Check system preference for dark mode
const getSystemPreference = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isDarkMode: getSystemPreference(),
      isRTL: false,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      toggleRTL: () => set((state) => ({ isRTL: !state.isRTL })),
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
)