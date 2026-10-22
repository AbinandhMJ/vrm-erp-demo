import { InstallmentRow, Invoice, PaymentPlanType, ScholarshipType } from '../types';
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

export const PLAN_LABEL: Record<PaymentPlanType, string> = {
  one_time: 'One-time payment',
  two_installments: '2 installments',
  three_installments: '3 installments',
  monthly: 'Monthly',
  custom: 'Custom plan'
};

/** Short label for a student's plan, e.g. "Monthly (10 payments)". */
export const planLabel = (plan: PaymentPlanType, count?: number) =>
  (plan === 'monthly' || plan === 'custom') && count ? `${PLAN_LABEL[plan]} (${count} payments)` : PLAN_LABEL[plan] || plan.replace(/_/g, ' ');

/** Same day-of-month n months later (clamped to the month's last day). */
export const addMonths = (iso: string, n: number, day?: number): string => {
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(y, m - 1 + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  const dd = Math.min(day ?? d, last);
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
};

/**
 * Monthly plan: an optional first (admission) payment today, then equal monthly payments
 * on a chosen day of the month. Rounding goes into the last payment.
 */
export const buildMonthlySchedule = (
  netFee: number,
  months: number,
  startDate: string,
  opts: { firstPayment?: number; dayOfMonth?: number } = {}
): InstallmentRow[] => {
  const rows: InstallmentRow[] = [];
  let remaining = netFee;
  const first = Math.max(0, Math.min(netFee, Math.round(opts.firstPayment || 0)));
  if (first > 0) {
    rows.push({ amount: first, dueDate: startDate, label: 'At admission' });
    remaining -= first;
  }
  const n = Math.max(1, months);
  const each = Math.floor(remaining / n);
  for (let i = 0; i < n; i++) {
    const offset = first > 0 ? i + 1 : i;
    rows.push({
      amount: i === n - 1 ? remaining - each * (n - 1) : each,
      dueDate: offset === 0 ? startDate : addMonths(startDate, offset, opts.dayOfMonth),
      label: `Month ${i + 1}`
    });
  }
  return rows.filter(r => r.amount > 0);
};

/** Problems with a schedule (empty when it is valid). */
export const scheduleProblems = (rows: InstallmentRow[], total: number, earliest?: string): string[] => {
  const p: string[] = [];
  if (rows.length === 0) p.push('Add at least one payment.');
  if (rows.some(r => !(r.amount > 0))) p.push('Every payment needs an amount above zero.');
  if (rows.some(r => !r.dueDate)) p.push('Every payment needs a due date.');
  if (earliest && rows.some(r => r.dueDate && r.dueDate < earliest)) p.push('Due dates cannot be in the past.');
  const sum = Math.round(rows.reduce((s, r) => s + (Number(r.amount) || 0), 0));
  if (sum !== Math.round(total)) p.push(`Payments add up to ₹${sum.toLocaleString('en-IN')}, but the amount to schedule is ₹${Math.round(total).toLocaleString('en-IN')} (${sum > total ? 'over' : 'short'} by ₹${Math.abs(sum - Math.round(total)).toLocaleString('en-IN')}).`);
  return p;
};

/** Ready-made shapes for any plan, as rows. */
export const scheduleFor = (netFee: number, plan: PaymentPlanType, startDate: string, monthly?: { months: number; firstPayment?: number; dayOfMonth?: number }): InstallmentRow[] => {
  if (plan === 'monthly') return buildMonthlySchedule(netFee, monthly?.months || 6, startDate, monthly);
  if (plan === 'custom') return buildInstallmentSchedule(netFee, 'two_installments', startDate);
  return buildInstallmentSchedule(netFee, plan, startDate).map((r, i, all) => ({ ...r, label: all.length > 1 ? `Installment ${i + 1}` : 'Full fee' }));
};
