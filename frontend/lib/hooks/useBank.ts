'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { bankApi, type BankAccountRequest, type BankTransactionRequest } from '@/lib/api/bank.api';

export const useBankAccounts = () =>
  useQuery({ queryKey: ['bank-accounts'], queryFn: bankApi.getAccounts, staleTime: 30_000 });

export const useBankTransactions = (accountId: number | null) =>
  useQuery({
    queryKey: ['bank-transactions', accountId],
    queryFn:  () => bankApi.getTransactions(accountId!),
    enabled:  !!accountId,
  });

export function useCreateBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: BankAccountRequest) => bankApi.createAccount(req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bank-accounts'] }); toast.success('Account created'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to create account'),
  });
}

export function useUpdateBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: number; req: BankAccountRequest }) => bankApi.updateAccount(id, req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bank-accounts'] }); toast.success('Account updated'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to update account'),
  });
}

export function useDeleteBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bankApi.deleteAccount(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bank-accounts'] }); toast.success('Account deleted'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Cannot delete account'),
  });
}

export function useAddBankTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: BankTransactionRequest) => bankApi.addTransaction(req),
    onSuccess: (_, req) => {
      qc.invalidateQueries({ queryKey: ['bank-transactions', req.bankAccountId] });
      qc.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast.success('Transaction added');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to add transaction'),
  });
}

export function useDeleteBankTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bankApi.deleteTransaction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank-transactions'] });
      qc.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast.success('Transaction deleted');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to delete transaction'),
  });
}