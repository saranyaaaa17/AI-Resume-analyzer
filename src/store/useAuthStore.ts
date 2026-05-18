import { create } from 'zustand';

import type { AuthUser } from '@/types/resume';
import { API_BASE_URL } from '@/lib/api';

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  initialized: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  initializeFromStorage: () => void;
  clearAuth: () => void;
  tryRefreshFromCookie: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  initialized: false,
  setToken: (token) => {
    if (typeof window !== 'undefined') {
      if (token) {
        window.localStorage.setItem('auth_token', token);
      } else {
        window.localStorage.removeItem('auth_token');
      }
    }
    set({ token });
  },
  setUser: (user) => set({ user }),
  initializeFromStorage: () => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : null;
    set({ token, initialized: true });
  },
  tryRefreshFromCookie: async () => {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
      if (!res.ok) return;
      const body = await res.json();
      if (body?.access_token) {
        window.localStorage.setItem('auth_token', body.access_token);
        set({ token: body.access_token });
      }
    } catch (e) {
      // ignore
    }
  },
  clearAuth: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('auth_token');
    }
    set({ token: null, user: null });
  },
}));