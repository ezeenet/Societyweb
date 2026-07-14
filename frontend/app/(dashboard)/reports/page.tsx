'use client';
// app/(dashboard)/reports/page.tsx

import React, { useState } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, Printer,
  Users, MessageSquare, UserCheck, Bell, AlertCircle, Download,
} from 'lucide-react';
import {
  printTrialBalance, printBalanceSheet,
  printComplaints, exportComplaintsPdf,
  printNotices, exportNoticesPdf,
  printVisitors, exportVisitorsCsv,
  printMembers, exportMembersCsv,
  exportVisitorsPdf,
} from '@/lib/utils/printUtils';
import PageHeader from '@/components/layout/PageHeader';
import { useSettings } from '@/lib/hooks/useAdmin';
import { useMemberAnnualStatement } from '@/lib/hooks/useAccounts';
import {
  useIncomeExpense, useBalanceSheet, useTrialBalance,
  useCashBook, useBankBook, useDefaulters, useCollectionSummary, useSendReminder, useSendBulkReminder,
} from '@/lib/hooks/useAccounts';
import { useComplaints } from '@/lib/hooks/useOperations';
import { useVisitors }   from '@/lib/hooks/useOperations';
import { useNotices }    from '@/lib/hooks/useOperations';
import { useMembers }    from '@/lib/hooks/useProperty';
import type { CollectionSummaryRow } from '@/types/accounts.types';

type ReportTab    = 'financial' | 'complaints' | 'visitors' | 'notices' | 'members';
type FinancialSub = 'income-expense' | 'balance-sheet' | 'trial-balance' | 'cash-book' | 'bank-book' | 'collection';

const INR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// Aging bucket calculation — dueDate पासून आजपर्यंतचे दिवस मोजून bucket मध्ये टाकतो
function getAgingBuckets(bills: any[]) {
  const today = new Date();
  const buckets = { b0_30: 0, b31_60: 0, b61_90: 0, b90plus: 0 };
  bills.forEach((b: any) => {
    if (!b.dueDate) { buckets.b90plus += b.amount; return; }
    const due = new Date(b.dueDate);
    const days = Math.floor((today.getTime() - due.getTime()) / 86400000);
    if (days <= 30) buckets.b0_30 += b.amount;
    else if (days <= 60) buckets.b31_60 += b.amount;
    else if (days <= 90) buckets.b61_90 += b.amount;
    else buckets.b90plus += b.amount;
  });
  return buckets;
}

const fyRange = () => {
  const now  = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return { from: `${year}-04-01`, to: `${year + 1}-03-31` };
};

// ── Print helper for Defaulter List ───────────────────────────────────────────
function printDefaulterList(report: any) {
  const rows = report.defaulters.map((d: any) =>
    '<tr><td>' + d.memberName + '</td><td>' + d.wingName + ' - ' + d.flatNumber + '</td>' +
    '<td style="text-align:center">' + d.pendingMonths + '</td>' +
    '<td style="text-align:right;color:#dc2626;font-weight:600">Rs.' + d.totalDue.toLocaleString('en-IN') + '</td></tr>'
  ).join('');
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) return;
  w.document.write('<!DOCTYPE html><html><head><title>Defaulter List</title>' +
    '<style>body{font-family:Arial;padding:32px;color:#1e293b}h2{color:#dc2626}' +
    'table{width:100%;border-collapse:collapse;font-size:13px}' +
    'th{background:#fef2f2;border:1px solid #fecaca;padding:8px 12px;text-align:left;font-weight:600;color:#dc2626}' +
    'td{border:1px solid #e2e8f0;padding:8px 12px}tfoot td{font-weight:700;background:#f8fafc}' +
    '@media print{@page{margin:1.5cm}}</style></head>' +
    '<body><h2>Defaulter List</h2>' +
    '<p style="color:#64748b;font-size:12px">Generated: ' + new Date().toLocaleString('en-IN') + '</p>' +
    '<table><thead><tr><th>Member</th><th>Flat</th><th>Pending Months</th><th>Amount Due</th></tr></thead>' +
    '<tbody>' + rows + '</tbody>' +
    '<tfoot><tr><td colspan="3">TOTAL OUTSTANDING</td>' +
    '<td style="text-align:right">Rs.' + report.totalOutstanding.toLocaleString('en-IN') + '</td></tr></tfoot></table>' +
    '<script>window.onload=function(){window.print()}</script></body></html>');
  w.document.close();
}

// ── Simple print helper for Income/Expense ────────────────────────────────────
function printIEReport(ieReport: any) {
  const rows = ieReport.rows.map((r: any) =>
    `<tr><td>${r.category}</td>
     <td style="text-align:right;color:#16a34a">${INR(r.income)}</td>
     <td style="text-align:right;color:#dc2626">${INR(r.expense)}</td>
     <td style="text-align:right;color:${r.net >= 0 ? '#1d4ed8' : '#dc2626'}">${INR(r.net)}</td></tr>`
  ).join('');
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><title>Income & Expense</title>
    <style>body{font-family:Arial;padding:32px;color:#1e293b}table{width:100%;border-collapse:collapse;font-size:13px}
    th{background:#f8fafc;border:1px solid #e2e8f0;padding:8px 12px;text-align:left;font-weight:600}
    td{border:1px solid #e2e8f0;padding:8px 12px}tfoot td{font-weight:700;background:#f8fafc}
    @media print{@page{margin:1.5cm}}</style></head>
    <body><h2>Income & Expense — FY ${ieReport.financialYear}</h2>
    <p style="color:#64748b;font-size:12px">Generated: ${new Date().toLocaleString('en-IN')}</p>
    <table><thead><tr><th>Category</th><th>Income</th><th>Expense</th><th>Net</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td>TOTAL</td>
      <td style="text-align:right">${INR(ieReport.totalIncome)}</td>
      <td style="text-align:right">${INR(ieReport.totalExpense)}</td>
      <td style="text-align:right">${INR(ieReport.netBalance)}</td>
    </tr></tfoot></table>
    <script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}

export default function ReportsPage() {
  const [tab,    setTab]    = useState<ReportTab>('financial');
  const [finSub, setFinSub] = useState<FinancialSub>('income-expense');
  const [from,   setFrom]   = useState(fyRange().from);
  const [to,     setTo]     = useState(fyRange().to);
  const [expandedDefaulter, setExpandedDefaulter] = useState<number | null>(null);
  const [defaulterSearch, setDefaulterSearch] = useState('');
  const [selectedDefaulters, setSelectedDefaulters] = useState<number[]>([]);
  const [statementMember, setStatementMember] = useState<number | null>(null);
  const [statementFY,     setStatementFY]     = useState(() => {
    const now = new Date();
    const yr  = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return yr;
  });

  const { data: ieReport, isLoading: ieLoading } = useIncomeExpense(from, to);
  const { data: bsReport, isLoading: bsLoading } = useBalanceSheet(from, to);
  const { data: tbReport, isLoading: tbLoading } = useTrialBalance(from, to);
  const { data: cbReport, isLoading: cbLoading } = useCashBook(from, to);
  const { data: bbReport, isLoading: bbLoading } = useBankBook(from, to);
  const { data: collection = [] }                 = useCollectionSummary();
  const { data: defaulters }                       = useDefaulters();
  const { data: settings }                         = useSettings();
  const sendReminder = useSendReminder();
  const sendBulkReminder = useSendBulkReminder();
  const { data: complaints  = [] }                 = useComplaints();
  const { data: visitors    = [] }                 = useVisitors();
  const { data: notices     = [] }                 = useNotices();
  const { data: members     = [] }                 = useMembers();
  const fyStart = `${statementFY}-04-01`;
  const fyEnd   = `${statementFY + 1}-03-31`;
  const { data: annualStatement, isLoading: stmtLoading } = useMemberAnnualStatement(statementMember, fyStart, fyEnd);

  const TABS: { id: ReportTab; label: string; icon: React.ElementType }[] = [
    { id: 'financial',  label: 'Financial',  icon: TrendingUp    },
    { id: 'complaints', label: 'Complaints', icon: MessageSquare },
    { id: 'visitors',   label: 'Visitors',   icon: UserCheck     },
    { id: 'notices',    label: 'Notices',    icon: Bell          },
    { id: 'members',    label: 'Members',    icon: Users         },
  ];

  const FIN_SUBS: { id: FinancialSub; label: string }[] = [
    { id: 'income-expense', label: 'Income & Expense' },
    { id: 'balance-sheet',  label: 'Balance Sheet'    },
    { id: 'trial-balance',  label: 'Trial Balance'    },
    { id: 'cash-book',      label: 'Cash Book'        },
    { id: 'bank-book',      label: 'Bank Book'        },
    { id: 'collection',     label: 'Collection'       },
  ];

  const Skel = ({ rows = 6 }: { rows?: number }) => (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3.5 border-b border-slate-100">
          {[...Array(4)].map((_, j) => <div key={j} className="skeleton h-4 rounded flex-1" />)}
        </div>
      ))}
    </div>
  );

  const PrintBtn = ({ onClick, label = 'Print' }: { onClick: () => void; label?: string }) => (
    <button onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
      <Printer className="w-3.5 h-3.5" /> {label}
    </button>
  );

  return (
    <div className="page-enter">
      <PageHeader title="Reports" subtitle="Financial and operational reports for your society" />

      {/* Main tabs */}
      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
              ${tab === id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* ── FINANCIAL ──────────────────────────────────────────────────────── */}
      {tab === 'financial' && (
        <div>
          <div className="flex gap-2 flex-wrap mb-4">
            {FIN_SUBS.map(s => (
              <button key={s.id} onClick={() => setFinSub(s.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                  ${finSub === s.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Date filter */}
          <div className="flex items-center gap-3 mb-5 bg-white border border-slate-200 rounded-xl px-4 py-3">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Date Range:</span>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30" />
            <span className="text-slate-400 text-sm">to</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>

          {/* Income & Expense */}
          {finSub === 'income-expense' && (ieLoading ? <Skel /> : ieReport ? (
            <div>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2">
                  <p className="text-xs text-green-600">Total Income</p>
                  <p className="text-lg font-bold text-green-700">{INR(ieReport.totalIncome)}</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2">
                  <p className="text-xs text-red-500">Total Expense</p>
                  <p className="text-lg font-bold text-red-600">{INR(ieReport.totalExpense)}</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2">
                  <p className="text-xs text-blue-600">Net Balance</p>
                  <p className={`text-lg font-bold ${ieReport.netBalance >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                    {INR(ieReport.netBalance)}
                  </p>
                </div>
                <PrintBtn onClick={() => printIEReport(ieReport)} />
              </div>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Category</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-green-600 uppercase">Income</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-red-500 uppercase">Expense</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Net</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {ieReport.rows.map((r: any) => (
                      <tr key={r.category} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">{r.category}</td>
                        <td className="px-4 py-3 text-right text-green-600 font-medium">{r.income > 0 ? INR(r.income) : '—'}</td>
                        <td className="px-4 py-3 text-right text-red-500 font-medium">{r.expense > 0 ? INR(r.expense) : '—'}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${r.net >= 0 ? 'text-blue-600' : 'text-red-500'}`}>{INR(r.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200">
                      <td className="px-4 py-3 font-bold text-slate-700">TOTAL</td>
                      <td className="px-4 py-3 text-right font-bold text-green-700">{INR(ieReport.totalIncome)}</td>
                      <td className="px-4 py-3 text-right font-bold text-red-600">{INR(ieReport.totalExpense)}</td>
                      <td className={`px-4 py-3 text-right font-bold ${ieReport.netBalance >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                        {INR(ieReport.netBalance)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : null)}

          {/* Balance Sheet */}
          {finSub === 'balance-sheet' && (bsLoading ? <Skel /> : bsReport ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-slate-500">FY {bsReport.financialYear} — Balance Sheet (T-Format)</p>
                <PrintBtn onClick={() => printBalanceSheet({
                  assets:      bsReport.assets,
                  liabilities: bsReport.liabilities,
                  asOf:        bsReport.financialYear,
                })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Liabilities & Members Funds</p>
                  </div>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-slate-100">
                      {bsReport.liabilities.map((l: any) => (
                        <tr key={l.label} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-700">{l.label}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-800">{INR(l.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-blue-50 border-t-2 border-blue-200">
                        <td className="px-4 py-3 font-bold text-blue-700">Total</td>
                        <td className="px-4 py-3 text-right font-bold text-blue-700">{INR(bsReport.totalLiabilities)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 bg-green-50 border-b border-green-100">
                    <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Assets & Properties</p>
                  </div>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-slate-100">
                      {bsReport.assets.map((a: any) => (
                        <tr key={a.label} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-700">{a.label}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-800">{INR(a.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-green-50 border-t-2 border-green-200">
                        <td className="px-4 py-3 font-bold text-green-700">Total</td>
                        <td className="px-4 py-3 text-right font-bold text-green-700">{INR(bsReport.totalAssets)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          ) : null)}

          {/* Trial Balance */}
          {finSub === 'trial-balance' && (tbLoading ? <Skel /> : tbReport ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border
                  ${tbReport.isBalanced ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                  {tbReport.isBalanced ? '✓ Balanced (Dr = Cr)' : '⚠ NOT Balanced'}
                </span>
                <PrintBtn onClick={() => printTrialBalance(
                  tbReport.rows.map((r: any) => ({ accountName: r.accountHead, debit: r.debit, credit: r.credit })),
                  tbReport.financialYear, tbReport.financialYear
                )} />
              </div>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Account Head</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-red-500 uppercase">Dr</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-green-600 uppercase">Cr</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {tbReport.rows.map((r: any) => (
                      <tr key={r.accountHead} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-800">{r.accountHead}</td>
                        <td className="px-4 py-3 text-right font-medium text-red-500">{r.debit > 0 ? INR(r.debit) : '—'}</td>
                        <td className="px-4 py-3 text-right font-medium text-green-600">{r.credit > 0 ? INR(r.credit) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-300">
                      <td className="px-4 py-3 font-bold text-slate-700">TOTAL</td>
                      <td className="px-4 py-3 text-right font-bold text-red-600">{INR(tbReport.totalDebit)}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-700">{INR(tbReport.totalCredit)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : null)}

          {/* Cash Book / Bank Book */}
          {(finSub === 'cash-book' || finSub === 'bank-book') && (() => {
            const report  = finSub === 'cash-book' ? cbReport  : bbReport;
            const loading = finSub === 'cash-book' ? cbLoading : bbLoading;
            if (loading) return <Skel />;
            if (!report)  return null;
            return (
              <div>
                <div className="flex gap-3 mb-4 flex-wrap items-center">
                  <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2">
                    <p className="text-xs text-green-600">Total Receipts</p>
                    <p className="text-lg font-bold text-green-700">{INR(report.totalReceipts)}</p>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2">
                    <p className="text-xs text-red-500">Total Payments</p>
                    <p className="text-lg font-bold text-red-600">{INR(report.totalPayments)}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2">
                    <p className="text-xs text-blue-600">Closing Balance</p>
                    <p className="text-lg font-bold text-blue-700">{INR(report.closingBalance)}</p>
                  </div>
                  <PrintBtn onClick={() => {
                    const heading = finSub === 'cash-book' ? 'Cash Book' : 'Bank Book';
                    import('@/lib/utils/printUtils').then(m => m.printAccountEntries(
                      report.entries.map((e: any) => ({
                        date: fmtDate(e.date), description: e.particulars,
                        entryType: e.voucherType, category: finSub === 'cash-book' ? 'Cash' : 'Bank',
                        debit: e.payments, credit: e.receipts, balance: e.balance,
                      })), heading
                    ));
                  }} />
                </div>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-slate-50 border-b border-slate-200">
                      {['Date','Particulars','Type','Receipts','Payments','Balance'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.entries.map((e: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(e.date)}</td>
                          <td className="px-4 py-3 text-slate-700 max-w-[180px] truncate">{e.particulars}</td>
                          <td className="px-4 py-3 text-xs text-slate-400">{e.voucherType}</td>
                          <td className="px-4 py-3 text-right text-green-600 font-medium">{e.receipts > 0 ? INR(e.receipts) : '—'}</td>
                          <td className="px-4 py-3 text-right text-red-500 font-medium">{e.payments > 0 ? INR(e.payments) : '—'}</td>
                          <td className={`px-4 py-3 text-right font-semibold ${e.balance >= 0 ? 'text-slate-800' : 'text-red-500'}`}>{INR(e.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {report.entries.length === 0 && <p className="text-center py-10 text-sm text-slate-400">No entries in this date range.</p>}
                </div>
              </div>
            );
          })()}

          {/* Collection */}
          {finSub === 'collection' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex justify-end">
                <PrintBtn onClick={() => {
                  const w = window.open('', '_blank', 'width=900,height=700');
                  if (!w) return;
                  const rows = collection.map((r: CollectionSummaryRow) =>
                    `<tr><td>${r.billMonth}</td><td>${r.totalFlats}</td><td>${r.paidCount}</td><td>${r.pendingCount}</td><td>Rs.${r.amountBilled.toLocaleString('en-IN')}</td><td>Rs.${r.amountCollected.toLocaleString('en-IN')}</td><td>Rs.${r.amountPending.toLocaleString('en-IN')}</td></tr>`
                  ).join('');
                  w.document.write(`<!DOCTYPE html><html><head><title>Collection</title><style>body{font-family:Arial;padding:24px}h2{color:#1a237e}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#1a237e;color:#fff;padding:7px 10px;text-align:left}td{padding:6px 10px;border-bottom:1px solid #e0e0e0}</style></head><body><h2>Collection Summary</h2><table><thead><tr><th>Month</th><th>Flats</th><th>Paid</th><th>Pending</th><th>Billed</th><th>Collected</th><th>Outstanding</th></tr></thead><tbody>${rows}</tbody></table><script>window.onload=()=>window.print()</script></body></html>`);
                  w.document.close();
                }} label="Print Collection" />
              </div>
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 border-b border-slate-200">
                  {['Month','Flats','Paid','Pending','Billed','Collected','Outstanding'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {collection.map((r: CollectionSummaryRow) => (
                    <tr key={r.billMonth} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{r.billMonth}</td>
                      <td className="px-4 py-3 text-slate-600">{r.totalFlats}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">{r.paidCount}</td>
                      <td className="px-4 py-3 text-amber-600 font-medium">{r.pendingCount}</td>
                      <td className="px-4 py-3 text-slate-700">{INR(r.amountBilled)}</td>
                      <td className="px-4 py-3 text-green-600 font-semibold">{INR(r.amountCollected)}</td>
                      <td className="px-4 py-3 font-semibold text-red-500">{INR(r.amountPending)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {collection.length === 0 && <p className="text-center py-10 text-sm text-slate-400">No bills yet.</p>}
            </div>
          )}
        </div>
      )}

      {/* ── COMPLAINTS ──────────────────────────────────────────────────────── */}
      {tab === 'complaints' && (
        <div>
          <div className="flex justify-end gap-2 mb-3">
            <PrintBtn onClick={() => printComplaints(complaints.map(c => ({ id: c.id, subject: c.title, description: c.description ?? '', category: c.category ?? '', status: c.status, priority: 'Normal', memberName: c.memberName ?? '-', flatNumber: c.flatNumber ?? '-', createdAt: fmtDate(c.createdAt), resolvedAt: undefined })))} />
            <button onClick={() => exportComplaintsPdf(complaints.map(c => ({ id: c.id, subject: c.title, description: c.description ?? '', category: c.category ?? '', status: c.status, priority: 'Normal', memberName: c.memberName ?? '-', flatNumber: c.flatNumber ?? '-', createdAt: fmtDate(c.createdAt), resolvedAt: undefined })))}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {(['OPEN','IN_PROGRESS','RESOLVED','CLOSED'] as const).map(s => (
              <div key={s} className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-500 mb-1">{s.replace('_',' ')}</p>
                <p className="text-2xl font-bold text-slate-800">{complaints.filter(c => c.status === s).length}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                {['Title','Category','Member','Flat','Status','Raised'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800 max-w-[150px] truncate">{c.title}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{c.category ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{c.memberName}</td>
                    <td className="px-4 py-3 text-slate-500">{c.flatNumber ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium
                        ${c.status === 'OPEN' ? 'bg-red-50 text-red-600' :
                          c.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600' :
                          c.status === 'RESOLVED' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {c.status.replace('_',' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── VISITORS ────────────────────────────────────────────────────────── */}
      {tab === 'visitors' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="grid grid-cols-3 gap-4 flex-1 mr-4">
              {[
                { label: 'Total', value: visitors.length, color: 'text-slate-800' },
                { label: 'Inside', value: visitors.filter(v => v.insidePremises).length, color: 'text-green-600' },
                { label: 'Exited', value: visitors.filter(v => !v.insidePremises).length, color: 'text-slate-500' },
              ].map(c => (
                <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-500 mb-1">{c.label}</p>
                  <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <PrintBtn onClick={() => {
                const vp = visitors.map(v => ({
                  id: v.id, name: v.visitorName, mobile: v.mobile, purpose: v.purpose,
                  flatNumber: v.flatNumber, wingName: v.wingName, hostMemberName: v.hostMemberName,
                  entryTime: v.entryTime, exitTime: v.exitTime, vehicleNo: v.vehicleNo,
                }));
                import('@/lib/utils/printUtils').then(m => m.printVisitors(vp));
              }} />
              <button onClick={() => {
                const vp = visitors.map(v => ({
                  id: v.id, name: v.visitorName, mobile: v.mobile, purpose: v.purpose,
                  flatNumber: v.flatNumber, wingName: v.wingName, hostMemberName: v.hostMemberName,
                  entryTime: v.entryTime, exitTime: v.exitTime, vehicleNo: v.vehicleNo,
                }));
                exportVisitorsCsv(vp);
              }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                {['Name','Mobile','Purpose','Flat','Entry','Exit','Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {visitors.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{v.visitorName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{v.mobile ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[100px] truncate">{v.purpose ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{v.wingName} – {v.flatNumber}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(v.entryTime).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {v.exitTime ? new Date(v.exitTime).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${v.insidePremises ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {v.insidePremises ? 'Inside' : 'Exited'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── NOTICES ─────────────────────────────────────────────────────────── */}
      {tab === 'notices' && (
        <div>
          <div className="flex justify-end gap-2 mb-3">
            <PrintBtn onClick={() => printNotices(notices.map(n => ({ id: n.id, title: n.title, content: n.content ?? '', noticeType: n.category, priority: n.category === 'Emergency' ? 'High' : 'Normal', publishDate: fmtDate(n.createdAt), expiryDate: n.expiresAt ? fmtDate(n.expiresAt) : undefined, targetAudience: 'All', hasPoll: n.hasPoll })))} />
            <button onClick={() => exportNoticesPdf(notices.map(n => ({ id: n.id, title: n.title, content: n.content ?? '', noticeType: n.category, priority: n.category === 'Emergency' ? 'High' : 'Normal', publishDate: fmtDate(n.createdAt), expiryDate: n.expiresAt ? fmtDate(n.expiresAt) : undefined, targetAudience: 'All', hasPoll: n.hasPoll })))}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-500 mb-1">Total</p><p className="text-2xl font-bold text-slate-800">{notices.length}</p></div>
            <div className="bg-white rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-500 mb-1">Active</p><p className="text-2xl font-bold text-green-600">{notices.filter(n => n.isActive).length}</p></div>
            <div className="bg-white rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-500 mb-1">With Polls</p><p className="text-2xl font-bold text-purple-600">{notices.filter(n => n.hasPoll).length}</p></div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                {['Title','Category','By','Status','Poll','Acks','Date'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {notices.map(n => (
                  <tr key={n.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800 max-w-[160px] truncate">{n.title}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{n.category}</td>
                    <td className="px-4 py-3 text-slate-600">{n.createdByName ?? 'Admin'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${n.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {n.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{n.hasPoll ? <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-md">Yes</span> : <span className="text-xs text-slate-400">—</span>}</td>
                    <td className="px-4 py-3 text-slate-600">{n.ackCount}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(n.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MEMBERS ─────────────────────────────────────────────────────────── */}
      {tab === 'members' && (
        <div>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" /> Defaulter List
              </h3>
              <div className="flex items-center gap-3">
                {defaulters && <span className="text-xs text-red-500 font-medium">{defaulters.defaulters.length} defaulter(s) . Total: {INR(defaulters.totalOutstanding)}</span>}
                {selectedDefaulters.length > 0 && (
                  <button
                    onClick={() => {
                      const recipients = (defaulters?.defaulters ?? [])
                        .filter(d => selectedDefaulters.includes(d.memberId))
                        .map(d => ({ memberId: d.memberId, amountDue: INR(d.totalDue) }));
                      sendBulkReminder.mutate(recipients, { onSuccess: () => setSelectedDefaulters([]) });
                    }}
                    disabled={sendBulkReminder.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors disabled:opacity-50">
                    <Bell className="w-3.5 h-3.5" /> Send to Selected ({selectedDefaulters.length})
                  </button>
                )}
                {defaulters && <PrintBtn onClick={() => printDefaulterList(defaulters)} />}
              </div>
            </div>
            <div className="relative mb-3 max-w-xs">
              <input type="text" placeholder="Search member, flat, wing..." value={defaulterSearch}
                onChange={e => setDefaulterSearch(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300" />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-red-50 border-b border-red-100">
                  <th className="px-4 py-3 w-8">
                    <input type="checkbox"
                      checked={!!defaulters && defaulters.defaulters.length > 0 && selectedDefaulters.length === defaulters.defaulters.length}
                      onChange={e => setSelectedDefaulters(e.target.checked ? (defaulters?.defaulters.map(d => d.memberId) ?? []) : [])}
                      className="rounded border-slate-300" />
                  </th>
                  {['Member','Flat','Wing','Pending Months','Amount Due',''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-red-600 uppercase">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {defaulters?.defaulters.filter(d => {
                    const q = defaulterSearch.toLowerCase();
                    return !q || d.memberName.toLowerCase().includes(q) ||
                      d.flatNumber.toLowerCase().includes(q) || d.wingName.toLowerCase().includes(q);
                  }).map(d => (
                    <React.Fragment key={d.memberId}>
                      <tr onClick={() => setExpandedDefaulter(expandedDefaulter === d.memberId ? null : d.memberId)}
                        className="hover:bg-red-50/30 cursor-pointer">
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <input type="checkbox"
                            checked={selectedDefaulters.includes(d.memberId)}
                            onChange={e => setSelectedDefaulters(prev =>
                              e.target.checked ? [...prev, d.memberId] : prev.filter(id => id !== d.memberId))}
                            className="rounded border-slate-300" />
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{d.memberName}</td>
                        <td className="px-4 py-3 text-slate-600">{d.flatNumber}</td>
                        <td className="px-4 py-3 text-slate-600">{d.wingName}</td>
                        <td className="px-4 py-3 text-amber-600 font-medium">{d.pendingMonths} month(s)</td>
                        <td className="px-4 py-3 font-bold text-red-500">{INR(d.totalDue)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); sendReminder.mutate({ memberId: d.memberId, amountDue: INR(d.totalDue) }); }}
                            disabled={sendReminder.isPending}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50">
                            <Bell className="w-3.5 h-3.5" /> Remind
                          </button>
                        </td>
                      </tr>
                      {expandedDefaulter === d.memberId && (
                        <tr className="bg-slate-50">
                          <td colSpan={7} className="px-4 py-3">
                            <div className="space-y-1.5">
                              {((d as any).bills ?? []).map((b: any, i: number) => (
                                <div key={i} className="flex items-center justify-between text-xs px-3 py-2 bg-white rounded-lg border border-slate-200">
                                  <span className="text-slate-600 font-medium">{b.billMonth}</span>
                                  <span className="text-slate-400">{b.dueDate ? fmtDate(b.dueDate) : "-"}</span>
                                  <span className="font-semibold text-red-500">{INR(b.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
              {defaulters?.defaulters.length === 0 && <p className="text-center py-10 text-sm text-green-600 font-medium">🎉 No defaulters!</p>}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" /> Member Annual Statement
            </h3>
            <div className="flex items-center gap-3 mb-4 bg-white border border-slate-200 rounded-xl px-4 py-3 flex-wrap">
              <select value={statementMember ?? ''} onChange={e => setStatementMember(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/30 min-w-56">
                <option value="">Select a member…</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} {m.flat ? `(${m.flat.wingName} – ${m.flat.flatNumber})` : ''}
                  </option>
                ))}
              </select>
              <select value={statementFY} onChange={e => setStatementFY(Number(e.target.value))}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/30">
                {[...Array(5)].map((_, i) => {
                  const yr = new Date().getFullYear() - i + 1;
                  return <option key={yr} value={yr}>{`FY ${yr}-${String((yr + 1) % 100).padStart(2, '0')}`}</option>;
                })}
              </select>
              {annualStatement && (
                <PrintBtn onClick={() => {
                  const w = window.open('', '_blank', 'width=900,height=700');
                  if (!w) return;
                  const rows = annualStatement.rows.map((r: any) =>
                    '<tr><td>' + fmtDate(r.date) + '</td><td>' + r.description + '</td>' +
                    '<td style="text-align:right;color:#dc2626">' + (r.debit > 0 ? INR(r.debit) : '-') + '</td>' +
                    '<td style="text-align:right;color:#16a34a">' + (r.credit > 0 ? INR(r.credit) : '-') + '</td>' +
                    '<td style="text-align:right;font-weight:600">' + INR(Math.abs(r.balance)) + (r.balance < 0 ? ' (Adv)' : '') + '</td></tr>'
                  ).join('');
                  w.document.write('<!DOCTYPE html><html><head><title>Annual Statement</title>' +
                    '<style>body{font-family:Arial;padding:32px;color:#1e293b}h2{color:#1a237e;margin-bottom:4px}' +
                    'table{width:100%;border-collapse:collapse;font-size:13px;margin-top:16px}' +
                    'th{background:#1a237e;color:#fff;padding:8px 12px;text-align:left}' +
                    'td{border-bottom:1px solid #e2e8f0;padding:8px 12px}' +
                    'tfoot td{font-weight:700;background:#f8fafc}' +
                    '@media print{@page{margin:1.5cm}}</style></head><body>' +
                    '<h2>' + annualStatement.memberName + ' — Annual Statement</h2>' +
                    '<p style="color:#64748b;font-size:13px">' + annualStatement.wingName + ' - ' + annualStatement.flatNumber + ' | FY ' + statementFY + '-' + String((statementFY + 1) % 100).padStart(2, '0') + '</p>' +
                    '<table><thead><tr><th>Date</th><th>Description</th><th>Dr (Billed)</th><th>Cr (Paid)</th><th>Balance</th></tr></thead>' +
                    '<tbody>' + rows + '</tbody>' +
                    '<tfoot><tr><td colspan="2">TOTAL</td><td style="text-align:right">' + INR(annualStatement.totalDebits) + '</td>' +
                    '<td style="text-align:right">' + INR(annualStatement.totalCredits) + '</td>' +
                    '<td style="text-align:right">' + INR(Math.abs(annualStatement.closingBalance)) + '</td></tr></tfoot></table>' +
                    '<script>window.onload=function(){window.print()}</script></body></html>');
                  w.document.close();
                }} />
              )}
            </div>

            {stmtLoading && <p className="text-sm text-slate-400 py-6 text-center">Loading…</p>}

            {annualStatement && (
              <div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-500 mb-1">Total Billed (Dr)</p>
                    <p className="text-xl font-bold text-red-500">{INR(annualStatement.totalDebits)}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-500 mb-1">Total Paid (Cr)</p>
                    <p className="text-xl font-bold text-green-600">{INR(annualStatement.totalCredits)}</p>
                  </div>
                  <div className={`rounded-xl border p-4 ${annualStatement.hasAdvance ? 'bg-blue-50 border-blue-100' : 'bg-white border-slate-200'}`}>
                    <p className="text-xs text-slate-500 mb-1">{annualStatement.hasAdvance ? 'Advance' : 'Closing Balance'}</p>
                    <p className={`text-xl font-bold ${annualStatement.hasAdvance ? 'text-blue-600' : 'text-amber-600'}`}>
                      {INR(Math.abs(annualStatement.closingBalance))}
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">{annualStatement.memberName}</p>
                    <p className="text-xs text-slate-400">{annualStatement.wingName} – {annualStatement.flatNumber}</p>
                  </div>
                  <table className="w-full text-sm">
                    <thead><tr className="bg-slate-50 border-b border-slate-200">
                      {['Date','Description','Dr (Billed)','Cr (Paid)','Balance'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {annualStatement.rows.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(row.date)}</td>
                          <td className="px-4 py-3 text-slate-700">{row.description}</td>
                          <td className="px-4 py-3 font-medium text-red-500">{row.debit > 0 ? INR(row.debit) : '—'}</td>
                          <td className="px-4 py-3 font-medium text-green-600">{row.credit > 0 ? INR(row.credit) : '—'}</td>
                          <td className={`px-4 py-3 font-semibold ${row.balance < 0 ? 'text-blue-600' : row.balance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                            {INR(Math.abs(row.balance))}{row.balance < 0 && <span className="text-xs ml-1 font-normal text-blue-400">(Adv)</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {annualStatement.rows.length === 0 && <p className="text-center py-10 text-sm text-slate-400">No transactions for this period.</p>}
                </div>
              </div>
            )}

            {!statementMember && (
              <div className="flex flex-col items-center py-12 bg-white rounded-xl border border-slate-200">
                <BarChart3 className="w-8 h-8 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">Select a member and financial year to view their annual statement.</p>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700">Member Directory</h3>
              <div className="flex gap-2">
                <PrintBtn onClick={() => printMembers(members.map(m => ({ name: m.fullName, flatNumber: m.flat?.flatNumber ?? '-', wingName: m.flat?.wingName ?? '-', memberType: m.memberType, phone: m.mobile ?? '-', email: m.email ?? undefined, aadhar: undefined, status: m.isActive ? 'ACTIVE' : 'INACTIVE' })))} />
                <button onClick={() => exportMembersCsv(members.map(m => ({ name: m.fullName, flatNumber: m.flat?.flatNumber ?? '-', wingName: m.flat?.wingName ?? '-', memberType: m.memberType, phone: m.mobile ?? '-', email: m.email ?? undefined, aadhar: undefined, status: m.isActive ? 'ACTIVE' : 'INACTIVE' })))}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 border-b border-slate-200">
                  {['Name','Mobile','Email','Type','Flat','Wing','Move-In'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{m.fullName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{m.mobile ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-[120px] truncate">{m.email ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{m.memberType}</td>
                      <td className="px-4 py-3 text-slate-600">{m.flat?.flatNumber ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{m.flat?.wingName ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{m.moveInDate ? fmtDate(m.moveInDate) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}