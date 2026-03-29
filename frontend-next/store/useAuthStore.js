import { create } from "zustand";
export const useAuthStore = create(() => ({
  user: { id: 1, name: "RL Agent", email: "agent@gcal-rl.local" },
  isAuthenticated: true,
  logout: () => {},
  login: () => {},
}));
