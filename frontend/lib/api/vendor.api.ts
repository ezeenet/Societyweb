import apiClient from './client';
import type { ApiSuccess } from '@/types/auth.types';

export interface Vendor {
  id:           number;
  name:         string;
  vendorType:   string | null;
  mobile:       string | null;
  address:      string | null;
  notes:        string | null;
  isActive:     boolean;
  totalPaid:    number;
  voucherCount: number;
  createdAt:    string;
}

export interface VendorRequest {
  name:        string;
  vendorType?: string;
  mobile?:     string;
  address?:    string;
  notes?:      string;
  isActive?:   boolean;
}

export const vendorApi = {
  getAll: async (activeOnly = false): Promise<Vendor[]> =>
    (await apiClient.get<ApiSuccess<Vendor[]>>('/vendors', { params: { activeOnly } })).data.data,

  create: async (req: VendorRequest): Promise<Vendor> =>
    (await apiClient.post<ApiSuccess<Vendor>>('/vendors', req)).data.data,

  update: async (id: number, req: VendorRequest): Promise<Vendor> =>
    (await apiClient.put<ApiSuccess<Vendor>>(`/vendors/${id}`, req)).data.data,

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/vendors/${id}`);
  },
};