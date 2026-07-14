'use client';
// app/(dashboard)/amc/page.tsx

import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, AlertTriangle, CheckCircle2, Clock, Printer } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useAmcContracts, useAmcSummary, useCreateAmc, useUpdateAmc, useDeleteAmc } from '@/lib/hooks/useAmc';
import { useVendors } from '@/lib/hooks/useVendor';
import type { AmcContract } from '@/lib/api/amc.api';

const INR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const AMC_CATEGORIES = [
  'Lift', 'Fire Safety', 'CCTV', 'Water Pump', 'Generator',
  'Intercom', 'Pest Control', 'Water Purifier', 'AC', 'Electrical', 'Other',
];

const statusColor = (c: AmcContract) => {
  if (c.isExpired) return 'bg-red-50 text-red-600 border-red-200';
  if (c.isDueSoon) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-green-50 text-green-700 border-green-200';
};

const statusLabel = (c: AmcContract) => {
  if (c.isExpired) return 'Expired';
  if (c.isDueSoon) return `Due in ${c.daysRemaining}d`;
  return 'Active';
};

export default function AmcPage() {
  const { data: contracts = [], isLoading } = useAmcContracts();
  const { data: summary }                   = useAmcSummary();
  const { data: vendors  = [] }             = useVendors(true);

  const createAmc = useCreateAmc();
  const updateAmc = useUpdateAmc();
  const deleteAmc = useDeleteAmc();

  const [search,       setSearch]       = useState('');
  const [filter,       setFilter]       = useState<'ALL' | 'ACTIVE' | 'DUE_SOON' | 'EXPIRED'>('ALL');
  const [modal,        setModal]        = useState(false);
  const [editTarget,   setEditTarget]   = useState<AmcContract | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AmcContract | null>(null);

  const [form, setForm] = useState({
    contractName: '', vendorId: '', vendorName: '', category: AMC_CATEGORIES[0],
    startDate: '', endDate: '', amount: '', paymentMode: 'CASH',
    status: 'ACTIVE', notes: '', reminderDays: '30',
  });

  const openCreate = () => {
    setEditTarget(null);
    setForm({ contractName: '', vendorId: '', vendorName: '', category: AMC_CATEGORIES[0], startDate: '', endDate: '', amount: '', paymentMode: 'CASH', status: 'ACTIVE', notes: '', reminderDays: '30' });
    setModal(true);
  };

  const openEdit = (c: AmcContract) => {
    setEditTarget(c);
    setForm({
      contractName: c.contractName, vendorId: c.vendorId ? String(c.vendorId) : '',
      vendorName: c.vendorName ?? '', category: c.category,
      startDate: c.startDate, endDate: c.endDate,
      amount: String(c.amount), paymentMode: c.paymentMode ?? 'CASH',
      status: c.status, notes: c.notes ?? '', reminderDays: String(c.reminderDays),
    });
    setModal(true);
  };

  const handleSubmit = () => {
    if (!form.contractName.trim() || !form.endDate) return;
    const req = {
      contractName: form.contractName,
      vendorId: form.vendorId ? Number(form.vendorId) : undefined,
      vendorName: form.vendorName || undefined,
      category: form.category,
      startDate: form.startDate || new Date().toISOString().split('T')[0],
      endDate: form.endDate,
      amount: Number(form.amount) || 0,
      paymentMode: form.paymentMode || undefined,
      status: form.status,
      notes: form.notes || undefined,
      reminderDays: Number(form.reminderDays) || 30,
    };
    if (editTarget) {
      updateAmc.mutate({ id: editTarget.id, req }, { onSuccess: () => setModal(false) });
    } else {
      createAmc.mutate(req, { onSuccess: () => setModal(false) });
    }
  };

  const filtered = contracts.filter(c => {
    const matchSearch = !search.trim() ||
      c.contractName.toLowerCase().includes(search.toLowerCase()) ||
      (c.vendorName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' ||
      (filter === 'EXPIRED'  && c.isExpired) ||
      (filter === 'DUE_SOON' && c.isDueSoon && !c.isExpired) ||
      (filter === 'ACTIVE'   && !c.isExpired && !c.isDueSoon);
    return matchSearch && matchFilter;
  });

  const printReport = () => {
    const rows = filtered.map(c =>
      '<tr><td>' + c.contractName + '</td><td>' + c.category + '</td>' +
      '<td>' + (c.vendorName ?? '-') + '</td>' +
      '<td>' + fmtDate(c.startDate) + '</td>' +
      '<td>' + fmtDate(c.endDate) + '</td>' +
      '<td style="text-align:right">' + INR(c.amount) + '</td>' +
      '<td style="color:' + (c.isExpired ? '#dc2626' : c.isDueSoon ? '#d97706' : '#16a34a') + ';font-weight:600">' +
      statusLabel(c) + '</td></tr>'
    ).join('');
    const w = window.open('', '_blank', 'width=1000,height=700');
    if (!w) return;
    w.document.write('<!DOCTYPE html><html><head><title>AMC Contracts</title>' +
      '<style>body{font-family:Arial;padding:32px;color:#1e293b}h2{color:#1e40af}' +
      'table{width:100%;border-collapse:collapse;font-size:12px}' +
      'th{background:#1e40af;color:#fff;padding:8px 10px;text-align:left}' +
      'td{padding:7px 10px;border-bottom:1px solid #e2e8f0}' +
      'tr:nth-child(even){background:#f8fafc}' +
      '@media print{@page{margin:1.5cm}}</style></head><body>' +
      '<h2>AMC Contract Report</h2>' +
      '<p style="color:#64748b;font-size:12px">Generated: ' + new Date().toLocaleString('en-IN') + '</p>' +
      '<table><thead><tr><th>Contract</th><th>Category</th><th>Vendor</th><th>Start</th><th>End</th><th>Amount</th><th>Status</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table>' +
      '<script>window.onload=function(){window.print()}</script></body></html>');
    w.document.close();
  };

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white';

  return (
    <div className="page-enter">
      <PageHeader title="AMC Contracts" subtitle="Annual Maintenance Contract tracking and renewals"
        actions={
          <div className="flex gap-2">
            {contracts.length > 0 && (
              <button onClick={printReport}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                <Printer className="w-4 h-4" /> Print
              </button>
            )}
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.25)' }}>
              <Plus className="w-4 h-4" /> Add AMC
            </button>
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total Contracts', value: summary?.total    ?? 0, color: '#4f7fff', icon: <CheckCircle2 className="w-5 h-5" /> },
          { label: 'Active',          value: summary?.active   ?? 0, color: '#22c55e', icon: <CheckCircle2 className="w-5 h-5" /> },
          { label: 'Due Soon (30d)',  value: summary?.dueSoon  ?? 0, color: '#f59e0b', icon: <Clock className="w-5 h-5" /> },
          { label: 'Expired',         value: summary?.expired  ?? 0, color: '#ef4444', icon: <AlertTriangle className="w-5 h-5" /> },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">{c.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                   style={{ background: `${c.color}18`, color: c.color }}>{c.icon}</div>
            </div>
            <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filter + Search */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {([['ALL', 'All'], ['ACTIVE', 'Active'], ['DUE_SOON', 'Due Soon'], ['EXPIRED', 'Expired']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${filter === val ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search contract, category, vendor…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30" />
        </div>
      </div>

      {/* Contracts Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 bg-white rounded-xl border border-slate-200">
          <CheckCircle2 className="w-8 h-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">{search ? 'No contracts match.' : 'No AMC contracts yet. Click "Add AMC" to start.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              {['Contract','Category','Vendor','Start Date','End Date','Amount','Status','Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(c => (
                <tr key={c.id} className={`transition-colors ${c.isExpired ? 'bg-red-50/30' : c.isDueSoon ? 'bg-amber-50/20' : 'hover:bg-slate-50'}`}>
                  <td className="px-4 py-3 font-medium text-slate-800">{c.contractName}</td>
                  <td className="px-4 py-3 text-slate-600">{c.category}</td>
                  <td className="px-4 py-3 text-slate-600">{c.vendorName ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(c.startDate)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(c.endDate)}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{INR(c.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium border ${statusColor(c)}`}>
                      {statusLabel(c)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(c)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
             onClick={() => setModal(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
               onClick={e => e.stopPropagation()}>
            <p className="font-semibold text-slate-800 mb-5">{editTarget ? 'Edit AMC Contract' : 'Add AMC Contract'}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Contract Name *</label>
                <input type="text" placeholder="e.g. Lift AMC - Otis" className={inputCls}
                  value={form.contractName} onChange={e => setForm(f => ({ ...f, contractName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Category *</label>
                  <select className={inputCls} value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {AMC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Vendor</label>
                  <select className={inputCls} value={form.vendorId}
                    onChange={e => {
                      const v = vendors.find(v => String(v.id) === e.target.value);
                      setForm(f => ({ ...f, vendorId: e.target.value, vendorName: v ? v.name : f.vendorName }));
                    }}>
                    <option value="">Select vendor…</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                  {!form.vendorId && (
                    <input type="text" placeholder="Or type vendor name…" className={`${inputCls} mt-2`}
                      value={form.vendorName} onChange={e => setForm(f => ({ ...f, vendorName: e.target.value }))} />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Date</label>
                  <input type="date" className={inputCls} value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">End Date *</label>
                  <input type="date" className={inputCls} value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (₹)</label>
                  <input type="number" min="0" className={inputCls} value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Reminder (days before)</label>
                  <input type="number" min="1" max="365" className={inputCls} value={form.reminderDays}
                    onChange={e => setForm(f => ({ ...f, reminderDays: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Mode</label>
                  <select className={inputCls} value={form.paymentMode}
                    onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))}>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="UPI">UPI</option>
                    <option value="NEFT">NEFT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                  <select className={inputCls} value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="ACTIVE">Active</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                <textarea rows={2} className={`${inputCls} resize-none`} value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleSubmit}
                disabled={!form.contractName.trim() || !form.endDate || createAmc.isPending || updateAmc.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                {editTarget ? 'Save Changes' : 'Add Contract'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget} title="Delete AMC Contract"
        description={`Delete "${deleteTarget?.contractName}"?`}
        confirmLabel="Delete" loading={deleteAmc.isPending}
        onConfirm={() => deleteAmc.mutate(deleteTarget!.id, { onSuccess: () => setDeleteTarget(null) })}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}