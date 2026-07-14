'use client';
// components/modules/wings/WingFormModal.tsx

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import type { Wing } from '@/types/property.types';

const schema = z.object({
  name: z.string().min(1, 'Wing name is required').max(100),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  editTarget: Wing | null;
  loading: boolean;
  onSubmit: (values: FormValues) => void;
  onClose: () => void;
}

export default function WingFormModal({ open, editTarget, loading, onSubmit, onClose }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open) reset({ name: editTarget?.name ?? '' });
  }, [open, editTarget, reset]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
         onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-slate-800">
            {editTarget ? 'Edit Wing' : 'Add Wing'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Wing Name</label>
            <input
              type="text"
              placeholder="e.g. Wing A, Tower 1"
              autoFocus
              className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all
                focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
                ${errors.name ? 'border-red-400' : 'border-slate-200 hover:border-slate-300'}`}
              {...register('name')}
            />
            {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {editTarget ? 'Save Changes' : 'Create Wing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
