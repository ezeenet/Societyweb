import apiClient from './client';
import type { ApiSuccess } from '@/types/auth.types';

export interface StaffMember {
  id:          number;
  fullName:    string;
  mobile:      string | null;
  address:     string | null;
  designation: string;
  salary:      number;
  joinDate:    string | null;
  status:      string;
  notes:       string | null;
  createdAt:   string;
}

export interface StaffSalaryRecord {
  id:          number;
  staffId:     number;
  staffName:   string;
  designation: string;
  salaryMonth: string;
  amount:      number;
  paidDate:    string | null;
  status:      string;
  notes:       string | null;
  createdAt:   string;
}

export interface StaffRequest {
  fullName:    string;
  mobile?:     string;
  address?:    string;
  designation: string;
  salary:      number;
  joinDate?:   string;
  status?:     string;
  notes?:      string;
}

export interface StaffSalaryRequest {
  salaryMonth: string;
  amount?:     number;
  paidDate?:   string;
  status?:     string;
  notes?:      string;
}

export const staffApi = {
  getAll:     async (): Promise<StaffMember[]> =>
    (await apiClient.get<ApiSuccess<StaffMember[]>>('/staff')).data.data,

  getSummary: async (): Promise<{ total: number; active: number; inactive: number }> =>
    (await apiClient.get<ApiSuccess<any>>('/staff/summary')).data.data,

  create: async (req: StaffRequest): Promise<StaffMember> =>
    (await apiClient.post<ApiSuccess<StaffMember>>('/staff', req)).data.data,

  update: async (id: number, req: StaffRequest): Promise<StaffMember> =>
    (await apiClient.put<ApiSuccess<StaffMember>>(`/staff/${id}`, req)).data.data,

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/staff/${id}`);
  },

  getSalaryHistory: async (staffId: number): Promise<StaffSalaryRecord[]> =>
    (await apiClient.get<ApiSuccess<StaffSalaryRecord[]>>(`/staff/${staffId}/salary`)).data.data,

  getMonthlySummary: async (month: string): Promise<any> =>
    (await apiClient.get<ApiSuccess<any>>(`/staff/salary/month/${month}`)).data.data,

  generateSalary: async (staffId: number, req: StaffSalaryRequest): Promise<StaffSalaryRecord> =>
    (await apiClient.post<ApiSuccess<StaffSalaryRecord>>(`/staff/${staffId}/salary`, req)).data.data,

  generateBulkSalary: async (month: string): Promise<StaffSalaryRecord[]> =>
    (await apiClient.post<ApiSuccess<StaffSalaryRecord[]>>(`/staff/salary/bulk/${month}`)).data.data,

  markPaid: async (salaryId: number): Promise<StaffSalaryRecord> =>
    (await apiClient.post<ApiSuccess<StaffSalaryRecord>>(`/staff/salary/${salaryId}/pay`)).data.data,
};