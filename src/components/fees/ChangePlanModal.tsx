import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Student } from '../../types';
import { InstallmentPlanEditor, PlanValue, initialPlanValue } from './InstallmentPlanEditor';
import { invoiceBalance, planLabel, scheduleProblems } from '../../lib/fees';
import { formatDate } from '../../lib/dates';

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/** Re-plan what a student still owes: monthly, custom dates/amounts, or a fixed plan. Paid amounts are untouched. */
export const ChangePlanModal: React.FC<{ student: Student; onClose: () => void; onSaved: (msg: string) => void }> = ({ student, onClose, onSaved }) => {
  const { invoices, today, reschedulePayments } = useApp();
  const mine = invoices.filter(i => i.studentId === student.id).sort((a, b) => a.installmentIndex - b.installmentIndex);
  const outstanding = mine.reduce((s, i) => s + invoiceBalance(i), 0);
  const [value, setValue] = useState<PlanValue>(() => {
    const v = initialPlanValue(outstanding, today, 'monthly');
    return { ...v, monthly: { ...v.monthly, months: Math.min(6, Math.max(1, mine.filter(i => invoiceBalance(i) > 0).length)) }, note: student.paymentPlanNote || '' };
  });
  const [error, setError] = useState('');

  const save = () => {
    const problems = scheduleProblems(value.rows, outstanding, today);
    if (problems.length) return setError(problems[0]);
    reschedulePayments(student.id, value.rows, value.plan, value.note);
    onSaved(`${student.name}'s balance of ${inr(outstanding)} is now on a ${planLabel(value.plan, value.rows.length).toLowerCase()}.`);
  };

  return (
    <Modal
      title={`Change payment plan: ${student.name}`}
      subtitle={`${student.rollNumber} · now ${planLabel(student.paymentPlan, mine.length)}`}
      onClose={onClose}
      size="xl"
      footer={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-[11px] text-slate-500">Paid installments and receipts stay as they are. Only the unpaid balance is re-planned.</span>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              Cancel
            </button>
            <button onClick={save} disabled={outstanding <= 0} className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-amber-600 rounded-lg disabled:opacity-50">
              Save new plan
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {[
            ['Total fee', student.netFee, 'text-slate-900 dark:text-white'],
            ['Paid so far', student.paidFee, 'text-emerald-700 dark:text-emerald-400'],
            ['To re-plan', outstanding, 'text-rose-700 dark:text-rose-400']
          ].map(([k, v, c]) => (
            <div key={String(k)} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="text-[10px] text-slate-500">{k}</div>
              <div className={`font-mono font-bold ${c}`}>{inr(Number(v))}</div>
            </div>
          ))}
        </div>
        <details className="rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
          <summary className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">Current schedule ({mine.length} installments)</summary>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {mine.map(i => (
              <div key={i.id} className="px-3 py-1.5 flex justify-between gap-2">
                <span>{i.label || `Installment ${i.installmentIndex}`}</span>
                <span className="text-slate-500">{formatDate(i.dueDate)}</span>
                <span className="font-mono">
                  {inr(i.paidAmount || 0)} / {inr(i.amount)}
                </span>
              </div>
            ))}
          </div>
        </details>
        {outstanding <= 0 ? (
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">This student has paid in full. Nothing to re-plan.</p>
        ) : (
          <InstallmentPlanEditor total={outstanding} start={today} value={value} onChange={setValue} totalLabel="Balance to schedule" />
        )}
        {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
      </div>
    </Modal>
  );
};
