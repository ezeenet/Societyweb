import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role } from '@/types/auth.types';

interface AuthUser {
  username: string;
  fullName: string | null;
  role:     Role;
  memberId: number | null;
}

interface AuthState {
  user:            AuthUser | null;
  accessToken:     string | null;
  isAuthenticated: boolean;

  setAuth:   (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  hasPermission: (permission: string) => boolean;
}

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  ADMIN:      ['*'],
  MANAGER:    ['manage:complaints', 'manage:notices', 'manage:documents', 'manage:visitors', 'vote:polls'],
  ACCOUNTANT: ['view:accounts', 'view:reports'],
  SECURITY:   ['manage:visitors'],
  MEMBER:     ['vote:polls', 'view:maintenance'],
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:            null,
      accessToken:     null,
      isAuthenticated: false,

      setAuth: (user, accessToken) => {
        // Also save token to cookie for proxy.ts to read
        document.cookie = `accessToken=${accessToken}; path=/; max-age=900`;
        set({ user, accessToken, isAuthenticated: true });
      },

      clearAuth: () => {
        // Clear cookie
        document.cookie = 'accessToken=; path=/; max-age=0';
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;
        const perms = ROLE_PERMISSIONS[user.role] ?? [];
        return perms.includes('*') || perms.includes(permission);
      },
    }),
    {
      name: 'societyms-auth',        // localStorage key
      partialize: (state) => ({      // only persist these fields
        user:            state.user,
        accessToken:     state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
