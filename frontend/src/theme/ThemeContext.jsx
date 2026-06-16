import { createContext, useContext, useEffect, useState } from "react";
import { lightTheme, darkTheme } from "./theme";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("padel_dark") === "true"; } catch { return false; }
  });

  useEffect(() => {
    const mode = dark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", mode);
    document.documentElement.style.colorScheme = mode;
    document.body?.setAttribute("data-theme", mode);
  }, [dark]);

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
