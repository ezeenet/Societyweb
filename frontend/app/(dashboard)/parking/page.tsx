'use client';
// app/(dashboard)/parking/page.tsx

import { useState } from 'react';
import { Plus, Pencil, Trash2, Car, UserCheck, UserX, Printer } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useAuthStore } from '@/lib/store/authStore';
import {
  useParkingSlots, useParkingSummary,
  useCreateParkingSlot, useUpdateParkingSlot, useDeleteParkingSlot,
  useAssignParkingSlot, useUnassignParkingSlot,
} from '@/lib/hooks/useParking';
import { useMembers } from '@/lib/hooks/useProperty';
import type { ParkingSlot } from '@/lib/api/parking.api';

export default function ParkingPage() {
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission('manage:members');

  const { data: slots   = [], isLoading } = useParkingSlots();
  const { data: summary }                 = useParkingSummary();
  const { data: members = [] }            = useMembers();

  const createSlot   = useCreateParkingSlot();
  const updateSlot   = useUpdateParkingSlot();
  const deleteSlot   = useDeleteParkingSlot();
  const assignSlot   = useAssignParkingSlot();
  const unassignSlot = useUnassignParkingSlot();

  const [slotModal,    setSlotModal]    = useState(false);
  const [editTarget,   setEditTarget]   = useState<ParkingSlot | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ParkingSlot | null>(null);
  const [assignTarget, setAssignTarget] = useState<ParkingSlot | null>(null);
  const [selectedMember, setSelectedMember] = useState('');

  const [form, setForm] = useState({ slotNumber: '', slotType: 'BOTH', notes: '' });

  const openCreate = () => {
    setEditTarget(null);
    setForm({ slotNumber: '', slotType: 'BOTH', notes: '' });
    setSlotModal(true);
  };

  const openEdit = (slot: ParkingSlot) => {
    setEditTarget(slot);
    setForm({ slotNumber: slot.slotNumber, slotType: slot.slotType, notes: slot.notes ?? '' });
    setSlotModal(true);
  };

  const handleSubmit = () => {
    if (!form.slotNumber.trim()) return;
    if (editTarget) {
      updateSlot.mutate({ id: editTarget.id, req: form }, { onSuccess: () => setSlotModal(false) });
    } else {
      createSlot.mutate(form, { onSuccess: () => setSlotModal(false) });
    }
  };

  const handleAssign = () => {
    if (!assignTarget || !selectedMember) return;
    assignSlot.mutate(
      { slotId: assignTarget.id, memberId: Number(selectedMember) },
      { onSuccess: () => { setAssignTarget(null); setSelectedMember(''); } }
    );
  };

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white';

  const printParkingReport = () => {
    const occupied = slots.filter(s => s.status === 'OCCUPIED');
    const vacant   = slots.filter(s => s.status === 'VACANT');
    const rows = slots.map(s =>
      '<tr>' +
      '<td>' + s.slotNumber + '</td>' +
      '<td>' + (s.slotType === 'TWO_WHEELER' ? 'Two Wheeler' : s.slotType === 'FOUR_WHEELER' ? 'Four Wheeler' : 'Both') + '</td>' +
      '<td style="color:' + (s.status === 'OCCUPIED' ? '#dc2626' : '#16a34a') + '">' + s.status + '</td>' +
      '<td>' + (s.memberName ?? '-') + '</td>' +
      '<td>' + (s.wingName && s.flatNumber ? s.wingName + ' - ' + s.flatNumber : '-') + '</td>' +
      '<td>' + (s.notes ?? '-') + '</td>' +
      '</tr>'
    ).join('');
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;
    w.document.write('<!DOCTYPE html><html><head><title>Parking Report</title>' +
      '<style>body{font-family:Arial;padding:24px;color:#1e293b}h2{color:#1e40af}' +
      '.summary{display:flex;gap:16px;margin-bottom:16px}' +
      '.badge{padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600}' +
      'table{width:100%;border-collapse:collapse;font-size:12px}' +
      'th{background:#1e40af;color:#fff;padding:8px 10px;text-align:left}' +
      'td{padding:7px 10px;border-bottom:1px solid #e2e8f0}' +
      'tr:nth-child(even){background:#f8fafc}</style></head><body>' +
      '<h2>Parking Slot Report</h2>' +
      '<p style="color:#64748b;font-size:12px">Generated: ' + new Date().toLocaleString('en-IN') + '</p>' +
      '<div class="summary">' +
      '<span class="badge" style="background:#eff6ff;color:#1d4ed8">Total: ' + slots.length + '</span>' +
      '<span class="badge" style="background:#fef2f2;color:#dc2626">Occupied: ' + occupied.length + '</span>' +
      '<span class="badge" style="background:#f0fdf4;color:#16a34a">Vacant: ' + vacant.length + '</span>' +
      '</div>' +
      '<table><thead><tr><th>Slot</th><th>Type</th><th>Status</th><th>Member</th><th>Flat</th><th>Notes</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table>' +
      '<script>window.onload=function(){window.print()}</script></body></html>');
    w.document.close();
  };

  const typeColor = (t: string) =>
    t === 'TWO_WHEELER' ? 'bg-blue-50 text-blue-700' :
    t === 'FOUR_WHEELER' ? 'bg-purple-50 text-purple-700' :
    'bg-slate-100 text-slate-600';

  const typeLabel = (t: string) =>
    t === 'TWO_WHEELER' ? '2W' : t === 'FOUR_WHEELER' ? '4W' : 'Both';

  return (
    <div className="page-enter">
      <PageHeader
        title="Parking"
        subtitle="Manage parking slots and assignments"
        actions={
          <div className="flex gap-2">
            {slots.length > 0 && (
              <button onClick={printParkingReport}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
                <Printer className="w-4 h-4" /> Print Report
              </button>
            )}
            {canManage && (
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.25)' }}>
            <Plus className="w-4 h-4" /> Add Slot
          </button>
            )}
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Slots',    value: summary?.total    ?? 0, color: '#4f7fff' },
          { label: 'Occupied',       value: summary?.occupied ?? 0, color: '#ef4444' },
          { label: 'Vacant',         value: summary?.vacant   ?? 0, color: '#22c55e' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">{c.label}</p>
            <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Slots Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 h-32 skeleton" />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
          <Car className="w-10 h-10 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No parking slots yet. Click "Add Slot" to start.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {slots.map(slot => (
            <div key={slot.id}
              className={`bg-white rounded-xl border-2 p-4 transition-all
                ${slot.status === 'OCCUPIED' ? 'border-red-200' : 'border-green-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                    ${slot.status === 'OCCUPIED' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                    {slot.slotNumber}
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${typeColor(slot.slotType)}`}>
                    {typeLabel(slot.slotType)}
                  </span>
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(slot)}
                      className="p-1 rounded text-slate-400 hover:text-blue-500 hover:bg-blue-50">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(slot)}
                      className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {slot.status === 'OCCUPIED' && slot.memberName ? (
                <div className="mb-2">
                  <p className="text-xs font-medium text-slate-700 truncate">{slot.memberName}</p>
                  {slot.flatNumber && (
                    <p className="text-xs text-slate-400">{slot.wingName} – {slot.flatNumber}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-green-600 font-medium mb-2">Vacant</p>
              )}

              {canManage && (
                slot.status === 'OCCUPIED' ? (
                  <button onClick={() => unassignSlot.mutate(slot.id)}
                    disabled={unassignSlot.isPending}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                    <UserX className="w-3.5 h-3.5" /> Unassign
                  </button>
                ) : (
                  <button onClick={() => { setAssignTarget(slot); setSelectedMember(''); }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                    <UserCheck className="w-3.5 h-3.5" /> Assign
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Slot Modal */}
      {slotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
             onClick={() => setSlotModal(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <p className="font-semibold text-slate-800 mb-5">{editTarget ? 'Edit Slot' : 'Add Parking Slot'}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Slot Number *</label>
                <input type="text" placeholder="e.g. P-1, A-01" className={inputCls}
                  value={form.slotNumber} onChange={e => setForm(f => ({ ...f, slotNumber: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Slot Type</label>
                <select className={inputCls} value={form.slotType}
                  onChange={e => setForm(f => ({ ...f, slotType: e.target.value }))}>
                  <option value="TWO_WHEELER">Two Wheeler</option>
                  <option value="FOUR_WHEELER">Four Wheeler</option>
                  <option value="BOTH">Both</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                <input type="text" placeholder="Optional" className={inputCls}
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setSlotModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleSubmit}
                disabled={createSlot.isPending || updateSlot.isPending || !form.slotNumber.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                {editTarget ? 'Save Changes' : 'Add Slot'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
             onClick={() => setAssignTarget(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <p className="font-semibold text-slate-800 mb-1">Assign Slot {assignTarget.slotNumber}</p>
            <p className="text-xs text-slate-500 mb-5">Select a member to assign this parking slot</p>
            <select className={inputCls} value={selectedMember}
              onChange={e => setSelectedMember(e.target.value)}>
              <option value="">Select member...</option>
              {members.filter(m => m.isActive).map(m => (
                <option key={m.id} value={m.id}>
                  {m.fullName} {m.flat ? `(${m.flat.wingName} – ${m.flat.flatNumber})` : ''}
                </option>
              ))}
            </select>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setAssignTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleAssign}
                disabled={!selectedMember || assignSlot.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget} title="Delete Slot"
        description={`Delete slot "${deleteTarget?.slotNumber}"? This cannot be undone.`}
        confirmLabel="Delete" loading={deleteSlot.isPending}
        onConfirm={() => deleteSlot.mutate(deleteTarget!.id, { onSuccess: () => setDeleteTarget(null) })}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}