'use client';
// app/(dashboard)/vendors/page.tsx

import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Users, Wallet } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useVendors, useCreateVendor, useUpdateVendor, useDeleteVendor } from '@/lib/hooks/useVendor';
import type { Vendor } from '@/lib/api/vendor.api';

const INR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const VENDOR_TYPES = [
  'Plumber', 'Electrician', 'Cleaner', 'Sweeper', 'Carpenter',
  'Painter', 'Security', 'Gardener', 'Lift Technician', 'Water Tank Cleaner',
  'Pest Control', 'CCTV Technician', 'Other',
];

export default function VendorsPage() {
  const { data: vendors = [], isLoading } = useVendors();
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();
  const deleteVendor = useDeleteVendor();

  const [search,       setSearch]       = useState('');
  const [modal,        setModal]        = useState(false);
  const [editTarget,   setEditTarget]   = useState<Vendor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);
  const [form, setForm] = useState({ name: '', vendorType: '', mobile: '', address: '', notes: '', isActive: true });

  const filtered = vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    (v.vendorType ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (v.mobile ?? '').includes(search)
  );

  const openCreate = () => {
    setEditTarget(null);
    setForm({ name: '', vendorType: '', mobile: '', address: '', notes: '', isActive: true });
    setModal(true);
  };

  const openEdit = (v: Vendor) => {
    setEditTarget(v);
    setForm({ name: v.name, vendorType: v.vendorType ?? '', mobile: v.mobile ?? '', address: v.address ?? '', notes: v.notes ?? '', isActive: v.isActive });
    setModal(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    const req = { ...form, vendorType: form.vendorType || undefined, mobile: form.mobile || undefined, address: form.address || undefined, notes: form.notes || undefined };
    if (editTarget) {
      updateVendor.mutate({ id: editTarget.id, req }, { onSuccess: () => setModal(false) });
    } else {
      createVendor.mutate(req, { onSuccess: () => setModal(false) });
    }
  };

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white';

  return (
    <div className="page-enter">
      <PageHeader title="Vendors" subtitle="Manage contractors and service providers"
        actions={
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.25)' }}>
            <Plus className="w-4 h-4" /> Add Vendor
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Total Vendors</p>
          <p className="text-2xl font-bold text-blue-600">{vendors.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Active</p>
          <p className="text-2xl font-bold text-green-600">{vendors.filter(v => v.isActive).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Total Paid</p>
          <p className="text-xl font-bold text-red-500">{INR(vendors.reduce((s, v) => s + v.totalPaid, 0))}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search by name, type, mobile…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30" />
      </div>

      {/* Vendors Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 bg-white rounded-xl border border-slate-200">
          <Users className="w-8 h-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">{search ? 'No vendors match your search.' : 'No vendors yet. Click "Add Vendor" to start.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              {['Name','Type','Mobile','Vouchers','Total Paid','Status','Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(v => (
                <tr key={v.id} className={`transition-colors ${!v.isActive ? 'opacity-50' : 'hover:bg-slate-50'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                           style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}>
                        {v.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-800">{v.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{v.vendorType ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{v.mobile ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{v.voucherCount}</td>
                  <td className="px-4 py-3 font-semibold text-red-500">{INR(v.totalPaid)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${v.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {v.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(v)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(v)}
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
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
               onClick={e => e.stopPropagation()}>
            <p className="font-semibold text-slate-800 mb-5">{editTarget ? 'Edit Vendor' : 'Add Vendor'}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Name *</label>
                <input type="text" className={inputCls} value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
                  <select className={inputCls} value={form.vendorType}
                    onChange={e => setForm(f => ({ ...f, vendorType: e.target.value }))}>
                    <option value="">Select type…</option>
                    {VENDOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Mobile</label>
                  <input type="tel" className={inputCls} value={form.mobile}
                    onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
                <textarea rows={2} className={`${inputCls} resize-none`} value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                <input type="text" className={inputCls} value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="rounded border-slate-300" />
                <span className="text-sm text-slate-700">Active Vendor</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleSubmit}
                disabled={!form.name.trim() || createVendor.isPending || updateVendor.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                {editTarget ? 'Save Changes' : 'Add Vendor'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget} title="Delete Vendor"
        description={`Delete vendor "${deleteTarget?.name}"? Existing vouchers will not be affected.`}
        confirmLabel="Delete" loading={deleteVendor.isPending}
        onConfirm={() => deleteVendor.mutate(deleteTarget!.id, { onSuccess: () => setDeleteTarget(null) })}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}