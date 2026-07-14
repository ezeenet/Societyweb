/**
 * printUtils.ts — SocietyMS Web v2.0
 * ─────────────────────────────────────────────────────────────────────────────
 * Browser Print  → open new window with styled HTML
 * PDF Export     → jsPDF + jspdf-autotable
 * Excel Export   → SheetJS (xlsx)
 * ─────────────────────────────────────────────────────────────────────────────
 * FIX: jsPDF default Helvetica font does NOT support ₹ (U+20B9) — shows
 *      as garbled characters. PDF cells use "Rs." instead.
 *      HTML print windows still use ₹ (browsers handle it fine).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// ─── Society Info (injected at runtime) ──────────────────────────────────────
let _societyName = 'SocietyMS';
export function setSocietyName(name: string) {
  _societyName = name;
}
export function getSocietyName(): string {
  return _societyName;
}

// ─── Shared Helpers ───────────────────────────────────────────────────────────
function today(): string {
  return new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

/** HTML print: use ₹ symbol (browsers support it) */
function inr(n: number): string {
  return '₹' + n.toLocaleString('en-IN');
}

/** PDF cells: use "Rs." — jsPDF Helvetica cannot render ₹ (U+20B9) */
function pdfInr(n: number): string {
  return 'Rs.' + n.toLocaleString('en-IN');
}

function htmlHead(title: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <title>${title}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;font-size:12px;color:#111;padding:20px}
    h2{font-size:18px;margin-bottom:2px;color:#1a237e}
    .sub{font-size:11px;color:#555;margin-bottom:12px}
    table{width:100%;border-collapse:collapse;margin-top:8px}
    th{background:#1a237e;color:#fff;padding:7px 10px;text-align:left;font-size:11px}
    td{padding:6px 10px;border-bottom:1px solid #e0e0e0;font-size:11px}
    tr:nth-child(even) td{background:#f5f5f5}
    .badge{display:inline-block;padding:2px 8px;border-radius:9px;font-size:10px;font-weight:600}
    .badge-green{background:#e8f5e9;color:#2e7d32}
    .badge-red{background:#ffebee;color:#c62828}
    .badge-yellow{background:#fffde7;color:#f57f17}
    .badge-blue{background:#e3f2fd;color:#1565c0}
    .footer{margin-top:20px;font-size:10px;color:#888;text-align:right}
    @media print{body{padding:8px}}
  </style></head><body>`;
}

function printWindow(html: string, title: string): void {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 400);
}

// ─── PDF Helpers ──────────────────────────────────────────────────────────────
function createPdf(title: string, subtitle = ''): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFontSize(16);
  doc.setTextColor(26, 35, 126);
  doc.text(_societyName, 14, 15);
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text(title, 14, 22);
  if (subtitle) doc.text(subtitle, 14, 28);
  doc.setFontSize(9);
  doc.text(`Generated: ${today()}`, doc.internal.pageSize.width - 50, 15);
  return doc;
}

function savePdf(doc: jsPDF, filename: string): void {
  doc.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Excel Helpers ────────────────────────────────────────────────────────────
function saveExcel(data: Record<string, unknown>[], sheetName: string, filename: string): void {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEMBERS
// ═══════════════════════════════════════════════════════════════════════════════
export interface MemberPrintData {
  name: string;
  flatNumber: string;
  wingName: string;
  memberType: string;
  phone: string;
  email?: string;
  aadhar?: string;
  status: string;
}

export function printMembers(members: MemberPrintData[]): void {
  const rows = members.map(m => `
    <tr>
      <td>${m.name}</td><td>${m.flatNumber}</td><td>${m.wingName}</td>
      <td>${m.memberType}</td><td>${m.phone}</td><td>${m.email ?? '-'}</td>
      <td>${m.aadhar ?? '-'}</td>
      <td><span class="badge badge-green">${m.status}</span></td>
    </tr>`).join('');
  const html = htmlHead('Members List') + `
    <h2>${_societyName}</h2>
    <div class="sub">Members List &nbsp;|&nbsp; ${today()}</div>
    <table>
      <thead><tr><th>Name</th><th>Flat</th><th>Wing</th><th>Type</th><th>Phone</th><th>Email</th><th>Aadhar</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">Total: ${members.length} members &nbsp;|&nbsp; ${_societyName}</div>
    </body></html>`;
  printWindow(html, 'Members');
}

export function exportMembersPdf(members: MemberPrintData[]): void {
  const doc = createPdf('Members List', `Total: ${members.length}`);
  autoTable(doc, {
    startY: 35,
    head: [['Name', 'Flat', 'Wing', 'Type', 'Phone', 'Email', 'Status']],
    body: members.map(m => [m.name, m.flatNumber, m.wingName, m.memberType, m.phone, m.email ?? '-', m.status]),
    headStyles: { fillColor: [26, 35, 126] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  savePdf(doc, 'members');
}

export function exportMembersCsv(members: MemberPrintData[]): void {
  saveExcel(members.map(m => ({
    Name: m.name, Flat: m.flatNumber, Wing: m.wingName,
    Type: m.memberType, Phone: m.phone, Email: m.email ?? '', Status: m.status,
  })), 'Members', 'members');
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLATS & WINGS
// ═══════════════════════════════════════════════════════════════════════════════
export interface FlatPrintData {
  flatNumber: string;
  floor: string;
  wingName: string;
  area?: number;
  status: 'OCCUPIED' | 'VACANT' | 'MAINTENANCE';
  ownerName?: string;
  phone?: string;
}

export interface WingPrintData {
  name: string;
  totalFlats: number;
  occupied: number;
  vacant: number;
  maintenance: number;
}

export function printFlats(flats: FlatPrintData[]): void {
  const badge = (s: string) => {
    const map: Record<string, string> = {
      OCCUPIED: 'badge-green', VACANT: 'badge-blue', MAINTENANCE: 'badge-yellow',
    };
    return `<span class="badge ${map[s] ?? ''}">${s}</span>`;
  };
  const rows = flats.map(f => `
    <tr>
      <td>${f.flatNumber}</td><td>${f.wingName}</td><td>${f.floor}</td>
      <td>${f.area ? f.area + ' sq.ft' : '-'}</td>
      <td>${badge(f.status)}</td><td>${f.ownerName ?? '-'}</td><td>${f.phone ?? '-'}</td>
    </tr>`).join('');
  const html = htmlHead('Flats List') + `
    <h2>${_societyName}</h2>
    <div class="sub">Flats List &nbsp;|&nbsp; ${today()}</div>
    <table>
      <thead><tr><th>Flat No.</th><th>Wing</th><th>Floor</th><th>Area</th><th>Status</th><th>Owner</th><th>Phone</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">Total: ${flats.length} flats &nbsp;|&nbsp; ${_societyName}</div>
    </body></html>`;
  printWindow(html, 'Flats');
}

export function exportFlatsPdf(flats: FlatPrintData[]): void {
  const doc = createPdf('Flats List', `Total: ${flats.length}`);
  autoTable(doc, {
    startY: 35,
    head: [['Flat No.', 'Wing', 'Floor', 'Area', 'Status', 'Owner', 'Phone']],
    body: flats.map(f => [
      f.flatNumber, f.wingName, f.floor, f.area ? `${f.area} sq.ft` : '-',
      f.status, f.ownerName ?? '-', f.phone ?? '-',
    ]),
    headStyles: { fillColor: [26, 35, 126] },
  });
  savePdf(doc, 'flats');
}

export function exportFlatsExcel(flats: FlatPrintData[]): void {
  saveExcel(flats.map(f => ({
    'Flat No': f.flatNumber, Wing: f.wingName, Floor: f.floor,
    'Area (sq.ft)': f.area ?? '', Status: f.status,
    Owner: f.ownerName ?? '', Phone: f.phone ?? '',
  })), 'Flats', 'flats');
}

export function printWings(wings: WingPrintData[]): void {
  const rows = wings.map(w => `
    <tr>
      <td>${w.name}</td><td>${w.totalFlats}</td><td>${w.occupied}</td>
      <td>${w.vacant}</td><td>${w.maintenance}</td>
      <td>${w.totalFlats > 0 ? Math.round((w.occupied / w.totalFlats) * 100) : 0}%</td>
    </tr>`).join('');
  const html = htmlHead('Wings Summary') + `
    <h2>${_societyName}</h2>
    <div class="sub">Wings Summary &nbsp;|&nbsp; ${today()}</div>
    <table>
      <thead><tr><th>Wing</th><th>Total Flats</th><th>Occupied</th><th>Vacant</th><th>Maintenance</th><th>Occupancy %</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">${_societyName}</div>
    </body></html>`;
  printWindow(html, 'Wings');
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAINTENANCE BILLS
// ═══════════════════════════════════════════════════════════════════════════════
export interface BillPrintData {
  flatNumber: string;
  wingName: string;
  memberName: string;    // ← member name (pass '' if not available)
  month: string;         // ← formatted month string  e.g. "May 2026"
  amount: number;
  billStatus: string;    // ← PENDING / PAID
  paidDate?: string;
  receiptNumber?: string;
}

export function printBills(bills: BillPrintData[], title?: string): void {
  const rows = bills.map(b => `
    <tr>
      <td>${b.flatNumber}</td><td>${b.wingName}</td><td>${b.memberName || '-'}</td>
      <td>${b.month}</td>
      <td>${inr(b.amount)}</td>
      <td><span class="badge ${b.billStatus === 'PAID' ? 'badge-green' : 'badge-yellow'}">${b.billStatus}</span></td>
      <td>${b.paidDate ?? '-'}</td><td>${b.receiptNumber ?? '-'}</td>
    </tr>`).join('');
  const total = bills.reduce((s, b) => s + b.amount, 0);
  const html = htmlHead('Maintenance Bills') + `
    <h2>${_societyName}</h2>
    <div class="sub">${title ?? 'Maintenance Bills'} &nbsp;|&nbsp; ${today()}</div>
    <table>
      <thead><tr><th>Flat</th><th>Wing</th><th>Member</th><th>Month</th><th>Amount</th><th>Status</th><th>Paid Date</th><th>Receipt</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr style="background:#e8eaf6"><td colspan="4"><strong>Total</strong></td><td><strong>${inr(total)}</strong></td><td colspan="3"></td></tr></tfoot>
    </table>
    <div class="footer">Total ${bills.length} bills &nbsp;|&nbsp; ${_societyName}</div>
    </body></html>`;
  printWindow(html, 'Bills');
}

export function exportBillsPdf(bills: BillPrintData[], title?: string): void {
  const total = bills.reduce((s, b) => s + b.amount, 0);
  const doc = createPdf('Maintenance Bills', title ?? '');
  autoTable(doc, {
    startY: 35,
    head: [['Flat', 'Wing', 'Member', 'Month', 'Amount', 'Status', 'Paid Date', 'Receipt']],
    body: [
      ...bills.map(b => [
        b.flatNumber, b.wingName, b.memberName || '-', b.month,
        // ↓ Use Rs. — ₹ symbol is NOT supported in jsPDF default font
        pdfInr(b.amount), b.billStatus, b.paidDate ?? '-', b.receiptNumber ?? '-',
      ]),
      ['', '', '', 'Total', pdfInr(total), '', '', ''],
    ],
    headStyles: { fillColor: [26, 35, 126] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  savePdf(doc, 'bills');
}

export function exportBillsCsv(bills: BillPrintData[]): void {
  saveExcel(bills.map(b => ({
    Flat: b.flatNumber, Wing: b.wingName, Member: b.memberName,
    Month: b.month, Amount: b.amount, Status: b.billStatus,
    'Paid Date': b.paidDate ?? '', Receipt: b.receiptNumber ?? '',
  })), 'Bills', 'bills');
}

// ─── Maintenance Bill ───────────────────────────────────────────────────────
export interface MaintenanceBillPrintData {
  billNo:        string;
  memberName:    string;
  flatNumber:    string;
  wingName:      string;
  mobile?:       string;
  email?:        string;
  billMonth:     string;
  amount:        number;
  lateFine:      number;
  totalDue:      number;
  previousDue?:  number;
  dueDate?:      string;
  generatedDate: string;
  societyAddress?: string;
  remarks?:      string;
}

export function printMaintenanceBill(b: MaintenanceBillPrintData): void {
  const html = htmlHead('Maintenance Bill') + `
    <div style="max-width:600px;margin:auto;font-family:Arial,sans-serif">

      <!-- Header -->
      <div style="text-align:center;border-bottom:2px solid #1a237e;padding-bottom:12px;margin-bottom:16px">
        <h2 style="color:#1a237e;font-size:20px;margin:0">${_societyName}</h2>
        ${b.societyAddress ? `<p style="color:#555;font-size:11px;margin:4px 0">${b.societyAddress}</p>` : ''}
        <p style="color:#888;font-size:11px;margin:4px 0">MAINTENANCE BILL</p>
      </div>

      <!-- Bill Info -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
        <div style="background:#f5f5f5;padding:10px;border-radius:6px">
          <p style="margin:0;font-size:10px;color:#888">BILL DATE</p>
          <p style="margin:4px 0 0;font-size:13px;font-weight:bold">${b.generatedDate}</p>
        </div>
        <div style="background:#f5f5f5;padding:10px;border-radius:6px">
          <p style="margin:0;font-size:10px;color:#888">BILL MONTH</p>
          <p style="margin:4px 0 0;font-size:13px;font-weight:bold">${b.billMonth}</p>
        </div>
        ${b.dueDate ? `
        <div style="background:#fff3e0;padding:10px;border-radius:6px">
          <p style="margin:0;font-size:10px;color:#e65100">DUE DATE</p>
          <p style="margin:4px 0 0;font-size:13px;font-weight:bold;color:#e65100">${b.dueDate}</p>
        </div>` : ''}
        <div style="background:#f5f5f5;padding:10px;border-radius:6px">
          <p style="margin:0;font-size:10px;color:#888">BILL NO.</p>
          <p style="margin:4px 0 0;font-size:13px;font-weight:bold">${b.billNo}</p>
        </div>
      </div>

      <!-- Member Info -->
      <div style="border:1px solid #e0e0e0;border-radius:8px;padding:12px;margin-bottom:16px">
        <p style="margin:0 0 8px;font-size:11px;font-weight:bold;color:#1a237e;text-transform:uppercase">Bill To</p>
        <p style="margin:0;font-size:15px;font-weight:bold;color:#1a237e">${b.memberName}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#555">
          Flat ${b.flatNumber} &nbsp;|&nbsp; Wing ${b.wingName}
        </p>
        ${b.mobile ? `<p style="margin:4px 0 0;font-size:11px;color:#888">Mobile: ${b.mobile}</p>` : ''}
        ${b.email  ? `<p style="margin:4px 0 0;font-size:11px;color:#888">Email: ${b.email}</p>`  : ''}
      </div>

      <!-- Amount Breakdown -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
        <thead>
          <tr style="background:#1a237e;color:#fff">
            <th style="padding:8px 12px;text-align:left;font-size:12px">Description</th>
            <th style="padding:8px 12px;text-align:right;font-size:12px">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid #e0e0e0">
            <td style="padding:10px 12px;font-size:13px">Maintenance Charges — ${b.billMonth}</td>
            <td style="padding:10px 12px;text-align:right;font-size:13px">&#8377;${b.amount.toLocaleString('en-IN')}</td>
          </tr>
          ${b.lateFine > 0 ? `
          <tr style="border-bottom:1px solid #e0e0e0">
            <td style="padding:10px 12px;font-size:13px;color:#c62828">Late Fine</td>
            <td style="padding:10px 12px;text-align:right;font-size:13px;color:#c62828">&#8377;${b.lateFine.toLocaleString('en-IN')}</td>
          </tr>` : ''}
          ${b.previousDue && b.previousDue > 0 ? `
          <tr style="border-bottom:1px solid #e0e0e0;background:#fff8e1">
            <td style="padding:10px 12px;font-size:13px;color:#e65100">Previous Dues (Pending)</td>
            <td style="padding:10px 12px;text-align:right;font-size:13px;color:#e65100">&#8377;${b.previousDue.toLocaleString('en-IN')}</td>
          </tr>` : ''}
          <tr style="background:#e8eaf6">
            <td style="padding:12px;font-size:14px;font-weight:bold;color:#1a237e">TOTAL DUE</td>
            <td style="padding:12px;text-align:right;font-size:18px;font-weight:bold;color:#1a237e">&#8377;${(b.totalDue + (b.previousDue ?? 0)).toLocaleString('en-IN')}</td>
          </tr>
        </tbody>
      </table>

      <!-- Payment Methods -->
      <div style="border:1px solid #e0e0e0;border-radius:8px;padding:12px;margin-bottom:16px">
        <p style="margin:0 0 8px;font-size:11px;font-weight:bold;color:#1a237e;text-transform:uppercase">Payment Methods</p>
        <p style="margin:0;font-size:11px;color:#555">&#10003; Cash / Cheque — Pay at society office</p>
        <p style="margin:4px 0 0;font-size:11px;color:#555">&#10003; Online — Contact admin for bank details</p>
      </div>

      ${b.remarks ? `
      <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:10px;margin-bottom:16px">
        <p style="margin:0;font-size:11px;color:#f57f17"><strong>Remarks:</strong> ${b.remarks}</p>
      </div>` : ''}

      <!-- Footer -->
      <div style="text-align:center;border-top:1px dashed #bdbdbd;padding-top:12px;margin-top:8px">
        ${b.dueDate ? `<p style="font-size:12px;color:#c62828;font-weight:bold">Please pay by ${b.dueDate} to avoid late fine.</p>` : ''}
        <p style="font-size:10px;color:#888;margin-top:4px">
          This is a computer-generated bill. No signature required. | ${_societyName}
        </p>
      </div>

    </div>
    </body></html>`;
  printWindow(html, 'Maintenance Bill');
}

// ─── Receipt ──────────────────────────────────────────────────────────────────
export interface ReceiptData {
  receiptNumber: string;
  memberName: string;
  flatNumber: string;
  wingName: string;
  month: string;
  amount: number;
  paymentMode: string;
  paidDate: string;
  referenceNumber?: string;
  approvedBy?: string;
}

export function printReceipt(r: ReceiptData): void {
  const html = htmlHead('Receipt') + `
    <div style="max-width:500px;margin:auto;border:2px solid #1a237e;border-radius:8px;padding:24px">
      <h2 style="text-align:center">${_societyName}</h2>
      <p style="text-align:center;color:#555;font-size:11px">MAINTENANCE PAYMENT RECEIPT</p>
      <hr style="border:1px solid #1a237e;margin:12px 0"/>
      <table style="width:100%;border:none">
        <tr><td style="border:none;color:#555">Receipt No.</td><td style="border:none;font-weight:bold">${r.receiptNumber}</td></tr>
        <tr><td style="border:none;color:#555">Date</td><td style="border:none">${r.paidDate}</td></tr>
        <tr><td style="border:none;color:#555">Member</td><td style="border:none">${r.memberName}</td></tr>
        <tr><td style="border:none;color:#555">Flat / Wing</td><td style="border:none">${r.flatNumber} — ${r.wingName}</td></tr>
        <tr><td style="border:none;color:#555">Month</td><td style="border:none">${r.month}</td></tr>
        <tr><td style="border:none;color:#555">Payment Mode</td><td style="border:none">${r.paymentMode}</td></tr>
        ${r.referenceNumber ? `<tr><td style="border:none;color:#555">Ref. No.</td><td style="border:none">${r.referenceNumber}</td></tr>` : ''}
        <tr><td style="border:none;color:#555">Amount Paid</td><td style="border:none;font-size:18px;font-weight:bold;color:#1a237e">${inr(r.amount)}</td></tr>
      </table>
      <hr style="border:1px dashed #999;margin:16px 0"/>
      ${r.approvedBy ? `<p style="text-align:right;font-size:10px;color:#555">Approved by: ${r.approvedBy}</p>` : ''}
      <p style="text-align:center;font-size:10px;color:#888;margin-top:8px">Thank you for your payment!</p>
    </div>
    </body></html>`;
  printWindow(html, 'Receipt');
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLAINTS
// ═══════════════════════════════════════════════════════════════════════════════
export interface ComplaintPrintData {
  id: number;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  memberName: string;
  flatNumber: string;
  createdAt: string;
  resolvedAt?: string;
}

export function printComplaints(complaints: ComplaintPrintData[]): void {
  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      OPEN: 'badge-red', IN_PROGRESS: 'badge-yellow', RESOLVED: 'badge-green', CLOSED: 'badge-blue',
    };
    return `<span class="badge ${map[s] ?? ''}">${s.replace('_', ' ')}</span>`;
  };
  const rows = complaints.map(c => `
    <tr>
      <td>#${c.id}</td><td>${c.subject}</td><td>${c.category}</td>
      <td>${c.memberName}</td><td>${c.flatNumber}</td>
      <td>${statusBadge(c.status)}</td><td>${c.priority}</td>
      <td>${c.createdAt}</td><td>${c.resolvedAt ?? '-'}</td>
    </tr>`).join('');
  const html = htmlHead('Complaints') + `
    <h2>${_societyName}</h2>
    <div class="sub">Complaints List &nbsp;|&nbsp; ${today()}</div>
    <table>
      <thead><tr><th>#</th><th>Subject</th><th>Category</th><th>Member</th><th>Flat</th><th>Status</th><th>Priority</th><th>Created</th><th>Resolved</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">Total: ${complaints.length} &nbsp;|&nbsp; ${_societyName}</div>
    </body></html>`;
  printWindow(html, 'Complaints');
}

export function exportComplaintsPdf(complaints: ComplaintPrintData[]): void {
  const doc = createPdf('Complaints List', `Total: ${complaints.length}`);
  autoTable(doc, {
    startY: 35,
    head: [['#', 'Subject', 'Category', 'Member', 'Flat', 'Status', 'Priority', 'Created']],
    body: complaints.map(c => [
      `#${c.id}`, c.subject, c.category, c.memberName, c.flatNumber,
      c.status, c.priority, c.createdAt,
    ]),
    headStyles: { fillColor: [26, 35, 126] },
  });
  savePdf(doc, 'complaints');
}

export function exportComplaintsExcel(complaints: ComplaintPrintData[]): void {
  saveExcel(complaints.map(c => ({
    ID: c.id, Subject: c.subject, Category: c.category,
    Member: c.memberName, Flat: c.flatNumber, Status: c.status,
    Priority: c.priority, Created: c.createdAt, Resolved: c.resolvedAt ?? '',
  })), 'Complaints', 'complaints');
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTICES
// ═══════════════════════════════════════════════════════════════════════════════
export interface NoticePrintData {
  id: number;
  title: string;
  content: string;
  noticeType: string;
  priority: string;
  publishDate: string;
  expiryDate?: string;
  targetAudience: string;
  hasPoll: boolean;
}

export function printNotices(notices: NoticePrintData[]): void {
  const rows = notices.map(n => `
    <tr>
      <td>#${n.id}</td><td><strong>${n.title}</strong></td><td>${n.noticeType}</td>
      <td>${n.priority}</td><td>${n.targetAudience}</td>
      <td>${n.publishDate}</td><td>${n.expiryDate ?? '-'}</td>
      <td>${n.hasPoll ? '✓ Yes' : 'No'}</td>
    </tr>
    <tr><td colspan="8" style="color:#555;font-size:10px;padding-left:20px">${n.content}</td></tr>`).join('');
  const html = htmlHead('Notices') + `
    <h2>${_societyName}</h2>
    <div class="sub">Notices &nbsp;|&nbsp; ${today()}</div>
    <table>
      <thead><tr><th>#</th><th>Title</th><th>Type</th><th>Priority</th><th>Audience</th><th>Published</th><th>Expiry</th><th>Poll</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">Total: ${notices.length} &nbsp;|&nbsp; ${_societyName}</div>
    </body></html>`;
  printWindow(html, 'Notices');
}

export function exportNoticesPdf(notices: NoticePrintData[]): void {
  const doc = createPdf('Notices', `Total: ${notices.length}`);
  autoTable(doc, {
    startY: 35,
    head: [['#', 'Title', 'Type', 'Priority', 'Audience', 'Published', 'Poll']],
    body: notices.map(n => [
      `#${n.id}`, n.title, n.noticeType, n.priority, n.targetAudience, n.publishDate, n.hasPoll ? 'Yes' : 'No',
    ]),
    headStyles: { fillColor: [26, 35, 126] },
  });
  savePdf(doc, 'notices');
}

export function exportNoticesExcel(notices: NoticePrintData[]): void {
  saveExcel(notices.map(n => ({
    ID: n.id, Title: n.title, Type: n.noticeType, Priority: n.priority,
    Audience: n.targetAudience, Published: n.publishDate,
    Expiry: n.expiryDate ?? '', Poll: n.hasPoll ? 'Yes' : 'No',
  })), 'Notices', 'notices');
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACCOUNTS
// ═══════════════════════════════════════════════════════════════════════════════
export interface AccountEntryPrintData {
  date: string;
  description: string;
  entryType: string;
  category: string;
  debit: number;
  credit: number;
  balance: number;
  paymentMode?: string;
  reference?: string;
}

export function printAccountEntries(entries: AccountEntryPrintData[], heading = 'Account Entries'): void {
  const rows = entries.map(e => `
    <tr>
      <td>${e.date}</td><td>${e.description}</td><td>${e.entryType}</td><td>${e.category}</td>
      <td style="text-align:right">${e.debit > 0 ? inr(e.debit) : '-'}</td>
      <td style="text-align:right">${e.credit > 0 ? inr(e.credit) : '-'}</td>
      <td style="text-align:right">${inr(e.balance)}</td>
      <td>${e.paymentMode ?? '-'}</td>
    </tr>`).join('');
  const totalDebit  = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0);
  const html = htmlHead(heading) + `
    <h2>${_societyName}</h2>
    <div class="sub">${heading} &nbsp;|&nbsp; ${today()}</div>
    <table>
      <thead><tr><th>Date</th><th>Description</th><th>Type</th><th>Category</th><th>Debit</th><th>Credit</th><th>Balance</th><th>Mode</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr style="background:#e8eaf6;font-weight:bold">
          <td colspan="4">TOTAL</td>
          <td style="text-align:right">${inr(totalDebit)}</td>
          <td style="text-align:right">${inr(totalCredit)}</td>
          <td colspan="2"></td>
        </tr>
      </tfoot>
    </table>
    <div class="footer">Total ${entries.length} entries &nbsp;|&nbsp; ${_societyName}</div>
    </body></html>`;
  printWindow(html, heading);
}

export function exportAccountsPdf(entries: AccountEntryPrintData[], heading = 'Account Entries'): void {
  const doc = createPdf(heading, `Total entries: ${entries.length}`);
  const totalDebit  = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0);
  autoTable(doc, {
    startY: 35,
    head: [['Date', 'Description', 'Type', 'Category', 'Debit', 'Credit', 'Balance', 'Mode']],
    body: [
      ...entries.map(e => [
        e.date, e.description, e.entryType, e.category,
        e.debit  > 0 ? pdfInr(e.debit)  : '-',
        e.credit > 0 ? pdfInr(e.credit) : '-',
        pdfInr(e.balance),
        e.paymentMode ?? '-',
      ]),
      ['', '', '', 'TOTAL', pdfInr(totalDebit), pdfInr(totalCredit), '', ''],
    ],
    headStyles: { fillColor: [26, 35, 126] },
  });
  savePdf(doc, heading.replace(/\s+/g, '_').toLowerCase());
}

export function exportAccountsExcel(entries: AccountEntryPrintData[], sheetName = 'Accounts'): void {
  saveExcel(entries.map(e => ({
    Date: e.date, Description: e.description, Type: e.entryType,
    Category: e.category, Debit: e.debit || '', Credit: e.credit || '',
    Balance: e.balance, Mode: e.paymentMode ?? '', Reference: e.reference ?? '',
  })), sheetName, sheetName.replace(/\s+/g, '_').toLowerCase());
}

export function printCashBook(entries: AccountEntryPrintData[]): void {
  printAccountEntries(entries, 'Cash Book');
}

// ─── Member Ledger ────────────────────────────────────────────────────────────
export interface MemberLedgerEntry {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  receiptNumber?: string;
}

export function printMemberLedger(
  entries: MemberLedgerEntry[],
  memberName: string,
  flatNumber: string,
): void {
  const rows = entries.map(e => `
    <tr>
      <td>${e.date}</td><td>${e.description}</td>
      <td>${e.receiptNumber ?? '-'}</td>
      <td style="text-align:right">${e.debit  > 0 ? inr(e.debit)  : '-'}</td>
      <td style="text-align:right">${e.credit > 0 ? inr(e.credit) : '-'}</td>
      <td style="text-align:right">${inr(e.balance)}</td>
    </tr>`).join('');
  const html = htmlHead('Member Ledger') + `
    <h2>${_societyName}</h2>
    <div class="sub">Member Ledger — ${memberName} (${flatNumber}) &nbsp;|&nbsp; ${today()}</div>
    <table>
      <thead><tr><th>Date</th><th>Description</th><th>Receipt No.</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">${_societyName}</div>
    </body></html>`;
  printWindow(html, 'Member Ledger');
}

// ─── Payments ─────────────────────────────────────────────────────────────────
export interface PaymentPrintData {
  receiptNumber: string;
  memberName: string;
  flatNumber: string;
  wingName?: string;
  billMonth?: string;
  amount: number;
  amountPaid?: number;
  paymentMode: string;
  approvalStatus?: string;
  paymentDate?: string;
  paidDate?: string;
  referenceNo?: string;
  approvedBy?: string;
}

export function printPayments(payments: PaymentPrintData[]): void {
  const rows = payments.map(p => {
    const amt  = p.amountPaid ?? p.amount;
    const date = p.paymentDate ?? p.paidDate ?? '-';
    return `
    <tr>
      <td>${p.receiptNumber}</td><td>${p.memberName}</td>
      <td>${p.wingName ? p.wingName + ' – ' : ''}${p.flatNumber}</td>
      <td>${p.billMonth ?? '-'}</td>
      <td style="text-align:right">${inr(amt)}</td>
      <td>${p.paymentMode}</td>
      <td>${p.approvalStatus ?? '-'}</td>
      <td>${date}</td>
    </tr>`;
  }).join('');
  const total = payments.reduce((s, p) => s + (p.amountPaid ?? p.amount), 0);
  const html = htmlHead('All Payments') + `
    <h2>${_societyName}</h2>
    <div class="sub">All Payments &nbsp;|&nbsp; ${today()}</div>
    <table>
      <thead><tr><th>Receipt</th><th>Member</th><th>Flat</th><th>Month</th><th>Amount</th><th>Mode</th><th>Status</th><th>Date</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr style="background:#e8eaf6"><td colspan="4"><strong>Total</strong></td><td style="text-align:right"><strong>${inr(total)}</strong></td><td colspan="3"></td></tr></tfoot>
    </table>
    <div class="footer">Total ${payments.length} payments &nbsp;|&nbsp; ${_societyName}</div>
    </body></html>`;
  printWindow(html, 'Payments');
}

export function exportPaymentsPdf(payments: PaymentPrintData[]): void {
  const total = payments.reduce((s, p) => s + (p.amountPaid ?? p.amount), 0);
  const doc = createPdf('All Payments');
  autoTable(doc, {
    startY: 35,
    head: [['Receipt', 'Member', 'Flat', 'Month', 'Amount', 'Mode', 'Status', 'Date']],
    body: [
      ...payments.map(p => [
        p.receiptNumber, p.memberName,
        `${p.wingName ? p.wingName + ' - ' : ''}${p.flatNumber}`,
        p.billMonth ?? '-',
        pdfInr(p.amountPaid ?? p.amount),
        p.paymentMode, p.approvalStatus ?? '-',
        p.paymentDate ?? p.paidDate ?? '-',
      ]),
      ['', '', '', 'Total', pdfInr(total), '', '', ''],
    ],
    headStyles: { fillColor: [26, 35, 126] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  savePdf(doc, 'payments');
}

export function exportPaymentsCsv(payments: PaymentPrintData[]): void {
  saveExcel(payments.map(p => ({
    Receipt: p.receiptNumber, Member: p.memberName,
    Flat: p.flatNumber, Wing: p.wingName ?? '',
    Month: p.billMonth ?? '',
    Amount: p.amountPaid ?? p.amount,
    Mode: p.paymentMode, Status: p.approvalStatus ?? '',
    Date: p.paymentDate ?? p.paidDate ?? '',
  })), 'Payments', 'payments');
}

// ═══════════════════════════════════════════════════════════════════════════════
// VISITORS
// ═══════════════════════════════════════════════════════════════════════════════
export interface VisitorPrintData {
  id?: number;
  visitorName?: string;
  name?: string;
  mobile?: string;
  phone?: string;
  purpose?: string;
  flatNumber: string;
  wingName: string;
  hostMemberName?: string;
  entryTime: string;
  exitTime?: string | null;
  duration?: string;
  vehicleNo?: string;
  vehicleNumber?: string;
}

export function printVisitors(visitors: VisitorPrintData[], title = 'Visitors Log'): void {
  const rows = visitors.map(v => {
    const name    = v.visitorName ?? v.name ?? '-';
    const phone   = v.mobile ?? v.phone ?? '-';
    const vehicle = v.vehicleNo ?? v.vehicleNumber ?? '-';
    return `
    <tr>
      <td>${name}</td><td>${phone}</td><td>${v.purpose ?? '-'}</td>
      <td>${v.wingName} – ${v.flatNumber}</td><td>${v.hostMemberName ?? '-'}</td>
      <td>${v.entryTime}</td><td>${v.exitTime ?? 'Still Inside'}</td>
      <td>${v.duration ?? '-'}</td><td>${vehicle}</td>
    </tr>`;
  }).join('');
  const html = htmlHead(title) + `
    <h2>${_societyName}</h2>
    <div class="sub">${title} &nbsp;|&nbsp; ${today()}</div>
    <table>
      <thead><tr><th>Name</th><th>Phone</th><th>Purpose</th><th>Flat/Wing</th><th>Host</th><th>Entry</th><th>Exit</th><th>Duration</th><th>Vehicle</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">Total: ${visitors.length} &nbsp;|&nbsp; ${_societyName}</div>
    </body></html>`;
  printWindow(html, title);
}

export function exportVisitorsPdf(visitors: VisitorPrintData[]): void {
  const doc = createPdf('Visitors Log', `Total: ${visitors.length}`);
  autoTable(doc, {
    startY: 35,
    head: [['Name', 'Phone', 'Purpose', 'Flat', 'Wing', 'Entry Time', 'Exit Time', 'Duration']],
    body: visitors.map(v => [
      v.visitorName ?? v.name ?? '-',
      v.mobile ?? v.phone ?? '-',
      v.purpose ?? '-', v.flatNumber, v.wingName,
      v.entryTime, v.exitTime ?? 'Still Inside', v.duration ?? '-',
    ]),
    headStyles: { fillColor: [26, 35, 126] },
  });
  savePdf(doc, 'visitors');
}

export function exportVisitorsCsv(visitors: VisitorPrintData[]): void {
  saveExcel(visitors.map(v => ({
    Name: v.visitorName ?? v.name ?? '',
    Phone: v.mobile ?? v.phone ?? '',
    Purpose: v.purpose ?? '', Flat: v.flatNumber, Wing: v.wingName,
    Host: v.hostMemberName ?? '', 'Entry Time': v.entryTime,
    'Exit Time': v.exitTime ?? '', Duration: v.duration ?? '',
    Vehicle: v.vehicleNo ?? v.vehicleNumber ?? '',
  })), 'Visitors', 'visitors');
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENTS
// ═══════════════════════════════════════════════════════════════════════════════
export interface DocumentPrintData {
  id: number;
  title: string;
  description?: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  uploadedBy: string;
  uploadedAt: string;
  category?: string;
}

export function printDocuments(docs: DocumentPrintData[]): void {
  const rows = docs.map(d => `
    <tr>
      <td>#${d.id}</td><td>${d.title}</td><td>${d.category ?? '-'}</td>
      <td>${d.fileName}</td><td>${d.fileType.toUpperCase()}</td>
      <td>${d.fileSize}</td><td>${d.uploadedBy}</td><td>${d.uploadedAt}</td>
    </tr>`).join('');
  const html = htmlHead('Documents') + `
    <h2>${_societyName}</h2>
    <div class="sub">Documents List &nbsp;|&nbsp; ${today()}</div>
    <table>
      <thead><tr><th>#</th><th>Title</th><th>Category</th><th>File Name</th><th>Type</th><th>Size</th><th>Uploaded By</th><th>Date</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">Total: ${docs.length} documents &nbsp;|&nbsp; ${_societyName}</div>
    </body></html>`;
  printWindow(html, 'Documents');
}

export function exportDocumentsExcel(docs: DocumentPrintData[]): void {
  saveExcel(docs.map(d => ({
    ID: d.id, Title: d.title, Category: d.category ?? '',
    'File Name': d.fileName, Type: d.fileType, Size: d.fileSize,
    'Uploaded By': d.uploadedBy, Date: d.uploadedAt,
    Description: d.description ?? '',
  })), 'Documents', 'documents');
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════════════════════════
export interface TrialBalanceRow {
  accountName: string;
  debit: number;
  credit: number;
}

export function printTrialBalance(rows: TrialBalanceRow[], fromDate: string, toDate: string): void {
  const totalDr = rows.reduce((s, r) => s + r.debit, 0);
  const totalCr = rows.reduce((s, r) => s + r.credit, 0);
  const tableRows = rows.map(r => `
    <tr>
      <td>${r.accountName}</td>
      <td style="text-align:right">${r.debit  > 0 ? inr(r.debit)  : '-'}</td>
      <td style="text-align:right">${r.credit > 0 ? inr(r.credit) : '-'}</td>
    </tr>`).join('');
  const html = htmlHead('Trial Balance') + `
    <h2>${_societyName}</h2>
    <div class="sub">Trial Balance &nbsp;|&nbsp; ${fromDate} to ${toDate} &nbsp;|&nbsp; ${today()}</div>
    <table>
      <thead><tr><th>Account</th><th style="text-align:right">Dr (₹)</th><th style="text-align:right">Cr (₹)</th></tr></thead>
      <tbody>${tableRows}</tbody>
      <tfoot>
        <tr style="background:#e8eaf6;font-weight:bold">
          <td>TOTAL</td>
          <td style="text-align:right">${inr(totalDr)}</td>
          <td style="text-align:right">${inr(totalCr)}</td>
        </tr>
        <tr style="background:${Math.abs(totalDr - totalCr) < 1 ? '#e8f5e9' : '#ffebee'}">
          <td colspan="3" style="text-align:center;font-weight:bold">
            ${Math.abs(totalDr - totalCr) < 1
              ? '&#10003; Trial Balance MATCHES (Dr = Cr)'
              : '&#9888; Difference: ' + inr(Math.abs(totalDr - totalCr))}
          </td>
        </tr>
      </tfoot>
    </table>
    <div class="footer">${_societyName}</div>
    </body></html>`;
  printWindow(html, 'Trial Balance');
}

export interface BalanceSheetData {
  assets:      { label: string; amount: number }[];
  liabilities: { label: string; amount: number }[];
  asOf: string;
}

export function printBalanceSheet(data: BalanceSheetData): void {
  const totalAssets      = data.assets.reduce((s, a) => s + a.amount, 0);
  const totalLiabilities = data.liabilities.reduce((s, l) => s + l.amount, 0);
  const assetRows = data.assets.map(a =>
    `<tr><td>${a.label}</td><td style="text-align:right">${inr(a.amount)}</td></tr>`
  ).join('');
  const liabRows = data.liabilities.map(l =>
    `<tr><td>${l.label}</td><td style="text-align:right">${inr(l.amount)}</td></tr>`
  ).join('');
  const html = htmlHead('Balance Sheet') + `
    <h2>${_societyName}</h2>
    <div class="sub">Balance Sheet as of ${data.asOf} &nbsp;|&nbsp; ${today()}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:12px">
      <div>
        <h3 style="color:#1a237e;margin-bottom:8px">ASSETS (Dr)</h3>
        <table>
          <thead><tr><th>Particulars</th><th>Amount</th></tr></thead>
          <tbody>${assetRows}</tbody>
          <tfoot><tr style="background:#e8eaf6;font-weight:bold"><td>TOTAL ASSETS</td><td style="text-align:right">${inr(totalAssets)}</td></tr></tfoot>
        </table>
      </div>
      <div>
        <h3 style="color:#1a237e;margin-bottom:8px">LIABILITIES (Cr)</h3>
        <table>
          <thead><tr><th>Particulars</th><th>Amount</th></tr></thead>
          <tbody>${liabRows}</tbody>
          <tfoot><tr style="background:#e8eaf6;font-weight:bold"><td>TOTAL LIABILITIES</td><td style="text-align:right">${inr(totalLiabilities)}</td></tr></tfoot>
        </table>
      </div>
    </div>
    <div class="footer">${_societyName}</div>
    </body></html>`;
  printWindow(html, 'Balance Sheet');
}