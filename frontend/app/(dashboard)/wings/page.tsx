'use client';

import { useState } from 'react';
import {
  Plus, Pencil, Trash2, Building2, Home,
  Users, Search, Printer, ChevronRight,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import {
  useWings, useCreateWing, useUpdateWing, useDeleteWing,
} from '@/lib/hooks/useProperty';
import { printWings } from '@/lib/utils/printUtils';

interface WingFormData {
  name: string;
  totalFloors: number;
  description?: string;
}

export default function WingsPage() {
  const { data: wings = [], isLoading } = useWings();
  const createWing = useCreateWing();
  const updateWing = useUpdateWing();
  const deleteWing = useDeleteWing();

  const [search,       setSearch]       = useState('');
  const [modal,        setModal]        = useState(false);
  const [editTarget,   setEditTarget]   = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form,         setForm]         = useState<WingFormData>({ name: '', totalFloors: 1 });

  const filtered = wings.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditTarget(null);
    setForm({ name: '', totalFloors: 1, description: '' });
    setModal(true);
  }

  function openEdit(wing: any) {
    setEditTarget(wing);
    setForm({ name: wing.name, totalFloors: wing.totalFloors ?? 1, description: wing.description ?? '' });
    setModal(true);
  }

  function handleSubmit() {
    if (!form.name.trim()) return;
    if (editTarget) {
      updateWing.mutate(
        { id: editTarget.id, payload: form },
        { onSuccess: () => { setModal(false); setEditTarget(null); } }
      );
    } else {
      createWing.mutate(form, { onSuccess: () => setModal(false) });
    }
  }

  const totalFlats   = wings.reduce((s, w) => s + (w.totalFlats   ?? 0), 0);
  const totalMembers = wings.reduce((s, w) => s + (w.memberCount  ?? 0), 0);

  const inputCls = (err?: boolean) =>
    `w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white
     focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
     ${err ? 'border-red-400' : 'border-slate-200 hover:border-slate-300'}`;

  return (
    <div className="page-enter">
      <PageHeader
        title="Wings"
        subtitle="Manage building wings and their flats"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => printWings(wings.map(w => ({
                name: w.name, totalFlats: w.totalFlats ?? 0,
                occupied: w.occupiedCount ?? 0,
                vacant: w.vacantCount ?? (w.totalFlats ?? 0) - (w.occupiedCount ?? 0),
                maintenance: 0,
              })))}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
              <Plus className="w-4 h-4" /> Add Wing
            </button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Wings',   value: wings.length, color: '#4f7fff', icon: <Building2 className="w-5 h-5" /> },
          { label: 'Total Flats',   value: totalFlats,   color: '#22c55e', icon: <Home className="w-5 h-5" /> },
          { label: 'Total Members', value: totalMembers, color: '#8b5cf6', icon: <Users className="w-5 h-5" /> },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500 font-medium">{k.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                   style={{ background: `${k.color}15`, color: k.color }}>
                {k.icon}
              </div>
            </div>
            <p className="text-3xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search wings…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
      </div>

      {/* Wings Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <div className="skeleton h-5 w-1/2 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-2/3 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 bg-white rounded-xl border border-slate-200">
          <Building2 className="w-8 h-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">
            {search ? 'No wings match your search.' : 'No wings yet. Add your first wing.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(wing => {
            const occupied  = wing.occupiedCount ?? 0;
            const total     = wing.totalFlats ?? 0;
            const vacant    = wing.vacantCount ?? (total - occupied);
            const occupancy = total > 0 ? Math.round((occupied / total) * 100) : 0;

            return (
              <div key={wing.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all">
                {/* Wing header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                         style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                      {wing.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">Wing {wing.name}</h3>
                      {wing.description && (
                        <p className="text-xs text-slate-400 mt-0.5">{wing.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(wing)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(wing)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: 'Total',    value: total,              color: '#64748b' },
                    { label: 'Occupied', value: occupied,           color: '#22c55e' },
                    { label: 'Vacant',   value: vacant,             color: '#f59e0b' },
                  ].map(s => (
                    <div key={s.label} className="text-center p-2 rounded-lg bg-slate-50">
                      <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-xs text-slate-400">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Occupancy bar */}
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Occupancy</span>
                    <span>{occupancy}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all duration-500"
                         style={{ width: `${occupancy}%`, background: 'linear-gradient(90deg,#3b82f6,#22c55e)' }} />
                  </div>
                </div>

                {/* Members */}
                {(wing.memberCount ?? 0) > 0 && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                    <Users className="w-3.5 h-3.5" />
                    <span>{wing.memberCount} member{(wing.memberCount ?? 0) !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
             onClick={() => { setModal(false); setEditTarget(null); }}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
               onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-semibold text-slate-800">
                {editTarget ? `Edit Wing — ${editTarget.name}` : 'Add New Wing'}
              </h3>
              <button onClick={() => { setModal(false); setEditTarget(null); }}
                className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Wing Name *</label>
                <input autoFocus type="text" placeholder="e.g. A, B, North, South"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className={inputCls(!form.name.trim())} />
                {!form.name.trim() && (
                  <p className="mt-1 text-xs text-red-500">Wing name is required</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Total Floors</label>
                <input type="number" min={1} max={50}
                  value={form.totalFloors}
                  onChange={e => setForm(f => ({ ...f, totalFloors: Number(e.target.value) }))}
                  className={inputCls()} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea rows={2} placeholder="Optional notes about this wing…"
                  value={form.description ?? ''}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className={`${inputCls()} resize-none`} />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button"
                  onClick={() => { setModal(false); setEditTarget(null); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="button" onClick={handleSubmit}
                  disabled={!form.name.trim() || createWing.isPending || updateWing.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                  {(createWing.isPending || updateWing.isPending) && (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  )}
                  {editTarget ? 'Save Changes' : 'Add Wing'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Wing"
        description={`Wing "${deleteTarget?.name}" delete केल्यावर त्यातील सर्व flats पण delete होतील. Continue?`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteWing.isPending}
        onConfirm={() => deleteWing.mutate(deleteTarget!.id, { onSuccess: () => setDeleteTarget(null) })}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}