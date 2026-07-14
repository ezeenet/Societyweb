import apiClient from './client';
import type { ApiSuccess } from '@/types/auth.types';

export interface AmcContract {
  id:            number;
  contractName:  string;
  vendorId:      number | null;
  vendorName:    string | null;
  category:      string;
  startDate:     string;
  endDate:       string;
  amount:        number;
  paymentMode:   string | null;
  status:        string;
  notes:         string | null;
  reminderDays:  number;
  daysRemaining: number;
  isExpired:     boolean;
  isDueSoon:     boolean;
  createdAt:     string;
}

export interface AmcContractRequest {
  contractName:  string;
  vendorId?:     number;
  vendorName?:   string;
  category:      string;
  startDate:     string;
  endDate:       string;
  amount:        number;
  paymentMode?:  string;
  status?:       string;
  notes?:        string;
  reminderDays?: number;
}

export const amcApi = {
  getAll: async (): Promise<AmcContract[]> =>
    (await apiClient.get<ApiSuccess<AmcContract[]>>('/amc')).data.data,

  getSummary: async (): Promise<any> =>
    (await apiClient.get<ApiSuccess<any>>('/amc/summary')).data.data,

  getUpcoming: async (days = 30): Promise<AmcContract[]> =>
    (await apiClient.get<ApiSuccess<AmcContract[]>>('/amc/upcoming', { params: { days } })).data.data,

  create: async (req: AmcContractRequest): Promise<AmcContract> =>
    (await apiClient.post<ApiSuccess<AmcContract>>('/amc', req)).data.data,

  update: async (id: number, req: AmcContractRequest): Promise<AmcContract> =>
    (await apiClient.put<ApiSuccess<AmcContract>>(`/amc/${id}`, req)).data.data,

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/amc/${id}`);
  },
};