// lib/api/operations.api.ts
import apiClient from './client';
import type { ApiSuccess } from '@/types/auth.types';
import type {
  Complaint, ComplaintRequest,
  Visitor, VisitorRequest,
  Notice, NoticeRequest, PollResult, PollRequest, AcknowledgementList,
} from '@/types/operations.types';

export const complaintsApi = {
  getAll:      async (): Promise<Complaint[]> => (await apiClient.get<ApiSuccess<Complaint[]>>('/complaints')).data.data,
  getMine:     async (memberId: number): Promise<Complaint[]> =>
    (await apiClient.get<ApiSuccess<Complaint[]>>(`/complaints/mine?memberId=${memberId}`)).data.data,
  create:      async (p: ComplaintRequest): Promise<Complaint> =>
    (await apiClient.post<ApiSuccess<Complaint>>('/complaints', p)).data.data,
  updateStatus: async (id: number, status: string, remarks?: string): Promise<Complaint> =>
    (await apiClient.patch<ApiSuccess<Complaint>>(`/complaints/${id}/status`, { status, remarks })).data.data,
  delete:      async (id: number): Promise<void> => { await apiClient.delete(`/complaints/${id}`); },
};

export const visitorsApi = {
  getAll:      async (): Promise<Visitor[]> => (await apiClient.get<ApiSuccess<Visitor[]>>('/visitors')).data.data,
  getActive:   async (): Promise<Visitor[]> => (await apiClient.get<ApiSuccess<Visitor[]>>('/visitors/active')).data.data,
  logEntry:    async (p: VisitorRequest): Promise<Visitor> =>
    (await apiClient.post<ApiSuccess<Visitor>>('/visitors', p)).data.data,
  recordExit:  async (id: number): Promise<Visitor> =>
    (await apiClient.patch<ApiSuccess<Visitor>>(`/visitors/${id}/exit`, {})).data.data,
  delete:      async (id: number): Promise<void> => { await apiClient.delete(`/visitors/${id}`); },
};

export const noticesApi = {
  getAll:      async (): Promise<Notice[]> => (await apiClient.get<ApiSuccess<Notice[]>>('/notices')).data.data,
  getActive:   async (): Promise<Notice[]> => (await apiClient.get<ApiSuccess<Notice[]>>('/notices?activeOnly=true')).data.data,
  create:      async (p: NoticeRequest): Promise<Notice> =>
    (await apiClient.post<ApiSuccess<Notice>>('/notices', p)).data.data,
  update:      async (id: number, p: NoticeRequest): Promise<Notice> =>
    (await apiClient.put<ApiSuccess<Notice>>(`/notices/${id}`, p)).data.data,
  toggle:      async (id: number): Promise<Notice> =>
    (await apiClient.patch<ApiSuccess<Notice>>(`/notices/${id}/toggle`, {})).data.data,
  delete:      async (id: number): Promise<void> => { await apiClient.delete(`/notices/${id}`); },
  getPoll:     async (id: number, memberId?: number): Promise<PollResult> =>
    (await apiClient.get<ApiSuccess<PollResult>>(`/notices/${id}/poll`, { params: { memberId } })).data.data,
  createPoll:  async (id: number, p: PollRequest): Promise<PollResult> =>
    (await apiClient.post<ApiSuccess<PollResult>>(`/notices/${id}/poll`, p)).data.data,
  updatePoll:  async (id: number, p: PollRequest): Promise<PollResult> =>
    (await apiClient.put<ApiSuccess<PollResult>>(`/notices/${id}/poll`, p)).data.data,
  vote:        async (id: number, selectedOption: string, memberId: number): Promise<PollResult> =>
    (await apiClient.post<ApiSuccess<PollResult>>(`/notices/${id}/poll/vote`, { selectedOption, memberId })).data.data,
  getAcks:     async (id: number): Promise<AcknowledgementList> =>
    (await apiClient.get<ApiSuccess<AcknowledgementList>>(`/notices/${id}/acknowledgements`)).data.data,
  acknowledge: async (id: number, memberId: number): Promise<void> => {
    await apiClient.post(`/notices/${id}/acknowledge`, { memberId }); },
};
