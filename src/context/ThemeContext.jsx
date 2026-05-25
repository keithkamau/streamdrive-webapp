import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("sd_theme") === "dark";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("sd_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("sd_theme", "light");
    }
  }, [dark]);

  const toggleTheme = () => setDark((d) => !d);

  return (
    // Expose both `dark` and `isDark` so TopBar.jsx (isDark) and any other
    // consumer using `dark` both work without changes.
    <ThemeContext.Provider value={{ dark, isDark: dark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be within ThemeProvider");
  return ctx;
};
