import { create } from 'zustand'

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('edusphere_dark_mode');
    if (saved !== null) {
      const isDark = saved === 'true';
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return isDark;
    }
  }
  return false;
};

export const useThemeStore = create((set) => ({
  isDarkMode: getInitialTheme(),
  setIsDarkMode: (newValue) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('edusphere_dark_mode', String(newValue));
      if (newValue) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    set({ isDarkMode: newValue });
  },
}));