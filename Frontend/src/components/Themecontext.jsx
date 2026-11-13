import React, { createContext, useContext, useEffect } from "react";
import { useThemeStore } from "../store/themeStore";

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const setIsDarkMode = useThemeStore((state) => state.setIsDarkMode);

  const theme = isDarkMode ? "dark" : "light";

  const setTheme = (newTheme) => {
    setIsDarkMode(newTheme === "dark");
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
