'use client';
// app/(dashboard)/staff/page.tsx

import { useState, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, Search, Users, Wallet,
  ChevronDown, ChevronUp, Printer, CheckCircle2, Clock,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import StatusBadge from '@/components/common/StatusBadge';
import { useAuthStore } from '@/lib/store/authStore';
import {
  useStaff, useStaffSummary, useStaffSalaryHistory,
  useStaffMonthlySummary, useCreateStaff, useUpdateStaff,
  useDeleteStaff, useGenerateSalary, useGenerateBulkSalary, useMarkSalaryPaid,
} from '@/lib/hooks/useStaff';
import type { StaffMember } from '@/lib/api/staff.api';

type Tab = 'staff' | 'salary';

const INR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtMonth = (m: string) => {
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
};

const curMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const DESIGNATIONS = [
  'Watchman', 'Security Guard', 'Cleaner', 'Sweeper',
  'Electrician', 'Plumber', 'Gardener', 'Lift Operator', 'Other',
];

export default function StaffPage() {
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission('manage:members');

  const [tab,          setTab]          = useState<Tab>('staff');
  const [search,       setSearch]       = useState('');
  const [expandedStaff, setExpandedStaff] = useState<number | null>(null);
  const [staffModal,   setStaffModal]   = useState(false);
  const [editTarget,   setEditTarget]   = useState<StaffMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);
  const [salaryModal,  setSalaryModal]  = useState<StaffMember | null>(null);
  const [bulkMonth,    setBulkMonth]    = useState(curMonth());
  const [selMonth,     setSelMonth]     = useState(curMonth());

  const { data: staffList = [], isLoading } = useStaff();
  const { data: summary }                   = useStaffSummary();
  const { data: monthData }                 = useStaffMonthlySummary(selMonth);

  const createStaff      = useCreateStaff();
  const updateStaff      = useUpdateStaff();
  const deleteStaff      = useDeleteStaff();
  const generateSalary   = useGenerateSalary();
  const generateBulk     = useGenerateBulkSalary();
  const markPaid         = useMarkSalaryPaid();

  const [form, setForm] = useState({
    fullName: '', mobile: '', address: '', designation: DESIGNATIONS[0],
    salary: '', joinDate: '', status: 'ACTIVE', notes: '',
  });

  const [salForm, setSalForm] = useState({
    salaryMonth: curMonth(), amount: '', paidDate: '', status: 'PENDING', notes: '',
  });

  const openCreate = () => {
    setEditTarget(null);
    setForm({ fullName: '', mobile: '', address: '', designation: DESIGNATIONS[0], salary: '', joinDate: '', status: 'ACTIVE', notes: '' });
    setStaffModal(true);
  };

  const openEdit = (s: StaffMember) => {
    setEditTarget(s);
    setForm({
      fullName: s.fullName, mobile: s.mobile ?? '', address: s.address ?? '',
      designation: s.designation, salary: String(s.salary),
      joinDate: s.joinDate ?? '', status: s.status, notes: s.notes ?? '',
    });
    setStaffModal(true);
  };

  const handleStaffSubmit = () => {
    if (!form.fullName.trim() || !form.designation) return;
    const req = { ...form, salary: Number(form.salary) || 0 };
    if (editTarget) {
      updateStaff.mutate({ id: editTarget.id, req }, { onSuccess: () => setStaffModal(false) });
    } else {
      createStaff.mutate(req, { onSuccess: () => setStaffModal(false) });
    }
  };

  const openSalaryModal = (s: StaffMember) => {
    setSalaryModal(s);
    setSalForm({ salaryMonth: curMonth(), amount: String(s.salary), paidDate: '', status: 'PENDING', notes: '' });
  };

  const handleSalarySubmit = () => {
    if (!salaryModal) return;
    generateSalary.mutate(
      { staffId: salaryModal.id, req: { ...salForm, amount: Number(salForm.amount) || undefined } },
      { onSuccess: () => setSalaryModal(null) }
    );
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return staffList;
    const q = search.toLowerCase();
    return staffList.filter(s =>
      s.fullName.toLowerCase().includes(q) ||
      s.designation.toLowerCase().includes(q) ||
      (s.mobile ?? '').includes(q)
    );
  }, [staffList, search]);

  const printStaffReport = () => {
    const rows = staffList.map(s =>
      '<tr><td>' + s.fullName + '</td><td>' + s.designation + '</td><td>' +
      (s.mobile ?? '-') + '</td><td>' + INR(s.salary) + '/mo</td><td>' +
      (s.joinDate ? fmtDate(s.joinDate) : '-') + '</td><td style="color:' +
      (s.status === 'ACTIVE' ? '#16a34a' : '#dc2626') + '">' + s.status + '</td></tr>'
    ).join('');
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;
    w.document.write('<!DOCTYPE html><html><head><title>Staff Report</title>' +
      '<style>body{font-family:Arial;padding:24px}h2{color:#1e40af}' +
      'table{width:100%;border-collapse:collapse;font-size:12px}' +
      'th{background:#1e40af;color:#fff;padding:8px 10px;text-align:left}' +
      'td{padding:7px 10px;border-bottom:1px solid #e2e8f0}' +
      'tr:nth-child(even){background:#f8fafc}</style></head><body>' +
      '<h2>Staff Report</h2>' +
      '<p style="color:#64748b;font-size:12px">Generated: ' + new Date().toLocaleString('en-IN') + '</p>' +
      '<table><thead><tr><th>Name</th><th>Designation</th><th>Mobile</th><th>Monthly Salary</th><th>Join Date</th><th>Status</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table>' +
      '<script>window.onload=function(){window.print()}</script></body></html>');
    w.document.close();
  };

  const printSalaryReport = () => {
    if (!monthData?.records) return;
    const rows = monthData.records.map((r: any) =>
      '<tr><td>' + r.staffName + '</td><td>' + r.designation + '</td><td>' + INR(r.amount) +
      '</td><td style="color:' + (r.status === 'PAID' ? '#16a34a' : '#dc2626') + '">' + r.status +
      '</td><td>' + (r.paidDate ? fmtDate(r.paidDate) : '-') + '</td></tr>'
    ).join('');
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;
    w.document.write('<!DOCTYPE html><html><head><title>Salary Report</title>' +
      '<style>body{font-family:Arial;padding:24px}h2{color:#1e40af}' +
      '.summary{display:flex;gap:16px;margin-bottom:16px}' +
      '.badge{padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600}' +
      'table{width:100%;border-collapse:collapse;font-size:12px}' +
      'th{background:#1e40af;color:#fff;padding:8px 10px;text-align:left}' +
      'td{padding:7px 10px;border-bottom:1px solid #e2e8f0}' +
      'tr:nth-child(even){background:#f8fafc}</style></head><body>' +
      '<h2>Salary Report — ' + fmtMonth(selMonth) + '</h2>' +
      '<p style="color:#64748b;font-size:12px">Generated: ' + new Date().toLocaleString('en-IN') + '</p>' +
      '<div class="summary">' +
      '<span class="badge" style="background:#f0fdf4;color:#16a34a">Paid: ' + INR(monthData.totalPaid) + '</span>' +
      '<span class="badge" style="background:#fef2f2;color:#dc2626">Pending: ' + INR(monthData.totalPending) + '</span>' +
      '</div>' +
      '<table><thead><tr><th>Name</th><th>Designation</th><th>Amount</th><th>Status</th><th>Paid Date</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table>' +
      '<script>window.onload=function(){window.print()}</script></body></html>');
    w.document.close();
  };

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white';

  return (
    <div className="page-enter">
      <PageHeader title="Staff" subtitle="Manage staff members and salary"
        actions={
          <div className="flex gap-2">
            {tab === 'staff' && staffList.length > 0 && (
              <button onClick={printStaffReport}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                <Printer className="w-4 h-4" /> Print
              </button>
            )}
            {tab === 'salary' && monthData?.records?.length > 0 && (
              <button onClick={printSalaryReport}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                <Printer className="w-4 h-4" /> Print
              </button>
            )}
            {canManage && tab === 'staff' && (
              <button onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.25)' }}>
                <Plus className="w-4 h-4" /> Add Staff
              </button>
            )}
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Total Staff',   value: summary?.total    ?? 0, color: '#4f7fff' },
          { label: 'Active',        value: summary?.active   ?? 0, color: '#22c55e' },
          { label: 'Inactive',      value: summary?.inactive ?? 0, color: '#94a3b8' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">{c.label}</p>
            <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl w-fit">
        {([['staff', 'Staff List', Users], ['salary', 'Salary', Wallet]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id as Tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* ── STAFF LIST TAB ── */}
      {tab === 'staff' && (
        <div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by name, designation, mobile..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          </div>

          {isLoading ? <Skel /> : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-20 bg-white rounded-xl border border-slate-200">
              <Users className="w-8 h-8 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">No staff found. Click "Add Staff" to start.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 border-b border-slate-200">
                  {['Name','Designation','Mobile','Monthly Salary','Join Date','Status','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(s => (
                    <>
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                 style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                              {s.fullName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-slate-800">{s.fullName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{s.designation}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.mobile ?? '—'}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{INR(s.salary)}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {s.joinDate ? fmtDate(s.joinDate) : '—'}
                        </td>
                        <td className="px-4 py-3"><StatusBadge value={s.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => setExpandedStaff(expandedStaff === s.id ? null : s.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-purple-500 hover:bg-purple-50 transition-colors"
                              title="Salary History">
                              {expandedStaff === s.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                            {canManage && (
                              <>
                                <button onClick={() => openSalaryModal(s)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-green-500 hover:bg-green-50 transition-colors"
                                  title="Generate Salary">
                                  <Wallet className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => openEdit(s)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setDeleteTarget(s)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedStaff === s.id && (
                        <SalaryHistoryRow staffId={s.id} markPaid={markPaid} canManage={canManage} />
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── SALARY TAB ── */}
      {tab === 'salary' && (
        <div>
          <div className="flex items-center gap-4 mb-5 bg-white border border-slate-200 rounded-xl px-4 py-3">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Salary Month:</span>
            <input type="month" value={selMonth} onChange={e => setSelMonth(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30" />
            {canManage && (
              <button onClick={() => generateBulk.mutate(selMonth)}
                disabled={generateBulk.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                Generate All
              </button>
            )}
          </div>

          {monthData && (
            <>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-500 mb-1">Total Staff</p>
                  <p className="text-2xl font-bold text-slate-800">{monthData.totalStaff}</p>
                </div>
                <div className="bg-green-50 rounded-xl border border-green-100 p-4">
                  <p className="text-xs text-green-600 mb-1">Total Paid</p>
                  <p className="text-2xl font-bold text-green-700">{INR(monthData.totalPaid)}</p>
                </div>
                <div className="bg-red-50 rounded-xl border border-red-100 p-4">
                  <p className="text-xs text-red-500 mb-1">Pending</p>
                  <p className="text-2xl font-bold text-red-600">{INR(monthData.totalPending)}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50 border-b border-slate-200">
                    {['Name','Designation','Amount','Status','Paid Date','Action'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthData.records.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">{r.staffName}</td>
                        <td className="px-4 py-3 text-slate-600">{r.designation}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{INR(r.amount)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-md font-medium
                            ${r.status === 'PAID' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {r.paidDate ? fmtDate(r.paidDate) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {canManage && r.status === 'PENDING' && (
                            <button onClick={() => markPaid.mutate(r.id)}
                              disabled={markPaid.isPending}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {monthData.records.length === 0 && (
                  <div className="flex flex-col items-center py-12">
                    <Clock className="w-8 h-8 text-slate-300" />
                    <p className="mt-3 text-sm text-slate-500">No salary records for {fmtMonth(selMonth)}. Click "Generate All" to create.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Add/Edit Staff Modal */}
      {staffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
             onClick={() => setStaffModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
               onClick={e => e.stopPropagation()}>
            <p className="font-semibold text-slate-800 mb-5">{editTarget ? 'Edit Staff' : 'Add Staff Member'}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
                <input type="text" className={inputCls} value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Designation *</label>
                  <select className={inputCls} value={form.designation}
                    onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}>
                    {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Monthly Salary (₹)</label>
                  <input type="number" min="0" className={inputCls} value={form.salary}
                    onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Mobile</label>
                  <input type="tel" className={inputCls} value={form.mobile}
                    onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Join Date</label>
                  <input type="date" className={inputCls} value={form.joinDate}
                    onChange={e => setForm(f => ({ ...f, joinDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
                <textarea rows={2} className={`${inputCls} resize-none`} value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                  <select className={inputCls} value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                  <input type="text" className={inputCls} value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStaffModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleStaffSubmit}
                disabled={!form.fullName.trim() || createStaff.isPending || updateStaff.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                {editTarget ? 'Save Changes' : 'Add Staff'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Salary Modal */}
      {salaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
             onClick={() => setSalaryModal(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
               onClick={e => e.stopPropagation()}>
            <p className="font-semibold text-slate-800 mb-1">Generate Salary</p>
            <p className="text-xs text-slate-500 mb-5">{salaryModal.fullName} — {salaryModal.designation}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Month</label>
                <input type="month" className={inputCls} value={salForm.salaryMonth}
                  onChange={e => setSalForm(f => ({ ...f, salaryMonth: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (₹)</label>
                <input type="number" min="0" className={inputCls} value={salForm.amount}
                  onChange={e => setSalForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                  <select className={inputCls} value={salForm.status}
                    onChange={e => setSalForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Paid Date</label>
                  <input type="date" className={inputCls} value={salForm.paidDate}
                    onChange={e => setSalForm(f => ({ ...f, paidDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                <input type="text" className={inputCls} value={salForm.notes}
                  onChange={e => setSalForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setSalaryModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleSalarySubmit}
                disabled={generateSalary.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget} title="Delete Staff"
        description={`Delete "${deleteTarget?.fullName}"? All salary records will also be deleted.`}
        confirmLabel="Delete" loading={deleteStaff.isPending}
        onConfirm={() => deleteStaff.mutate(deleteTarget!.id, { onSuccess: () => setDeleteTarget(null) })}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function SalaryHistoryRow({ staffId, markPaid, canManage }: {
  staffId: number;
  markPaid: any;
  canManage: boolean;
}) {
  const { data: history = [], isLoading } = useStaffSalaryHistory(staffId);

  return (
    <tr className="bg-slate-50">
      <td colSpan={7} className="px-4 py-3">
        {isLoading ? (
          <p className="text-xs text-slate-400">Loading...</p>
        ) : history.length === 0 ? (
          <p className="text-xs text-slate-400">No salary records yet.</p>
        ) : (
          <div className="space-y-1.5">
            {history.map(r => (
              <div key={r.id} className="flex items-center justify-between text-xs px-3 py-2 bg-white rounded-lg border border-slate-200">
                <span className="font-medium text-slate-600">{fmtMonth(r.salaryMonth)}</span>
                <span className="text-slate-800 font-semibold">{INR(r.amount)}</span>
                <span className={`px-2 py-0.5 rounded font-medium ${r.status === 'PAID' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                  {r.status}
                </span>
                <span className="text-slate-400">{r.paidDate ? fmtDate(r.paidDate) : '—'}</span>
                {canManage && r.status === 'PENDING' && (
                  <button onClick={() => markPaid.mutate(r.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs text-green-700 bg-green-50 hover:bg-green-100">
                    <CheckCircle2 className="w-3 h-3" /> Pay
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </td>
    </tr>
  );
}

function Skel() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 h-10 border-b border-slate-200" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3.5 border-b border-slate-100">
          {[...Array(7)].map((_, j) => <div key={j} className="skeleton h-4 rounded flex-1" />)}
        </div>
      ))}
    </div>
  );
}