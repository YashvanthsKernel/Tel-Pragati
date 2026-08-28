"use client";

import { create } from "zustand";

type ThemeMode = "dark" | "light";

interface ThemeState {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

function applyTheme(mode: ThemeMode) {
  if (typeof document !== "undefined") {
    if (mode === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }
}

const savedTheme =
  typeof window !== "undefined"
    ? (localStorage.getItem("tel-pragati-theme") as ThemeMode) || "dark"
    : "dark";

export const useThemeStore = create<ThemeState>((set) => {
  // Apply on init
  applyTheme(savedTheme);

  return {
    mode: savedTheme,
    toggleTheme: () =>
      set((state) => {
        const next = state.mode === "dark" ? "light" : "dark";
        applyTheme(next);
        localStorage.setItem("tel-pragati-theme", next);
        return { mode: next };
      }),
    setTheme: (mode) => {
      applyTheme(mode);
      localStorage.setItem("tel-pragati-theme", mode);
      set({ mode });
    },
  };
});
