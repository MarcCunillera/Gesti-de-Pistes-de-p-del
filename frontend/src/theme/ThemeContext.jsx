import { createContext, useContext, useState } from "react";
import { lightTheme, darkTheme } from "./theme";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("padel_dark") === "true"; } catch { return false; }
  });

  const toggle = () => {
    setDark((d) => {
      const next = !d;
      localStorage.setItem("padel_dark", String(next));
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ t: dark ? darkTheme : lightTheme, dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
