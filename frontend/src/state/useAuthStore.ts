"use client";

import { create } from "zustand";
import { AutonomyTier, Role } from "../data/types";

interface AuthState {
  user: string;
  role: Role;
  autonomyTier: AutonomyTier;
  isAuthenticated: boolean;
  setRole: (role: Role) => void;
  setUser: (user: string) => void;
  setAutonomyTier: (tier: AutonomyTier) => void;
  login: (user: string, role: Role) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: "",
  role: "viewer",
  autonomyTier: "advisory",
  isAuthenticated: false,

  setRole: (role: Role) => set({ role }),
  setUser: (user: string) => set({ user }),
  setAutonomyTier: (autonomyTier: AutonomyTier) => set({ autonomyTier }),
  login: (user: string, role: Role) =>
    set({ user, role, isAuthenticated: true }),
  logout: () =>
    set({ user: "", role: "viewer", isAuthenticated: false }),
}));
