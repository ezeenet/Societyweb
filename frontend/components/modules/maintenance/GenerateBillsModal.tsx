'use client';
// components/modules/maintenance/GenerateBillsModal.tsx

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, Zap } from 'lucide-react';

const schema = z.object({
  billMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Select a valid month'),
  amount:    z.coerce.number().positive('Amount must be greater than 0'),
  dueDate:   z.string().min(1, 'Due date is required'),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open:        boolean;
  loading:     boolean;
  defaultAmount?: number;
  onSubmit:    (values: FormValues) => void;
  onClose:     () => void;
}

export default function GenerateBillsModal({ open, loading, defaultAmount = 2000, onSubmit, onClose }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open) {
      const now     = new Date();
      const month   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const due     = new Date(now.getFullYear(), now.getMonth(), 10);
      const dueStr  = due.toISOString().split('T')[0];
      reset({ billMonth: month, amount: defaultAmount, dueDate: dueStr });
    }
  }, [open, defaultAmount, reset]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
         onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl"
           onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg,#fef9c3,#fef08a)' }}>
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Generate Bills</p>
              <p className="text-xs text-slate-500">For all occupied flats</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Bill Month</label>
            <input type="month"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all
                focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
                ${errors.billMonth ? 'border-red-400' : 'border-slate-200'}`}
              {...register('billMonth')} />
            {errors.billMonth && <p className="mt-1 text-xs text-red-500">{errors.billMonth.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount per Flat (₹)</label>
            <input type="number" min="1" step="0.01"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all
                focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
                ${errors.amount ? 'border-red-400' : 'border-slate-200'}`}
              {...register('amount')} />
            {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date</label>
            <input type="date"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              {...register('dueDate')} />
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
            <p className="text-xs text-amber-700">
              Bills will be generated for all currently occupied flats. Flats that already have a bill for the selected month will be skipped automatically.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Generate Bills
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
