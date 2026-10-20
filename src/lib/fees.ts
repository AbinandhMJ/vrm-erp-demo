import { Invoice, PaymentPlanType, ScholarshipType } from '../types';
import { addDays } from './dates';

export const SCHOLARSHIP_RATES: Record<Exclude<ScholarshipType, 'custom' | 'none'>, number> = {
  merit_25: 0.25,
  ews_rural_40: 0.4,
  full_lump_sum_10: 0.1
};

export const computeDiscount = (baseFee: number, scholarship: ScholarshipType, customAmount = 0): number => {
  if (scholarship === 'none') return 0;
  if (scholarship === 'custom') return Math.max(0, Math.min(baseFee, Math.round(customAmount)));
  return Math.round(baseFee * SCHOLARSHIP_RATES[scholarship]);
};

/** Installment amounts and due dates for a plan, starting from the admission date. */
export const buildInstallmentSchedule = (
  netFee: number,
  plan: PaymentPlanType,
  admissionDate: string
): { amount: number; dueDate: string }[] => {
  if (plan === 'one_time') return [{ amount: netFee, dueDate: admissionDate }];
  if (plan === 'two_installments') {
    const first = Math.round(netFee / 2);
    return [
      { amount: first, dueDate: admissionDate },
      { amount: netFee - first, dueDate: addDays(admissionDate, 150) }
    ];
  }
  const part = Math.round(netFee / 3);
  return [
    { amount: part, dueDate: admissionDate },
    { amount: part, dueDate: addDays(admissionDate, 75) },
    { amount: netFee - part * 2, dueDate: addDays(admissionDate, 150) }
  ];
};

export const invoiceBalance = (inv: Invoice): number => Math.max(0, inv.amount - (inv.paidAmount || 0));

/** Status shown to users: 'overdue' is derived from the due date, never stored. */
export const effectiveInvoiceStatus = (inv: Invoice, today: string): Invoice['status'] => {
  if ((inv.paidAmount || 0) >= inv.amount) return 'paid';
  if (inv.dueDate < today) return 'overdue';
  if ((inv.paidAmount || 0) > 0) return 'partially_paid';
  return 'pending';
};

/**
 * Applies a payment to a student's open invoices, oldest installment first.
 * Returns the updated invoices and how the amount was split. Any surplus beyond the
 * total outstanding is returned as `unallocated` (callers should prevent overpayment).
 */
export const allocatePayment = (
  studentInvoices: Invoice[],
  amount: number,
  paidDate: string,
  receiptId: string,
  preferredInvoiceId?: string
): { updated: Invoice[]; allocations: { invoiceId: string; amount: number }[]; unallocated: number } => {
  const ordered = [...studentInvoices].sort((a, b) => {
    if (preferredInvoiceId) {
      if (a.id === preferredInvoiceId) return -1;
      if (b.id === preferredInvoiceId) return 1;
    }
    return a.installmentIndex - b.installmentIndex;
  });

  let remaining = Math.round(amount);
  const allocations: { invoiceId: string; amount: number }[] = [];
  const changed = new Map<string, Invoice>();

  for (const inv of ordered) {
    if (remaining <= 0) break;
    const due = invoiceBalance(inv);
    if (due <= 0) continue;
    const applied = Math.min(due, remaining);
    remaining -= applied;
    const paidAmount = (inv.paidAmount || 0) + applied;
    const fullyPaid = paidAmount >= inv.amount;
    changed.set(inv.id, {
      ...inv,
      paidAmount,
      status: fullyPaid ? 'paid' : 'partially_paid',
      paidDate: fullyPaid ? paidDate : inv.paidDate,
      receiptId
    });
    allocations.push({ invoiceId: inv.id, amount: applied });
  }

  return {
    updated: studentInvoices.map(inv => changed.get(inv.id) || inv),
    allocations,
    unallocated: remaining
  };
};

export const formatINR = (n: number): string => `₹${Math.round(n).toLocaleString('en-IN')}`;

export const nextSequence = (values: string[], prefix: string, pad = 5): string => {
  let max = 0;
  for (const v of values) {
    if (!v.startsWith(prefix)) continue;
    const n = parseInt(v.slice(prefix.length), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(pad, '0')}`;
};
