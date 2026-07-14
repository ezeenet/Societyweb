// lib/hooks/useProperty.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { wingsApi, flatsApi, membersApi } from '@/lib/api/property.api';
import type { WingRequest, FlatRequest, FlatStatus, MemberRequest } from '@/types/property.types';

// ── Wings ─────────────────────────────────────────────────────────────────────

export function useWings() {
  return useQuery({
    queryKey: ['wings'],
    queryFn:  wingsApi.getAll,
    staleTime: 60_000,
  });
}

export function useCreateWing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: WingRequest) => wingsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wings'] });
      toast.success('Wing created successfully');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to create wing'),
  });
}

export function useUpdateWing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: WingRequest }) => wingsApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wings'] });
      toast.success('Wing updated');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to update wing'),
  });
}

export function useDeleteWing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => wingsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wings'] });
      qc.invalidateQueries({ queryKey: ['flats'] });
      toast.success('Wing deleted');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to delete wing'),
  });
}

// ── Flats ─────────────────────────────────────────────────────────────────────

export function useFlats(params?: { wingId?: number; status?: FlatStatus }) {
  return useQuery({
    queryKey: ['flats', params],
    queryFn:  () => flatsApi.getAll(params),
    staleTime: 60_000,
  });
}

export function useCreateFlat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FlatRequest) => flatsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flats'] });
      qc.invalidateQueries({ queryKey: ['wings'] });
      toast.success('Flat added successfully');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to add flat'),
  });
}

export function useUpdateFlat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FlatRequest }) => flatsApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flats'] });
      qc.invalidateQueries({ queryKey: ['wings'] });
      toast.success('Flat updated');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to update flat'),
  });
}

export function useUpdateFlatStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: FlatStatus }) => flatsApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flats'] });
      qc.invalidateQueries({ queryKey: ['wings'] });
      toast.success('Flat status updated');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Cannot update flat status'),
  });
}

export function useDeleteFlat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => flatsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flats'] });
      qc.invalidateQueries({ queryKey: ['wings'] });
      toast.success('Flat deleted');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Cannot delete flat'),
  });
}

// ── Members ───────────────────────────────────────────────────────────────────

export function useMembers(includeInactive = false) {
  return useQuery({
    queryKey: ['members', includeInactive],
    queryFn:  () => membersApi.getAll(includeInactive),
    staleTime: 30_000,
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: MemberRequest) => membersApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['flats'] });
      qc.invalidateQueries({ queryKey: ['wings'] });
      toast.success('Member added successfully');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to add member'),
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: MemberRequest }) => membersApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['flats'] });
      toast.success('Member updated');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to update member'),
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => membersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['flats'] });
      qc.invalidateQueries({ queryKey: ['wings'] });
      toast.success('Member deleted');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to delete member'),
  });
}

export function useMoveOutMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, moveOutDate }: { id: number; moveOutDate?: string }) =>
      membersApi.moveOut(id, moveOutDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['flats'] });
      qc.invalidateQueries({ queryKey: ['wings'] });
      toast.success('Member moved out successfully');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Move out failed'),
  });
}

export function useExportMembers() {
  return useMutation({
    mutationFn: membersApi.exportCsv,
    onSuccess: (blob) => {
      const url      = URL.createObjectURL(blob);
      const link     = document.createElement('a');
      link.href      = url;
      link.download  = `members-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    },
    onError: () => toast.error('Export failed'),
  });
}
