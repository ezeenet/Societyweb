// lib/api/property.api.ts

import apiClient from './client';
import type {
  Wing, WingRequest,
  Flat, FlatRequest, FlatStatus,
  Member, MemberRequest, PageResponse,
} from '@/types/property.types';
import type { ApiSuccess } from '@/types/auth.types';

// ── Wings ─────────────────────────────────────────────────────────────────────

export const wingsApi = {
  getAll: async (): Promise<Wing[]> => {
    const { data } = await apiClient.get<ApiSuccess<Wing[]>>('/wings');
    return data.data;
  },
  create: async (payload: WingRequest): Promise<Wing> => {
    const { data } = await apiClient.post<ApiSuccess<Wing>>('/wings', payload);
    return data.data;
  },
  update: async (id: number, payload: WingRequest): Promise<Wing> => {
    const { data } = await apiClient.put<ApiSuccess<Wing>>(`/wings/${id}`, payload);
    return data.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/wings/${id}`);
  },
};

// ── Flats ─────────────────────────────────────────────────────────────────────

export const flatsApi = {
  getAll: async (params?: { wingId?: number; status?: FlatStatus }): Promise<Flat[]> => {
    const { data } = await apiClient.get<ApiSuccess<Flat[]>>('/flats', { params });
    return data.data;
  },
  getById: async (id: number): Promise<Flat> => {
    const { data } = await apiClient.get<ApiSuccess<Flat>>(`/flats/${id}`);
    return data.data;
  },
  create: async (payload: FlatRequest): Promise<Flat> => {
    const { data } = await apiClient.post<ApiSuccess<Flat>>('/flats', payload);
    return data.data;
  },
  update: async (id: number, payload: FlatRequest): Promise<Flat> => {
    const { data } = await apiClient.put<ApiSuccess<Flat>>(`/flats/${id}`, payload);
    return data.data;
  },
  updateStatus: async (id: number, status: FlatStatus): Promise<Flat> => {
    const { data } = await apiClient.patch<ApiSuccess<Flat>>(`/flats/${id}/status`, { status });
    return data.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/flats/${id}`);
  },
};

// ── Members ───────────────────────────────────────────────────────────────────

export const membersApi = {
  getAll: async (includeInactive = false): Promise<Member[]> => {
    const { data } = await apiClient.get<ApiSuccess<Member[]>>('/members/all', { params: { includeInactive } });
    return data.data;
  },
  search: async (params: { search?: string; page?: number; size?: number }): Promise<PageResponse<Member>> => {
    const { data } = await apiClient.get<ApiSuccess<PageResponse<Member>>>('/members', { params });
    return data.data;
  },
  getById: async (id: number): Promise<Member> => {
    const { data } = await apiClient.get<ApiSuccess<Member>>(`/members/${id}`);
    return data.data;
  },
  create: async (payload: MemberRequest): Promise<Member> => {
    const { data } = await apiClient.post<ApiSuccess<Member>>('/members', payload);
    return data.data;
  },
  update: async (id: number, payload: MemberRequest): Promise<Member> => {
    const { data } = await apiClient.put<ApiSuccess<Member>>(`/members/${id}`, payload);
    return data.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/members/${id}`);
  },
  exportCsv: async (): Promise<Blob> => {
    const response = await apiClient.get('/members/export', { responseType: 'blob' });
    return response.data;
  },
  moveOut: async (id: number, moveOutDate?: string): Promise<Member> => {
    const params = moveOutDate ? { moveOutDate } : {};
    const { data } = await apiClient.post<ApiSuccess<Member>>(`/members/${id}/move-out`, null, { params });
    return data.data;
  },
};
