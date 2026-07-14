'use client';
// app/(dashboard)/maintenance/page.tsx

import { useState, useMemo } from 'react';
import {
  Zap, CreditCard, Clock, CheckCircle2, XCircle,
  Printer, Search, Receipt, Download, Pencil, Trash2, Archive,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import PaymentModal from '@/components/modules/maintenance/PaymentModal';
import GenerateBillsModal from '@/components/modules/maintenance/GenerateBillsModal';
import { useAuthStore } from '@/lib/store/authStore';
import {
  useBills, useMyBills, useMyPayments, usePayments, usePendingPayments,
  useGenerateBills, useRecordPayment, useApprovePayment, useRejectPayment,
  useDeleteBill, useUpdateBill, useMarkAsUnpaid, useYearClose,
} from '@/lib/hooks/useBilling';
import { useSettings } from '@/lib/hooks/useAdmin';
import {
  printReceipt, printMaintenanceBill, setSocietyName,
  printBills, exportBillsPdf, exportBillsCsv,
  printPayments, exportPaymentsPdf, exportPaymentsCsv,
  type BillPrintData, type PaymentPrintData,
} from '@/lib/utils/printUtils';
import type { Bill, Payment } from '@/types/billing.types';

type AdminTab  = 'all-bills' | 'pending-approvals' | 'all-payments';
type MemberTab = 'my-bills'  | 'my-payments';

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const formatMonth = (m: string) => {
  if (!m) return '-';
  if (m === 'OPENING-BAL') return 'Opening Balance';
  if (m === 'CARRIED_FORWARD' || m.startsWith('CF-')) return 'Carried Forward';
  const parts = m.split('-');
  if (parts.length < 2) return m;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1);
  if (isNaN(d.getTime())) return m;
  return d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
};

// ── Map raw Bill → BillPrintData (field name fix) ──────────────────────────
function mapBillForPrint(b: Bill): BillPrintData {
  return {
    flatNumber:    b.flatNumber,
    wingName:      b.wingName,
    memberName:    (b as any).memberName ?? '-',
    month:         formatMonth(b.billMonth),
    amount:        b.amount,
    billStatus:    b.status,
    paidDate:      (b as any).paidDate ?? undefined,
    receiptNumber: (b as any).receiptNumber ?? undefined,
  };
}

// ── Map raw Payment → PaymentPrintData (field name fix) ────────────────────
function mapPaymentForPrint(p: Payment): PaymentPrintData {
  return {
    receiptNumber:  p.receiptNumber,
    memberName:     p.memberName,
    flatNumber:     p.flatNumber,
    wingName:       p.wingName,
    billMonth:      formatMonth(p.billMonth),
    amount:         p.amountPaid,
    amountPaid:     p.amountPaid,
    paymentMode:    p.paymentMode,
    approvalStatus: p.approvalStatus,
    paymentDate:    p.paymentDate,
    referenceNo:    (p as any).referenceNo ?? undefined,
  };
}

export default function MaintenancePage() {
  const { user, hasPermission } = useAuthStore();
  const isMember    = user?.role === 'MEMBER';
  const canGenerate = hasPermission('manage:maintenance');
  const canApprove  = user?.role === 'ADMIN';

  return isMember
    ? <MemberView memberId={(user as any)?.memberId!} />
    : <AdminView canGenerate={canGenerate} canApprove={canApprove} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function AdminView({ canGenerate, canApprove }: { canGenerate: boolean; canApprove: boolean }) {
  const [tab,           setTab]           = useState<AdminTab>('all-bills');
  const [billSearch,    setBillSearch]    = useState('');
  const [generateModal, setGenerateModal] = useState(false);
  const [payModal,      setPayModal]      = useState(false);
  const [selectedBill,  setSelectedBill]  = useState<Bill | null>(null);
  const [rejectTarget,  setRejectTarget]  = useState<Payment | null>(null);
  const [rejectReason,  setRejectReason]  = useState('');
  const [editTarget,    setEditTarget]    = useState<any>(null);
  const [deleteTarget,  setDeleteTarget]  = useState<any>(null);
  const [approveTarget, setApproveTarget] = useState<Payment | null>(null);

  const { data: settings } = useSettings();
  const { data: allBills    = [], isLoading: billsLoading  } = useBills();
  const { data: pendingPays = [], isLoading: pendingLoading } = usePendingPayments();
  const { data: allPayments = [], isLoading: paysLoading   } = usePayments();

  const generateBills  = useGenerateBills();
  const yearClose      = useYearClose();
  const [yearCloseModal, setYearCloseModal] = useState(false);
  const [newYearMonth,   setNewYearMonth]   = useState(() => {
    const now = new Date();
    const yr  = now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear();
    return `${yr}-04`;
  });
  const deleteBill     = useDeleteBill();
  const markAsUnpaid   = useMarkAsUnpaid();
  const [unpaidTarget, setUnpaidTarget] = useState<any>(null);
  const updateBill     = useUpdateBill();
  const recordPayment  = useRecordPayment();
  const approvePayment = useApprovePayment();
  const rejectPayment  = useRejectPayment();

  const totalBills      = allBills.length;
  const pendingBillsCnt = allBills.filter(b => b.status === 'PENDING').length;
  const paidBillsCnt    = allBills.filter(b => b.status === 'PAID').length;
  const totalCollected  = allPayments
    .filter(p => p.approvalStatus === 'APPROVED')
    .reduce((s, p) => s + p.amountPaid, 0);

  const filteredBills = useMemo(() => {
    if (!billSearch.trim()) return allBills;
    const q = billSearch.toLowerCase();
    return allBills.filter(b =>
      b.flatNumber.toLowerCase().includes(q) ||
      b.wingName.toLowerCase().includes(q) ||
      b.billMonth.includes(q)
    );
  }, [allBills, billSearch]);

  const toBillPrint = (bills: typeof allBills) => bills.map(b => ({
    flatNumber:    b.flatNumber,
    wingName:      b.wingName,
    memberName:    (b as any).memberName ?? '-',
    month:         b.billMonth
      ? new Date(b.billMonth + '-01').toLocaleString('en-IN', { month: 'long', year: 'numeric' })
      : '-',
    amount:        b.amount,
    billStatus:    b.status,
    paidDate:      (b as any).paidDate ?? undefined,
    receiptNumber: (b as any).receiptNumber ?? undefined,
  }));

  const toPaymentPrint = (pays: typeof allPayments) => pays.map(p => ({
    receiptNumber:  p.receiptNumber,
    memberName:     p.memberName,
    flatNumber:     p.flatNumber,
    wingName:       p.wingName,
    billMonth:      p.billMonth,
    amountPaid:     p.amountPaid,
    amount:         p.amountPaid,
    paymentMode:    p.paymentMode,
    approvalStatus: p.approvalStatus,
    paymentDate:    p.paymentDate,
  }));

  return (
    <div className="page-enter">
      <PageHeader
        title="Maintenance"
        subtitle="Billing generation, collections, and payment approvals"
        actions={canGenerate && (
          <div className="flex gap-2">
            <button onClick={() => setYearCloseModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors">
              <Archive className="w-4 h-4" /> Year Close
            </button>
            <button onClick={() => setGenerateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 4px 12px rgba(245,158,11,0.25)' }}>
              <Zap className="w-4 h-4" /> Generate Bills
            </button>
          </div>
        )}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Bills"     value={totalBills}                color="#4f7fff" icon={<Receipt className="w-5 h-5" />} />
        <KpiCard label="Pending"         value={pendingBillsCnt}           color="#f59e0b" icon={<Clock className="w-5 h-5" />} />
        <KpiCard label="Paid"            value={paidBillsCnt}              color="#22c55e" icon={<CheckCircle2 className="w-5 h-5" />} />
        <KpiCard label="Total Collected" value={formatINR(totalCollected)} color="#8b5cf6" icon={<CreditCard className="w-5 h-5" />} isAmount />
      </div>

      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl w-fit">
        {([
          ['all-bills',         'All Bills',         allBills.length],
          ['pending-approvals', 'Pending Approvals', pendingPays.length],
          ['all-payments',      'All Payments',      allPayments.length],
        ] as const).map(([t, label, count]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
            {count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold
                ${t === 'pending-approvals' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── ALL BILLS TAB ── */}
      {tab === 'all-bills' && (
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search by flat, wing, or month…"
                value={billSearch} onChange={e => setBillSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
            <button
              onClick={() => printBills(filteredBills.map(mapBillForPrint))}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={() => exportBillsPdf(filteredBills.map(mapBillForPrint))}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
              <Download className="w-4 h-4" /> PDF
            </button>
            <button
              onClick={() => exportBillsCsv(filteredBills.map(mapBillForPrint))}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
              <Download className="w-4 h-4" /> CSV
            </button>
          </div>

          {billsLoading ? <TableSkeleton rows={8} cols={8} /> : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Wing','Flat','Member','Month','Amount','Late Fine','Total Due','Status','Action'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBills.map(bill => (
                    <tr key={bill.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-600">{bill.wingName}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{bill.flatNumber}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{(bill as any).memberName ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatMonth(bill.billMonth)}</td>
                      <td className="px-4 py-3 text-slate-700">{formatINR(bill.amount)}</td>
                      <td className="px-4 py-3">
                        {bill.lateFine > 0
                          ? <span className="text-red-500 font-medium">{formatINR(bill.lateFine)}</span>
                          : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{formatINR(bill.totalDue)}</td>
                      <td className="px-4 py-3"><StatusBadge value={bill.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              if (settings?.societyName) setSocietyName(settings.societyName);
                              const prevDue = allBills
                                .filter(b =>
                                  b.flatId === bill.flatId &&
                                  b.id !== bill.id &&
                                  b.status === 'PENDING' &&
                                  b.billMonth < bill.billMonth  // फक्त आधीचे pending bills
                                )
                                .reduce((s, b) => s + Number(b.totalDue ?? b.amount), 0);
                              printMaintenanceBill({
                                billNo:        `BILL-${bill.id}`,
                                memberName:    (bill as any).memberName ?? '-',
                                flatNumber:    bill.flatNumber,
                                wingName:      bill.wingName,
                                billMonth:     bill.billMonth
                                  ? new Date(bill.billMonth + '-01').toLocaleString('en-IN', { month: 'long', year: 'numeric' })
                                  : bill.billMonth,
                                amount:        Number(bill.amount),
                                lateFine:      Number(bill.lateFine ?? 0),
                                totalDue:      Number(bill.totalDue ?? bill.amount),
                                previousDue:   prevDue,
                                dueDate:       bill.dueDate
                                  ? new Date(bill.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                  : undefined,
                                generatedDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                              societyAddress: settings?.address ?? undefined,
                              });
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                            <Printer className="w-3 h-3" /> Bill
                          </button>
                          {bill.status === 'PENDING' && canGenerate && (
                            <button onClick={() => { setSelectedBill(bill); setPayModal(true); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                              <CreditCard className="w-3.5 h-3.5" /> Pay
                            </button>
                          )}
                          {canApprove && (
                            <>
                              <button onClick={() => setEditTarget(bill)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              {bill.status === 'PAID' && (
                                <button onClick={() => setUnpaidTarget(bill)}
                                  title="Mark as Unpaid"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors">
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button onClick={() => setDeleteTarget(bill)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredBills.length === 0 && <EmptyState message="No bills found." />}
              <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
                {filteredBills.length} bill(s)
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PENDING APPROVALS TAB ── */}
      {tab === 'pending-approvals' && (
        <div>
          {pendingLoading ? <TableSkeleton rows={5} cols={8} /> :
           pendingPays.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
              <CheckCircle2 className="w-10 h-10 text-green-300" />
              <p className="mt-3 text-sm font-medium text-slate-600">All caught up!</p>
              <p className="text-xs text-slate-400 mt-1">No payments pending approval.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-amber-50 border-b border-amber-100">
                    {['Member','Flat','Month','Amount','Mode','Receipt No.','Date','Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-amber-700 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingPays.map(pay => (
                    <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                               style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
                            {pay.memberName.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-800 whitespace-nowrap">{(pay as any).flatOwnerName ?? pay.memberName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{pay.wingName} – {pay.flatNumber}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatMonth(pay.billMonth)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{formatINR(pay.amountPaid)}</td>
                      <td className="px-4 py-3"><StatusBadge value={pay.paymentMode} /></td>
                      <td className="px-4 py-3 font-mono text-xs text-blue-600">{pay.receiptNumber}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(pay.paymentDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        {canApprove && (
                          <div className="flex gap-2">
                            <button onClick={() => setApproveTarget(pay)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button onClick={() => { setRejectTarget(pay); setRejectReason(''); }}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ALL PAYMENTS TAB ── */}
      {tab === 'all-payments' && (
        <div>
          <div className="flex items-center justify-end gap-2 mb-4">
            <button
              onClick={() => printPayments(allPayments.map(mapPaymentForPrint))}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
              <Printer className="w-4 h-4" /> Print All
            </button>
            <button
              onClick={() => exportPaymentsPdf(allPayments.map(mapPaymentForPrint))}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
              <Download className="w-4 h-4" /> PDF
            </button>
            <button
              onClick={() => exportPaymentsCsv(allPayments.map(mapPaymentForPrint))}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
              <Download className="w-4 h-4" /> CSV
            </button>
          </div>

          {paysLoading ? <TableSkeleton rows={8} cols={8} /> : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Receipt No.','Member','Flat','Month','Amount','Mode','Status','Print'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allPayments.map(pay => (
                    <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-blue-600 font-medium">{pay.receiptNumber}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap">{(pay as any).flatOwnerName ?? pay.memberName}</td>
                      <td className="px-4 py-3 text-slate-600">{pay.wingName} – {pay.flatNumber}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatMonth(pay.billMonth)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{formatINR(pay.amountPaid)}</td>
                      <td className="px-4 py-3 text-slate-600">{pay.paymentMode}</td>
                      <td className="px-4 py-3"><StatusBadge value={pay.approvalStatus} /></td>
                      <td className="px-4 py-3">
                        {pay.approvalStatus === 'APPROVED' && (
                          <button
                            onClick={() => printReceipt({
                              receiptNumber:   pay.receiptNumber,
                              memberName:      pay.memberName,
                              flatNumber:      pay.flatNumber,
                              wingName:        pay.wingName,
                              month:           formatMonth(pay.billMonth),
                              amount:          pay.amountPaid,
                              paymentMode:     pay.paymentMode,
                              paidDate:        pay.paymentDate,
                              referenceNumber: (pay as any).referenceNo ?? undefined,
                            })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allPayments.length === 0 && <EmptyState message="No payments recorded yet." />}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!unpaidTarget} title="Mark Bill as Unpaid"
        description={`Reverse payment for ${unpaidTarget?.wingName} - ${unpaidTarget?.flatNumber} (${unpaidTarget?.billMonth})? The payment and account entry will be deleted, and bill will return to PENDING.`}
        confirmLabel="Mark as Unpaid" variant="warning" loading={markAsUnpaid.isPending}
        onConfirm={() => markAsUnpaid.mutate(unpaidTarget!.id, { onSuccess: () => setUnpaidTarget(null) })}
        onCancel={() => setUnpaidTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget} title="Delete Bill"
        description={`Delete bill for ${deleteTarget?.wingName} - ${deleteTarget?.flatNumber} (${deleteTarget?.billMonth})? This will also delete all associated payments and account entries.`}
        confirmLabel="Delete" loading={deleteBill.isPending}
        onConfirm={() => deleteBill.mutate(deleteTarget!.id, { onSuccess: () => setDeleteTarget(null) })}
        onCancel={() => setDeleteTarget(null)}
      />

      {editTarget && (
        <EditBillModal
          bill={editTarget}
          loading={updateBill.isPending}
          onSubmit={v => updateBill.mutate(
            { id: editTarget.id, payload: v },
            { onSuccess: () => setEditTarget(null) }
          )}
          onClose={() => setEditTarget(null)}
        />
      )}

      {yearCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
             onClick={() => setYearCloseModal(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-50">
                <Archive className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Year Close</p>
                <p className="text-xs text-slate-500">Carry forward pending bills to new year</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 mb-4">
              <p className="text-xs text-amber-700">सगळे PENDING bills CARRIED_FORWARD होतील आणि नवीन arrears bill तयार होईल. हे action reversible नाही.</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">New Year Arrears Month</label>
              <input type="month" value={newYearMonth} onChange={e => setNewYearMonth(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400" />
              <p className="text-xs text-slate-400 mt-1">बहुतेक नवीन FY चा April (उदा. 2027-04)</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setYearCloseModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={() => yearClose.mutate(newYearMonth, { onSuccess: () => setYearCloseModal(false) })}
                disabled={yearClose.isPending || !newYearMonth}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                {yearClose.isPending && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                Confirm Year Close
              </button>
            </div>
          </div>
        </div>
      )}

      <GenerateBillsModal
        open={generateModal} loading={generateBills.isPending}
        defaultAmount={settings?.defaultMaintenanceAmount}
        onSubmit={v => generateBills.mutate(
          { billMonth: v.billMonth, amount: Number(v.amount), dueDate: v.dueDate },
          { onSuccess: () => setGenerateModal(false) }
        )}
        onClose={() => setGenerateModal(false)}
      />

      <PaymentModal
        open={payModal} bill={selectedBill} memberId={1}
        loading={recordPayment.isPending}
        onSubmit={v => recordPayment.mutate(v as any, { onSuccess: () => { setPayModal(false); setSelectedBill(null); } })}
        onClose={() => { setPayModal(false); setSelectedBill(null); }}
      />

      <ConfirmDialog
        open={!!approveTarget} title="Approve Payment"
        description={`Approve ₹${approveTarget?.amountPaid.toLocaleString('en-IN')} from ${approveTarget?.memberName}? Bill will be marked PAID.`}
        confirmLabel="Approve" variant="warning" loading={approvePayment.isPending}
        onConfirm={() => approvePayment.mutate(approveTarget!.id, { onSuccess: () => setApproveTarget(null) })}
        onCancel={() => setApproveTarget(null)}
      />

      {rejectTarget && (
        <RejectModal
          payment={rejectTarget} reason={rejectReason}
          onReasonChange={setRejectReason} loading={rejectPayment.isPending}
          onConfirm={() => rejectPayment.mutate(
            { id: rejectTarget.id, reason: rejectReason },
            { onSuccess: () => { setRejectTarget(null); setRejectReason(''); } }
          )}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEMBER VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function MemberView({ memberId }: { memberId: number }) {
  const [tab,          setTab]          = useState<MemberTab>('my-bills');
  const [payModal,     setPayModal]     = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const { data: myBills    = [], isLoading: billsLoading } = useMyBills();
  const { data: myPayments = [], isLoading: paysLoading  } = useMyPayments();

  const recordPayment = useRecordPayment();

  const pendingBills = myBills.filter(b => b.status === 'PENDING');
  const totalPaid    = myPayments.filter(p => p.approvalStatus === 'APPROVED').reduce((s, p) => s + p.amountPaid, 0);
  const pendingAmt   = pendingBills.reduce((s, b) => s + b.totalDue, 0);

  return (
    <div className="page-enter">
      <PageHeader title="My Maintenance" subtitle="Your flat's maintenance bills and payment history" />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Pending Bills" value={pendingBills.length}   color="#f59e0b" icon={<Clock className="w-5 h-5" />} />
        <KpiCard label="Amount Due"    value={formatINR(pendingAmt)} color="#ef4444" icon={<CreditCard className="w-5 h-5" />} isAmount />
        <KpiCard label="Total Paid"    value={formatINR(totalPaid)}  color="#22c55e" icon={<CheckCircle2 className="w-5 h-5" />} isAmount />
      </div>

      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl w-fit">
        {(['my-bills', 'my-payments'] as MemberTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t === 'my-bills' ? 'My Bills' : 'Payment History'}
          </button>
        ))}
      </div>

      {tab === 'my-bills' && (
        <div>
          {billsLoading ? <TableSkeleton rows={4} cols={7} /> : myBills.length === 0 ? (
            <EmptyState message="No bills generated for your flat yet." />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Month','Amount','Late Fine','Total Due','Due Date','Status','Action'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myBills.map(bill => {
                    const hasPending = myPayments.some(p => p.billId === bill.id && p.approvalStatus === 'PENDING');
                    const isOverdue  = bill.status === 'PENDING' && bill.dueDate && new Date(bill.dueDate) < new Date();
                    return (
                      <tr key={bill.id} className={`transition-colors ${isOverdue ? 'bg-red-50/40' : 'hover:bg-slate-50'}`}>
                        <td className="px-4 py-3 font-medium text-slate-800">{formatMonth(bill.billMonth)}</td>
                        <td className="px-4 py-3 text-slate-700">{formatINR(bill.amount)}</td>
                        <td className="px-4 py-3">
                          {bill.lateFine > 0
                            ? <span className="text-red-500 font-medium">{formatINR(bill.lateFine)}</span>
                            : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">{formatINR(bill.totalDue)}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                          {isOverdue && <span className="ml-1.5 text-red-500 font-medium">Overdue</span>}
                        </td>
                        <td className="px-4 py-3"><StatusBadge value={bill.status} /></td>
                        <td className="px-4 py-3">
                          {bill.status === 'PENDING' && (
                            hasPending ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-amber-700 bg-amber-50">
                                <Clock className="w-3 h-3" /> Awaiting Approval
                              </span>
                            ) : (
                              <button onClick={() => { setSelectedBill(bill); setPayModal(true); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                                <CreditCard className="w-3.5 h-3.5" /> Pay Now
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'my-payments' && (
        <div>
          {paysLoading ? <TableSkeleton rows={4} cols={7} /> : myPayments.length === 0 ? (
            <EmptyState message="No payment history yet." />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Receipt No.','Month','Amount','Mode','Date','Status','Receipt'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myPayments.map(pay => (
                    <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-blue-600 font-medium">{pay.receiptNumber}</td>
                      <td className="px-4 py-3 text-slate-700">{formatMonth(pay.billMonth)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{formatINR(pay.amountPaid)}</td>
                      <td className="px-4 py-3 text-slate-600">{pay.paymentMode}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(pay.paymentDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge value={pay.approvalStatus} />
                        {pay.approvalStatus === 'REJECTED' && pay.rejectionReason && (
                          <p className="text-xs text-red-500 mt-0.5 max-w-[140px] truncate">{pay.rejectionReason}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {pay.approvalStatus === 'APPROVED' && (
                          <button
                            onClick={() => printReceipt({
                              receiptNumber:   pay.receiptNumber,
                              memberName:      pay.memberName,
                              flatNumber:      pay.flatNumber,
                              wingName:        pay.wingName,
                              month:           formatMonth(pay.billMonth),
                              amount:          pay.amountPaid,
                              paymentMode:     pay.paymentMode,
                              paidDate:        pay.paymentDate,
                              referenceNumber: (pay as any).referenceNo ?? undefined,
                            })}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                            <Printer className="w-3 h-3" /> Print
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <PaymentModal
        open={payModal} bill={selectedBill} memberId={memberId}
        loading={recordPayment.isPending}
        onSubmit={v => recordPayment.mutate(v as any, { onSuccess: () => { setPayModal(false); setSelectedBill(null); } })}
        onClose={() => { setPayModal(false); setSelectedBill(null); }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REJECT MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function RejectModal({ payment, reason, onReasonChange, loading, onConfirm, onClose }: {
  payment: Payment; reason: string; onReasonChange: (v: string) => void;
  loading: boolean; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
         onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-50">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">Reject Payment</p>
            <p className="text-xs text-slate-500">from {payment.memberName} — {formatINR(payment.amountPaid)}</p>
          </div>
        </div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason *</label>
        <textarea rows={3} value={reason} onChange={e => onReasonChange(e.target.value)}
          placeholder="e.g. Incorrect amount, invalid reference…"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none resize-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 mb-4" />
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={!reason.trim() || loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
            {loading && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            Reject Payment
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════
function KpiCard({ label, value, color, icon, isAmount = false }: {
  label: string; value: string | number; color: string; icon: React.ReactNode; isAmount?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
             style={{ background: `${color}15`, color }}>{icon}</div>
      </div>
      <p className={`font-bold leading-none ${isAmount ? 'text-xl' : 'text-3xl'}`} style={{ color }}>{value}</p>
    </div>
  );
}

function TableSkeleton({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 h-10 border-b border-slate-200" />
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3.5 border-b border-slate-100">
          {[...Array(cols)].map((_, j) => <div key={j} className="skeleton h-4 rounded flex-1" />)}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
      <Receipt className="w-8 h-8 text-slate-300" />
      <p className="mt-3 text-sm text-slate-500">{message}</p>
    </div>
  );
}

function EditBillModal({ bill, loading, onSubmit, onClose }: {
  bill: any; loading: boolean;
  onSubmit: (v: { amount?: number; lateFine?: number; dueDate?: string }) => void;
  onClose: () => void;
}) {
  const [amount,   setAmount]   = useState(String(bill.amount ?? ''));
  const [lateFine, setLateFine] = useState(String(bill.lateFine ?? '0'));
  const [dueDate,  setDueDate]  = useState(bill.dueDate ? bill.dueDate.substring(0, 10) : '');

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
         onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <p className="font-semibold text-slate-800 mb-1">Edit Bill</p>
        <p className="text-xs text-slate-500 mb-5">{bill.wingName} - {bill.flatNumber} | {formatMonth(bill.billMonth)}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (₹)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Late Fine (₹)</label>
            <input type="number" value={lateFine} onChange={e => setLateFine(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={() => onSubmit({
              amount:   amount !== '' ? Number(amount) : undefined,
              lateFine: lateFine !== '' ? Number(lateFine) : undefined,
              dueDate:  dueDate  || undefined,
            })}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
            {loading && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

