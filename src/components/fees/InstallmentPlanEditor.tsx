import React from 'react';
import { InstallmentRow, PaymentPlanType } from '../../types';
import { PLAN_LABEL, addMonths, scheduleFor, scheduleProblems } from '../../lib/fees';
import { formatDate } from '../../lib/dates';
import { FIELD, LBL } from '../admissions/AdmissionFormFields';
import { Plus, Trash2, Wand2, Pencil, AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface PlanValue {
  plan: PaymentPlanType;
  rows: InstallmentRow[];
  monthly: { months: number; firstPayment: number; dayOfMonth: number };
  note: string;
}

export const initialPlanValue = (total: number, start: string, plan: PaymentPlanType = 'two_installments'): PlanValue => {
  const monthly = { months: 6, firstPayment: 0, dayOfMonth: Number(start.slice(8, 10)) || 5 };
  return { plan, rows: scheduleFor(total, plan, start, monthly), monthly, note: '' };
};

/** Rebuild the rows for the chosen plan (custom rows are kept as they are). */
export const withRows = (v: PlanValue, total: number, start: string): PlanValue =>
  v.plan === 'custom' ? v : { ...v, rows: scheduleFor(total, v.plan, start, v.monthly) };

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/**
 * Choose how a fee is paid: one time, 2 or 3 installments, monthly (any number of months),
 * or a fully custom schedule (any amounts and dates, e.g. after harvest, after a scholarship arrives).
 */
export const InstallmentPlanEditor: React.FC<{
  total: number;
  start: string;
  value: PlanValue;
  onChange: (v: PlanValue) => void;
  /** Label for the amount being scheduled ("Net fee" or "Outstanding balance"). */
  totalLabel?: string;
}> = ({ total, start, value, onChange, totalLabel = 'Net fee' }) => {
  const set = (patch: Partial<PlanValue>) => onChange(withRows({ ...value, ...patch }, total, start));
  const rows = value.rows;
  const sum = Math.round(rows.reduce((s, r) => s + (Number(r.amount) || 0), 0));
  const problems = scheduleProblems(rows, total, start);
  const editRows = (next: InstallmentRow[]) => onChange({ ...value, plan: 'custom', rows: next });

  const options: { id: PaymentPlanType; title: string; desc: string }[] = [
    { id: 'one_time', title: 'One time', desc: `${inr(total)} now` },
    { id: 'two_installments', title: '2 installments', desc: 'Now + 5 months' },
    { id: 'three_installments', title: '3 installments', desc: 'Every 2½ months' },
    { id: 'monthly', title: 'Monthly', desc: 'Any number of months' },
    { id: 'custom', title: 'Custom', desc: 'Your own dates & amounts' }
  ];

  const splitEqually = () => {
    const n = rows.length || 1;
    const each = Math.floor(total / n);
    editRows(rows.map((r, i) => ({ ...r, amount: i === n - 1 ? total - each * (n - 1) : each })));
  };
  const addRow = () => {
    const last = rows[rows.length - 1];
    const remaining = Math.max(0, total - sum);
    editRows([...rows, { amount: remaining, dueDate: last ? addMonths(last.dueDate, 1) : start, label: `Payment ${rows.length + 1}` }]);
  };

  return (
    <div className="space-y-3" data-plan-editor>
      <div>
        <label className={LBL}>Payment plan</label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {options.map(o => (
            <button
              key={o.id}
              type="button"
              aria-pressed={value.plan === o.id}
              onClick={() =>
                o.id === 'custom'
                  ? onChange({ ...value, plan: 'custom', rows: value.plan === 'custom' ? rows : rows.map((r, i) => ({ ...r, label: r.label || `Payment ${i + 1}` })) })
                  : set({ plan: o.id })
              }
              className={`p-2.5 rounded-lg border text-left transition-colors ${
                value.plan === o.id ? 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/40 font-semibold text-slate-900 dark:text-white' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <div>{o.title}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-normal">{o.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {value.plan === 'monthly' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
          <div>
            <label className={LBL}>Number of monthly payments</label>
            <select className={FIELD} value={value.monthly.months} onChange={e => set({ monthly: { ...value.monthly, months: Number(e.target.value) } })} aria-label="Number of months">
              {Array.from({ length: 24 }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>
                  {n} month{n > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LBL}>Paid at admission (optional)</label>
            <input
              type="number"
              min={0}
              max={total}
              className={`${FIELD} font-mono`}
              value={value.monthly.firstPayment || ''}
              placeholder="0"
              onChange={e => set({ monthly: { ...value.monthly, firstPayment: Math.max(0, Math.min(total, Number(e.target.value) || 0)) } })}
              aria-label="Paid at admission"
            />
          </div>
          <div>
            <label className={LBL}>Due on day of month</label>
            <select className={FIELD} value={value.monthly.dayOfMonth} onChange={e => set({ monthly: { ...value.monthly, dayOfMonth: Number(e.target.value) } })} aria-label="Due day">
              {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 text-xs">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {rows.length} payment{rows.length === 1 ? '' : 's'} · {PLAN_LABEL[value.plan]}
          </span>
          {value.plan !== 'custom' ? (
            <button type="button" onClick={() => editRows(rows.map((r, i) => ({ ...r, label: r.label || `Payment ${i + 1}` })))} className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400 hover:underline">
              <Pencil className="w-3 h-3" /> Change dates or amounts
            </button>
          ) : (
            <span className="flex items-center gap-3">
              <button type="button" onClick={splitEqually} className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400 hover:underline">
                <Wand2 className="w-3 h-3" /> Split equally
              </button>
              <button type="button" onClick={addRow} className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400 hover:underline">
                <Plus className="w-3 h-3" /> Add payment
              </button>
            </span>
          )}
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
          {rows.map((r, i) =>
            value.plan === 'custom' ? (
              <div key={i} className="grid grid-cols-12 gap-2 items-center px-3 py-1.5" data-plan-row>
                <span className="col-span-1 text-[11px] font-mono text-slate-400">{i + 1}</span>
                <input
                  className={`${FIELD} col-span-11 sm:col-span-4`}
                  value={r.label || ''}
                  placeholder="Label, e.g. After harvest"
                  aria-label={`Label for payment ${i + 1}`}
                  onChange={e => editRows(rows.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                />
                <input
                  type="date"
                  className={`${FIELD} col-span-6 sm:col-span-3`}
                  value={r.dueDate}
                  min={start}
                  aria-label={`Due date for payment ${i + 1}`}
                  onChange={e => editRows(rows.map((x, j) => (j === i ? { ...x, dueDate: e.target.value } : x)))}
                />
                <input
                  type="number"
                  min={0}
                  className={`${FIELD} col-span-5 sm:col-span-3 font-mono`}
                  value={r.amount || ''}
                  aria-label={`Amount for payment ${i + 1}`}
                  onChange={e => editRows(rows.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) || 0 } : x)))}
                />
                <button type="button" onClick={() => editRows(rows.filter((_, j) => j !== i))} aria-label={`Remove payment ${i + 1}`} className="col-span-1 p-1 text-slate-400 hover:text-rose-600 justify-self-end">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 text-xs" data-plan-row>
                <span className="text-slate-700 dark:text-slate-300">
                  <span className="font-mono text-slate-400 mr-2">{i + 1}</span>
                  {r.label || `Payment ${i + 1}`}
                </span>
                <span className="text-slate-500">{r.dueDate === start ? 'Now' : formatDate(r.dueDate)}</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{inr(r.amount)}</span>
              </div>
            )
          )}
        </div>
        <div className="flex items-center justify-between px-3 py-2 text-xs border-t border-slate-200 dark:border-slate-800">
          <span className="text-slate-500">
            {totalLabel}: <b className="font-mono text-slate-900 dark:text-white">{inr(total)}</b>
          </span>
          {problems.length === 0 ? (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Adds up
            </span>
          ) : (
            <span className="font-mono font-semibold text-rose-600">Scheduled {inr(sum)}</span>
          )}
        </div>
      </div>
      {problems.length > 0 && (
        <div className="text-xs text-rose-600 space-y-0.5" data-plan-problems>
          {problems.map(p => (
            <div key={p} className="flex items-start gap-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {p}
            </div>
          ))}
        </div>
      )}
      <div>
        <label className={LBL}>Note about this plan (optional)</label>
        <input className={FIELD} value={value.note} onChange={e => onChange({ ...value, note: e.target.value })} placeholder="e.g. Parents pay after the October harvest; scholarship money expected in January" />
      </div>
    </div>
  );
};
