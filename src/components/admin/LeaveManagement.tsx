import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FIELD, LBL } from '../admissions/AdmissionFormFields';
import { Modal } from '../common/Modal';
import { Avatar } from '../common/PhotoPicker';
import { LeaveRequest, LeaveType } from '../../types';
import { LEAVE_LABEL, LEAVE_QUOTA, leaveUsed, workingDaysIn } from '../../lib/leave';
import { addDays, formatDate, parseISODate, toISODate } from '../../lib/dates';
import { CalendarDays, ChevronLeft, ChevronRight, Check, X, Plus, Trash2 } from 'lucide-react';

const STATUS_STYLE: Record<LeaveRequest['status'], string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
};

const card = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs';

const range = (l: LeaveRequest) => (l.from === l.to ? formatDate(l.from) : `${formatDate(l.from)} – ${formatDate(l.to)}`);

export const LeaveManagement: React.FC = () => {
  const { role, currentStaff, staffMembers, leaveRequests, holidays, applyLeave, decideLeave, cancelLeave, addHoliday, removeHoliday, today } = useApp();
  const isAdmin = role === 'management' || role === 'office_staff';
  const year = today.slice(0, 4);

  const [view, setView] = useState<'calendar' | 'mine' | 'approvals' | 'holidays'>(isAdmin ? 'approvals' : currentStaff ? 'mine' : 'calendar');
  const [applyOpen, setApplyOpen] = useState(false);
  const [decision, setDecision] = useState<{ req: LeaveRequest; status: 'approved' | 'rejected' } | null>(null);
  const [note, setNote] = useState('');

  // ---- calendar ----
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selectedDay, setSelectedDay] = useState<string | null>(today);
  const monthStart = `${month}-01`;
  const first = parseISODate(monthStart);
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday-first grid
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => addDays(monthStart, i))];
  while (cells.length % 7) cells.push(null);
  const shiftMonth = (n: number) => {
    const d = new Date(first.getFullYear(), first.getMonth() + n, 1);
    setMonth(toISODate(d).slice(0, 7));
    setSelectedDay(null);
  };
  const live = leaveRequests.filter(l => l.status === 'approved' || l.status === 'pending');
  const leavesOn = (d: string) => live.filter(l => l.from <= d && l.to >= d && parseISODate(d).getDay() !== 0);
  const holidayOn = (d: string) => holidays.find(h => h.date === d);
  const onLeaveToday = leaveRequests.filter(l => l.status === 'approved' && l.from <= today && l.to >= today);

  const mine = leaveRequests.filter(l => l.staffId === currentStaff?.id);
  const pending = leaveRequests.filter(l => l.status === 'pending');
  const [filter, setFilter] = useState<'all' | LeaveRequest['status']>('all');
  const history = leaveRequests.filter(l => filter === 'all' || l.status === filter);

  const tab = (id: typeof view, label: string, badge?: number) => (
    <button
      onClick={() => setView(id)}
      className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap ${
        view === id ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      {label}
      {!!badge && <span className="ml-1.5 px-1.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold">{badge}</span>}
    </button>
  );

  const requestRow = (l: LeaveRequest, actions: React.ReactNode) => {
    const staff = staffMembers.find(s => s.id === l.staffId);
    return (
      <div key={l.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
        <Avatar photo={staff?.photo} name={l.staffName} className="w-9 h-9 text-sm" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900 dark:text-white">
            {l.staffName} <span className="font-normal text-slate-500">· {staff?.department}</span>
          </div>
          <div className="text-slate-600 dark:text-slate-400">
            {LEAVE_LABEL[l.type]} · {range(l)} · <b>{l.days}</b> working day{l.days === 1 ? '' : 's'}
          </div>
          <div className="text-slate-500 dark:text-slate-400 italic truncate">“{l.reason}”</div>
          {l.decisionNote && <div className="text-[11px] text-slate-500">Note: {l.decisionNote}</div>}
        </div>
        <span className={`self-start sm:self-center px-2 py-0.5 rounded font-semibold capitalize ${STATUS_STYLE[l.status]}`}>{l.status}</span>
        {actions}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Leave & Holiday Calendar</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Apply for leave, approve requests, and see who is away. Sundays and holidays are not counted as leave days.
          </p>
        </div>
        {currentStaff && (
          <button onClick={() => setApplyOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-amber-600 rounded-lg self-start">
            <Plus className="w-3.5 h-3.5" /> Apply for leave
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={card}>
          <div className="text-[11px] text-slate-500">On leave today</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{onLeaveToday.length}</div>
          <div className="text-[11px] text-slate-500 truncate">{onLeaveToday.map(l => l.staffName).join(', ') || 'Everyone is in'}</div>
        </div>
        <div className={card}>
          <div className="text-[11px] text-slate-500">Pending approval</div>
          <div className="text-2xl font-bold font-mono text-amber-600">{pending.length}</div>
        </div>
        <div className={card}>
          <div className="text-[11px] text-slate-500">Approved this year</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {leaveRequests.filter(l => l.status === 'approved' && l.from.startsWith(year)).reduce((s, l) => s + l.days, 0)}
            <span className="text-xs font-normal text-slate-500"> days</span>
          </div>
        </div>
        <div className={card}>
          <div className="text-[11px] text-slate-500">Next holiday</div>
          {(() => {
            const h = holidays.find(x => x.date >= today);
            return h ? (
              <>
                <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{h.name}</div>
                <div className="text-[11px] text-slate-500">{formatDate(h.date)}</div>
              </>
            ) : (
              <div className="text-sm text-slate-500">None listed</div>
            );
          })()}
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit max-w-full overflow-x-auto">
        {isAdmin && tab('approvals', 'Approvals', pending.length)}
        {currentStaff && tab('mine', 'My leave')}
        {tab('calendar', 'Leave calendar')}
        {tab('holidays', 'Holidays')}
      </div>

      {view === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className={`${card} lg:col-span-2`}>
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => shiftMonth(-1)} aria-label="Previous month" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h3>
              <button onClick={() => shiftMonth(1)} aria-label="Next month" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-[10px] font-semibold text-slate-500 text-center mb-1">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1" data-leave-calendar>
              {cells.map((d, i) => {
                if (!d) return <div key={i} />;
                const hol = holidayOn(d);
                const sunday = parseISODate(d).getDay() === 0;
                const ls = leavesOn(d);
                const isToday = d === today;
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(d)}
                    className={`min-h-[64px] sm:min-h-[78px] p-1 rounded-lg border text-left align-top flex flex-col gap-0.5 transition-colors ${
                      selectedDay === d ? 'ring-2 ring-amber-500' : ''
                    } ${
                      hol
                        ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900'
                        : sunday
                          ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className={`text-[11px] font-bold ${isToday ? 'text-amber-600' : sunday || hol ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {Number(d.slice(8))}
                    </span>
                    {hol && <span className="text-[9px] leading-tight text-rose-700 dark:text-rose-300 line-clamp-2">{hol.name}</span>}
                    {!hol &&
                      ls.slice(0, 2).map(l => (
                        <span
                          key={l.id}
                          className={`text-[9px] leading-tight px-1 rounded truncate ${
                            l.status === 'approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'border border-dashed border-amber-500 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {l.staffName.replace(/^(Dr|Col)\.?\s+/i, '').split(' ')[0]}
                        </span>
                      ))}
                    {!hol && ls.length > 2 && <span className="text-[9px] text-slate-500">+{ls.length - 2} more</span>}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-900/50" /> Approved leave
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded border border-dashed border-amber-500" /> Pending
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-rose-50 border border-rose-200" /> Holiday
              </span>
              <span>Sunday is the weekly off</span>
            </div>
          </div>
          <div className={card}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" /> {selectedDay ? formatDate(selectedDay) : 'Pick a day'}
            </h3>
            {selectedDay && (
              <div className="mt-3 space-y-2 text-xs">
                {holidayOn(selectedDay) && <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 font-semibold">Holiday: {holidayOn(selectedDay)!.name}</div>}
                {parseISODate(selectedDay).getDay() === 0 && <div className="text-slate-500">Sunday (weekly off)</div>}
                {leavesOn(selectedDay).length === 0 && !holidayOn(selectedDay) && <div className="text-slate-500">No one is on leave.</div>}
                {leavesOn(selectedDay).map(l => (
                  <div key={l.id} className="flex items-center gap-2">
                    <Avatar photo={staffMembers.find(s => s.id === l.staffId)?.photo} name={l.staffName} className="w-7 h-7 text-xs" />
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-white truncate">{l.staffName}</div>
                      <div className="text-slate-500">
                        {LEAVE_LABEL[l.type]} · <span className="capitalize">{l.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'mine' && currentStaff && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['casual', 'sick', 'earned'] as const).map(t => {
              const used = leaveUsed(leaveRequests, currentStaff.id, t, year);
              return (
                <div key={t} className={card}>
                  <div className="text-[11px] text-slate-500">{LEAVE_LABEL[t]}</div>
                  <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                    {LEAVE_QUOTA[t] - used}
                    <span className="text-xs font-normal text-slate-500"> of {LEAVE_QUOTA[t]} left</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, (used / LEAVE_QUOTA[t]) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className={`${card} space-y-2`}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">My requests</h3>
            {mine.length === 0 && <p className="text-xs text-slate-500">You haven't applied for leave yet.</p>}
            {mine.map(l =>
              requestRow(
                l,
                (l.status === 'pending' || (l.status === 'approved' && l.from > today)) && (
                  <button onClick={() => cancelLeave(l.id)} className="self-start sm:self-center text-xs font-semibold text-rose-600 hover:underline">
                    Cancel
                  </button>
                )
              )
            )}
          </div>
        </div>
      )}

      {view === 'approvals' && isAdmin && (
        <div className="space-y-4">
          <div className={`${card} space-y-2`}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Waiting for approval ({pending.length})</h3>
            {pending.length === 0 && <p className="text-xs text-slate-500">Nothing to approve.</p>}
            {pending.map(l => {
              const own = l.staffId === currentStaff?.id;
              const bal = LEAVE_QUOTA[l.type] - leaveUsed(leaveRequests, l.staffId, l.type, l.from.slice(0, 4));
              return requestRow(
                l,
                <div className="flex flex-col items-start sm:items-end gap-1">
                  {l.type !== 'unpaid' && (
                    <span className={`text-[11px] ${bal < l.days ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>
                      Balance {bal} day{bal === 1 ? '' : 's'}
                      {bal < l.days && ' (not enough)'}
                    </span>
                  )}
                  {own ? (
                    <span className="text-[11px] text-slate-500">Your own request: needs another approver</span>
                  ) : (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setNote('');
                          setDecision({ req: l, status: 'approved' });
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => {
                          setNote('');
                          setDecision({ req: l, status: 'rejected' });
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 text-white font-semibold"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className={`${card} space-y-2`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">All leave requests</h3>
              <select value={filter} onChange={e => setFilter(e.target.value as typeof filter)} className={`${FIELD} sm:max-w-[180px]`}>
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            {history.length === 0 && <p className="text-xs text-slate-500">No requests.</p>}
            {history.map(l => requestRow(l, null))}
          </div>
        </div>
      )}

      {view === 'holidays' && <HolidayList isAdmin={isAdmin} holidays={holidays} onAdd={addHoliday} onRemove={removeHoliday} today={today} />}

      {applyOpen && currentStaff && <ApplyLeaveModal onClose={() => setApplyOpen(false)} onApplied={() => setView('mine')} apply={applyLeave} />}

      {decision && (
        <Modal
          title={decision.status === 'approved' ? 'Approve leave' : 'Reject leave'}
          subtitle={`${decision.req.staffName} · ${LEAVE_LABEL[decision.req.type]} · ${range(decision.req)}`}
          onClose={() => setDecision(null)}
          size="sm"
          footer={
            <div className="flex justify-end gap-2">
              <button onClick={() => setDecision(null)} className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                Cancel
              </button>
              <button
                onClick={() => {
                  decideLeave(decision.req.id, decision.status, note.trim() || undefined);
                  setDecision(null);
                }}
                className={`px-4 py-2 text-xs font-bold text-white rounded-lg ${decision.status === 'approved' ? 'bg-emerald-600' : 'bg-rose-600'}`}
              >
                {decision.status === 'approved' ? 'Approve' : 'Reject'}
              </button>
            </div>
          }
        >
          <label className={LBL}>Note to {decision.req.staffName.split(' ')[0]} (optional)</label>
          <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} className={FIELD} placeholder="e.g. Please arrange a substitute for Saturday's class." />
          {decision.status === 'approved' && <p className="mt-2 text-[11px] text-slate-500">The days are marked as Leave on the staff attendance register.</p>}
        </Modal>
      )}
    </div>
  );
};

const ApplyLeaveModal: React.FC<{
  onClose: () => void;
  onApplied: () => void;
  apply: ReturnType<typeof useApp>['applyLeave'];
}> = ({ onClose, onApplied, apply }) => {
  const { currentStaff, today, holidays, leaveRequests } = useApp();
  const [type, setType] = useState<LeaveType>('casual');
  const [from, setFrom] = useState(addDays(today, 1));
  const [to, setTo] = useState(addDays(today, 1));
  const [halfDay, setHalfDay] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const days = useMemo(() => (halfDay ? 0.5 : to >= from ? workingDaysIn(from, to, holidays).length : 0), [from, to, halfDay, holidays]);
  const balance = currentStaff ? LEAVE_QUOTA[type] - leaveUsed(leaveRequests, currentStaff.id, type, from.slice(0, 4)) : 0;

  const submit = () => {
    if (!currentStaff) return;
    if (!reason.trim()) return setError('Please give a reason.');
    if (type !== 'unpaid' && days > balance) return setError(`Only ${balance} day(s) of ${LEAVE_LABEL[type].toLowerCase()} left. Choose another type or Loss of pay.`);
    const r = apply({ staffId: currentStaff.id, type, from, to: halfDay ? from : to, halfDay, reason: reason.trim() });
    if ('error' in r) return setError(r.error);
    onApplied();
    onClose();
  };

  return (
    <Modal
      title="Apply for leave"
      subtitle="Your request goes to management for approval."
      onClose={onClose}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            Cancel
          </button>
          <button onClick={submit} className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-amber-600 rounded-lg">
            Submit request
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div>
          <label className={LBL}>Leave type</label>
          <select value={type} onChange={e => setType(e.target.value as LeaveType)} className={FIELD}>
            {(Object.keys(LEAVE_LABEL) as LeaveType[]).map(t => (
              <option key={t} value={t}>
                {LEAVE_LABEL[t]}
                {t !== 'unpaid' && currentStaff ? ` (${LEAVE_QUOTA[t] - leaveUsed(leaveRequests, currentStaff.id, t, from.slice(0, 4))} left)` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={LBL}>From</label>
            <input
              type="date"
              value={from}
              onChange={e => {
                setFrom(e.target.value);
                if (to < e.target.value) setTo(e.target.value);
              }}
              className={FIELD}
            />
          </div>
          <div>
            <label className={LBL}>To</label>
            <input type="date" value={halfDay ? from : to} min={from} disabled={halfDay} onChange={e => setTo(e.target.value)} className={FIELD} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
          <input type="checkbox" checked={halfDay} onChange={e => setHalfDay(e.target.checked)} /> Half day
        </label>
        <div>
          <label className={LBL}>Reason</label>
          <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} className={FIELD} placeholder="e.g. Family function in Trichy" />
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          <b>{days}</b> working day{days === 1 ? '' : 's'} (Sundays and holidays excluded).
        </p>
        {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
      </div>
    </Modal>
  );
};

const HolidayList: React.FC<{
  isAdmin: boolean;
  holidays: { id: string; date: string; name: string }[];
  onAdd: (date: string, name: string) => void;
  onRemove: (id: string) => void;
  today: string;
}> = ({ isAdmin, holidays, onAdd, onRemove, today }) => {
  const [date, setDate] = useState(today);
  const [name, setName] = useState('');
  return (
    <div className={`${card} space-y-3`}>
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Academy holidays</h3>
      {isAdmin && (
        <div className="flex flex-col sm:flex-row gap-2">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={`${FIELD} sm:max-w-[180px]`} />
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Holiday name, e.g. Deepavali" className={FIELD} />
          <button
            onClick={() => {
              if (!date || !name.trim()) return;
              onAdd(date, name.trim());
              setName('');
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-amber-600 rounded-lg whitespace-nowrap"
          >
            Add holiday
          </button>
        </div>
      )}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {holidays.map(h => (
          <div key={h.id} className={`py-2 flex items-center justify-between gap-2 text-xs ${h.date < today ? 'opacity-60' : ''}`}>
            <span className="font-mono text-slate-500 w-28 shrink-0">{formatDate(h.date)}</span>
            <span className="flex-1 font-semibold text-slate-900 dark:text-white">{h.name}</span>
            {isAdmin && (
              <button onClick={() => onRemove(h.id)} aria-label={`Remove ${h.name}`} className="p-1 text-slate-400 hover:text-rose-600">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
