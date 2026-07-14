'use client';
// components/modules/members/MemberFormModal.tsx

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import type { Member, Flat } from '@/types/property.types';
import { MEMBER_TYPE_LABELS } from '@/types/property.types';

const schema = z.object({
  fullName:      z.string().min(1, 'Full name is required').max(200),
  mobile:        z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number').or(z.literal('')),
  email:         z.string().email('Enter a valid email').or(z.literal('')),
  aadharNumber:  z.string().regex(/^\d{12}$/, 'Aadhaar must be 12 digits').or(z.literal('')),
  memberType:    z.enum(['OWNER', 'TENANT', 'CO_OWNER']),
  flatId:        z.coerce.number().min(1, 'Flat is required'),
  moveInDate:    z.string().optional(),
  vehicleNumber: z.string().max(20).optional().or(z.literal('')),
  parkingSlot:   z.string().max(20).optional().or(z.literal('')),
  openingBalance: z.coerce.number().min(0, 'Cannot be negative').optional(),
  shareCapital:   z.coerce.number().min(0, 'Cannot be negative').optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  editTarget: Member | null;
  flats: Flat[];
  loading: boolean;
  onSubmit: (values: FormValues) => void;
  onClose: () => void;
}

export default function MemberFormModal({ open, editTarget, flats, loading, onSubmit, onClose }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open) {
      reset({
        fullName:      editTarget?.fullName      ?? '',
        mobile:        editTarget?.mobile        ?? '',
        email:         editTarget?.email         ?? '',
        aadharNumber:  editTarget?.aadharNumber  ?? '',
        memberType:    editTarget?.memberType    ?? 'OWNER',
        flatId:        editTarget?.flat?.id      ?? (flats[0]?.id ?? 0),
        moveInDate:    editTarget?.moveInDate    ?? '',
        vehicleNumber: editTarget?.vehicleNumber ?? '',
        parkingSlot:   editTarget?.parkingSlot   ?? '',
        openingBalance: (editTarget as any)?.openingBalance ?? 0,
        shareCapital:   (editTarget as any)?.shareCapital   ?? 0,
      });
    }
  }, [open, editTarget, flats, reset]);

  if (!open) return null;

  const inputCls = (hasError?: boolean) =>
    `w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white
     focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
     ${hasError ? 'border-red-400' : 'border-slate-200 hover:border-slate-300'}`;

  const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
         onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-slate-800">{editTarget ? 'Edit Member' : 'Add Member'}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Fields marked * are required</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Personal info */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Personal Info</p>

            <Field label="Full Name *" error={errors.fullName?.message}>
              <input type="text" placeholder="John Doe" autoFocus
                className={inputCls(!!errors.fullName)} {...register('fullName')} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Mobile" error={errors.mobile?.message}>
                <input type="tel" placeholder="9876543210"
                  className={inputCls(!!errors.mobile)} {...register('mobile')} />
              </Field>
              <Field label="Email" error={errors.email?.message}>
                <input type="email" placeholder="john@example.com"
                  className={inputCls(!!errors.email)} {...register('email')} />
              </Field>
            </div>

            <Field label="Aadhaar Number" error={errors.aadharNumber?.message}>
              <input type="text" placeholder="123456789012" maxLength={12}
                className={inputCls(!!errors.aadharNumber)} {...register('aadharNumber')} />
            </Field>
          </div>

          {/* Flat & type */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Flat & Type</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Flat *" error={errors.flatId?.message}>
                <select className={inputCls(!!errors.flatId)} {...register('flatId')}>
                  <option value="">Select flat</option>
                  {flats.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.wingName} – {f.flatNumber}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Member Type">
                <select className={inputCls()} {...register('memberType')}>
                  {Object.entries(MEMBER_TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Move-In Date">
              <input type="date" className={inputCls()} {...register('moveInDate')} />
            </Field>
          </div>

          {/* Opening Balance — नवीन आणि जुन्या दोन्ही members साठी, duplicate-safe */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 space-y-3">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Opening Balance (Optional)</p>
            <Field label="Previous Due Amount" error={errors.openingBalance?.message}>
              <input type="number" step="0.01" min="0" placeholder="0.00"
                className={inputCls(!!errors.openingBalance)} {...register('openingBalance')} />
            </Field>
            <p className="text-xs text-slate-500">
              {editTarget
                ? "जर आधीच arrears bill तयार झाला नसेल, तर हे amount टाकून Save केल्यावर एकदाच bill तयार होईल."
                : "Member add झाल्यावर हे amount चं arrears bill auto तयार होईल."}
            </p>
          </div>

          {/* Share Capital */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-3">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Share Capital (Optional)</p>
            <Field label="Share Capital Amount" error={(errors as any).shareCapital?.message}>
              <input type="number" step="0.01" min="0" placeholder="0.00"
                className={inputCls(!!(errors as any).shareCapital)} {...register('shareCapital' as any)} />
            </Field>
            <p className="text-xs text-slate-500">
              One-time share capital as per bye-laws. A separate account entry will be created automatically.
            </p>
          </div>

          {/* Vehicle */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehicle (Optional)</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Vehicle Number">
                <input type="text" placeholder="MH-20-AB-1234"
                  className={inputCls()} {...register('vehicleNumber')} />
              </Field>
              <Field label="Parking Slot">
                <input type="text" placeholder="P-42"
                  className={inputCls()} {...register('parkingSlot')} />
              </Field>
            </div>
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
              {editTarget ? 'Save Changes' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}