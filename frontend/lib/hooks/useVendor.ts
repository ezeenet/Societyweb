'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { vendorApi, type VendorRequest } from '@/lib/api/vendor.api';

export const useVendors = (activeOnly = false) =>
  useQuery({ queryKey: ['vendors', activeOnly], queryFn: () => vendorApi.getAll(activeOnly), staleTime: 30_000 });

export function useCreateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: VendorRequest) => vendorApi.create(req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendors'] }); toast.success('Vendor added'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to add vendor'),
  });
}

export function useUpdateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: number; req: VendorRequest }) => vendorApi.update(id, req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendors'] }); toast.success('Vendor updated'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to update vendor'),
  });
}

export function useDeleteVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => vendorApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendors'] }); toast.success('Vendor deleted'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Cannot delete vendor'),
  });
}