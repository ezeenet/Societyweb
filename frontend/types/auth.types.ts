// ─────────────────────────────────────────────────────────────────────────────
// types/auth.types.ts
// All auth-related TypeScript types.
// ─────────────────────────────────────────────────────────────────────────────

export type Role = 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'SECURITY' | 'MEMBER';

export interface AuthUser {
  username: string;
  fullName: string;
  role: Role;
  memberId: number | null;
}

export interface AuthResponse {
  accessToken: string;
  username: string;
  fullName: string;
  role: Role;
  memberId: number | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic API envelope matching the backend ApiResponse<T>
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  status: 'success';
  data: T;
  message: string | null;
  timestamp: string;
}

export interface ApiError {
  status: 'error';
  code: string;
  message: string;
  errors?: Record<string, string>;   // Field-level validation errors
  timestamp: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─────────────────────────────────────────────────────────────────────────────
// Permission model — maps each role to its allowed actions
// Used by usePermissions() hook and sidebar rendering
// ─────────────────────────────────────────────────────────────────────────────

export type Permission =
  | 'view:members'
  | 'manage:members'
  | 'view:flats'
  | 'manage:flats'
  | 'view:maintenance'
  | 'manage:maintenance'
  | 'approve:payments'
  | 'view:complaints'
  | 'manage:complaints'
  | 'view:visitors'
  | 'manage:visitors'
  | 'view:notices'
  | 'manage:notices'
  | 'vote:polls'
  | 'view:accounts'
  | 'manage:accounts'
  | 'view:reports'
  | 'view:documents'
  | 'manage:documents'
  | 'view:settings'
  | 'manage:settings'
  | 'view:users'
  | 'manage:users';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    'view:members', 'manage:members',
    'view:flats', 'manage:flats',
    'view:maintenance', 'manage:maintenance', 'approve:payments',
    'view:complaints', 'manage:complaints',
    'view:visitors', 'manage:visitors',
    'view:notices', 'manage:notices', 'vote:polls',
    'view:accounts', 'manage:accounts',
    'view:reports',
    'view:documents', 'manage:documents',
    'view:settings', 'manage:settings',
    'view:users', 'manage:users',
  ],
  MANAGER: [
    'view:members', 'manage:members',
    'view:flats', 'manage:flats',
    'view:maintenance', 'manage:maintenance',
    'view:complaints', 'manage:complaints',
    'view:visitors', 'manage:visitors',
    'view:notices', 'manage:notices', 'vote:polls',
    'view:documents', 'manage:documents',
  ],
  ACCOUNTANT: [
    'view:maintenance', 'manage:maintenance',
    'view:accounts', 'manage:accounts',
    'view:reports',
  ],
  SECURITY: [
    'view:complaints', 'manage:complaints',
    'view:visitors', 'manage:visitors',
  ],
  MEMBER: [
    'view:maintenance',
    'view:complaints', 'manage:complaints',
    'view:notices', 'vote:polls',
  ],
};
