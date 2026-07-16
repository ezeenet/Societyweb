'use client';
// app/(dashboard)/flats/page.tsx

import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Building2, LayoutGrid, Search, Printer } from 'lucide-react';
import { printMembers as printFlats } from '@/lib/utils/printUtils'; // Tumche print utility import kara
import PageHeader from '@/components/layout/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import WingFormModal from '@/components/modules/wings/WingFormModal';
import FlatFormModal from '@/components/modules/flats/FlatFormModal';
import { useAuthStore } from '@/lib/store/authStore';
import {
  useWings, useCreateWing, useUpdateWing, useDeleteWing,
  useFlats, useCreateFlat, useUpdateFlat, useDeleteFlat,
} from '@/lib/hooks/useProperty';
import type { Wing, Flat } from '@/types/property.types';
import { FLAT_TYPE_LABELS } from '@/types/property.types';

type Tab = 'wings' | 'flats';

export default function FlatsPage() {
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission('manage:flats');

  const [activeTab,    setActiveTab]    = useState<Tab>('flats');
  const [search,       setSearch]       = useState('');
  const [wingFilter,   setWingFilter]   = useState<number | 'all'>('all');

  // Wing modal state
  const [wingModal,    setWingModal]    = useState(false);
  const [editWing,     setEditWing]     = useState<Wing | null>(null);
  const [deleteWing,   setDeleteWing]   = useState<Wing | null>(null);

  // Flat modal state
  const [flatModal,    setFlatModal]    = useState(false);
  const [editFlat,     setEditFlat]     = useState<Flat | null>(null);
  const [deleteFlat,   setDeleteFlat]   = useState<Flat | null>(null);

  const { data: wings  = [], isLoading: wingsLoading  } = useWings();
  const { data: flats  = [], isLoading: flatsLoading  } = useFlats();

  const createWing = useCreateWing();
  const updateWing = useUpdateWing();
  const deleteWingMut = useDeleteWing();
  const createFlat = useCreateFlat();
  const updateFlat = useUpdateFlat();
  const deleteFlatMut = useDeleteFlat();

  const filteredFlats = useMemo(() => {
    return flats.filter(f => {
      const matchesWing   = wingFilter === 'all' || f.wingId === wingFilter;
      const matchesSearch = !search ||
        f.flatNumber.toLowerCase().includes(search.toLowerCase()) ||
        f.wingName.toLowerCase().includes(search.toLowerCase());
      return matchesWing && matchesSearch;
    });
  }, [flats, wingFilter, search]);

  const handleWingSubmit = (values: { name: string }) => {
    if (editWing) {
      updateWing.mutate({ id: editWing.id, payload: values }, { onSuccess: () => { setWingModal(false); setEditWing(null); } });
    } else {
      createWing.mutate(values, { onSuccess: () => setWingModal(false) });
    }
  };

  const handleFlatSubmit = (values: any) => {
    const payload = {
      wingId:      Number(values.wingId),
      flatNumber:  values.flatNumber,
      floorNumber: values.floorNumber ? Number(values.floorNumber) : undefined,
      flatType:    values.flatType || undefined,
      areaSqft:    values.areaSqft ? Number(values.areaSqft) : undefined,
    };
    if (editFlat) {
      updateFlat.mutate({ id: editFlat.id, payload }, { onSuccess: () => { setFlatModal(false); setEditFlat(null); } });
    } else {
      createFlat.mutate(payload, { onSuccess: () => setFlatModal(false) });
    }
  };

  const SummaryCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
    </div>
  );

  const totalOccupied = wings.reduce((s, w) => s + w.occupiedCount, 0);
  const totalVacant   = wings.reduce((s, w) => s + w.vacantCount, 0);
  const totalFlats    = wings.reduce((s, w) => s + w.totalFlats, 0);

  return (
    <div className="page-enter">
      <PageHeader
        title="Flats & Wings"
        subtitle="Manage building wings and individual flat units"
        actions={
          <div className="flex items-center gap-2">
            {/* Print Button - Filtered flats cha data print sathi */}
            {activeTab === 'flats' && (
              <button 
               onClick={() => printFlats(filteredFlats.map(f => ({
  wing: f.wingName,
  flatNo: f.flatNumber,
  floor: f.floorNumber ?? '—',
  type: f.flatType,
  area: f.areaSqFt ? f.areaSqFt + ' sqft' : '—',
  status: f.status
})))}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
            )}

            {canManage && (
              <>
                {activeTab === 'wings' && (
                  <button onClick={() => { setEditWing(null); setWingModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
                    style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.25)' }}>
                    <Plus className="w-4 h-4" /> Add Wing
                  </button>
                )}
                {activeTab === 'flats' && (
                  <button onClick={() => { setEditFlat(null); setFlatModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
                    style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.25)' }}>
                    <Plus className="w-4 h-4" /> Add Flat
                  </button>
                )}
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Total Flats"    value={totalFlats}    color="#4f7fff" />
        <SummaryCard label="Occupied"       value={totalOccupied} color="#22c55e" />
        <SummaryCard label="Vacant"         value={totalVacant}   color="#64748b" />
      </div>

      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {([['flats', LayoutGrid, 'Flats'], ['wings', Building2, 'Wings']] as const).map(([tab, Icon, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab as Tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {activeTab === 'wings' && (
        <div>
          {wingsLoading ? (
            <WingsSkeleton />
          ) : wings.length === 0 ? (
            <EmptyState icon={<Building2 className="w-8 h-8 text-slate-300" />} message="No wings yet. Add your first wing." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wings.map(wing => (
                <div key={wing.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                           style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)' }}>
                        <Building2 className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{wing.name}</p>
                        <p className="text-xs text-slate-400">{wing.totalFlats} flats total</p>
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex gap-1">
                        <button onClick={() => { setEditWing(wing); setWingModal(true); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteWing(wing)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1 text-center py-2 rounded-lg bg-green-50 border border-green-100">
                      <p className="text-lg font-bold text-green-600">{wing.occupiedCount}</p>
                      <p className="text-xs text-green-500">Occupied</p>
                    </div>
                    <div className="flex-1 text-center py-2 rounded-lg bg-slate-50 border border-slate-100">
                      <p className="text-lg font-bold text-slate-500">{wing.vacantCount}</p>
                      <p className="text-xs text-slate-400">Vacant</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'flats' && (
        <div>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search flat number…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
            <select value={wingFilter === 'all' ? '' : wingFilter}
              onChange={e => setWingFilter(e.target.value ? Number(e.target.value) : 'all')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 bg-white">
              <option value="">All Wings</option>
              {wings.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>

          {flatsLoading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : filteredFlats.length === 0 ? (
            <EmptyState icon={<LayoutGrid className="w-8 h-8 text-slate-300" />} message="No flats found." />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Wing', 'Flat No.', 'Floor', 'Type', 'Area (sq.ft)', 'Member', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFlats.map(flat => (
                    <tr key={flat.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-700">{flat.wingName}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{flat.flatNumber}</td>
                      <td className="px-4 py-3 text-slate-600">{flat.floorNumber ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {flat.flatType ? FLAT_TYPE_LABELS[flat.flatType] : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
  {flat.areaSqft ? flat.areaSqft.toLocaleString('en-IN') : '—'}
</td>
<td className="px-4 py-3">
  {(flat as any).memberName
    ? <div>
        <p className="text-sm font-medium text-slate-700">{(flat as any).memberName}</p>
        {(flat as any).memberPhone && <p className="text-xs text-slate-400">{(flat as any).memberPhone}</p>}
      </div>
    : <span className="text-slate-400">—</span>}
</td>
<td className="px-4 py-3"><StatusBadge value={flat.status} /></td>
                      <td className="px-4 py-3">
                        {canManage && (
                          <div className="flex gap-1">
                            <button onClick={() => { setEditFlat(flat); setFlatModal(true); }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteFlat(flat)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
                Showing {filteredFlats.length} of {flats.length} flats
              </div>
            </div>
          )}
        </div>
      )}

      <WingFormModal
        open={wingModal} editTarget={editWing}
        loading={createWing.isPending || updateWing.isPending}
        onSubmit={handleWingSubmit}
        onClose={() => { setWingModal(false); setEditWing(null); }}
      />
      <FlatFormModal
        open={flatModal} editTarget={editFlat} wings={wings}
        loading={createFlat.isPending || updateFlat.isPending}
        onSubmit={handleFlatSubmit}
        onClose={() => { setFlatModal(false); setEditFlat(null); }}
      />
      <ConfirmDialog
        open={!!deleteWing}
        title="Delete Wing"
        description={`Delete "${deleteWing?.name}"? This cannot be undone.`}
        confirmLabel="Delete Wing"
        loading={deleteWingMut.isPending}
        onConfirm={() => deleteWingMut.mutate(deleteWing!.id, { onSuccess: () => setDeleteWing(null) })}
        onCancel={() => setDeleteWing(null)}
      />
      <ConfirmDialog
        open={!!deleteFlat}
        title="Delete Flat"
        description={`Delete flat "${deleteFlat?.flatNumber}"? This action cannot be undone.`}
        confirmLabel="Delete Flat"
        loading={deleteFlatMut.isPending}
        onConfirm={() => deleteFlatMut.mutate(deleteFlat!.id, { onSuccess: () => setDeleteFlat(null) })}
        onCancel={() => setDeleteFlat(null)}
      />
    </div>
  );
}

function WingsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="skeleton h-5 w-28 mb-4 rounded" />
          <div className="flex gap-3">
            <div className="skeleton flex-1 h-12 rounded-lg" />
            <div className="skeleton flex-1 h-12 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TableSkeleton({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 h-10" />
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-slate-100">
          {[...Array(cols)].map((_, j) => (
            <div key={j} className="skeleton h-4 flex-1 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200">
      {icon}
      <p className="mt-3 text-sm text-slate-500">{message}</p>
    </div>
  );
}
