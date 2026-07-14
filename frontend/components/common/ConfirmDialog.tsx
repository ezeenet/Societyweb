'use client';
// components/common/ConfirmDialog.tsx

import { Loader2, AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open, title, description,
  confirmLabel = 'Delete',
  variant = 'danger',
  loading = false,
  onConfirm, onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const isDanger  = variant === 'danger';
  const iconColor = isDanger ? '#ef4444' : '#f59e0b';
  const iconBg    = isDanger ? '#fef2f2' : '#fffbeb';
  const btnStyle  = isDanger
    ? { background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }
    : { background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      {/* Card */}
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
               style={{ background: iconBg }}>
            <AlertTriangle className="w-6 h-6" style={{ color: iconColor }} />
          </div>
        </div>

        <h3 className="text-base font-semibold text-slate-800 text-center mb-1">{title}</h3>
        <p className="text-sm text-slate-500 text-center leading-relaxed mb-6">{description}</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            style={btnStyle}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
