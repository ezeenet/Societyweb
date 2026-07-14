// lib/hooks/useAccounts.ts
'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { accountsApi, reportsApi } from '@/lib/api/accounts.api';
import type { AccountEntryRequest } from '@/types/accounts.types';

// ── Accounts ──────────────────────────────────────────────────────────────────
export const useAccountEntries = () =>
  useQuery({ queryKey: ['accounts'], queryFn: accountsApi.getAll, staleTime: 30_000 });

export const useAccountSummary = () =>
  useQuery({ queryKey: ['accounts', 'summary'], queryFn: accountsApi.getSummary, staleTime: 30_000 });

export const useFundSummary = () =>
  useQuery({ queryKey: ['accounts', 'funds'], queryFn: accountsApi.getFunds, staleTime: 60_000 });

export const useMemberLedger = (memberId: number | null) =>
  useQuery({
    queryKey: ['ledger', memberId],
    queryFn:  () => accountsApi.getLedger(memberId!),
    enabled:  !!memberId,
  });

export const useMemberAnnualStatement = (memberId: number | null, fyStart?: string, fyEnd?: string) =>
  useQuery({
    queryKey: ['annual-statement', memberId, fyStart, fyEnd],
    queryFn:  () => accountsApi.getAnnualStatement(memberId!, fyStart, fyEnd),
    enabled:  !!memberId,
  });

export function useCreateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: AccountEntryRequest) => accountsApi.create(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Entry created');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to create entry'),
  });
}

export function useUpdateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AccountEntryRequest }) =>
      accountsApi.update(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); toast.success('Entry updated'); },
  });
}

export function useDeleteEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => accountsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); toast.success('Entry deleted'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Delete failed'),
  });
}

// ── Reports ───────────────────────────────────────────────────────────────────
export const useIncomeExpense  = (from?: string, to?: string) =>
  useQuery({ queryKey: ['report', 'income-expense', from, to],
    queryFn: () => reportsApi.getIncomeExpense(from, to), enabled: true });

export const useBalanceSheet   = (from?: string, to?: string) =>
  useQuery({ queryKey: ['report', 'balance-sheet', from, to],
    queryFn: () => reportsApi.getBalanceSheet(from, to) });

export const useTrialBalance   = (from?: string, to?: string) =>
  useQuery({ queryKey: ['report', 'trial-balance', from, to],
    queryFn: () => reportsApi.getTrialBalance(from, to) });

export const useCashBook       = (from?: string, to?: string) =>
  useQuery({ queryKey: ['report', 'cash-book', from, to],
    queryFn: () => reportsApi.getCashBook(from, to) });

export const useBankBook       = (from?: string, to?: string) =>
  useQuery({ queryKey: ['report', 'bank-book', from, to],
    queryFn: () => reportsApi.getBankBook(from, to) });

export const useDefaulters     = () =>
  useQuery({ queryKey: ['report', 'defaulters'], queryFn: reportsApi.getDefaulters, staleTime: 60_000 });

export const useCollectionSummary = () =>
  useQuery({ queryKey: ['report', 'collection'], queryFn: reportsApi.getCollection, staleTime: 60_000 });

export function useSendReminder() {
  return useMutation({
    mutationFn: ({ memberId, amountDue }: { memberId: number; amountDue: string }) =>
      reportsApi.sendReminder(memberId, amountDue),
    onSuccess: () => toast.success('Reminder sent'),
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to send reminder'),
  });
}

export function useSendBulkReminder() {
  return useMutation({
    mutationFn: (recipients: { memberId: number; amountDue: string }[]) =>
      reportsApi.sendBulkReminder(recipients),
    onSuccess: (data: any) => toast.success(data?.message ?? 'Reminders sent'),
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to send bulk reminders'),
  });
}
