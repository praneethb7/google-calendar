import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: "light",
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === "light" ? "dark" : "light";
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", next);
        document.documentElement.classList.toggle("dark", next === "dark");
      }
      return { theme: next };
    }),
  setTheme: (theme) => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
    set({ theme });
  },
  initTheme: () => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("gcal-theme");
    const theme = saved || "light";
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    set({ theme });
  },
}));
