// ─────────────────────────────────────────────────────────────────────────────
// lib/api/auth.api.ts
// Auth-specific API calls. One function per endpoint.
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from './client';
import { ApiSuccess, AuthResponse, LoginRequest } from '@/types/auth.types';

export const authApi = {

  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<ApiSuccess<AuthResponse>>(
      '/auth/login',
      credentials
    );
    return data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  getProfile: async (): Promise<AuthResponse> => {
    const { data } = await apiClient.get<ApiSuccess<AuthResponse>>('/auth/me');
    return data.data;
  },

};
