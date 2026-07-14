// types/billing.types.ts

export type BillStatus     = 'PENDING' | 'PAID';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PaymentMode    = 'CASH' | 'UPI' | 'NEFT' | 'RTGS' | 'CHEQUE' | 'ONLINE';

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  CASH:   'Cash',
  UPI:    'UPI',
  NEFT:   'NEFT',
  RTGS:   'RTGS',
  CHEQUE: 'Cheque',
  ONLINE: 'Online',
};

export interface Bill {
  id:         number;
  flatId:     number;
  flatNumber: string;
  wingName:   string;
  billMonth:  string;
  amount:     number;
  lateFine:   number;
  totalDue:   number;
  dueDate:    string | null;
  status:     BillStatus;
  createdAt:  string;
  updatedAt:  string;
}

export interface Payment {
  id:              number;
  billId:          number;
  billMonth:       string;
  flatNumber:      string;
  wingName:        string;
  memberId:        number;
  memberName:      string;
  amountPaid:      number;
  paymentDate:     string;
  paymentMode:     PaymentMode;
  referenceNo:     string | null;
  receiptNumber:   string;
  remarks:         string | null;
  approvalStatus:  ApprovalStatus;
  rejectionReason: string | null;
  approvedAt:      string | null;
  createdAt:       string;
}

export interface BillGenerateRequest {
  billMonth: string;
  amount:    number;
  dueDate:   string;
}

export interface PaymentRequest {
  billId:      number;
  memberId:    number;
  amountPaid:  number;
  paymentDate: string;
  paymentMode: PaymentMode;
  referenceNo?: string;
  remarks?:     string;
}

export interface BulkGenerateResult {
  generated:    number;
  skipped:      number;
  billMonth:    string;
  skippedFlats: string[];
}
