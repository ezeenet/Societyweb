// types/accounts.types.ts

export type EntryType = 'INCOME' | 'EXPENSE' | 'OPENING_BALANCE';

export const INCOME_CATEGORIES = [
  'Maintenance', 'Sinking Fund', 'Repair Fund', 'Corpus Fund',
  'Reserve Fund', 'Share Capital', 'Cash', 'Bank', 'Interest', 'Penalty', 'Other Income',
] as const;

export const EXPENSE_CATEGORIES = [
  'Salary', 'Repair', 'Utilities', 'Security', 'Cleaning',
  'Event', 'Admin', 'Insurance', 'Legal', 'Other Expense',
] as const;

export const FUND_CATEGORIES = [
  'Sinking Fund', 'Repair Fund', 'Corpus Fund', 'Reserve Fund',
] as const;

export interface AccountEntry {
  id:          number;
  title:       string;
  amount:      number;
  entryType:   EntryType;
  category:    string;
  subCategory: string | null;
  description: string | null;
  entryDate:   string;
  reference:   string | null;
  isVerified:  boolean;
  createdAt:   string;
  updatedAt:   string;
}

export interface AccountEntryRequest {
  title:        string;
  amount:       number;
  entryType:    EntryType;
  category:     string;
  subCategory?: string;
  description?: string;
  entryDate:    string;
  reference?:   string;
}

export interface AccountSummary {
  openingBalance:  number;
  totalIncome:     number;
  totalExpense:    number;
  closingBalance:  number;
}

export interface LedgerRow {
  date:        string;
  description: string;
  debit:       number;
  credit:      number;
  balance:     number;
  type:        'BILL' | 'PAYMENT';
  reference:   string;
}

export interface MemberLedger {
  memberId:       number;
  memberName:     string;
  flatNumber:     string | null;
  wingName:       string | null;
  rows:           LedgerRow[];
  totalDebits:    number;
  totalCredits:   number;
  closingBalance: number;
  hasAdvance:     boolean;
}

export interface FundBalance {
  fundName:     string;
  totalIncome:  number;
  totalExpense: number;
  balance:      number;
}

export interface FundSummary {
  funds:      FundBalance[];
  grandTotal: number;
}

// ── Report types ──────────────────────────────────────────────────────────────

export interface IncomeExpenseRow {
  category: string;
  income:   number;
  expense:  number;
  net:      number;
}

export interface IncomeExpenseReport {
  financialYear: string;
  from:          string;
  to:            string;
  rows:          IncomeExpenseRow[];
  totalIncome:   number;
  totalExpense:  number;
  netBalance:    number;
}

export interface BalanceSheetItem { label: string; amount: number; }

export interface BalanceSheetReport {
  financialYear:    string;
  liabilities:      BalanceSheetItem[];
  assets:           BalanceSheetItem[];
  totalLiabilities: number;
  totalAssets:      number;
}

export interface TrialBalanceRow   { accountHead: string; debit: number; credit: number; }

export interface TrialBalanceReport {
  financialYear: string;
  rows:          TrialBalanceRow[];
  totalDebit:    number;
  totalCredit:   number;
  isBalanced:    boolean;
}

export interface BookEntry {
  date:        string;
  particulars: string;
  voucherType: string;
  receipts:    number;
  payments:    number;
  balance:     number;
}

export interface CashBankBookReport {
  bookType:       string;
  from:           string;
  to:             string;
  openingBalance: number;
  entries:        BookEntry[];
  totalReceipts:  number;
  totalPayments:  number;
  closingBalance: number;
}

export interface DefaulterRow {
  memberId:      number;
  memberName:    string;
  flatNumber:    string;
  wingName:      string;
  totalDue:      number;
  pendingMonths: number;
}

export interface DefaulterReport {
  defaulters:       DefaulterRow[];
  totalOutstanding: number;
}

export interface CollectionSummaryRow {
  billMonth:        string;
  totalFlats:       number;
  paidCount:        number;
  pendingCount:     number;
  amountBilled:     number;
  amountCollected:  number;
  amountPending:    number;
}
