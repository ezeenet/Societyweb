'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { voucherApi, type ExpenseVoucherRequest } from '@/lib/api/voucher.api';

export const useVouchers = () =>
  useQuery({ queryKey: ['vouchers'], queryFn: voucherApi.getAll, staleTime: 30_000 });

export function useCreateVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: ExpenseVoucherRequest) => voucherApi.create(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vouchers'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Voucher created');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to create voucher'),
  });
}

export function useDeleteVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => voucherApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vouchers'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Voucher deleted');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Cannot delete voucher'),
  });
}