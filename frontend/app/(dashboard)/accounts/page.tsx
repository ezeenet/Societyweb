'use client';
// app/(dashboard)/accounts/page.tsx

import { useState, useMemo } from 'react';
import {
  BookOpen, Plus, Pencil, Trash2, Printer, Search,
  TrendingUp, TrendingDown, Wallet, Users, BarChart2, Download, Landmark, Receipt,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PageHeader from '@/components/layout/PageHeader';
import { useVouchers, useCreateVoucher, useDeleteVoucher } from '@/lib/hooks/useVoucher';
import { useVendors } from '@/lib/hooks/useVendor';
import { useSettings } from '@/lib/hooks/useAdmin';
import {
  useBankAccounts, useBankTransactions, useCreateBankAccount,
  useUpdateBankAccount, useDeleteBankAccount, useAddBankTransaction, useDeleteBankTransaction,
} from '@/lib/hooks/useBank';
import type { BankAccount } from '@/lib/api/bank.api';
import StatusBadge from '@/components/common/StatusBadge';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { printReceipt } from '@/lib/utils/receipt';
import {
  printAccountEntries, exportAccountsPdf, exportAccountsExcel,
  printCashBook, printMemberLedger, printPayments,
  exportPaymentsPdf, exportPaymentsCsv,
} from '@/lib/utils/printUtils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  useAccountEntries, useAccountSummary, useFundSummary,
  useMemberLedger, useCreateEntry, useUpdateEntry, useDeleteEntry,
} from '@/lib/hooks/useAccounts';
import { useMembers } from '@/lib/hooks/useProperty';
import { usePayments } from '@/lib/hooks/useBilling';
import type { AccountEntry, EntryType } from '@/types/accounts.types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, FUND_CATEGORIES } from '@/types/accounts.types';

type Tab = 'general' | 'receipts' | 'ledger' | 'cashbook' | 'funds' | 'payments' | 'bank' | 'vouchers';

const INR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const entrySchema = z.object({
  title:       z.string().min(1, 'Required').max(200),
  amount:      z.coerce.number().positive('Must be > 0'),
  entryType:   z.enum(['INCOME', 'EXPENSE', 'OPENING_BALANCE']),
  category:    z.string().min(1, 'Required'),
  description: z.string().optional().or(z.literal('')),
  entryDate:   z.string().min(1, 'Required'),
  reference:   z.string().optional().or(z.literal('')),
});

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AccountsPage() {
  const [tab,          setTab]          = useState<Tab>('general');
  const [entryModal,   setEntryModal]   = useState(false);
  const [editTarget,   setEditTarget]   = useState<AccountEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AccountEntry | null>(null);
  const [ledgerMember, setLedgerMember] = useState<number | null>(null);
  const [search,       setSearch]       = useState('');
  const [fundDrill,    setFundDrill]    = useState<string | null>(null);

  const { data: entries  = [], isLoading: entriesLoading } = useAccountEntries();
  const { data: summary }                                    = useAccountSummary();
  const { data: members  = [] }                             = useMembers(true);
  const { data: payments = [] }                             = usePayments();
  const { data: funds }                                      = useFundSummary();
  const { data: ledger,  isLoading: ledgerLoading }         = useMemberLedger(ledgerMember);

  const { data: bankAccounts = [] }                    = useBankAccounts();
  const [selBankAccount, setSelBankAccount]            = useState<number | null>(null);
  const { data: bankTxns = [] }                        = useBankTransactions(selBankAccount);
  const [bankAccountModal, setBankAccountModal]        = useState(false);
  const [editBankAccount, setEditBankAccount]          = useState<BankAccount | null>(null);
  const [txnModal, setTxnModal]                        = useState(false);
  const [bankForm, setBankForm]                        = useState({ accountName: '', bankName: '', accountNumber: '', branch: '', openingBalance: '' });
  const [txnForm, setTxnForm]                          = useState({ transactionType: 'DEPOSIT', amount: '', description: '', transactionDate: new Date().toISOString().split('T')[0], reference: '' });
  const createBankAccount   = useCreateBankAccount();
  const updateBankAccount   = useUpdateBankAccount();
  const deleteBankAccount   = useDeleteBankAccount();
  const addBankTransaction  = useAddBankTransaction();
  const deleteBankTxn       = useDeleteBankTransaction();

  const { data: vouchers = [] }     = useVouchers();
  const { data: vendors  = [] }     = useVendors(true);
  const { data: settings2 }         = useSettings();
  const createVoucher               = useCreateVoucher();
  const deleteVoucher               = useDeleteVoucher();
  const [voucherModal, setVoucherModal] = useState(false);
  const [vForm, setVForm] = useState({
    voucherType: 'EXPENSE', expenseFor: '', vendorName: '', vendorId: '' as string, voucherDate: new Date().toISOString().split('T')[0],
    paymentMode: 'CASH', description: '',
    items: [{ itemName: '', quantity: '1', pricePerUnit: '' }] as { itemName: string; quantity: string; pricePerUnit: string }[],
  });
  const [viewVoucher, setViewVoucher] = useState<any>(null);
  const [deleteVoucherTarget, setDeleteVoucherTarget] = useState<any>(null);

  const vSubTotal = vForm.items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.pricePerUnit) || 0), 0);

  const resetVForm = () => setVForm({
    voucherType: 'EXPENSE', expenseFor: '', vendorName: '', vendorId: '' as string, voucherDate: new Date().toISOString().split('T')[0],
    paymentMode: 'CASH', description: '',
    items: [{ itemName: '', quantity: '1', pricePerUnit: '' }],
  });

  const createEntry = useCreateEntry();
  const updateEntry = useUpdateEntry();
  const deleteEntry = useDeleteEntry();

  const { register, handleSubmit, reset, watch, formState: { errors } } =
    useForm({ resolver: zodResolver(entrySchema) });
  const watchType = watch('entryType', 'INCOME');

  const openModal = (target?: AccountEntry) => {
    setEditTarget(target ?? null);
    reset(target ? {
      title:     target.title,
      amount:    target.amount,
      entryType: target.entryType,
      category:  target.category,
      description: target.description ?? '',
      entryDate: target.entryDate,
      reference: target.reference ?? '',
    } : {
      title: '', amount: '', entryType: 'INCOME',
      category: '', description: '', entryDate: new Date().toISOString().split('T')[0], reference: '',
    });
    setEntryModal(true);
  };

  const onSubmit = (values: any) => {
    if (editTarget) {
      updateEntry.mutate({ id: editTarget.id, payload: values },
        { onSuccess: () => { setEntryModal(false); setEditTarget(null); } });
    } else {
      createEntry.mutate(values, { onSuccess: () => setEntryModal(false) });
    }
  };

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(e =>
      e.title.toLowerCase().includes(q) ||
      (e.category ?? '').toLowerCase().includes(q)
    );
  }, [entries, search]);

  const approvedPayments = useMemo(() =>
    payments.filter(p => p.approvalStatus === 'APPROVED'),
    [payments]
  );

  const inputCls = (err?: boolean) =>
    `w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white
     focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
     ${err ? 'border-red-400' : 'border-slate-200 hover:border-slate-300'}`;

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'general',  label: 'General Entries', icon: BookOpen  },
    { id: 'receipts', label: 'Receipts',         icon: Printer   },
    { id: 'ledger',   label: 'Member Ledger',    icon: Users     },
    { id: 'cashbook', label: 'Cash Book',        icon: Wallet    },
    { id: 'funds',    label: 'Funds',            icon: BarChart2 },
    { id: 'payments', label: 'All Payments',     icon: TrendingUp },
    { id: 'bank',     label: 'Bank',             icon: Landmark },
    { id: 'vouchers', label: 'Vouchers',         icon: Receipt },
  ];

  return (
    <div className="page-enter">
      <PageHeader
        title="Accounts"
        subtitle="General ledger, receipts, funds, and financial records"
        actions={
          <div className="flex items-center gap-2">
            {/* General Entries */}
            {tab === 'general' && <>
              <button onClick={() => printAccountEntries(filteredEntries.map(e => ({ date: fmtDate(e.entryDate), description: e.title, entryType: e.entryType, category: e.category, debit: e.entryType === 'EXPENSE' ? e.amount : 0, credit: e.entryType === 'INCOME' ? e.amount : 0, balance: 0, paymentMode: e.reference ?? undefined })))}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button onClick={() => exportAccountsPdf(filteredEntries.map(e => ({ date: fmtDate(e.entryDate), description: e.title, entryType: e.entryType, category: e.category, debit: e.entryType === 'EXPENSE' ? e.amount : 0, credit: e.entryType === 'INCOME' ? e.amount : 0, balance: 0, paymentMode: e.reference ?? undefined })))}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                <Download className="w-4 h-4" /> PDF
              </button>
              <button onClick={() => exportAccountsExcel(filteredEntries.map(e => ({ date: fmtDate(e.entryDate), description: e.title, entryType: e.entryType, category: e.category, debit: e.entryType === 'EXPENSE' ? e.amount : 0, credit: e.entryType === 'INCOME' ? e.amount : 0, balance: 0, paymentMode: e.reference ?? undefined })))}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                <Download className="w-4 h-4" /> Excel
              </button>
              <button onClick={() => openModal()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.25)' }}>
                <Plus className="w-4 h-4" /> Add Entry
              </button>
            </>}
            {/* Cash Book */}
            {tab === 'cashbook' && <>
              <button onClick={() => printCashBook(entries.filter(e => e.category === 'Cash').map(e => ({ date: fmtDate(e.entryDate), description: e.title, entryType: e.entryType, category: e.category, debit: e.entryType === 'EXPENSE' ? e.amount : 0, credit: e.entryType === 'INCOME' ? e.amount : 0, balance: 0 })))}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button onClick={() => exportAccountsPdf(entries.filter(e => e.category === 'Cash').map(e => ({ date: fmtDate(e.entryDate), description: e.title, entryType: e.entryType, category: e.category, debit: e.entryType === 'EXPENSE' ? e.amount : 0, credit: e.entryType === 'INCOME' ? e.amount : 0, balance: 0 })), 'Cash Book')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                <Download className="w-4 h-4" /> PDF
              </button>
              <button onClick={() => exportAccountsExcel(entries.filter(e => e.category === 'Cash').map(e => ({ date: fmtDate(e.entryDate), description: e.title, entryType: e.entryType, category: e.category, debit: e.entryType === 'EXPENSE' ? e.amount : 0, credit: e.entryType === 'INCOME' ? e.amount : 0, balance: 0 })), 'Cash Book')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                <Download className="w-4 h-4" /> Excel
              </button>
            </>}
            {/* Member Ledger */}
            {tab === 'ledger' && ledger && <>
              <button onClick={() => printMemberLedger(ledger.rows.map(r => ({ date: fmtDate(r.date), description: r.description, debit: r.debit, credit: r.credit, balance: r.balance, receiptNumber: r.receiptNumber ?? undefined })), ledger.memberName, ledger.flatNumber)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button onClick={() => {
                const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
                doc.setFontSize(16); doc.setTextColor(26,35,126);
                doc.text(ledger.memberName + ' — Member Ledger', 14, 15);
                doc.setFontSize(10); doc.setTextColor(80,80,80);
                doc.text(ledger.wingName + ' - ' + ledger.flatNumber, 14, 22);
                autoTable(doc, {
                  startY: 30,
                  head: [['Date','Description','Receipt No.','Dr (Billed)','Cr (Paid)','Balance']],
                  body: ledger.rows.map(r => [
                    fmtDate(r.date), r.description, r.receiptNumber ?? '-',
                    r.debit  > 0 ? 'Rs.' + r.debit.toLocaleString('en-IN')  : '-',
                    r.credit > 0 ? 'Rs.' + r.credit.toLocaleString('en-IN') : '-',
                    'Rs.' + Math.abs(r.balance).toLocaleString('en-IN'),
                  ]),
                  headStyles: { fillColor: [26,35,126] },
                  alternateRowStyles: { fillColor: [245,245,245] },
                });
                doc.save('member_ledger_' + ledger.memberName.replace(/\s+/g,'_') + '.pdf');
              }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                <Download className="w-4 h-4" /> PDF
              </button>
            </>}
            {/* Funds */}
            {tab === 'funds' && funds && <>
              <button onClick={() => printFundSummary(funds)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button onClick={() => {
                const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
                doc.setFontSize(16); doc.setTextColor(26,35,126);
                doc.text('Fund Summary', 14, 15);
                doc.setFontSize(9); doc.setTextColor(80,80,80);
                doc.text('Generated: ' + new Date().toLocaleDateString('en-IN'), doc.internal.pageSize.width - 50, 15);
                autoTable(doc, {
                  startY: 25,
                  head: [['Fund', 'Income', 'Expense', 'Balance']],
                  body: [
                    ...funds.funds.map((f: any) => [
                      f.fundName,
                      'Rs.' + f.totalIncome.toLocaleString('en-IN'),
                      'Rs.' + f.totalExpense.toLocaleString('en-IN'),
                      'Rs.' + f.balance.toLocaleString('en-IN'),
                    ]),
                    ['TOTAL', '', '', 'Rs.' + funds.grandTotal.toLocaleString('en-IN')],
                  ],
                  headStyles: { fillColor: [26,35,126] },
                  alternateRowStyles: { fillColor: [245,245,245] },
                });
                doc.save('fund_summary_' + new Date().toISOString().slice(0,10) + '.pdf');
              }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                <Download className="w-4 h-4" /> PDF
              </button>
              <button onClick={() => {
                import('@/lib/utils/printUtils').then(m => {
                  (m as any).saveExcel
                    ? null
                    : null;
                  const XLSX = require('xlsx');
                  const ws = XLSX.utils.json_to_sheet(funds.funds.map((f: any) => ({
                    Fund: f.fundName,
                    Income: f.totalIncome,
                    Expense: f.totalExpense,
                    Balance: f.balance,
                  })));
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, 'Funds');
                  XLSX.writeFile(wb, 'fund_summary_' + new Date().toISOString().slice(0,10) + '.xlsx');
                });
              }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                <Download className="w-4 h-4" /> Excel
              </button>
            </>}

            {/* Bank */}
            {tab === 'bank' && (
              <button onClick={() => { setEditBankAccount(null); setBankForm({ accountName: '', bankName: '', accountNumber: '', branch: '', openingBalance: '' }); setBankAccountModal(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.25)' }}>
                <Plus className="w-4 h-4" /> Add Bank Account
              </button>
            )}
            {/* All Payments */}
            {tab === 'payments' && <>
              <button onClick={() => printPayments(payments.map(p => ({ receiptNumber: p.receiptNumber, memberName: p.memberName, flatNumber: p.flatNumber, wingName: p.wingName, billMonth: p.billMonth, amount: p.amountPaid, amountPaid: p.amountPaid, paymentMode: p.paymentMode, approvalStatus: p.approvalStatus, paymentDate: p.paymentDate })))}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button onClick={() => exportPaymentsPdf(payments.map(p => ({ receiptNumber: p.receiptNumber, memberName: p.memberName, flatNumber: p.flatNumber, wingName: p.wingName, billMonth: p.billMonth, amount: p.amountPaid, amountPaid: p.amountPaid, paymentMode: p.paymentMode, approvalStatus: p.approvalStatus, paymentDate: p.paymentDate })))}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                <Download className="w-4 h-4" /> PDF
              </button>
              <button onClick={() => exportPaymentsCsv(payments.map(p => ({ receiptNumber: p.receiptNumber, memberName: p.memberName, flatNumber: p.flatNumber, wingName: p.wingName, billMonth: p.billMonth, amount: p.amountPaid, amountPaid: p.amountPaid, paymentMode: p.paymentMode, approvalStatus: p.approvalStatus, paymentDate: p.paymentDate })))}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                <Download className="w-4 h-4" /> CSV
              </button>
            </>}
          </div>
        }
      />

      {/* Summary strip */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Opening Balance', value: summary.openingBalance, color: '#64748b', icon: <Wallet className="w-4 h-4" /> },
            { label: 'Total Income',    value: summary.totalIncome,    color: '#22c55e', icon: <TrendingUp className="w-4 h-4" /> },
            { label: 'Total Expense',   value: summary.totalExpense,   color: '#ef4444', icon: <TrendingDown className="w-4 h-4" /> },
            { label: 'Balance',         value: summary.closingBalance,
              color: summary.closingBalance >= 0 ? '#3b82f6' : '#ef4444',
              icon: <BookOpen className="w-4 h-4" /> },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500">{c.label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                     style={{ background: `${c.color}18`, color: c.color }}>{c.icon}</div>
              </div>
              <p className="text-xl font-bold" style={{ color: c.color }}>{INR(c.value)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 mb-5 bg-slate-100 p-1 rounded-xl">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
              ${tab === id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: General Entries ─────────────────────────────────────────── */}
      {tab === 'general' && (
        <div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search entries…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          </div>
          {entriesLoading ? <Skel /> : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 border-b border-slate-200">
                  {['Date','Title','Category','Type','Amount','Reference','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEntries.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(e.entryDate)}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 max-w-[160px] truncate">{e.title}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{e.category}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-md font-medium
                          ${e.entryType === 'INCOME' ? 'bg-green-50 text-green-700' :
                            e.entryType === 'EXPENSE' ? 'bg-red-50 text-red-600' :
                            'bg-slate-100 text-slate-500'}`}>
                          {e.entryType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className={`px-4 py-3 font-semibold whitespace-nowrap
                        ${e.entryType === 'INCOME' ? 'text-green-600' : e.entryType === 'EXPENSE' ? 'text-red-500' : 'text-slate-600'}`}>
                        {e.entryType === 'INCOME' ? '+' : e.entryType === 'EXPENSE' ? '-' : ''}{INR(e.amount)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 font-mono">{e.reference ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => openModal(e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredEntries.length === 0 && <Empty msg="No entries. Click 'Add Entry' to start." />}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: Maintenance Receipts ───────────────────────────────────── */}
      {tab === 'receipts' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              {['Receipt No.','Member','Flat','Month','Amount','Mode','Date','Print'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {approvedPayments.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">{p.receiptNumber}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{p.memberName}</td>
                  <td className="px-4 py-3 text-slate-600">{p.wingName} – {p.flatNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{p.billMonth}</td>
                  <td className="px-4 py-3 font-semibold text-green-600">{INR(p.amountPaid)}</td>
                  <td className="px-4 py-3"><StatusBadge value={p.paymentMode} /></td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(p.paymentDate)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => printReceipt(p)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                      <Printer className="w-3 h-3" /> Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {approvedPayments.length === 0 && <Empty msg="No approved receipts yet." />}
        </div>
      )}

      {/* ── TAB 3: Member Ledger ──────────────────────────────────────────── */}
      {tab === 'ledger' && (
        <div>
          <div className="flex gap-3 mb-4">
            <select value={ledgerMember ?? ''}
              onChange={e => setLedgerMember(e.target.value ? Number(e.target.value) : null)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/30 min-w-64">
              <option value="">Select a member…</option>
              {members.filter(m => m.isActive).map(m => (
                <option key={m.id} value={m.id}>
                  {m.fullName} {m.flat ? `(${m.flat.wingName} – ${m.flat.flatNumber})` : ''}
                </option>
              ))}
              {members.some(m => !m.isActive) && (
                <optgroup label="── Moved Out ──">
                  {members.filter(m => !m.isActive).map(m => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} {m.flat ? `(${m.flat.wingName} – ${m.flat.flatNumber})` : ''} [Moved Out]
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {ledgerLoading && <Skel />}
          {ledger && (
            <div>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-500 mb-1">Total Billed (Dr)</p>
                  <p className="text-xl font-bold text-red-500">{INR(ledger.totalDebits)}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-500 mb-1">Total Paid (Cr)</p>
                  <p className="text-xl font-bold text-green-600">{INR(ledger.totalCredits)}</p>
                </div>
                <div className={`rounded-xl border p-4 ${ledger.hasAdvance ? 'bg-blue-50 border-blue-100' : 'bg-white border-slate-200'}`}>
                  <p className="text-xs text-slate-500 mb-1">
                    {ledger.hasAdvance ? 'Advance (Overpaid)' : 'Balance Due'}
                  </p>
                  <p className={`text-xl font-bold ${ledger.hasAdvance ? 'text-blue-600' : 'text-amber-600'}`}>
                    {INR(Math.abs(ledger.closingBalance))}
                  </p>
                  {ledger.hasAdvance && (
                    <p className="text-xs text-blue-500 mt-0.5">Member has paid in advance</p>
                  )}
                </div>
              </div>

              {/* Ledger table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">{ledger.memberName}</p>
                  <p className="text-xs text-slate-400">{ledger.wingName} – {ledger.flatNumber}</p>
                </div>
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50 border-b border-slate-200">
                    {['Date','Description','Dr (Billed)','Cr (Paid)','Balance'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {ledger.rows.map((row, i) => (
                      <tr key={i} className={`transition-colors
                        ${row.type === 'BILL' ? 'hover:bg-red-50/30' : 'hover:bg-green-50/30'}`}>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(row.date)}</td>
                        <td className="px-4 py-3 text-slate-700">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                              ${row.type === 'BILL' ? 'bg-red-400' : 'bg-green-400'}`} />
                            {row.description}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-red-500">
                          {row.debit > 0 ? INR(row.debit) : '—'}
                        </td>
                        <td className="px-4 py-3 font-medium text-green-600">
                          {row.credit > 0 ? INR(row.credit) : '—'}
                        </td>
                        <td className={`px-4 py-3 font-semibold ${row.balance < 0 ? 'text-blue-600' : row.balance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                          {INR(Math.abs(row.balance))}
                          {row.balance < 0 && <span className="text-xs ml-1 font-normal text-blue-400">(Adv)</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {ledger.rows.length === 0 && <Empty msg="No transactions for this member." />}
              </div>
            </div>
          )}
          {!ledgerMember && !ledger && (
            <div className="flex flex-col items-center py-20 bg-white rounded-xl border border-slate-200">
              <Users className="w-8 h-8 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">Select a member above to view their ledger.</p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: Cash Book (simplified — full version via Reports) ─────── */}
      {tab === 'cashbook' && (
        <div>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-xs text-blue-600">
              This shows Cash + Cheque entries. For the full date-range Cash Book report with running balance, go to the Reports page → Financial tab.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                {['Date','Particulars','Type','Receipts','Payments'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {entries.filter(e => e.category === 'Cash').map(e => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(e.entryDate)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{e.title}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{e.entryType}</td>
                    <td className="px-4 py-3 font-medium text-green-600">
                      {e.entryType === 'INCOME' ? INR(e.amount) : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-red-500">
                      {e.entryType === 'EXPENSE' ? INR(e.amount) : '—'}
                    </td>
                  </tr>
                ))}
                {approvedPayments.filter(p => p.paymentMode === 'CASH' || p.paymentMode === 'CHEQUE').map(p => (
                  <tr key={`p-${p.id}`} className="hover:bg-green-50/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(p.paymentDate)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">Maint. Receipt – {p.memberName}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{p.paymentMode}</td>
                    <td className="px-4 py-3 font-medium text-green-600">{INR(p.amountPaid)}</td>
                    <td className="px-4 py-3 text-slate-400">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 5: Fund Management ────────────────────────────────────────── */}
      {tab === 'funds' && funds && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {funds.funds.map(f => (
              <div key={f.fundName} onClick={() => setFundDrill(f.fundName)}
                className="bg-white rounded-xl border border-slate-200 p-5 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{f.fundName}</p>
                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Income</span>
                    <span className="text-green-600 font-medium">{INR(f.totalIncome)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Expense</span>
                    <span className="text-red-500 font-medium">{INR(f.totalExpense)}</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-100 flex justify-between text-sm">
                    <span className="font-semibold text-slate-700">Balance</span>
                    <span className={`font-bold ${f.balance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                      {INR(f.balance)}
                    </span>
                  </div>
                </div>
                {/* Mini progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-blue-400"
                       style={{ width: f.totalIncome > 0 ? `${Math.min((f.balance / f.totalIncome) * 100, 100)}%` : '0%' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Total Funds Balance</span>
            <span className="text-xl font-bold text-blue-600">{INR(funds.grandTotal)}</span>
          </div>
          <p className="mt-4 text-xs text-slate-400 text-center">
            Add fund entries via the General Entries tab — use 'Sinking Fund', 'Repair Fund', 'Corpus Fund', or 'Reserve Fund' as the category.
          </p>
        </div>
      )}

      {/* ── TAB 6: All Payments ───────────────────────────────────────────── */}
      {tab === 'payments' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              {['Receipt','Member','Flat','Month','Amount','Mode','Status','Date'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">{p.receiptNumber}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{p.memberName}</td>
                  <td className="px-4 py-3 text-slate-600">{p.wingName} – {p.flatNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{p.billMonth}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{INR(p.amountPaid)}</td>
                  <td className="px-4 py-3 text-slate-600">{p.paymentMode}</td>
                  <td className="px-4 py-3"><StatusBadge value={p.approvalStatus} /></td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(p.paymentDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && <Empty msg="No payments recorded." />}
        </div>
      )}

      {/* ── Entry Form Modal ──────────────────────────────────────────────── */}
      {entryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
             onClick={() => setEntryModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
               onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-semibold text-slate-800">
                {editTarget ? 'Edit Entry' : 'New Account Entry'}
              </h3>
              <button onClick={() => setEntryModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
                <input type="text" autoFocus className={inputCls(!!errors.title)}
                  placeholder="e.g. April maintenance collection" {...register('title')} />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message as string}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Entry Type *</label>
                  <select className={inputCls()} {...register('entryType')}>
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                    <option value="OPENING_BALANCE">Opening Balance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Category *</label>
                  <select className={inputCls(!!errors.category)} {...register('category')}>
                    <option value="">Select…</option>
                    {watchType === 'INCOME'
                      ? INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
                      : watchType === 'EXPENSE'
                      ? EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
                      : ['Cash', 'Bank'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message as string}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (₹) *</label>
                  <input type="number" step="0.01" min="0.01" className={inputCls(!!errors.amount)} {...register('amount')} />
                  {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Date *</label>
                  <input type="date" className={inputCls(!!errors.entryDate)} {...register('entryDate')} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Reference / Cheque No.</label>
                <input type="text" placeholder="Optional" className={inputCls()} {...register('reference')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea rows={2} className={`${inputCls()} resize-none`}
                  placeholder="Optional notes…" {...register('description')} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEntryModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={createEntry.isPending || updateEntry.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                  {(createEntry.isPending || updateEntry.isPending) &&
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  {editTarget ? 'Save Changes' : 'Add Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fund Drill-Down Modal */}
      {fundDrill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
             onClick={() => setFundDrill(null)}>
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl max-h-[85vh] flex flex-col"
               onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">{fundDrill}</p>
                <h3 className="text-base font-semibold text-slate-800 mt-0.5">Fund Entries</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printAccountEntries(
                    entries.filter(e => e.category === fundDrill).map(e => ({
                      date: fmtDate(e.entryDate), description: e.title,
                      entryType: e.entryType, category: e.category,
                      debit:  e.entryType === 'EXPENSE' ? e.amount : 0,
                      credit: e.entryType === 'INCOME'  ? e.amount : 0,
                      balance: 0,
                    })),
                    fundDrill
                  )}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button onClick={() => setFundDrill(null)}
                  className="text-slate-400 hover:text-slate-600 p-1">✕</button>
              </div>
            </div>

            {/* Summary strip */}
            {(() => {
              const fundData = funds?.funds.find(f => f.fundName === fundDrill);
              if (!fundData) return null;
              return (
                <div className="grid grid-cols-3 gap-3 px-6 py-3 bg-slate-50 border-b border-slate-100">
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Income</p>
                    <p className="text-base font-bold text-green-600">{INR(fundData.totalIncome)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Expense</p>
                    <p className="text-base font-bold text-red-500">{INR(fundData.totalExpense)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Balance</p>
                    <p className={`text-base font-bold ${fundData.balance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>{INR(fundData.balance)}</p>
                  </div>
                </div>
              );
            })()}

            {/* Entries table */}
            <div className="overflow-y-auto flex-1">
              {(() => {
                const drillEntries = entries.filter(e => e.category === fundDrill);
                if (drillEntries.length === 0) return (
                  <div className="flex flex-col items-center py-16">
                    <p className="text-sm text-slate-400">No entries for {fundDrill}.</p>
                  </div>
                );
                return (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0">
                      <tr className="bg-slate-50 border-b border-slate-200">
                        {['Date','Title','Type','Reference','Amount'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {drillEntries.map(e => (
                        <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(e.entryDate)}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{e.title}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-md font-medium
                              ${e.entryType === 'INCOME' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                              {e.entryType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400 font-mono">{e.reference ?? '—'}</td>
                          <td className={`px-4 py-3 font-semibold whitespace-nowrap
                            ${e.entryType === 'INCOME' ? 'text-green-600' : 'text-red-500'}`}>
                            {e.entryType === 'INCOME' ? '+' : '-'}{INR(e.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t-2 border-slate-200">
                        <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-slate-500">
                          {drillEntries.length} entries
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-700">
                          {INR(drillEntries.filter(e => e.entryType === 'INCOME').reduce((s,e) => s+e.amount, 0) -
                               drillEntries.filter(e => e.entryType === 'EXPENSE').reduce((s,e) => s+e.amount, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Bank ── */}
      {tab === 'bank' && (
        <div>
          {/* Account Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {bankAccounts.map(acc => (
              <div key={acc.id}
                onClick={() => setSelBankAccount(selBankAccount === acc.id ? null : acc.id)}
                className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all
                  ${selBankAccount === acc.id ? 'border-blue-400 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-50">
                    <Landmark className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={e => { e.stopPropagation(); setEditBankAccount(acc); setBankForm({ accountName: acc.accountName, bankName: acc.bankName, accountNumber: acc.accountNumber ?? '', branch: acc.branch ?? '', openingBalance: String(acc.openingBalance) }); setBankAccountModal(true); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); deleteBankAccount.mutate(acc.id); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="font-semibold text-slate-800 text-sm">{acc.accountName}</p>
                <p className="text-xs text-slate-400 mb-2">{acc.bankName}{acc.accountNumber ? ' · ' + acc.accountNumber : ''}</p>
                <p className={`text-xl font-bold ${acc.currentBalance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                  {INR(acc.currentBalance)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Current Balance</p>
              </div>
            ))}
            {bankAccounts.length === 0 && (
              <div className="col-span-3 flex flex-col items-center py-16 bg-white rounded-xl border border-slate-200">
                <Landmark className="w-8 h-8 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">No bank accounts yet. Click "Add Bank Account".</p>
              </div>
            )}
          </div>

          {/* Transactions */}
          {selBankAccount && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-700">
                  Transactions — {bankAccounts.find(a => a.id === selBankAccount)?.accountName}
                </p>
                <button onClick={() => { setTxnForm({ transactionType: 'DEPOSIT', amount: '', description: '', transactionDate: new Date().toISOString().split('T')[0], reference: '', contraEntry: false }); setTxnModal(true); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white"
                  style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                  <Plus className="w-4 h-4" /> Add Transaction
                </button>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50 border-b border-slate-200">
                    {['Date','Description','Reference','Deposit','Withdrawal','Balance',''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {bankTxns.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(t.transactionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{t.description ?? '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{t.reference ?? '—'}</td>
                        <td className="px-4 py-3 font-medium text-green-600">
                          {t.transactionType === 'DEPOSIT' ? INR(t.amount) : '—'}
                        </td>
                        <td className="px-4 py-3 font-medium text-red-500">
                          {t.transactionType === 'WITHDRAWAL' ? INR(t.amount) : '—'}
                        </td>
                        <td className={`px-4 py-3 font-semibold ${t.runningBalance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                          {INR(t.runningBalance)}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => deleteBankTxn.mutate(t.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {bankTxns.length === 0 && <Empty msg="No transactions yet. Click 'Add Transaction'." />}
              </div>
            </div>
          )}

          {/* Add/Edit Bank Account Modal */}
          {bankAccountModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                 style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
                 onClick={() => setBankAccountModal(false)}>
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <p className="font-semibold text-slate-800 mb-5">{editBankAccount ? 'Edit Bank Account' : 'Add Bank Account'}</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Account Name *</label>
                    <input type="text" placeholder="e.g. ADCC Main Account" className={inputCls()}
                      value={bankForm.accountName} onChange={e => setBankForm(f => ({ ...f, accountName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Bank Name *</label>
                    <input type="text" placeholder="e.g. ADCC Bank, SBI, HDFC" className={inputCls()}
                      value={bankForm.bankName} onChange={e => setBankForm(f => ({ ...f, bankName: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Account Number</label>
                      <input type="text" className={inputCls()}
                        value={bankForm.accountNumber} onChange={e => setBankForm(f => ({ ...f, accountNumber: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Branch</label>
                      <input type="text" className={inputCls()}
                        value={bankForm.branch} onChange={e => setBankForm(f => ({ ...f, branch: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Opening Balance (₹)</label>
                    <input type="number" min="0" className={inputCls()}
                      value={bankForm.openingBalance} onChange={e => setBankForm(f => ({ ...f, openingBalance: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setBankAccountModal(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const req = { ...bankForm, openingBalance: Number(bankForm.openingBalance) || 0 };
                      if (editBankAccount) {
                        updateBankAccount.mutate({ id: editBankAccount.id, req }, { onSuccess: () => setBankAccountModal(false) });
                      } else {
                        createBankAccount.mutate(req, { onSuccess: () => setBankAccountModal(false) });
                      }
                    }}
                    disabled={!bankForm.accountName.trim() || !bankForm.bankName.trim()}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                    {editBankAccount ? 'Save Changes' : 'Add Account'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Transaction Modal */}
          {txnModal && selBankAccount && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                 style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
                 onClick={() => setTxnModal(false)}>
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <p className="font-semibold text-slate-800 mb-5">Add Transaction</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {['DEPOSIT', 'WITHDRAWAL'].map(type => (
                      <button key={type} onClick={() => setTxnForm(f => ({ ...f, transactionType: type }))}
                        className={`py-2.5 rounded-xl text-sm font-medium transition-all
                          ${txnForm.transactionType === type
                            ? type === 'DEPOSIT'
                              ? 'bg-green-500 text-white'
                              : 'bg-red-500 text-white'
                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        {type === 'DEPOSIT' ? '↓ Deposit' : '↑ Withdrawal'}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (₹) *</label>
                    <input type="number" min="0" className={inputCls()}
                      value={txnForm.amount} onChange={e => setTxnForm(f => ({ ...f, amount: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                    <input type="date" className={inputCls()}
                      value={txnForm.transactionDate} onChange={e => setTxnForm(f => ({ ...f, transactionDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                    <input type="text" className={inputCls()} placeholder="e.g. Maintenance collection"
                      value={txnForm.description} onChange={e => setTxnForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Reference / Cheque No.</label>
                    <input type="text" className={inputCls()}
                      value={txnForm.reference} onChange={e => setTxnForm(f => ({ ...f, reference: e.target.value }))} />
                  </div>

                  {/* Contra Entry Toggle */}
                  <div className={`p-3 rounded-xl border transition-all ${txnForm.contraEntry ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={txnForm.contraEntry}
                        onChange={e => setTxnForm(f => ({ ...f, contraEntry: e.target.checked }))}
                        className="w-4 h-4 rounded" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {txnForm.transactionType === 'WITHDRAWAL' ? 'Transfer to Cash Book' : 'Transfer from Cash Book'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {txnForm.transactionType === 'WITHDRAWAL'
                            ? 'Bank कमी होईल + Cash Book मध्ये entry येईल (Contra)'
                            : 'Bank वाढेल + Cash Book मधून entry जाईल (Contra)'}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setTxnModal(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!txnForm.amount) return;
                      addBankTransaction.mutate({
                        bankAccountId: selBankAccount,
                        transactionType: txnForm.transactionType,
                        amount: Number(txnForm.amount),
                        description: txnForm.description || undefined,
                        transactionDate: txnForm.transactionDate || undefined,
                        reference: txnForm.reference || undefined,
                        contraEntry: txnForm.contraEntry,
                      }, { onSuccess: () => setTxnModal(false) });
                    }}
                    disabled={!txnForm.amount || addBankTransaction.isPending}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                    style={{ background: txnForm.transactionType === 'DEPOSIT'
                      ? 'linear-gradient(135deg,#22c55e,#16a34a)'
                      : 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
                    Add {txnForm.transactionType === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Vouchers ── */}
      {tab === 'vouchers' && (
        <div>
          <div className="flex gap-2 mb-4">
            {[
              { type: 'ALL',     label: 'All',           color: 'bg-slate-100 text-slate-700' },
              { type: 'EXPENSE', label: 'Expense (EXP)', color: 'bg-red-50 text-red-700' },
              { type: 'RECEIPT', label: 'Receipt (RCP)', color: 'bg-green-50 text-green-700' },
            ].map(({ type, label, color }) => (
              <button key={type}
                onClick={() => setVForm(f => ({ ...f, _filter: type } as any))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${(vForm as any)._filter === type || (!((vForm as any)._filter) && type === 'ALL') ? color + ' border-current' : 'bg-white text-slate-500 border-slate-200'}`}>
                {label}
              </button>
            ))}
            <div className="ml-auto flex gap-2">
              {[
                { type: 'EXPENSE', label: 'New Expense', color: '#ef4444' },
                { type: 'RECEIPT', label: 'New Receipt', color: '#22c55e' },
              ].map(({ type, label, color }) => (
                <button key={type}
                  onClick={() => { resetVForm(); setVForm(f => ({ ...f, voucherType: type })); setVoucherModal(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                  style={{ background: color }}>
                  <Plus className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                {['Voucher No.','Type','Date','Description','Vendor','Amount','Mode','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {vouchers
                  .filter(v => !(vForm as any)._filter || (vForm as any)._filter === 'ALL' || v.voucherType === (vForm as any)._filter)
                  .map(v => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 font-medium">{v.voucherNumber}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium
                        ${v.voucherType === 'EXPENSE' ? 'bg-red-50 text-red-600' :
                          v.voucherType === 'PAYMENT' ? 'bg-amber-50 text-amber-700' :
                          'bg-green-50 text-green-700'}`}>
                        {v.voucherType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(v.voucherDate)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{v.expenseFor}</td>
                    <td className="px-4 py-3 text-slate-600">{v.vendorName ?? '—'}</td>
                    <td className={`px-4 py-3 font-semibold ${v.voucherType === 'RECEIPT' ? 'text-green-600' : 'text-red-500'}`}>{INR(v.totalAmount)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{v.paymentMode}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setViewVoucher(v)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                          <Printer className="w-3.5 h-3.5" /> View
                        </button>
                        <button onClick={() => setDeleteVoucherTarget(v)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {vouchers.length === 0 && <Empty msg="No vouchers yet. Click 'New Voucher' to create one." />}
          </div>

          {/* New Voucher Modal */}
          {voucherModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                 style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
                 onClick={() => setVoucherModal(false)}>
              <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
                   onClick={e => e.stopPropagation()}>
                <p className="font-semibold text-slate-800 mb-5">
                  {vForm.voucherType === 'RECEIPT' ? 'New Receipt Voucher' : vForm.voucherType === 'PAYMENT' ? 'New Payment Voucher' : 'New Expense Voucher'}
                </p>
                <div className="flex gap-2 mb-4">
                  {[
                    { type: 'EXPENSE', label: 'Expense', color: '#ef4444' },
                    { type: 'RECEIPT', label: 'Receipt', color: '#22c55e' },
                  ].map(({ type, label, color }) => (
                    <button key={type} onClick={() => setVForm(f => ({ ...f, voucherType: type }))}
                      className="flex-1 py-2 rounded-lg text-xs font-medium transition-all border"
                      style={vForm.voucherType === type ? { background: color, color: '#fff', borderColor: color } : { background: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' }}>
                      {label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      {vForm.voucherType === 'RECEIPT' ? 'Income From *' : 'Expense For *'}
                    </label>
                    <input type="text"
                      placeholder={vForm.voucherType === 'RECEIPT' ? 'e.g. Hall Rent, Interest, Penalty' : 'e.g. Water Tank Cleaning'}
                      className={inputCls()}
                      value={vForm.expenseFor} onChange={e => setVForm(f => ({ ...f, expenseFor: e.target.value }))} />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      {vForm.voucherType === 'RECEIPT' ? 'Received From' : 'Vendor / Paid To'}
                    </label>
                    <input type="text"
                      placeholder="Type name to search or add new…"
                      className={inputCls()}
                      value={vForm.vendorName}
                      onChange={e => setVForm(f => ({ ...f, vendorName: e.target.value, vendorId: '' }))}
                      autoComplete="off"
                    />
                    {vForm.vendorName && vendors.filter(v => v.name.toLowerCase().includes(vForm.vendorName.toLowerCase())).length > 0 && !vForm.vendorId && (
                      <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                        {vendors
                          .filter(v => v.name.toLowerCase().includes(vForm.vendorName.toLowerCase()))
                          .map(v => (
                            <button key={v.id} type="button"
                              onClick={() => setVForm(f => ({ ...f, vendorId: String(v.id), vendorName: v.name }))}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                              <span className="font-medium text-slate-800">{v.name}</span>
                              {v.vendorType && <span className="text-xs text-slate-400 ml-2">— {v.vendorType}</span>}
                            </button>
                          ))
                        }
                      </div>
                    )}
                    {vForm.vendorName && !vForm.vendorId && vendors.filter(v => v.name.toLowerCase() === vForm.vendorName.toLowerCase()).length === 0 && (
                      <p className="text-xs text-blue-500 mt-1">New vendor — will be saved automatically on submit</p>
                    )}
                    {vForm.vendorId && (
                      <button onClick={() => setVForm(f => ({ ...f, vendorId: '', vendorName: '' }))}
                        className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 text-xs">✕</button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                    <input type="date" className={inputCls()}
                      value={vForm.voucherDate} onChange={e => setVForm(f => ({ ...f, voucherDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Mode</label>
                    <select className={inputCls()} value={vForm.paymentMode}
                      onChange={e => setVForm(f => ({ ...f, paymentMode: e.target.value }))}>
                      <option value="CASH">Cash</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="UPI">UPI</option>
                      <option value="NEFT">NEFT/Bank Transfer</option>
                    </select>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-700">Items</label>
                    <button onClick={() => setVForm(f => ({ ...f, items: [...f.items, { itemName: '', quantity: '1', pricePerUnit: '' }] }))}
                      className="text-xs text-blue-600 font-medium hover:text-blue-700">+ Add Item</button>
                  </div>
                  <div className="space-y-2">
                    {vForm.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <input type="text" placeholder="Item name" className={`${inputCls()} col-span-5`}
                          value={item.itemName}
                          onChange={e => setVForm(f => ({ ...f, items: f.items.map((it, i) => i === idx ? { ...it, itemName: e.target.value } : it) }))} />
                        <input type="number" min="0" placeholder="Qty" className={`${inputCls()} col-span-2`}
                          value={item.quantity}
                          onChange={e => setVForm(f => ({ ...f, items: f.items.map((it, i) => i === idx ? { ...it, quantity: e.target.value } : it) }))} />
                        <input type="number" min="0" placeholder="Price/Unit" className={`${inputCls()} col-span-3`}
                          value={item.pricePerUnit}
                          onChange={e => setVForm(f => ({ ...f, items: f.items.map((it, i) => i === idx ? { ...it, pricePerUnit: e.target.value } : it) }))} />
                        <span className="col-span-1 text-xs text-slate-600 font-medium text-right">
                          {INR((Number(item.quantity) || 0) * (Number(item.pricePerUnit) || 0))}
                        </span>
                        {vForm.items.length > 1 && (
                          <button onClick={() => setVForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))}
                            className="col-span-1 text-slate-400 hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end mb-4">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Total Amount</p>
                    <p className="text-xl font-bold text-slate-800">{INR(vSubTotal)}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Description / Notes</label>
                  <textarea rows={2} className={`${inputCls()} resize-none`} placeholder="Optional notes…"
                    value={vForm.description} onChange={e => setVForm(f => ({ ...f, description: e.target.value }))} />
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setVoucherModal(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!vForm.expenseFor.trim() || vForm.items.some(it => !it.itemName.trim())) return;
                      createVoucher.mutate({
                        voucherType: vForm.voucherType,
                        expenseFor: vForm.expenseFor,
                        vendorName: vForm.vendorName || undefined,
                        vendorId: vForm.vendorId ? Number(vForm.vendorId) : undefined,
                        voucherDate: vForm.voucherDate,
                        paymentMode: vForm.paymentMode,
                        description: vForm.description || undefined,
                        paidAmount: vSubTotal,
                        items: vForm.items.map(it => ({
                          itemName: it.itemName,
                          quantity: Number(it.quantity) || 1,
                          pricePerUnit: Number(it.pricePerUnit) || 0,
                        })),
                      }, { onSuccess: () => setVoucherModal(false) });
                    }}
                    disabled={!vForm.expenseFor.trim() || createVoucher.isPending}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                    Create Voucher
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* View / Print Voucher Modal */}
          {viewVoucher && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                 style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
                 onClick={() => setViewVoucher(null)}>
              <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
                   onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <p className="font-semibold text-slate-800">Voucher {viewVoucher.voucherNumber}</p>
                  <button
                    onClick={() => {
                      const w = window.open('', '_blank', 'width=700,height=800');
                      if (!w) return;
                      const rows = viewVoucher.items.map((it: any, i: number) =>
                        '<tr><td>' + (i+1) + '</td><td>' + it.itemName + '</td><td style="text-align:center">' + it.quantity + '</td>' +
                        '<td style="text-align:right">Rs.' + Number(it.pricePerUnit).toLocaleString('en-IN') + '</td>' +
                        '<td style="text-align:right">Rs.' + Number(it.amount).toLocaleString('en-IN') + '</td></tr>'
                      ).join('');
                      w.document.write('<!DOCTYPE html><html><head><title>Expense Voucher</title>' +
                        '<style>body{font-family:Arial;padding:32px;color:#1e293b}h2{text-align:center;margin-bottom:16px}' +
                        '.box{border:1px solid #cbd5e1;border-radius:6px;overflow:hidden;margin-bottom:16px}' +
                        '.head{background:#f1f5f9;padding:10px 16px;font-weight:700;font-size:16px}' +
                        '.sub{padding:0 16px 10px;font-size:13px;color:#64748b}' +
                        'table{width:100%;border-collapse:collapse;font-size:13px}' +
                        'th{background:#f8fafc;border:1px solid #e2e8f0;padding:7px 10px;text-align:left}' +
                        'td{border:1px solid #e2e8f0;padding:7px 10px}' +
                        '.totals td{font-weight:700}' +
                        '.sig{margin-top:60px;text-align:right;font-size:13px}' +
                        '@media print{@page{margin:1.5cm}}</style></head><body>' +
                        '<h2>Expense Voucher</h2>' +
                        '<div class="box"><div class="head">' + (settings2?.societyName ?? 'Society') + '</div>' +
                        '<div class="sub">Email: ' + (settings2?.contactEmail ?? '-') + '</div></div>' +
                        '<table style="margin-bottom:16px"><tr><td style="font-weight:600">Expense For</td><td>' + viewVoucher.expenseFor + '</td>' +
                        '<td style="font-weight:600">Date</td><td>' + fmtDate(viewVoucher.voucherDate) + '</td></tr></table>' +
                        '<table><thead><tr><th>#</th><th>Item Name</th><th>Qty</th><th>Price/Unit</th><th>Amount</th></tr></thead>' +
                        '<tbody>' + rows + '</tbody>' +
                        '<tfoot class="totals">' +
                        '<tr><td colspan="4" style="text-align:right">Sub Total</td><td style="text-align:right">Rs.' + Number(viewVoucher.subTotal).toLocaleString('en-IN') + '</td></tr>' +
                        '<tr><td colspan="4" style="text-align:right">Total</td><td style="text-align:right">Rs.' + Number(viewVoucher.totalAmount).toLocaleString('en-IN') + '</td></tr>' +
                        '<tr><td colspan="4" style="text-align:right">Paid</td><td style="text-align:right">Rs.' + Number(viewVoucher.paidAmount).toLocaleString('en-IN') + '</td></tr>' +
                        '<tr><td colspan="4" style="text-align:right">Balance</td><td style="text-align:right">Rs.' + Number(viewVoucher.balanceAmount).toLocaleString('en-IN') + '</td></tr>' +
                        '</tfoot></table>' +
                        (viewVoucher.vendorName ? '<p style="margin-top:12px;font-size:13px"><b>Paid To:</b> ' + viewVoucher.vendorName + '</p>' : '') +
                        (viewVoucher.description ? '<p style="font-size:13px"><b>Description:</b> ' + viewVoucher.description + '</p>' : '') +
                        '<div class="sig">Authorized Signatory</div>' +
                        '<script>window.onload=function(){window.print()}</script></body></html>');
                      w.document.close();
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-500 hover:bg-blue-600">
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                </div>
                <div className="space-y-1 mb-4 text-sm">
                  <p><span className="text-slate-500">Expense For:</span> <span className="font-medium">{viewVoucher.expenseFor}</span></p>
                  <p><span className="text-slate-500">Date:</span> {fmtDate(viewVoucher.voucherDate)}</p>
                  {viewVoucher.vendorName && <p><span className="text-slate-500">Vendor:</span> {viewVoucher.vendorName}</p>}
                </div>
                <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden mb-4">
                  <thead><tr className="bg-slate-50 border-b border-slate-200">
                    {['Item','Qty','Price/Unit','Amount'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewVoucher.items.map((it: any) => (
                      <tr key={it.id}>
                        <td className="px-3 py-2">{it.itemName}</td>
                        <td className="px-3 py-2">{it.quantity}</td>
                        <td className="px-3 py-2">{INR(it.pricePerUnit)}</td>
                        <td className="px-3 py-2 font-medium">{INR(it.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-right text-sm space-y-1">
                  <p>Total: <span className="font-bold">{INR(viewVoucher.totalAmount)}</span></p>
                  <p>Paid: <span className="font-medium text-green-600">{INR(viewVoucher.paidAmount)}</span></p>
                  <p>Balance: <span className="font-medium text-red-500">{INR(viewVoucher.balanceAmount)}</span></p>
                </div>
                <button onClick={() => setViewVoucher(null)}
                  className="w-full mt-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteVoucherTarget} title="Delete Voucher"
        description={`Delete voucher "${deleteVoucherTarget?.voucherNumber}"? The linked account entry will also be removed.`}
        confirmLabel="Delete" loading={deleteVoucher.isPending}
        onConfirm={() => deleteVoucher.mutate(deleteVoucherTarget!.id, { onSuccess: () => setDeleteVoucherTarget(null) })}
        onCancel={() => setDeleteVoucherTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget} title="Delete Entry"
        description={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete" loading={deleteEntry.isPending}
        onConfirm={() => deleteEntry.mutate(deleteTarget!.id, { onSuccess: () => setDeleteTarget(null) })}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function printFundSummary(funds: any) {
  const w = window.open("", "_blank", "width=800,height=600");
  if (!w) return;
  const rows = funds.funds.map((f: any) => {
    const bal = f.balance >= 0 ? "#1d4ed8" : "#dc2626";
    return "<tr><td>" + f.fundName + "</td>"
      + "<td style=\"text-align:right;color:#16a34a\">Rs." + f.totalIncome.toLocaleString("en-IN") + "</td>"
      + "<td style=\"text-align:right;color:#dc2626\">Rs." + f.totalExpense.toLocaleString("en-IN") + "</td>"
      + "<td style=\"text-align:right;font-weight:bold;color:" + bal + "\">Rs." + f.balance.toLocaleString("en-IN") + "</td></tr>";
  }).join("");
  const html = "<!DOCTYPE html><html><head><title>Fund Summary</title>"
    + "<style>body{font-family:Arial;padding:24px}h2{color:#1a237e}"
    + "table{width:100%;border-collapse:collapse;font-size:13px}"
    + "th{background:#1a237e;color:#fff;padding:8px 12px;text-align:left}"
    + "td{padding:8px 12px;border-bottom:1px solid #e0e0e0}"
    + "tfoot td{font-weight:bold;background:#f1f5f9}</style></head>"
    + "<body><h2>Fund Summary</h2><table><thead>"
    + "<tr><th>Fund</th><th>Income</th><th>Expense</th><th>Balance</th></tr></thead>"
    + "<tbody>" + rows + "</tbody>"
    + "<tfoot><tr><td>TOTAL</td><td></td><td></td>"
    + "<td style=\"text-align:right\">Rs." + funds.grandTotal.toLocaleString("en-IN") + "</td></tr></tfoot>"
    + "</table></body></html>";
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 400);
}

function Skel() {
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

function Empty({ msg }: { msg: string }) {
  return (
    <div className="flex flex-col items-center py-12">
      <p className="text-sm text-slate-400">{msg}</p>
    </div>
  );
}
