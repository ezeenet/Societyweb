import apiClient from './client';
import type { ApiSuccess } from '@/types/auth.types';

export interface BankAccount {
  id:             number;
  accountName:    string;
  bankName:       string;
  accountNumber:  string | null;
  branch:         string | null;
  openingBalance: number;
  currentBalance: number;
}

export interface BankTransaction {
  id:              number;
  bankAccountId:   number;
  accountName:     string;
  transactionType: string;
  amount:          number;
  description:     string | null;
  transactionDate: string;
  reference:       string | null;
  runningBalance:  number;
  createdAt:       string;
}

export interface BankAccountRequest {
  accountName:    string;
  bankName:       string;
  accountNumber?: string;
  branch?:        string;
  openingBalance?: number;
}

export interface BankTransactionRequest {
  bankAccountId:   number;
  transactionType: string;
  amount:          number;
  description?:    string;
  transactionDate?: string;
  reference?:      string;
}

export const bankApi = {
  getAccounts: async (): Promise<BankAccount[]> =>
    (await apiClient.get<ApiSuccess<BankAccount[]>>('/bank/accounts')).data.data,

  createAccount: async (req: BankAccountRequest): Promise<BankAccount> =>
    (await apiClient.post<ApiSuccess<BankAccount>>('/bank/accounts', req)).data.data,

  updateAccount: async (id: number, req: BankAccountRequest): Promise<BankAccount> =>
    (await apiClient.put<ApiSuccess<BankAccount>>(`/bank/accounts/${id}`, req)).data.data,

  deleteAccount: async (id: number): Promise<void> => {
    await apiClient.delete(`/bank/accounts/${id}`);
  },

  getTransactions: async (accountId: number): Promise<BankTransaction[]> =>
    (await apiClient.get<ApiSuccess<BankTransaction[]>>(`/bank/accounts/${accountId}/transactions`)).data.data,

  addTransaction: async (req: BankTransactionRequest): Promise<BankTransaction> =>
    (await apiClient.post<ApiSuccess<BankTransaction>>('/bank/transactions', req)).data.data,

  deleteTransaction: async (id: number): Promise<void> => {
    await apiClient.delete(`/bank/transactions/${id}`);
  },
};