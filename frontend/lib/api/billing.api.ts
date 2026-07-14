// lib/api/billing.api.ts
import apiClient from './client';
import type { ApiSuccess } from '@/types/auth.types';
import type {
  Bill, Payment, BillGenerateRequest, PaymentRequest, BulkGenerateResult,
} from '@/types/billing.types';

export const billingApi = {

  // ── Bills ──────────────────────────────────────────────────────────────────
  generateBills: async (payload: BillGenerateRequest): Promise<BulkGenerateResult> => {
    const { data } = await apiClient.post<ApiSuccess<BulkGenerateResult>>('/billing/generate', payload);
    return data.data;
  },
  getAllBills: async (): Promise<Bill[]> => {
    const { data } = await apiClient.get<ApiSuccess<Bill[]>>('/billing/bills');
    return data.data;
  },
  getPendingBills: async (): Promise<Bill[]> => {
    const { data } = await apiClient.get<ApiSuccess<Bill[]>>('/billing/bills/pending');
    return data.data;
  },
  getMyBills: async (): Promise<Bill[]> => {
    const { data } = await apiClient.get<ApiSuccess<Bill[]>>('/billing/bills/mine');
    return data.data;
  },

  // ── Payments ───────────────────────────────────────────────────────────────
  pay: async (payload: PaymentRequest): Promise<Payment> => {
    const { data } = await apiClient.post<ApiSuccess<Payment>>('/billing/pay', payload);
    return data.data;
  },
  getAllPayments: async (): Promise<Payment[]> => {
    const { data } = await apiClient.get<ApiSuccess<Payment[]>>('/billing/payments');
    return data.data;
  },
  getPendingPayments: async (): Promise<Payment[]> => {
    const { data } = await apiClient.get<ApiSuccess<Payment[]>>('/billing/payments/pending');
    return data.data;
  },
  getMyPayments: async (): Promise<Payment[]> => {
    const { data } = await apiClient.get<ApiSuccess<Payment[]>>('/billing/payments/mine');
    return data.data;
  },
  approvePayment: async (id: number): Promise<Payment> => {
    const { data } = await apiClient.post<ApiSuccess<Payment>>(`/billing/payments/${id}/approve`);
    return data.data;
  },
  rejectPayment: async (id: number, reason: string): Promise<Payment> => {
    const { data } = await apiClient.post<ApiSuccess<Payment>>(`/billing/payments/${id}/reject`, { reason });
    return data.data;
  },
};
