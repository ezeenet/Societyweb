'use client';
// components/modules/maintenance/PaymentModal.tsx

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, CreditCard } from 'lucide-react';
import type { Bill } from '@/types/billing.types';
import { PAYMENT_MODE_LABELS } from '@/types/billing.types';

const schema = z.object({
  amountPaid:  z.coerce.number().positive('Amount must be greater than 0'),
  paymentDate: z.string().min(1, 'Date is required'),
  paymentMode: z.enum(['CASH','UPI','NEFT','RTGS','CHEQUE','ONLINE'], {
    required_error: 'Payment mode is required',
  }),
  referenceNo: z.string().max(100).optional().or(z.literal('')),
  remarks:     z.string().max(500).optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open:      boolean;
  bill:      Bill | null;
  memberId:  number;
  loading:   boolean;
  onSubmit:  (values: FormValues & { billId: number; memberId: number }) => void;
  onClose:   () => void;
}

export default function PaymentModal({ open, bill, memberId, loading, onSubmit, onClose }: Props) {
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const paymentMode = watch('paymentMode');
  const needsRef    = paymentMode && paymentMode !== 'CASH';

  useEffect(() => {
    if (open && bill) {
      reset({
        amountPaid:  bill.totalDue,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: 'CASH',
        referenceNo: '',
        remarks:     '',
      });
    }
  }, [open, bill, reset]);

  if (!open || !bill) return null;

  const formatINR = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
         onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)' }}>
              <CreditCard className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Pay Maintenance Bill</p>
              <p className="text-xs text-slate-500">
                {bill.wingName} – {bill.flatNumber} &bull; {bill.billMonth}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bill summary strip */}
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Bill Amount</span>
            <span className="font-medium text-slate-800">{formatINR(bill.amount)}</span>
          </div>
          {bill.lateFine > 0 && (
            <div className="flex justify-between text-sm mt-1">
              <span className="text-red-500">Late Fine</span>
              <span className="font-medium text-red-500">+ {formatINR(bill.lateFine)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm mt-1 pt-2 border-t border-blue-200">
            <span className="font-semibold text-slate-800">Total Due</span>
            <span className="font-bold text-blue-700 text-base">{formatINR(bill.totalDue)}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(v => onSubmit({ ...v, billId: bill.id, memberId }))}
              className="px-6 py-5 space-y-4">

          <div className="grid grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (₹)</label>
              <input type="number" step="0.01" min="1"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all
                  focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
                  ${errors.amountPaid ? 'border-red-400' : 'border-slate-200'}`}
                {...register('amountPaid')} />
              {errors.amountPaid && <p className="mt-1 text-xs text-red-500">{errors.amountPaid.message}</p>}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Date</label>
              <input type="date"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                {...register('paymentDate')} />
            </div>
          </div>

          {/* Mode */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Payment Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(PAYMENT_MODE_LABELS) as (keyof typeof PAYMENT_MODE_LABELS)[]).map(mode => (
                <label key={mode}
                  className={`flex items-center justify-center py-2 rounded-xl border text-sm font-medium cursor-pointer transition-all
                    ${paymentMode === mode
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>
                  <input type="radio" value={mode} className="sr-only" {...register('paymentMode')} />
                  {PAYMENT_MODE_LABELS[mode]}
                </label>
              ))}
            </div>
            {errors.paymentMode && <p className="mt-1 text-xs text-red-500">{errors.paymentMode.message}</p>}
          </div>

          {/* Reference (conditional) */}
          {needsRef && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Reference / Transaction ID
                <span className="text-slate-400 font-normal ml-1">(UTR / Cheque No)</span>
              </label>
              <input type="text" placeholder="Enter transaction reference"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                {...register('referenceNo')} />
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Remarks <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea rows={2} placeholder="Any additional notes…"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all resize-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              {...register('remarks')} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
