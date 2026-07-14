'use client';
// app/(dashboard)/complaints/page.tsx

import { useState, useMemo } from 'react';
import { Plus, MessageSquare, Search, Pencil, Trash2, Clock, CheckCircle2, AlertCircle, XCircle, Printer, Download } from 'lucide-react';
import { printComplaints, exportComplaintsPdf, exportComplaintsExcel } from '@/lib/utils/printUtils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import PageHeader from '@/components/layout/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useAuthStore } from '@/lib/store/authStore';
import { useComplaints, useCreateComplaint, useUpdateComplaintStatus, useDeleteComplaint } from '@/lib/hooks/useOperations';
import type { Complaint, ComplaintStatus } from '@/types/operations.types';

const CATEGORIES = ['Water','Electricity','Lift','Parking','Security','Cleanliness','Noise','Other'] as const;
const STATUSES   = ['OPEN','IN_PROGRESS','RESOLVED','CLOSED'] as const;

const STATUS_ICONS: Record<ComplaintStatus, React.ReactNode> = {
  OPEN:        <AlertCircle className="w-4 h-4 text-red-500" />,
  IN_PROGRESS: <Clock className="w-4 h-4 text-blue-500" />,
  RESOLVED:    <CheckCircle2 className="w-4 h-4 text-green-500" />,
  CLOSED:      <XCircle className="w-4 h-4 text-slate-400" />,
};

const createSchema = z.object({
  title:       z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  category:    z.string().optional(),
  memberId: z.coerce.number().optional(),
});

const statusSchema = z.object({
  status:  z.enum(['OPEN','IN_PROGRESS','RESOLVED','CLOSED']),
  remarks: z.string().max(500).optional(),
});

export default function ComplaintsPage() {
  const { user, hasPermission } = useAuthStore();
  const isMember   = user?.role === 'MEMBER';
  const canManage  = hasPermission('manage:complaints');
  const canDelete  = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [createModal,  setCreateModal]  = useState(false);
  const [statusModal,  setStatusModal]  = useState<Complaint | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Complaint | null>(null);

  const { data: complaints = [], isLoading } = useComplaints();
  const createComplaint  = useCreateComplaint();
  const updateStatus     = useUpdateComplaintStatus();
  const deleteComplaint  = useDeleteComplaint();

  const { register: regCreate, handleSubmit: hsCreate, reset: resetCreate, formState: { errors: errsCreate } } =
    useForm({ resolver: zodResolver(createSchema) });

  const { register: regStatus, handleSubmit: hsStatus, reset: resetStatus, watch: watchStatus } =
    useForm({ resolver: zodResolver(statusSchema) });

  const filtered = useMemo(() => complaints.filter(c => {
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchSearch = !search.trim() ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.memberName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.flatNumber ?? '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  }), [complaints, search, filterStatus]);

  const counts = {
    OPEN:        complaints.filter(c => c.status === 'OPEN').length,
    IN_PROGRESS: complaints.filter(c => c.status === 'IN_PROGRESS').length,
    RESOLVED:    complaints.filter(c => c.status === 'RESOLVED').length,
    CLOSED:      complaints.filter(c => c.status === 'CLOSED').length,
  };

  const onCreateSubmit = (values: any) => {
  const memberId = isMember 
    ? (user as any)?.memberId 
    : Number(values.memberId);
  createComplaint.mutate(
    { ...values, memberId },
    { onSuccess: () => { setCreateModal(false); resetCreate(); } }
  );
};

  const onStatusSubmit = (values: any) => {
    updateStatus.mutate(
      { id: statusModal!.id, status: values.status, remarks: values.remarks },
      { onSuccess: () => { setStatusModal(null); resetStatus(); } }
    );
  };

  return (
    <div className="page-enter">
      <PageHeader
        title="Complaints"
        subtitle="Society complaints management and resolution tracking"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => printComplaints(filtered.map(c => ({
                id: c.id, subject: c.title, description: c.description ?? '',
                category: c.category ?? '', status: c.status, priority: 'Normal',
                memberName: c.memberName ?? '-', flatNumber: c.flatNumber ?? '-',
                createdAt: new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                resolvedAt: undefined,
              })))}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={() => exportComplaintsPdf(filtered.map(c => ({
                id: c.id, subject: c.title, description: c.description ?? '',
                category: c.category ?? '', status: c.status, priority: 'Normal',
                memberName: c.memberName ?? '-', flatNumber: c.flatNumber ?? '-',
                createdAt: new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                resolvedAt: undefined,
              })))}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
              <Download className="w-4 h-4" /> PDF
            </button>
            <button
              onClick={() => exportComplaintsExcel(filtered.map(c => ({
                id: c.id, subject: c.title, description: c.description ?? '',
                category: c.category ?? '', status: c.status, priority: 'Normal',
                memberName: c.memberName ?? '-', flatNumber: c.flatNumber ?? '-',
                createdAt: new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                resolvedAt: undefined,
              })))}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
              <Download className="w-4 h-4" /> Excel
            </button>
            <button onClick={() => setCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.25)' }}>
              <Plus className="w-4 h-4" /> Raise Complaint
            </button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {(Object.entries(counts) as [ComplaintStatus, number][]).map(([status, count]) => (
          <button key={status} onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
            className={`bg-white rounded-xl border p-4 text-left transition-all hover:shadow-md
              ${filterStatus === status ? 'border-blue-300 ring-1 ring-blue-200' : 'border-slate-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {STATUS_ICONS[status]}
              <span className="text-xs text-slate-500 font-medium">{status.replace('_', ' ')}</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{count}</p>
          </button>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search complaints…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/30">
          <option value="all">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      {isLoading ? <TableSkeleton /> : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
          <MessageSquare className="w-8 h-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No complaints found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['#', 'Title', 'Category', !isMember && 'Member/Flat', 'Status', 'Raised', 'Actions']
                  .filter(Boolean).map(h => (
                  <th key={h as string} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c, i) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 max-w-[200px] truncate">{c.title}</p>
                    {c.description && <p className="text-xs text-slate-400 mt-0.5 max-w-[200px] truncate">{c.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {c.category ? <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{c.category}</span> : '—'}
                  </td>
                  {!isMember && (
                    <td className="px-4 py-3">
                      <p className="text-slate-700 font-medium text-xs">{c.memberName}</p>
                      {c.flatNumber && <p className="text-slate-400 text-xs mt-0.5">{c.wingName} – {c.flatNumber}</p>}
                    </td>
                  )}
                  <td className="px-4 py-3"><StatusBadge value={c.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {(!isMember || (c.status !== 'RESOLVED' && c.status !== 'CLOSED')) && (
  <button onClick={() => { setStatusModal(c); resetStatus({ status: c.status, remarks: c.remarks ?? '' }); }}
    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors" title="Update status">
    <Pencil className="w-3.5 h-3.5" />
  </button>
)}
                      {canDelete && (
                        <button onClick={() => setDeleteTarget(c)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">{filtered.length} complaints</div>
        </div>
      )}

      {/* Create modal */}
      {createModal && (
        <Modal title="Raise Complaint" onClose={() => setCreateModal(false)}>
          <form onSubmit={hsCreate(onCreateSubmit)} className="space-y-4">
            <Field label="Title *" error={errsCreate.title?.message as string}>
              <input type="text" autoFocus placeholder="Brief complaint title"
                className={inputCls(!!errsCreate.title)} {...regCreate('title')} />
            </Field>
            <Field label="Category">
              <select className={inputCls()} {...regCreate('category')}>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Description">
              <textarea rows={3} placeholder="Describe the issue in detail…"
                className={`${inputCls()} resize-none`} {...regCreate('description')} />
            </Field>
            {!isMember && (
              <Field label="Member ID" error={errsCreate.memberId?.message as string}>
                <input type="number" className={inputCls(!!errsCreate.memberId)} {...regCreate('memberId')} />
              </Field>
            )}
            <ModalFooter onCancel={() => setCreateModal(false)} loading={createComplaint.isPending} label="Submit Complaint" />
          </form>
        </Modal>
      )}

      {/* Status update modal */}
      {statusModal && (
        <Modal title={`Update: ${statusModal.title}`} onClose={() => setStatusModal(null)}>
          <form onSubmit={hsStatus(onStatusSubmit)} className="space-y-4">
            <Field label="New Status">
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.filter(s => !isMember || s === 'OPEN' || s === 'IN_PROGRESS').map(s => {
                  const current = watchStatus('status');
                  return (
                    <label key={s}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm cursor-pointer transition-all
                        ${current === s ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input type="radio" value={s} className="sr-only" {...regStatus('status')} />
                      {STATUS_ICONS[s as ComplaintStatus]}
                      {s.replace('_', ' ')}
                    </label>
                  );
                })}
              </div>
            </Field>
            <Field label="Remarks">
              <textarea rows={2} placeholder="Optional notes…" className={`${inputCls()} resize-none`}
                {...regStatus('remarks')} />
            </Field>
            <ModalFooter onCancel={() => setStatusModal(null)} loading={updateStatus.isPending} label="Update Status" />
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Complaint"
        description={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteComplaint.isPending}
        onConfirm={() => deleteComplaint.mutate(deleteTarget!.id, { onSuccess: () => setDeleteTarget(null) })}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────
const inputCls = (err?: boolean) =>
  `w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white
   focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
   ${err ? 'border-red-400' : 'border-slate-200 hover:border-slate-300'}`;

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
         onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-base font-semibold text-slate-800 pr-4">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 flex-shrink-0">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
function ModalFooter({ onCancel, loading, label }: { onCancel: () => void; loading: boolean; label: string }) {
  return (
    <div className="flex gap-3 pt-1">
      <button type="button" onClick={onCancel}
        className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">Cancel</button>
      <button type="submit" disabled={loading}
        className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
        {loading && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
        {label}
      </button>
    </div>
  );
}
function TableSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 h-10 border-b border-slate-200" />
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3.5 border-b border-slate-100">
          {[...Array(6)].map((_, j) => <div key={j} className="skeleton h-4 rounded flex-1" />)}
        </div>
      ))}
    </div>
  );
}
