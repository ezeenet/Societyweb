'use client';
// app/(dashboard)/users/page.tsx

import { useState, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Search, Shield, Clock, ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PageHeader from '@/components/layout/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import {
  useSystemUsers, useCreateUser, useUpdateUser,
  useToggleUserActive, useDeleteUser, useActivityLog,
} from '@/lib/hooks/useAdmin';
import { useMembers } from '@/lib/hooks/useProperty';
import { useAuthStore } from '@/lib/store/authStore';
import type { SystemUser } from '@/types/admin.types';

type Tab = 'users' | 'log';

const ROLES = ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'SECURITY', 'MEMBER'] as const;

const createSchema = z.object({
  username:  z.string().min(3).max(50),
  password:  z.string().min(6).max(100),
  role:      z.enum(ROLES),
  fullName:  z.string().max(200).optional().or(z.literal('')),
  memberId:  z.coerce.number().optional().or(z.literal('')),
});
const updateSchema = z.object({
  fullName:  z.string().max(200).optional().or(z.literal('')),
  role:      z.enum(ROLES),
  memberId:  z.coerce.number().optional().or(z.literal('')),
  isActive:  z.boolean().optional(),
});

const fmtDt = (d: string | null) => d
  ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })
  : '—';

const inputCls = (err?: boolean) =>
  `w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white
   focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
   ${err ? 'border-red-400' : 'border-slate-200 hover:border-slate-300'}`;

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [tab,          setTab]          = useState<Tab>('users');
  const [search,       setSearch]       = useState('');
  const [logSearch,    setLogSearch]    = useState('');
  const [logPage,      setLogPage]      = useState(0);
  const [modal,        setModal]        = useState(false);
  const [editTarget,   setEditTarget]   = useState<SystemUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SystemUser | null>(null);

  const { data: users   = [], isLoading } = useSystemUsers();
  const { data: members = [] }            = useMembers();
  const { data: logData, isLoading: logLoading } = useActivityLog(logSearch, logPage);

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const toggleUser = useToggleUserActive();
  const deleteUser = useDeleteUser();

  const { register: regC, handleSubmit: hsC, reset: resetC, formState: { errors: errsC } } =
    useForm({ resolver: zodResolver(createSchema) });
  const { register: regU, handleSubmit: hsU, reset: resetU } =
    useForm({ resolver: zodResolver(updateSchema) });

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      u.username.toLowerCase().includes(q) ||
      (u.fullName ?? '').toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  }, [users, search]);

  const openCreate = () => {
    setEditTarget(null);
    resetC({ username: '', password: '', role: 'MEMBER', fullName: '', memberId: '' });
    setModal(true);
  };

  const openEdit = (u: SystemUser) => {
    setEditTarget(u);
    resetU({ fullName: u.fullName ?? '', role: u.role, memberId: u.memberId ?? '' });
    setModal(true);
  };

  const onCreateSubmit = (v: any) => {
    createUser.mutate(
      { ...v, memberId: v.memberId || undefined },
      { onSuccess: () => setModal(false) }
    );
  };

  const onUpdateSubmit = (v: any) => {
    updateUser.mutate(
      { id: editTarget!.id, payload: { ...v, memberId: v.memberId || undefined } },
      { onSuccess: () => { setModal(false); setEditTarget(null); } }
    );
  };

  return (
    <div className="page-enter">
      <PageHeader
        title="User Management"
        subtitle="System user accounts, roles, and activity audit log"
        actions={tab === 'users' && (
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.25)' }}>
            <Plus className="w-4 h-4" /> Add User
          </button>
        )}
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl w-fit">
        {([['users', Shield, 'Users'], ['log', Clock, 'Activity Log']] as const).map(([t, Icon, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* ── USERS TAB ──────────────────────────────────────────────────────── */}
      {tab === 'users' && (
        <div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by username, name, or role…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          </div>

          {isLoading ? <TableSkeleton /> : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 border-b border-slate-200">
                  {['Username','Full Name','Role','Linked Member','Status','Last Login','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className={`transition-colors ${!u.isActive ? 'opacity-50 bg-slate-50' : 'hover:bg-slate-50'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                               style={{ background: `linear-gradient(135deg,#3b82f6,#1d4ed8)` }}>
                            {(u.fullName ?? u.username).charAt(0).toUpperCase()}
                          </div>
                          <span className="font-mono text-sm text-slate-700">{u.username}</span>
                          {u.username === currentUser?.username && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-md font-medium">You</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{u.fullName ?? '—'}</td>
                      <td className="px-4 py-3"><StatusBadge value={u.role} /></td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{u.memberName ?? '—'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge value={u.isActive ? 'ACTIVE' : 'INACTIVE'} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDt(u.lastLogin)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => toggleUser.mutate(u.id)}
                            disabled={u.username === currentUser?.username}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={u.isActive ? 'Deactivate' : 'Activate'}>
                            {u.isActive
                              ? <ToggleRight className="w-3.5 h-3.5" />
                              : <ToggleLeft  className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => setDeleteTarget(u)}
                            disabled={u.username === currentUser?.username}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <p className="text-center py-10 text-sm text-slate-400">No users found.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── ACTIVITY LOG TAB ───────────────────────────────────────────────── */}
      {tab === 'log' && (
        <div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by username…"
              value={logSearch} onChange={e => { setLogSearch(e.target.value); setLogPage(0); }}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          </div>

          {logLoading ? <TableSkeleton /> : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 border-b border-slate-200">
                  {['Time','User','Module','Action','Details','IP'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {(logData?.content ?? []).map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDt(log.createdAt)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-blue-600">{log.username}</td>
                      <td className="px-4 py-3">
                        {log.module && (
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{log.module}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700 max-w-[160px] truncate">{log.action}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate">{log.details ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{log.ipAddress ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {logData && logData.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                  <p className="text-xs text-slate-400">
                    {logData.totalElements} entries · Page {logData.page + 1} of {logData.totalPages}
                  </p>
                  <div className="flex gap-1">
                    <button onClick={() => setLogPage(p => Math.max(0, p - 1))}
                      disabled={logData.page === 0}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => setLogPage(p => p + 1)}
                      disabled={logData.page >= logData.totalPages - 1}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── User Form Modal ───────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
             onClick={() => setModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
               onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-semibold text-slate-800">
                {editTarget ? 'Edit User' : 'Create User'}
              </h3>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {editTarget ? (
              <form onSubmit={hsU(onUpdateSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <input type="text" className={inputCls()} {...regU('fullName')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                  <select className={inputCls()} {...regU('role')}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Linked Member</label>
                  <select className={inputCls()} {...regU('memberId')}>
                    <option value="">None</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} {m.flat ? `(${m.flat.flatNumber})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <ModalFooter onCancel={() => setModal(false)} loading={updateUser.isPending} label="Save Changes" />
              </form>
            ) : (
              <form onSubmit={hsC(onCreateSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Username *</label>
                    <input type="text" autoFocus className={inputCls(!!errsC.username)} {...regC('username')} />
                    {errsC.username && <p className="mt-1 text-xs text-red-500">{errsC.username.message as string}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Password *</label>
                    <input type="password" className={inputCls(!!errsC.password)} {...regC('password')} />
                    {errsC.password && <p className="mt-1 text-xs text-red-500">{errsC.password.message as string}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <input type="text" className={inputCls()} {...regC('fullName')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Role *</label>
                    <select className={inputCls()} {...regC('role')}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Link to Member</label>
                    <select className={inputCls()} {...regC('memberId')}>
                      <option value="">None</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.fullName} {m.flat ? `(${m.flat.flatNumber})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <ModalFooter onCancel={() => setModal(false)} loading={createUser.isPending} label="Create User" />
              </form>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget} title="Delete User"
        description={`Delete user "${deleteTarget?.username}"? This cannot be undone.`}
        confirmLabel="Delete User" loading={deleteUser.isPending}
        onConfirm={() => deleteUser.mutate(deleteTarget!.id, { onSuccess: () => setDeleteTarget(null) })}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3.5 border-b border-slate-100">
          {[...Array(6)].map((_, j) => <div key={j} className="skeleton h-4 rounded flex-1" />)}
        </div>
      ))}
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
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}{label}
      </button>
    </div>
  );
}
