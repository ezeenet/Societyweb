'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { amcApi, type AmcContractRequest } from '@/lib/api/amc.api';

export const useAmcContracts = () =>
  useQuery({ queryKey: ['amc'], queryFn: amcApi.getAll, staleTime: 30_000 });

export const useAmcSummary = () =>
  useQuery({ queryKey: ['amc', 'summary'], queryFn: amcApi.getSummary, staleTime: 30_000 });

export const useUpcomingAmc = (days = 30) =>
  useQuery({ queryKey: ['amc', 'upcoming', days], queryFn: () => amcApi.getUpcoming(days), staleTime: 30_000 });

export function useCreateAmc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: AmcContractRequest) => amcApi.create(req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['amc'] }); toast.success('AMC contract added'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to add AMC'),
  });
}

export function useUpdateAmc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: number; req: AmcContractRequest }) => amcApi.update(id, req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['amc'] }); toast.success('AMC contract updated'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to update AMC'),
  });
}

export function useDeleteAmc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => amcApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['amc'] }); toast.success('AMC contract deleted'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Cannot delete AMC'),
  });
}