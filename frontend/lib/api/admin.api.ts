// lib/api/admin.api.ts
import apiClient from './client';
import type { ApiSuccess } from '@/types/auth.types';
import type {
  DashboardStats, SocietySettings, SystemUser,
  UserCreateRequest, UserUpdateRequest,
  DocumentFile, ActivityLog, PageResponse,
} from '@/types/admin.types';

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> =>
    (await apiClient.get<ApiSuccess<DashboardStats>>('/dashboard/stats')).data.data,
};

export const settingsApi = {
  get:    async (): Promise<SocietySettings> =>
    (await apiClient.get<ApiSuccess<SocietySettings>>('/settings')).data.data,
  update: async (payload: Partial<SocietySettings>): Promise<SocietySettings> =>
    (await apiClient.put<ApiSuccess<SocietySettings>>('/settings', payload)).data.data,
  uploadLogo: async (file: File): Promise<SocietySettings> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post<ApiSuccess<SocietySettings>>('/settings/logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },
};

export const usersApi = {
  getAll:       async (): Promise<SystemUser[]> =>
    (await apiClient.get<ApiSuccess<SystemUser[]>>('/users')).data.data,
  create:       async (p: UserCreateRequest): Promise<SystemUser> =>
    (await apiClient.post<ApiSuccess<SystemUser>>('/users', p)).data.data,
  update:       async (id: number, p: UserUpdateRequest): Promise<SystemUser> =>
    (await apiClient.put<ApiSuccess<SystemUser>>(`/users/${id}`, p)).data.data,
  toggleActive: async (id: number): Promise<SystemUser> =>
    (await apiClient.patch<ApiSuccess<SystemUser>>(`/users/${id}/toggle`, {})).data.data,
  delete:       async (id: number): Promise<void> => { await apiClient.delete(`/users/${id}`); },
  getActivityLog: async (params: { search?: string; page?: number; size?: number }): Promise<PageResponse<ActivityLog>> =>
    (await apiClient.get<ApiSuccess<PageResponse<ActivityLog>>>('/users/activity-log', { params })).data.data,
};

export const documentsApi = {
  getAll:   async (type?: string): Promise<DocumentFile[]> =>
    (await apiClient.get<ApiSuccess<DocumentFile[]>>('/documents', { params: type ? { type } : {} })).data.data,
  upload:   async (title: string, documentType: string, memberId: number | undefined, file: File): Promise<DocumentFile> => {
    const form = new FormData();
    form.append('title', title);
    form.append('documentType', documentType);
    if (memberId) form.append('memberId', String(memberId));
    form.append('file', file);
    const { data } = await apiClient.post<ApiSuccess<DocumentFile>>('/documents', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },
  download: (id: number) => {
    window.open(`${apiClient.defaults.baseURL}/documents/${id}/download`, '_blank');
  },
  delete:   async (id: number): Promise<void> => { await apiClient.delete(`/documents/${id}`); },
};

// ── lib/hooks/useAdmin.ts ─────────────────────────────────────────────────────
