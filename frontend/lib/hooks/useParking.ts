'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { parkingApi, type ParkingSlotRequest } from '@/lib/api/parking.api';

export const useParkingSlots = () =>
  useQuery({ queryKey: ['parking'], queryFn: parkingApi.getAll, staleTime: 30_000 });

export const useParkingSummary = () =>
  useQuery({ queryKey: ['parking', 'summary'], queryFn: parkingApi.getSummary, staleTime: 30_000 });

export function useCreateParkingSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: ParkingSlotRequest) => parkingApi.create(req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['parking'] }); toast.success('Slot created'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to create slot'),
  });
}

export function useUpdateParkingSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: number; req: ParkingSlotRequest }) => parkingApi.update(id, req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['parking'] }); toast.success('Slot updated'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to update slot'),
  });
}

export function useDeleteParkingSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => parkingApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['parking'] }); toast.success('Slot deleted'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Cannot delete slot'),
  });
}

export function useAssignParkingSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slotId, memberId }: { slotId: number; memberId: number }) =>
      parkingApi.assign(slotId, memberId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['parking'] }); toast.success('Slot assigned'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to assign slot'),
  });
}

export function useUnassignParkingSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slotId: number) => parkingApi.unassign(slotId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['parking'] }); toast.success('Slot unassigned'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to unassign slot'),
  });
}