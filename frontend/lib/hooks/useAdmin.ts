// lib/hooks/useAdmin.ts
'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { dashboardApi, settingsApi, usersApi, documentsApi } from '@/lib/api/admin.api';
import type { UserCreateRequest, UserUpdateRequest, SocietySettings } from '@/types/admin.types';

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const useDashboardStats = () =>
  useQuery({
    queryKey: ['dashboard'],
    queryFn:  dashboardApi.getStats,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,  // auto-refresh every 5 min
  });

// ── Settings ──────────────────────────────────────────────────────────────────
export const useSettings = () =>
  useQuery({ queryKey: ['settings'], queryFn: settingsApi.get, staleTime: 5 * 60_000 });

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<SocietySettings>) => settingsApi.update(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved successfully');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to save settings'),
  });
}

export function useUploadLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => settingsApi.uploadLogo(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Logo uploaded successfully');
    },
    onError: () => toast.error('Logo upload failed'),
  });
}

// ── Users ─────────────────────────────────────────────────────────────────────
export const useSystemUsers = () =>
  useQuery({ queryKey: ['system-users'], queryFn: usersApi.getAll, staleTime: 30_000 });

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: UserCreateRequest) => usersApi.create(p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['system-users'] }); toast.success('User created'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to create user'),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UserUpdateRequest }) => usersApi.update(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['system-users'] }); toast.success('User updated'); },
  });
}

export function useToggleUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => usersApi.toggleActive(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['system-users'] }); toast.success('Status updated'); },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['system-users'] }); toast.success('User deleted'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Cannot delete user'),
  });
}

export const useActivityLog = (search?: string, page = 0) =>
  useQuery({
    queryKey: ['activity-log', search, page],
    queryFn: () => usersApi.getActivityLog({ search, page, size: 25 }),
    staleTime: 30_000,
  });

// ── Documents ─────────────────────────────────────────────────────────────────
export const useDocuments = (type?: string) =>
  useQuery({
    queryKey: ['documents', type],
    queryFn:  () => documentsApi.getAll(type),
    staleTime: 30_000,
  });

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ title, documentType, memberId, file }: {
      title: string; documentType: string; memberId?: number; file: File;
    }) => documentsApi.upload(title, documentType, memberId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document uploaded successfully');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Upload failed'),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => documentsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); toast.success('Document deleted'); },
  });
}
