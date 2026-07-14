// lib/api/accounts.api.ts
import apiClient from './client';
import type { ApiSuccess } from '@/types/auth.types';
import type {
  AccountEntry, AccountEntryRequest, AccountSummary,
  MemberLedger, FundSummary,
  IncomeExpenseReport, BalanceSheetReport, TrialBalanceReport,
  CashBankBookReport, DefaulterReport, CollectionSummaryRow,
} from '@/types/accounts.types';

const qs = (from?: string, to?: string) =>
  from && to ? `?from=${from}&to=${to}` : '';

export const accountsApi = {
  getAll:     async (): Promise<AccountEntry[]> =>
    (await apiClient.get<ApiSuccess<AccountEntry[]>>('/accounts')).data.data,
  getSummary: async (): Promise<AccountSummary> =>
    (await apiClient.get<ApiSuccess<AccountSummary>>('/accounts/summary')).data.data,
  create:     async (p: AccountEntryRequest): Promise<AccountEntry> =>
    (await apiClient.post<ApiSuccess<AccountEntry>>('/accounts', p)).data.data,
  update:     async (id: number, p: AccountEntryRequest): Promise<AccountEntry> =>
    (await apiClient.put<ApiSuccess<AccountEntry>>(`/accounts/${id}`, p)).data.data,
  delete:     async (id: number): Promise<void> => { await apiClient.delete(`/accounts/${id}`); },
  getLedger:  async (memberId: number): Promise<MemberLedger> =>
    (await apiClient.get<ApiSuccess<MemberLedger>>(`/accounts/ledger/${memberId}`)).data.data,
  getAnnualStatement: async (memberId: number, fyStart?: string, fyEnd?: string): Promise<MemberLedger> => {
    const params: any = {};
    if (fyStart) params.fyStart = fyStart;
    if (fyEnd)   params.fyEnd   = fyEnd;
    return (await apiClient.get<ApiSuccess<MemberLedger>>(`/accounts/ledger/${memberId}/annual`, { params })).data.data;
  },
  getFunds:   async (): Promise<FundSummary> =>
    (await apiClient.get<ApiSuccess<FundSummary>>('/accounts/funds')).data.data,
};

export const reportsApi = {
  getIncomeExpense: async (from?: string, to?: string): Promise<IncomeExpenseReport> =>
    (await apiClient.get<ApiSuccess<IncomeExpenseReport>>(`/reports/income-expense${qs(from, to)}`)).data.data,
  getBalanceSheet:  async (from?: string, to?: string): Promise<BalanceSheetReport> =>
    (await apiClient.get<ApiSuccess<BalanceSheetReport>>(`/reports/balance-sheet${qs(from, to)}`)).data.data,
  getTrialBalance:  async (from?: string, to?: string): Promise<TrialBalanceReport> =>
    (await apiClient.get<ApiSuccess<TrialBalanceReport>>(`/reports/trial-balance${qs(from, to)}`)).data.data,
  getCashBook:      async (from?: string, to?: string): Promise<CashBankBookReport> =>
    (await apiClient.get<ApiSuccess<CashBankBookReport>>(`/reports/cash-book${qs(from, to)}`)).data.data,
  getBankBook:      async (from?: string, to?: string): Promise<CashBankBookReport> =>
    (await apiClient.get<ApiSuccess<CashBankBookReport>>(`/reports/bank-book${qs(from, to)}`)).data.data,
  getDefaulters:    async (): Promise<DefaulterReport> =>
    (await apiClient.get<ApiSuccess<DefaulterReport>>('/reports/defaulters')).data.data,
  getCollection:    async (): Promise<CollectionSummaryRow[]> =>
    (await apiClient.get<ApiSuccess<CollectionSummaryRow[]>>('/reports/collection-summary')).data.data,
  sendReminder:     async (memberId: number, amountDue: string): Promise<void> => {
    await apiClient.post(`/push/remind/${memberId}`, { amountDue });
  },
  sendBulkReminder: async (recipients: { memberId: number; amountDue: string }[]): Promise<{ message: string; sent: number; skipped: number }> =>
    (await apiClient.post<ApiSuccess<{ message: string; sent: number; skipped: number }>>('/push/remind-bulk', recipients)).data.data,
};
