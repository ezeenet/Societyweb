import apiClient from './client';
import type { ApiSuccess } from '@/types/auth.types';

export interface ParkingSlot {
  id:         number;
  slotNumber: string;
  slotType:   string;
  status:     string;
  memberId:   number | null;
  memberName: string | null;
  flatNumber: string | null;
  wingName:   string | null;
  notes:      string | null;
}

export interface ParkingSlotRequest {
  slotNumber: string;
  slotType:   string;
  notes?:     string;
}

export const parkingApi = {
  getAll: async (): Promise<ParkingSlot[]> =>
    (await apiClient.get<ApiSuccess<ParkingSlot[]>>('/parking')).data.data,

  getSummary: async (): Promise<{ total: number; occupied: number; vacant: number }> =>
    (await apiClient.get<ApiSuccess<any>>('/parking/summary')).data.data,

  create: async (req: ParkingSlotRequest): Promise<ParkingSlot> =>
    (await apiClient.post<ApiSuccess<ParkingSlot>>('/parking', req)).data.data,

  update: async (id: number, req: ParkingSlotRequest): Promise<ParkingSlot> =>
    (await apiClient.put<ApiSuccess<ParkingSlot>>(`/parking/${id}`, req)).data.data,

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/parking/${id}`);
  },

  assign: async (slotId: number, memberId: number): Promise<ParkingSlot> =>
    (await apiClient.post<ApiSuccess<ParkingSlot>>(`/parking/${slotId}/assign/${memberId}`)).data.data,

  unassign: async (slotId: number): Promise<ParkingSlot> =>
    (await apiClient.post<ApiSuccess<ParkingSlot>>(`/parking/${slotId}/unassign`)).data.data,
};