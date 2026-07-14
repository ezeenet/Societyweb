// lib/hooks/useOperations.ts
'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { complaintsApi, visitorsApi, noticesApi } from '@/lib/api/operations.api';
import type { ComplaintRequest, VisitorRequest, NoticeRequest, PollRequest } from '@/types/operations.types';
import { useAuthStore } from '@/lib/store/authStore';

// ── Complaints ────────────────────────────────────────────────────────────────
export function useComplaints() {
  const { user } = useAuthStore();
  const isMember = user?.role === 'MEMBER';
  return useQuery({
    queryKey: ['complaints', isMember ? 'mine' : 'all'],
    queryFn: isMember ? () => complaintsApi.getMine(user!.memberId!) : complaintsApi.getAll,
  });
}
export function useCreateComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: ComplaintRequest) => complaintsApi.create(p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['complaints'] }); toast.success('Complaint raised'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to raise complaint'),
  });
}
export function useUpdateComplaintStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, remarks }: { id: number; status: string; remarks?: string }) =>
      complaintsApi.updateStatus(id, status, remarks),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['complaints'] }); toast.success('Status updated'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Cannot update status'),
  });
}
export function useDeleteComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => complaintsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['complaints'] }); toast.success('Complaint deleted'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Delete failed'),
  });
}

// ── Visitors ──────────────────────────────────────────────────────────────────
export function useVisitors() {
  return useQuery({ queryKey: ['visitors'], queryFn: visitorsApi.getAll, staleTime: 15_000 });
}
export function useActiveVisitors() {
  return useQuery({ queryKey: ['visitors', 'active'], queryFn: visitorsApi.getActive,
    staleTime: 15_000, refetchInterval: 30_000 });
}
export function useLogVisitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: VisitorRequest) => visitorsApi.logEntry(p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['visitors'] }); toast.success('Visitor entry logged'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to log visitor'),
  });
}
export function useRecordVisitorExit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => visitorsApi.recordExit(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['visitors'] }); toast.success('Exit recorded'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to record exit'),
  });
}
export function useDeleteVisitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => visitorsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['visitors'] }); toast.success('Record deleted'); },
  });
}

// ── Notices ───────────────────────────────────────────────────────────────────
export function useNotices() {
  const { user } = useAuthStore();
  const isMember = user?.role === 'MEMBER';
  return useQuery({
    queryKey: ['notices', isMember ? 'active' : 'all'],
    queryFn: isMember ? noticesApi.getActive : noticesApi.getAll,
  });
}
export function useCreateNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: NoticeRequest) => noticesApi.create(p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notices'] }); toast.success('Notice published'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to publish'),
  });
}
export function useUpdateNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: NoticeRequest }) => noticesApi.update(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notices'] }); toast.success('Notice updated'); },
  });
}
export function useToggleNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => noticesApi.toggle(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notices'] }); toast.success('Status toggled'); },
  });
}
export function useDeleteNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => noticesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notices'] }); toast.success('Notice deleted'); },
  });
}
export function useNoticePoll(noticeId: number | null, memberId?: number) {
  return useQuery({
    queryKey: ['poll', noticeId, memberId],
    queryFn: () => noticesApi.getPoll(noticeId!, memberId),
    enabled: !!noticeId,
  });
}
export function useCreatePoll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ noticeId, payload }: { noticeId: number; payload: PollRequest }) =>
      noticesApi.createPoll(noticeId, payload),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ['poll', v.noticeId] }); toast.success('Poll created'); },
  });
}
export function useVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ noticeId, option, memberId }: { noticeId: number; option: string; memberId: number }) =>
      noticesApi.vote(noticeId, option, memberId),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['poll', v.noticeId] });
      qc.invalidateQueries({ queryKey: ['notices'] });
      toast.success('Vote submitted!');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Voting failed'),
  });
}
export function useAcknowledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ noticeId, memberId }: { noticeId: number; memberId: number }) =>
      noticesApi.acknowledge(noticeId, memberId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notices'] }); toast.success('Notice acknowledged'); },
  });
}
