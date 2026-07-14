'use client';
// app/(dashboard)/members/page.tsx
import { useState, useMemo } from 'react';
import { Plus, Search, Download, Pencil, Trash2, Users, Printer, LogOut } from 'lucide-react';
import { printMembers, exportMembersCsv } from '@/lib/utils/printUtils';
import PageHeader from '@/components/layout/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import MemberFormModal from '@/components/modules/members/MemberFormModal';
import { useAuthStore } from '@/lib/store/authStore';
import {
  useMembers, useFlats,
  useCreateMember, useUpdateMember, useDeleteMember, useExportMembers, useMoveOutMember,
} from '@/lib/hooks/useProperty';
import type { Member } from '@/types/property.types';

const PAGE_SIZE = 15;

export default function MembersPage() {
  const { hasPermission, user } = useAuthStore();
  const canManage  = hasPermission('manage:members');
  const isSecurity = user?.role === 'SECURITY';

  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Member | null>(null);
  const [deleteTarget,  setDeleteTarget]  = useState<Member | null>(null);
  const [moveOutTarget, setMoveOutTarget] = useState<Member | null>(null);
  const [moveOutDate,   setMoveOutDate]   = useState('');

  const { data: members = [], isLoading } = useMembers(showInactive);
  const { data: flats = [] } = useFlats();
  const createMember = useCreateMember();
  const updateMember  = useUpdateMember();
  const deleteMember  = useDeleteMember();
  const moveOutMember = useMoveOutMember();
  const exportMembers = useExportMembers();

  const filtered = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(m =>
      m.fullName.toLowerCase().includes(q) ||
      (m.mobile ?? '').includes(q) ||
      (m.email ?? '').toLowerCase().includes(q) ||
      (m.flat?.flatNumber ?? '').toLowerCase().includes(q) ||
      (m.flat?.wingName ?? '').toLowerCase().includes(q)
    );
  }, [members, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const handleSearch = (val: string) => { setSearch(val); setCurrentPage(0); };

  const handleSubmit = (values: any) => {
    const payload = {
      fullName:      values.fullName,
      mobile:        values.mobile        || undefined,
      email:         values.email         || undefined,
      aadharNumber:  values.aadharNumber  || undefined,
      memberType:    values.memberType,
      flatId:        Number(values.flatId),
      moveInDate:    values.moveInDate    || undefined,
      vehicleNumber: values.vehicleNumber || undefined,
      parkingSlot:   values.parkingSlot   || undefined,
      openingBalance: values.openingBalance ? Number(values.openingBalance) : undefined,
      shareCapital:   values.shareCapital !== undefined && values.shareCapital !== "" ? Number(values.shareCapital) : undefined,
    };
    if (editTarget) {
      updateMember.mutate(
        { id: editTarget.id, payload },
        { onSuccess: () => { setModal(false); setEditTarget(null); } }
      );
    } else {
      createMember.mutate(payload, { onSuccess: () => setModal(false) });
    }
  };

  const summaryCards = [
    { label: 'Total Members', value: members.length,                                          color: '#4f7fff' },
    { label: 'Owners',        value: members.filter(m => m.memberType === 'OWNER').length,    color: '#8b5cf6' },
    { label: 'Tenants',       value: members.filter(m => m.memberType === 'TENANT').length,   color: '#06b6d4' },
    { label: 'Co-Owners',     value: members.filter(m => m.memberType === 'CO_OWNER').length, color: '#6366f1' },
  ];

  // Table headers — security ला mobile/email/aadhar नको
  const headers = [
    '#', 'Name',
    ...(!isSecurity ? ['Mobile', 'Email', 'Aadhar'] : []),
    'Type', 'Flat', 'Move-In', 'Status',
    ...(canManage ? ['Actions'] : []),
  ];

  return (
    <div className="page-enter">
      <PageHeader
        title="Members"
        subtitle={`${members.length} active society members`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => printMembers(members.map(m => ({
                name:       m.fullName,
                flatNumber: m.flat?.flatNumber ?? '—',
                wingName:   m.flat?.wingName   ?? '—',
                memberType: m.memberType,
                phone:      m.mobile           ?? '—',
                email:      m.email            ?? '',
                aadhar:     m.aadharNumber     ?? '',
                status:     m.isActive ? 'ACTIVE' : 'INACTIVE',
              })))}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
              <Printer className="w-4 h-4" /> Print
            </button>
            {canManage && (
              <button
                onClick={() => exportMembers.mutate()}
                disabled={exportMembers.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            )}
            {canManage && (
              <button onClick={() => { setEditTarget(null); setModal(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.25)' }}>
                <Plus className="w-4 h-4" /> Add Member
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {summaryCards.map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">{c.label}</p>
            <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-3">
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)}
            className="rounded border-slate-300" />
          Show Inactive Members
        </label>
        {showInactive && (
          <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
            Including moved-out members
          </span>
        )}
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, mobile, email, flat…"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
        />
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
          <span className="w-8 h-8 text-slate-300"><Users /></span>
          <p className="mt-3 text-sm text-slate-500">
            {search ? 'No members match your search.' : 'No members yet. Add your first member.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {headers.map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((member, idx) => (
                  <tr key={member.id} className={`transition-colors ${!member.isActive ? "bg-slate-50 opacity-60" : "hover:bg-slate-50"}`}>
                    <td className="px-4 py-3 text-slate-400 text-xs">{currentPage * PAGE_SIZE + idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                             style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
                          {member.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-800 whitespace-nowrap">{member.fullName}</span>
                      </div>
                    </td>
                    {!isSecurity && (
                      <>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">{member.mobile ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-600 max-w-[160px] truncate">{member.email ?? '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{member.aadharNumber ?? '—'}</td>
                      </>
                    )}
                    <td className="px-4 py-3"><StatusBadge value={member.memberType} /></td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {member.flat ? (
                        <span className="text-slate-700">
                          <span className="font-medium">{member.flat.flatNumber}</span>
                          <span className="text-slate-400 text-xs ml-1">({member.flat.wingName})</span>
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {member.moveInDate
                        ? new Date(member.moveInDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={member.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setEditTarget(member); setModal(true); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {member.isActive && (
                            <button
                              onClick={() => { setMoveOutTarget(member); setMoveOutDate(new Date().toISOString().slice(0,10)); }}
                              title="Move Out"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors">
                              <LogOut className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteTarget(member)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors
                      ${currentPage === i ? 'text-white bg-blue-500' : 'text-slate-500 hover:bg-slate-100'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <MemberFormModal
        open={modal}
        editTarget={editTarget}
        flats={flats}
        loading={createMember.isPending || updateMember.isPending}
        onSubmit={handleSubmit}
        onClose={() => { setModal(false); setEditTarget(null); }}
      />
      {moveOutTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
             onClick={() => setMoveOutTarget(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-50">
                <LogOut className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Move Out Member</p>
                <p className="text-xs text-slate-500">{moveOutTarget.fullName} — {moveOutTarget.flat?.wingName} {moveOutTarget.flat?.flatNumber}</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 mb-4">
              <p className="text-xs text-amber-700">Member Inactive होईल. सगळे जुने records (bills, payments) सुरक्षित राहतील. Flat Vacant होईल (दुसरा active member नसेल तर).</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Move-Out Date</label>
              <input type="date" value={moveOutDate} onChange={e => setMoveOutDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setMoveOutTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={() => moveOutMember.mutate(
                  { id: moveOutTarget.id, moveOutDate },
                  { onSuccess: () => setMoveOutTarget(null) }
                )}
                disabled={moveOutMember.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                {moveOutMember.isPending && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                Confirm Move Out
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Member"
        description={`Delete "${deleteTarget?.fullName}"? All related complaints, payments, and votes will also be permanently deleted.`}
        confirmLabel="Delete Member"
        loading={deleteMember.isPending}
        onConfirm={() => deleteMember.mutate(deleteTarget!.id, { onSuccess: () => setDeleteTarget(null) })}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 h-10 border-b border-slate-200" />
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3.5 border-b border-slate-100">
          {[...Array(6)].map((_, j) => (
            <div key={j} className={`skeleton h-4 rounded ${j === 1 ? 'flex-[2]' : 'flex-1'}`} />
          ))}
        </div>
      ))}
    </div>
  );
}