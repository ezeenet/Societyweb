import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuthStore } from '@/lib/store/authStore';

const API = process.env.NEXT_PUBLIC_API_URL; // http://localhost:8080/api/v1

function getAuthHeader() {
  const token = document.cookie
    .split('; ')
    .find((r) => r.startsWith('accessToken='))
    ?.split('=')[1];
  return { Authorization: `Bearer ${token}` };
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface MaintenanceBill {
  id: number;
  flatNumber: string;
  wingName: string;
  memberName: string;
  memberId: number;
  amount: number;
  billMonth: string;   // "2024-04"
  dueDate: string;
  lateFine: number;
  totalDue: number;
  status: 'PENDING' | 'PAID';
  receiptNumber: string | null;
  paidDate: string | null;
  paymentMode: string | null;
  remarks: string | null;
}

export interface PaymentRecord {
  id: number;
  billId: number;
  memberName: string;
  flatNumber: string;
  wingName: string;
  billMonth: string;
  amountPaid: number;
  paymentMode: string;
  paymentDate: string;
  receiptNumber: string;
  referenceNo: string | null;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  approvedBy: string | null;
}

// ─── API ──────────────────────────────────────────────────────────────────────
// Backend base: /api/v1/billing/...

const billingApi = {
  // ── Bills ──
  getAllBills: async (): Promise<MaintenanceBill[]> => {
    const { data } = await axios.get(`${API}/billing/bills`, {
      headers: getAuthHeader(),
    });
    return data.data ?? data;
  },

  getPendingBills: async (): Promise<MaintenanceBill[]> => {
    const { data } = await axios.get(`${API}/billing/bills/pending`, {
      headers: getAuthHeader(),
    });
    return data.data ?? data;
  },

  getMyBills: async (): Promise<MaintenanceBill[]> => {
    const { data } = await axios.get(`${API}/billing/bills/mine`, {
      headers: getAuthHeader(),
    });
    return data.data ?? data;
  },

  // ── Payments ──
  getAllPayments: async (): Promise<PaymentRecord[]> => {
    const { data } = await axios.get(`${API}/billing/payments`, {
      headers: getAuthHeader(),
    });
    return data.data ?? data;
  },

  getPendingPayments: async (): Promise<PaymentRecord[]> => {
    const { data } = await axios.get(`${API}/billing/payments/pending`, {
      headers: getAuthHeader(),
    });
    return data.data ?? data;
  },

  getMyPayments: async (): Promise<PaymentRecord[]> => {
    const { data } = await axios.get(`${API}/billing/payments/mine`, {
      headers: getAuthHeader(),
    });
    return data.data ?? data;
  },

  // ── Actions ──
  deleteBill: async (id: number): Promise<void> => {
    await axios.delete(`${API}/billing/bills/${id}`, { headers: getAuthHeader() });
  },

  markAsUnpaid: async (id: number): Promise<MaintenanceBill> => {
    const { data } = await axios.post(`${API}/billing/bills/${id}/unpaid`, {}, { headers: getAuthHeader() });
    return data.data ?? data;
  },

  updateBill: async (id: number, req: { amount?: number; lateFine?: number; dueDate?: string }): Promise<MaintenanceBill> => {
    const { data } = await axios.put(`${API}/billing/bills/${id}`, req, { headers: getAuthHeader() });
    return data.data ?? data;
  },

  generateBills: async (req: { billMonth: string; amount: number; dueDate: string }) => {
    const { data } = await axios.post(`${API}/billing/generate`, req, {
      headers: getAuthHeader(),
    });
    return data.data ?? data;
  },

  recordPayment: async (req: {
    billId: number;
    amountPaid: number;
    paymentMode: string;
    paymentDate: string;
    referenceNo?: string;
    remarks?: string;
  }): Promise<PaymentRecord> => {
    const { data } = await axios.post(`${API}/billing/pay`, req, {
      headers: getAuthHeader(),
    });
    return data.data ?? data;
  },

  approvePayment: async (id: number): Promise<PaymentRecord> => {
    const { data } = await axios.post(
      `${API}/billing/payments/${id}/approve`,
      {},
      { headers: getAuthHeader() }
    );
    return data.data ?? data;
  },

  rejectPayment: async (id: number, reason: string): Promise<PaymentRecord> => {
    const { data } = await axios.post(
      `${API}/billing/payments/${id}/reject`,
      { reason },
      { headers: getAuthHeader() }
    );
    return data.data ?? data;
  },
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** useBills — All Bills tab (Admin/Manager/Accountant) */
export function useBills() {
  return useQuery<MaintenanceBill[]>({
    queryKey: ['all-bills'],
    queryFn: billingApi.getAllBills,
    staleTime: 30_000,
    retry: false,
  });
}

/** useBilling — alias for useBills */
export const useBilling = useBills;

/** useMyBills — MEMBER only */
export function useMyBills() {
  return useQuery<MaintenanceBill[]>({
    queryKey: ['my-bills'],
    queryFn: billingApi.getMyBills,
    staleTime: 30_000,
    retry: false,
  });
}

/** useAllBills — explicit name */
export const useAllBills = useBills;

/** usePayments — All Payments tab */
export function usePayments() {
  return useQuery<PaymentRecord[]>({
    queryKey: ['all-payments'],
    queryFn: billingApi.getAllPayments,
    staleTime: 30_000,
    retry: false,
  });
}

/** usePendingPayments — Pending Approvals tab */
export function usePendingPayments() {
  return useQuery<PaymentRecord[]>({
    queryKey: ['pending-payments'],
    queryFn: billingApi.getPendingPayments,
    staleTime: 30_000,
    retry: false,
  });
}

/** useMyPayments — MEMBER payment history */
export function useMyPayments() {
  return useQuery<PaymentRecord[]>({
    queryKey: ['my-payments'],
    queryFn: billingApi.getMyPayments,
    staleTime: 30_000,
    retry: false,
  });
}

/** useYearClose — Admin only */
export function useYearClose() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (newYearMonth: string) =>
      axios.post(`${API}/billing/year-close?newYearMonth=${newYearMonth}`, {}, { headers: getAuthHeader() })
        .then(r => r.data.data ?? r.data),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['all-bills'] });
      toast.success(data?.message ?? 'Year close successful');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Year close failed'),
  });
}

/** useGenerateBills */
export function useGenerateBills() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: billingApi.generateBills,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-bills'] });
    },
  });
}

/** useRecordPayment — Member → PENDING */
export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: billingApi.recordPayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-bills'] });
      qc.invalidateQueries({ queryKey: ['my-payments'] });
      qc.invalidateQueries({ queryKey: ['all-bills'] });
      qc.invalidateQueries({ queryKey: ['pending-payments'] });
    },
  });
}

/** useApprovePayment — Admin → PAID */
export function useApprovePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => billingApi.approvePayment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-bills'] });
      qc.invalidateQueries({ queryKey: ['pending-payments'] });
      qc.invalidateQueries({ queryKey: ['all-payments'] });
    },
  });
}

/** useMarkAsUnpaid — Admin only */
export function useMarkAsUnpaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => billingApi.markAsUnpaid(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-bills'] });
      qc.invalidateQueries({ queryKey: ['all-payments'] });
      toast.success('Bill marked as unpaid — payment reversed');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to mark as unpaid'),
  });
}

/** useDeleteBill — Admin only */
export function useDeleteBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => billingApi.deleteBill(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-bills'] });
      toast.success('Bill deleted');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Delete failed'),
  });
}

/** useUpdateBill — Admin only */
export function useUpdateBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { amount?: number; lateFine?: number; dueDate?: string } }) =>
      billingApi.updateBill(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-bills'] });
      toast.success('Bill updated');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Update failed'),
  });
}

/** useRejectPayment */
export function useRejectPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      billingApi.rejectPayment(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-bills'] });
      qc.invalidateQueries({ queryKey: ['pending-payments'] });
    },
  });
}

export { billingApi };
