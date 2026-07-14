'use client';
// app/(dashboard)/visitors/page.tsx

import { useState } from 'react';
import { Plus, UserCheck, LogOut, Trash2, Search, Users, Clock, Printer, Download, CheckCircle2, XCircle, Bell } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { printVisitors, exportVisitorsPdf, exportVisitorsCsv } from '@/lib/utils/printUtils';
import PageHeader from '@/components/layout/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useAuthStore } from '@/lib/store/authStore';
import { useVisitors, useActiveVisitors, useLogVisitor, useRecordVisitorExit, useDeleteVisitor } from '@/lib/hooks/useOperations';
import { useFlats, useMembers } from '@/lib/hooks/useProperty';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Visitor } from '@/types/operations.types';

type Tab = 'all' | 'active' | 'pending';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const schema = z.object({
  visitorName:  z.string().min(1, 'Name is required').max(200),
  mobile:       z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit mobile').or(z.literal('')),
  purpose:      z.string().max(200).optional().or(z.literal('')),
  flatId:       z.coerce.number().min(1, 'Flat is required'),
  hostMemberId: z.coerce.number().optional().or(z.literal('')),
  vehicleNo:    z.string().max(20).optional().or(z.literal('')),
});

const fmtTime = (dt: string) => new Date(dt).toLocaleString('en-IN', {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
});

const duration = (entry: string, exit?: string | null) => {
  const ms = (exit ? new Date(exit) : new Date()).getTime() - new Date(entry).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

function getToken(): string {
  try {
    const store = JSON.parse(localStorage.getItem('societyms-auth') || '{}');
    return store?.state?.accessToken || '';
  } catch { return ''; }
}

export default function VisitorsPage() {
  const { user } = useAuthStore();
  const canManage = user?.role !== 'MEMBER';
  const isMember  = user?.role === 'MEMBER';
  const memberId  = (user as any)?.memberId ?? null;
  const queryClient = useQueryClient();

  const [tab,          setTab]          = useState<Tab>('all');
  const [search,       setSearch]       = useState('');
  const [logModal,     setLogModal]     = useState(false);
  const [exitTarget,   setExitTarget]   = useState<Visitor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Visitor | null>(null);

  const { data: allVisitors    = [], isLoading: allLoading    } = useVisitors();
  const { data: activeVisitors = [], isLoading: activeLoading } = useActiveVisitors();
  const { data: flats          = [] }                           = useFlats();
  const { data: members        = [] }                           = useMembers();

  // Pending visitors for member
  const { data: pendingVisitors = [], isLoading: pendingLoading } = useQuery({
    queryKey: ['visitors-pending', memberId],
    queryFn: async () => {
      if (!memberId) return [];
      const res = await fetch(`${API}/visitors/pending?memberId=${memberId}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!memberId,
    refetchInterval: 10000, // 10 seconds poll
  });

  // Approve mutation
  const approveVisitor = useMutation({
    mutationFn: async (visitorId: number) => {
      const res = await fetch(`${API}/visitors/${visitorId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ memberId }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors-pending'] });
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
    },
  });

  // Deny mutation
  const denyVisitor = useMutation({
    mutationFn: async (visitorId: number) => {
      const res = await fetch(`${API}/visitors/${visitorId}/deny`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ memberId }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors-pending'] });
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
    },
  });

  const logVisitor   = useLogVisitor();
  const recordExit   = useRecordVisitorExit();
  const deleteRecord = useDeleteVisitor();

  const { register, handleSubmit, reset, watch, formState: { errors } } =
    useForm({ resolver: zodResolver(schema) });

  const watchedFlatId = watch('flatId');

  // Flat select केल्यावर त्या flat चेच members filter करा
  const filteredMembersForFlat = watchedFlatId
    ? members.filter(m => m.flat?.id === Number(watchedFlatId))
    : members;

  const baseVisitors = tab === 'active' ? activeVisitors : allVisitors;
  const memberFiltered = isMember && memberId
    ? baseVisitors.filter(v => v.hostMemberId === memberId || (v as any).memberId === memberId)
    : baseVisitors;

  const displayed = memberFiltered.filter(v =>
    !search.trim() ||
    v.visitorName.toLowerCase().includes(search.toLowerCase()) ||
    (v.flatNumber ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (v.mobile ?? '').includes(search)
  );

  const onSubmit = (values: any) => {
    logVisitor.mutate(
      { ...values, flatId: Number(values.flatId), hostMemberId: values.hostMemberId || undefined },
      { onSuccess: () => { setLogModal(false); reset(); } }
    );
  };

  const visitorsToPrint = displayed.map(v => ({
    id: v.id, visitorName: v.visitorName, mobile: v.mobile, purpose: v.purpose,
    flatNumber: v.flatNumber, wingName: v.wingName,
    hostMemberName: v.hostMemberName, entryTime: v.entryTime,
    exitTime: v.exitTime, vehicleNo: v.vehicleNo,
  }));

  const inputCls = (err?: boolean) =>
    `w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white
     focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
     ${err ? 'border-red-400' : 'border-slate-200'}`;

  const statusBadge = (v: any) => {
    const status = (v as any).approvalStatus;
    if (status === 'PENDING') return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-700">Pending</span>;
    if (status === 'DENIED')  return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-600">Denied</span>;
    return v.insidePremises
      ? <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-700">Inside</span>
      : <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-500">Exited</span>;
  };

  return (
    <div className="page-enter">
      <PageHeader
        title="Visitors"
        subtitle={isMember ? "Visitors for your flat" : "Entry and exit log for society premises"}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => printVisitors(visitorsToPrint, tab === 'active' ? 'Active Visitors' : 'All Visitors')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={() => exportVisitorsPdf(visitorsToPrint)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
              <Download className="w-4 h-4" /> PDF
            </button>
            <button onClick={() => exportVisitorsCsv(visitorsToPrint)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
              <Download className="w-4 h-4" /> CSV
            </button>
            {canManage && (
              <button onClick={() => setLogModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.25)' }}>
                <Plus className="w-4 h-4" /> Log Visitor
              </button>
            )}
          </div>
        }
      />

      {/* Pending Approval Banner — Member ला दिसेल */}
      {isMember && pendingVisitors.length > 0 && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-amber-600" />
            <p className="text-sm font-semibold text-amber-800">
              {pendingVisitors.length} visitor{pendingVisitors.length > 1 ? 's' : ''} waiting at gate — Approve or Deny
            </p>
          </div>
          <div className="space-y-2">
            {pendingVisitors.map((v: any) => (
              <div key={v.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-amber-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                       style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                    {v.visitorName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{v.visitorName}</p>
                    <p className="text-xs text-slate-500">
                      {v.purpose ?? 'Visit'} · {v.mobile ?? '—'} · {fmtTime(v.entryTime)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => denyVisitor.mutate(v.id)}
                    disabled={denyVisitor.isPending}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors">
                    <XCircle className="w-4 h-4" /> Deny
                  </button>
                  <button
                    onClick={() => approveVisitor.mutate(v.id)}
                    disabled={approveVisitor.isPending}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white transition-colors"
                    style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-slate-500">{isMember ? 'My visitors today' : 'Total today'}</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{isMember ? memberFiltered.length : allVisitors.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-4 h-4 text-green-500" />
            <span className="text-xs text-slate-500">Currently inside</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {isMember
              ? memberFiltered.filter(v => v.insidePremises).length
              : activeVisitors.length}
          </p>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {(['all','active'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {t === 'active'
                ? `Active (${isMember ? memberFiltered.filter(v => v.insidePremises).length : activeVisitors.length})`
                : `All (${isMember ? memberFiltered.length : allVisitors.length})`}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search visitor, flat, mobile…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
        </div>
      </div>

      {/* Table */}
      {(tab === 'all' ? allLoading : activeLoading) ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3.5 border-b border-slate-100">
              {[...Array(7)].map((_, j) => <div key={j} className="skeleton h-4 rounded flex-1" />)}
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center py-20 bg-white rounded-xl border border-slate-200">
          <UserCheck className="w-8 h-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">
            {tab === 'active' ? 'No visitors currently inside.' : 'No visitor records.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Visitor','Mobile','Purpose','Flat / Host','Entry','Exit / Duration','Status','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayed.map(v => (
                <tr key={v.id} className={`transition-colors ${v.insidePremises ? 'bg-green-50/30 hover:bg-green-50/60' : 'hover:bg-slate-50'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                           style={{ background: v.insidePremises ? '#22c55e' : (v as any).approvalStatus === 'PENDING' ? '#f59e0b' : '#94a3b8' }}>
                        {v.visitorName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-800 whitespace-nowrap">{v.visitorName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{v.mobile ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-[120px] truncate">{v.purpose ?? '—'}</td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700 font-medium text-xs">{v.wingName} – {v.flatNumber}</p>
                    {v.hostMemberName && <p className="text-slate-400 text-xs mt-0.5">{v.hostMemberName}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{fmtTime(v.entryTime)}</td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {v.exitTime ? (
                      <span className="text-slate-500">{fmtTime(v.exitTime)} <span className="text-slate-400">({duration(v.entryTime, v.exitTime)})</span></span>
                    ) : (v as any).approvalStatus === 'PENDING' ? (
                      <span className="text-amber-500 text-xs">Waiting approval…</span>
                    ) : (
                      <span className="flex items-center gap-1 text-green-600">
                        <Clock className="w-3 h-3" /> {duration(v.entryTime)} (ongoing)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{statusBadge(v)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {/* Member: Approve/Deny for pending */}
                      {isMember && (v as any).approvalStatus === 'PENDING' && (
                        <>
                          <button onClick={() => denyVisitor.mutate(v.id)}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Deny">
                            <XCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => approveVisitor.mutate(v.id)}
                            className="p-1.5 rounded-lg text-green-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Approve">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {v.insidePremises && canManage && (
                        <button onClick={() => setExitTarget(v)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors">
                          <LogOut className="w-3 h-3" /> Exit
                        </button>
                      )}
                      {canManage && (
                        <button onClick={() => setDeleteTarget(v)}
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
        </div>
      )}

      {/* Log Visitor Modal */}
      {logModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
             onClick={() => setLogModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
               onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-semibold text-slate-800">Log Visitor Entry</h3>
              <button onClick={() => setLogModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Visitor Name *</label>
                  <input autoFocus type="text" className={inputCls(!!errors.visitorName)} {...register('visitorName')} />
                  {errors.visitorName && <p className="mt-1 text-xs text-red-500">{errors.visitorName.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Mobile (10 digits)</label>
                  <input type="tel" placeholder="9876543210" maxLength={10} className={inputCls(!!errors.mobile)} {...register('mobile')} />
                  {errors.mobile && <p className="mt-1 text-xs text-red-500">{errors.mobile.message as string}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Purpose</label>
                <input type="text" placeholder="e.g. Delivery, Meeting" className={inputCls()} {...register('purpose')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Visiting Flat *</label>
                  <select className={inputCls(!!errors.flatId)} {...register('flatId')}>
                    <option value="">Select flat</option>
                    {flats.map(f => <option key={f.id} value={f.id}>{f.wingName} – {f.flatNumber}</option>)}
                  </select>
                  {errors.flatId && <p className="mt-1 text-xs text-red-500">{errors.flatId.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Host Member</label>
                  <select className={inputCls()} {...register('hostMemberId')}>
                    <option value="">Select (optional)</option>
                    {filteredMembersForFlat.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Vehicle No.</label>
                <input type="text" placeholder="MH-20-AB-1234" className={inputCls()} {...register('vehicleNo')} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setLogModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={logVisitor.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                  {logVisitor.isPending && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!exitTarget} title="Record Exit" variant="warning"
        description={`Mark ${exitTarget?.visitorName} as exited? Current time will be recorded.`}
        confirmLabel="Record Exit" loading={recordExit.isPending}
        onConfirm={() => recordExit.mutate(exitTarget!.id, { onSuccess: () => setExitTarget(null) })}
        onCancel={() => setExitTarget(null)}
      />
      <ConfirmDialog
        open={!!deleteTarget} title="Delete Record"
        description={`Delete visitor record for "${deleteTarget?.visitorName}"?`}
        confirmLabel="Delete" loading={deleteRecord.isPending}
        onConfirm={() => deleteRecord.mutate(deleteTarget!.id, { onSuccess: () => setDeleteTarget(null) })}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}