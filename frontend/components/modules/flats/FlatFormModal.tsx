'use client';
// components/modules/flats/FlatFormModal.tsx

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import type { Flat, Wing } from '@/types/property.types';
import { FLAT_TYPE_LABELS } from '@/types/property.types';

const schema = z.object({
  wingId:      z.coerce.number().min(1, 'Wing is required'),
  flatNumber:  z.string().min(1, 'Flat number is required').max(20),
  floorNumber: z.coerce.number().min(0).optional().or(z.literal('')),
  flatType:    z.string().optional(),
  areaSqft:    z.coerce.number().positive().optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  editTarget: Flat | null;
  wings: Wing[];
  loading: boolean;
  onSubmit: (values: FormValues) => void;
  onClose: () => void;
}

export default function FlatFormModal({ open, editTarget, wings, loading, onSubmit, onClose }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open) {
      reset({
        wingId:      editTarget?.wingId ?? (wings[0]?.id ?? ''),
        flatNumber:  editTarget?.flatNumber ?? '',
        floorNumber: editTarget?.floorNumber ?? '',
        flatType:    editTarget?.flatType ?? '',
        areaSqft:    editTarget?.areaSqft ?? '',
      });
    }
  }, [open, editTarget, wings, reset]);

  if (!open) return null;

  const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );

  const inputCls = (hasError?: boolean) =>
    `w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white
     focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
     ${hasError ? 'border-red-400' : 'border-slate-200 hover:border-slate-300'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
         onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-slate-800">
            {editTarget ? 'Edit Flat' : 'Add Flat'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Wing" error={errors.wingId?.message}>
              <select className={inputCls(!!errors.wingId)} {...register('wingId')}>
                {wings.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </Field>
            <Field label="Flat Number *" error={errors.flatNumber?.message}>
              <input type="text" placeholder="101" autoFocus
                className={inputCls(!!errors.flatNumber)} {...register('flatNumber')} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Floor Number">
              <input type="number" min="0" placeholder="1"
                className={inputCls()} {...register('floorNumber')} />
            </Field>
            <Field label="Flat Type">
              <select className={inputCls()} {...register('flatType')}>
                <option value="">Select type</option>
                {Object.entries(FLAT_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Area (sq.ft)">
            <input type="number" min="0" step="0.01" placeholder="750"
              className={inputCls()} {...register('areaSqft')} />
          </Field>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {editTarget ? 'Save Changes' : 'Add Flat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
