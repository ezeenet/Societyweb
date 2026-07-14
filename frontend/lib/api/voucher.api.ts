import apiClient from './client';
import type { ApiSuccess } from '@/types/auth.types';

export interface VoucherItem {
  id:           number;
  itemName:     string;
  quantity:     number;
  pricePerUnit: number;
  amount:       number;
}

export interface ExpenseVoucher {
  id:             number;
  voucherNumber:  string;
  expenseFor:     string;
  vendorName:     string | null;
  voucherDate:    string;
  items:          VoucherItem[];
  subTotal:       number;
  totalAmount:    number;
  paidAmount:     number;
  balanceAmount:  number;
  paymentMode:    string;
  description:    string | null;
  createdAt:      string;
}

export interface VoucherItemRequest {
  itemName:     string;
  quantity:     number;
  pricePerUnit: number;
}

export interface ExpenseVoucherRequest {
  expenseFor:   string;
  vendorName?:  string;
  voucherDate?: string;
  items:        VoucherItemRequest[];
  paidAmount?:  number;
  paymentMode?: string;
  description?: string;
}

export const voucherApi = {
  getAll: async (): Promise<ExpenseVoucher[]> =>
    (await apiClient.get<ApiSuccess<ExpenseVoucher[]>>('/expense-vouchers')).data.data,

  create: async (req: ExpenseVoucherRequest): Promise<ExpenseVoucher> =>
    (await apiClient.post<ApiSuccess<ExpenseVoucher>>('/expense-vouchers', req)).data.data,

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/expense-vouchers/${id}`);
  },
};