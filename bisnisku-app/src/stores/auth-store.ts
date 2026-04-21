import { create } from "zustand";
import type { UserRole } from "@/types";

interface AuthState {
  userId: string | null;
  role: UserRole | null;
  isLoading: boolean;
  setUser: (userId: string, role: UserRole) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  role: null,
  isLoading: true,
  setUser: (userId, role) => set({ userId, role, isLoading: false }),
  clearUser: () => set({ userId: null, role: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
