'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { staffApi, type StaffRequest, type StaffSalaryRequest } from '@/lib/api/staff.api';

export const useStaff        = () =>
  useQuery({ queryKey: ['staff'], queryFn: staffApi.getAll, staleTime: 30_000 });

export const useStaffSummary = () =>
  useQuery({ queryKey: ['staff', 'summary'], queryFn: staffApi.getSummary, staleTime: 30_000 });

export const useStaffSalaryHistory = (staffId: number | null) =>
  useQuery({
    queryKey: ['staff-salary', staffId],
    queryFn:  () => staffApi.getSalaryHistory(staffId!),
    enabled:  !!staffId,
  });

export const useStaffMonthlySummary = (month: string) =>
  useQuery({
    queryKey: ['staff-salary-month', month],
    queryFn:  () => staffApi.getMonthlySummary(month),
    staleTime: 30_000,
  });

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: StaffRequest) => staffApi.create(req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); toast.success('Staff added'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to add staff'),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: number; req: StaffRequest }) => staffApi.update(id, req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); toast.success('Staff updated'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to update staff'),
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => staffApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); toast.success('Staff deleted'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Cannot delete staff'),
  });
}

export function useGenerateSalary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, req }: { staffId: number; req: StaffSalaryRequest }) =>
      staffApi.generateSalary(staffId, req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff-salary'] }); toast.success('Salary generated'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to generate salary'),
  });
}

export function useGenerateBulkSalary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (month: string) => staffApi.generateBulkSalary(month),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['staff-salary'] });
      qc.invalidateQueries({ queryKey: ['staff-salary-month'] });
      toast.success(data.length + ' salary records generated');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to generate bulk salary'),
  });
}

export function useMarkSalaryPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (salaryId: number) => staffApi.markPaid(salaryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-salary'] });
      qc.invalidateQueries({ queryKey: ['staff-salary-month'] });
      toast.success('Salary marked as paid');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to mark salary as paid'),
  });
}