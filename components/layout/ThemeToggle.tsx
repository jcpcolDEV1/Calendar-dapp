"use client";

import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark =
      typeof window !== "undefined" &&
      document.documentElement.classList.contains("dark");
    setDarkMode(isDark);
  }, []);

  function toggleTheme() {
    document.documentElement.classList.toggle("dark");
    setDarkMode((prev) => !prev);
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      data-testid="theme-toggle"
    >
      {darkMode ? (
        <Sun className="h-5 w-5 text-slate-600 dark:text-slate-300" />
      ) : (
        <Moon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
      )}
    </button>
  );
}
