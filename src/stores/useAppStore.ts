import { create } from 'zustand'

interface AppState {
  isDarkMode: boolean
  isRTL: boolean
  toggleDarkMode: () => void
  toggleRTL: () => void
}

export const useAppStore = create<AppState>((set) => ({
  isDarkMode: false,
  isRTL: false,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  toggleRTL: () => set((state) => ({ isRTL: !state.isRTL })),
}))