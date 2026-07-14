// lib/utils/receipt.ts
// Generates a printable HTML receipt and opens it in a new browser window.
// No external library needed — pure HTML/CSS injected into a popup.

import type { Payment } from '@/types/billing.types';

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export function printReceipt(payment: Payment, societyName = 'Society Management System') {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Receipt ${payment.receiptNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #f8fafc;
      display: flex;
      justify-content: center;
      padding: 40px 20px;
    }
    .receipt {
      background: white;
      width: 360px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .header {
      background: linear-gradient(135deg, #1d4ed8, #3b82f6);
      color: white;
      text-align: center;
      padding: 24px 20px 20px;
    }
    .header h1 { font-size: 18px; font-weight: 700; letter-spacing: -0.3px; }
    .header p  { font-size: 12px; opacity: 0.85; margin-top: 4px; }
    .badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 20px;
      padding: 4px 14px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 12px;
      letter-spacing: 1px;
    }
    .section {
      padding: 16px 20px;
      border-bottom: 1px dashed #e2e8f0;
    }
    .section:last-child { border-bottom: none; }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 5px 0;
    }
    .label { font-size: 12px; color: #64748b; }
    .value { font-size: 13px; color: #1e293b; font-weight: 500; text-align: right; max-width: 60%; }
    .amount-row {
      background: #eff6ff;
      border-radius: 8px;
      padding: 14px 16px;
      margin: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .amount-label { font-size: 13px; color: #1d4ed8; font-weight: 600; }
    .amount-value { font-size: 22px; color: #1d4ed8; font-weight: 700; }
    .footer {
      text-align: center;
      padding: 16px 20px 20px;
      background: #f8fafc;
    }
    .footer p { font-size: 12px; color: #64748b; }
    .footer .thank { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 4px; }
    @media print {
      body { background: white; padding: 0; }
      .receipt { box-shadow: none; border: none; border-radius: 0; width: 100%; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>${societyName}</h1>
      <p>Maintenance Payment Receipt</p>
      <div class="badge">OFFICIAL RECEIPT</div>
    </div>

    <div class="section">
      <div class="row">
        <span class="label">Receipt No.</span>
        <span class="value" style="font-weight:700;color:#1d4ed8">${payment.receiptNumber}</span>
      </div>
      <div class="row">
        <span class="label">Date</span>
        <span class="value">${formatDate(payment.paymentDate)}</span>
      </div>
      <div class="row">
        <span class="label">Bill Month</span>
        <span class="value">${payment.billMonth}</span>
      </div>
    </div>

    <div class="section">
      <div class="row">
        <span class="label">Member</span>
        <span class="value">${payment.memberName}</span>
      </div>
      <div class="row">
        <span class="label">Flat</span>
        <span class="value">${payment.wingName} – ${payment.flatNumber}</span>
      </div>
      <div class="row">
        <span class="label">Payment Mode</span>
        <span class="value">${payment.paymentMode}</span>
      </div>
      ${payment.referenceNo ? `
      <div class="row">
        <span class="label">Reference No.</span>
        <span class="value">${payment.referenceNo}</span>
      </div>` : ''}
    </div>

    <div class="amount-row">
      <span class="amount-label">Amount Paid</span>
      <span class="amount-value">${formatINR(payment.amountPaid)}</span>
    </div>

    <div class="footer">
      <p class="thank">Thank you for your payment!</p>
      <p>This is a computer-generated receipt</p>
      <p>and does not require a signature.</p>
    </div>
  </div>

  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=480,height=680,scrollbars=yes');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
