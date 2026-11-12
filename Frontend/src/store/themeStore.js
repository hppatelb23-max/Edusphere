import { create } from 'zustand'

export const useThemeStore = create((set) => ({
    isDarkMode: false,
    setIsDarkMode: (newValue) => set({ isDarkMode: newValue }), // Correctly update isDarkMode
  }));