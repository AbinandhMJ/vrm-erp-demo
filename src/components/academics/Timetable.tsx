import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { FIELD, LBL } from '../admissions/AdmissionFormFields';
import { ClassScheduleItem } from '../../types';
import { addDays, formatDate, parseISODate, weekdayOf } from '../../lib/dates';
import { DatedClass, classesOn, findClashes, makeRange, parseRange, to24h } from '../../lib/timetable';
import { classIsFor, occurrencesBetween, timeLabel } from '../../lib/onlineClasses';
import { Clock, MapPin, User, Plus, ChevronLeft, ChevronRight, Pencil, Trash2, Ban, RotateCcw, Video, AlertTriangle, CalendarDays, Repeat } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
type Day = (typeof DAYS)[number];

const mondayOf = (iso: string) => {
  const dow = parseISODate(iso).getDay();
  return addDays(iso, dow === 0 ? -6 : 1 - dow);
};

type FormState =
  | { mode: 'weekly'; slot?: ClassScheduleItem; day?: Day; batchId?: string }
  | { mode: 'once'; date?: string; batchId?: string };

export const Timetable: React.FC = () => {
  const { schedule, scheduleChanges, batches, role, currentStudent, currentStaff, currentUser, today, onlineClasses, setActiveTab, deleteScheduleSlot, cancelClassSession, removeScheduleChange } = useApp();
  const isStudent = role === 'student';
  const isFaculty = role === 'faculty';
  const canManage = role === 'management' || role === 'office_staff' || role === 'faculty';
  const canEditSlot = (facultyName: string) => role === 'management' || role === 'office_staff' || (isFaculty && facultyName === currentUser.name);

  const [view, setView] = useState<'week' | 'template'>('week');
  const [selectedBatchId, setSelectedBatchId] = useState(isFaculty ? 'mine' : 'all');
  const effectiveBatch = isStudent ? currentStudent?.enrolledBatchId || '' : selectedBatchId;
  const matches = (c: { batchId: string; facultyName: string }) =>
    effectiveBatch === 'all' ? true : effectiveBatch === 'mine' ? c.facultyName === currentStaff?.name : c.batchId === effectiveBatch;

  const [weekStart, setWeekStart] = useState(mondayOf(today));
  const weekDates = DAYS.map((_, i) => addDays(weekStart, i));
  const [form, setForm] = useState<FormState | null>(null);
  const [cancelling, setCancelling] = useState<DatedClass | null>(null);
  const [toast, setToast] = useState('');
  const flash = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(''), 4000);
  };

  // Online classes for the week, shown alongside classroom classes.
  const online = useMemo(
    () =>
      occurrencesBetween(onlineClasses, weekDates[0], weekDates[6]).filter(o =>
        isStudent
          ? classIsFor(o.cls, currentStudent?.enrolledBatchId)
          : effectiveBatch === 'all'
            ? true
            : effectiveBatch === 'mine'
              ? o.cls.facultyName === currentStaff?.name
              : classIsFor(o.cls, effectiveBatch)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onlineClasses, weekStart, effectiveBatch]
  );

  const changesThisWeek = scheduleChanges.filter(c => c.date >= weekDates[0] && c.date <= weekDates[6] && matches(c));

  const classRow = (c: DatedClass, dated: boolean) => {
    const cancelled = c.kind === 'cancelled';
    return (
      <div key={c.key} data-class={`${c.subject}|${c.kind}`} className="py-3 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-bold ${cancelled ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>{c.subject}</span>
            {c.kind === 'extra' && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300">Extra class</span>}
            {cancelled && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">Cancelled</span>}
            {!isStudent && (
              <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">{c.batchName}</span>
            )}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {c.topic}
            {c.reason && <span className="italic"> · {cancelled ? 'Reason' : 'Note'}: {c.reason}</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 shrink-0">
          <span className={`flex items-center gap-1.5 font-mono ${cancelled ? 'line-through' : 'text-slate-700 dark:text-slate-300'}`}>
            <Clock className="w-3.5 h-3.5 text-slate-400" /> {c.time}
          </span>
          <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-slate-400" /> {c.room}
          </span>
          <span className="flex items-center gap-1.5 text-slate-900 dark:text-white font-medium">
            <User className="w-3.5 h-3.5 text-slate-400" /> {c.facultyName}
          </span>
          {canManage && canEditSlot(c.facultyName) && (
            <span className="flex items-center gap-1">
              {dated && c.kind === 'regular' && c.date >= today && (
                <button onClick={() => setCancelling(c)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300">
                  <Ban className="w-3 h-3" /> Cancel this day
                </button>
              )}
              {dated && c.kind === 'cancelled' && (
                <button
                  onClick={() => {
                    removeScheduleChange(c.changeId!);
                    flash('Class restored.');
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300"
                >
                  <RotateCcw className="w-3 h-3" /> Restore
                </button>
              )}
              {dated && c.kind === 'extra' && (
                <button onClick={() => window.confirm('Remove this extra class?') && removeScheduleChange(c.changeId!)} aria-label="Remove extra class" className="p-1 text-slate-400 hover:text-rose-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              {!dated && (
                <>
                  <button onClick={() => setForm({ mode: 'weekly', slot: schedule.find(s => s.id === c.slotId) })} aria-label={`Edit ${c.subject}`} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => window.confirm(`Remove ${c.subject} on ${weekdayOf(c.date)}s from the timetable?`) && deleteScheduleSlot(c.slotId!)}
                    aria-label={`Delete ${c.subject}`}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{isStudent ? 'My Class Schedule' : 'Class Schedules & Timetable'}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isStudent ? currentStudent?.enrolledBatchName : 'Weekly timetable, extra classes and cancellations. Students see changes straight away.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {!isStudent && (
            <div className="w-full sm:w-64">
            <select value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)} className={FIELD} aria-label="Show batch">
              {isFaculty && <option value="mine">My classes (all batches)</option>}
              <option value="all">All batches</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            </div>
          )}
          {canManage && (
            <button
              onClick={() => setForm({ mode: 'once', batchId: effectiveBatch !== 'all' && effectiveBatch !== 'mine' ? effectiveBatch : undefined })}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg"
            >
              <Plus className="w-4 h-4" /> Schedule a class
            </button>
          )}
        </div>
      </div>

      {toast && <div role="status" className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-900 dark:text-emerald-200">{toast}</div>}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
          {(
            [
              ['week', 'Week by date', <CalendarDays key="i" className="w-3.5 h-3.5" />],
              ['template', 'Regular weekly timetable', <Repeat key="i" className="w-3.5 h-3.5" />]
            ] as const
          ).map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap ${view === id ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
        {view === 'week' && (
          <div className="flex items-center gap-1 text-xs">
            <button onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-800 dark:text-slate-200 min-w-[170px] text-center">
              {formatDate(weekDates[0])} – {formatDate(weekDates[6])}
            </span>
            <button onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next week" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <ChevronRight className="w-4 h-4" />
            </button>
            {weekStart !== mondayOf(today) && (
              <button onClick={() => setWeekStart(mondayOf(today))} className="ml-1 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold">
                This week
              </button>
            )}
          </div>
        )}
      </div>

      {view === 'week' && changesThisWeek.length > 0 && (
        <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900 text-xs text-violet-900 dark:text-violet-200">
          <b>Changes this week:</b>{' '}
          {changesThisWeek
            .map(c => `${c.kind === 'extra' ? 'Extra' : 'Cancelled'}: ${c.subject} on ${weekdayOf(c.date).slice(0, 3)} ${formatDate(c.date).slice(0, 6)}`)
            .join(' · ')}
        </div>
      )}

      <div className="space-y-4">
        {(view === 'week' ? weekDates : DAYS.map(d => d)).map((key, i) => {
          const day = DAYS[i];
          const date = view === 'week' ? key : addDays(weekStart, i);
          const list: DatedClass[] =
            view === 'week'
              ? classesOn(date, schedule, scheduleChanges).filter(matches)
              : schedule
                  .filter(s => s.day === day && matches(s))
                  .sort((a, b) => parseRange(a.time).start - parseRange(b.time).start)
                  .map(s => ({ ...s, key: s.id, date, kind: 'regular' as const, slotId: s.id }));
          const onl = view === 'week' ? online.filter(o => o.date === date) : [];
          const isToday = view === 'week' ? date === today : day === weekdayOf(today);
          if (view === 'template' && list.length === 0 && (day === 'Sunday' || day === 'Saturday') && !canManage) return null;
          return (
            <div key={day} className={`bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-2xs ${isToday ? 'border-amber-400 dark:border-amber-600' : 'border-slate-200 dark:border-slate-800'}`}>
              <div className="bg-slate-50/80 dark:bg-slate-800/60 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {day}
                  {view === 'week' && <span className="ml-2 normal-case font-medium text-slate-500">{formatDate(date)}</span>}
                  {isToday && <span className="ml-2 text-[10px] text-amber-700 dark:text-amber-400 normal-case">Today</span>}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">
                    {list.filter(c => c.kind !== 'cancelled').length + onl.length} class{list.filter(c => c.kind !== 'cancelled').length + onl.length === 1 ? '' : 'es'}
                  </span>
                  {canManage && (
                    <button
                      onClick={() => setForm(view === 'week' ? { mode: 'once', date, batchId: effectiveBatch.startsWith('batch') ? effectiveBatch : undefined } : { mode: 'weekly', day, batchId: effectiveBatch.startsWith('batch') ? effectiveBatch : undefined })}
                      aria-label={`Add class on ${day}`}
                      className="p-1 rounded text-slate-400 hover:text-amber-600"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </span>
              </div>
              <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800">
                {list.length === 0 && onl.length === 0 && <p className="text-xs text-slate-400 italic py-1">No classes.</p>}
                {list.map(c => classRow(c, view === 'week'))}
                {onl.map(o => (
                  <div key={`${o.cls.id}|${o.date}`} className="py-3 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs font-bold ${o.cancelled ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>{o.cls.title}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 inline-flex items-center gap-1">
                          <Video className="w-3 h-3" /> Online · {o.cls.platform}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{o.cls.subject}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 shrink-0">
                      <span className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {timeLabel(o.start)} – {timeLabel(o.end)}
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-900 dark:text-white font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" /> {o.cls.facultyName}
                      </span>
                      <button onClick={() => setActiveTab('online_classes')} className="font-semibold text-rose-700 dark:text-rose-400 hover:underline">
                        Open
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {form && (
        <ScheduleClassModal
          initial={form}
          onClose={() => setForm(null)}
          onSaved={msg => {
            setForm(null);
            flash(msg);
          }}
          goOnline={() => {
            setForm(null);
            setActiveTab('online_classes');
          }}
        />
      )}

      {cancelling && (
        <CancelModal
          c={cancelling}
          onClose={() => setCancelling(null)}
          onConfirm={reason => {
            cancelClassSession(cancelling.slotId!, cancelling.date, reason);
            setCancelling(null);
            flash(`${cancelling.subject} on ${formatDate(cancelling.date)} is cancelled. Students in ${cancelling.batchName} see it in their schedule and notifications.`);
          }}
        />
      )}
    </div>
  );
};

const CancelModal: React.FC<{ c: DatedClass; onClose: () => void; onConfirm: (reason: string) => void }> = ({ c, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  return (
    <Modal
      title="Cancel this class"
      subtitle={`${c.subject} · ${c.batchName} · ${formatDate(c.date)}, ${c.time}`}
      onClose={onClose}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            Keep class
          </button>
          <button onClick={() => onConfirm(reason.trim() || 'Not given')} className="px-4 py-2 text-xs font-bold text-white bg-rose-600 rounded-lg">
            Cancel class
          </button>
        </div>
      }
    >
      <label className={LBL}>Reason (students see this)</label>
      <input className={FIELD} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Faculty on leave; make-up class on Saturday" />
      <p className="mt-2 text-[11px] text-slate-500">Only this date is cancelled. The weekly timetable stays the same.</p>
    </Modal>
  );
};

const ScheduleClassModal: React.FC<{ initial: FormState; onClose: () => void; onSaved: (msg: string) => void; goOnline: () => void }> = ({ initial, onClose, onSaved, goOnline }) => {
  const { schedule, scheduleChanges, batches, staffMembers, role, currentUser, today, saveScheduleSlot, addExtraClass } = useApp();
  const slot = initial.mode === 'weekly' ? initial.slot : undefined;
  const range = slot ? parseRange(slot.time) : null;
  const faculty = staffMembers.filter(s => s.department === 'Faculty');
  const rooms = [...new Set(schedule.map(s => s.room))].sort();
  const subjects = [...new Set(schedule.map(s => s.subject))].sort();

  const [mode, setMode] = useState<'weekly' | 'once'>(initial.mode);
  const [f, setF] = useState({
    batchId: slot?.batchId || initial.batchId || batches[0]?.id || '',
    subject: slot?.subject || '',
    topic: slot?.topic || '',
    facultyName: slot?.facultyName || (role === 'faculty' ? currentUser.name : faculty[0]?.name || ''),
    room: slot?.room || rooms[0] || '',
    day: (slot?.day || (initial.mode === 'weekly' ? initial.day : undefined) || 'Monday') as Day,
    date: (initial.mode === 'once' && initial.date && initial.date >= today ? initial.date : undefined) || today,
    start: range ? to24h(slot!.time.split(/\s*[–-]\s*/)[0]) : '10:00',
    end: range ? to24h(slot!.time.split(/\s*[–-]\s*/)[1]) : '11:30',
    note: ''
  });
  const [error, setError] = useState('');
  const [override, setOverride] = useState(false);
  const set = (patch: Partial<typeof f>) => {
    setF(prev => ({ ...prev, ...patch }));
    setOverride(false);
  };
  const time = makeRange(f.start, f.end);
  const clashes = findClashes(
    { batchId: f.batchId, facultyName: f.facultyName, room: f.room, time, day: mode === 'weekly' ? f.day : weekdayOf(f.date), date: mode === 'once' ? f.date : undefined, ignoreSlotId: slot?.id },
    schedule,
    scheduleChanges
  );

  const save = () => {
    if (!f.batchId || !f.subject.trim() || !f.facultyName) return setError('Choose the batch, subject and faculty.');
    if (f.end <= f.start) return setError('The class must end after it starts.');
    if (mode === 'once' && f.date < today) return setError('Pick today or a future date.');
    if (clashes.length && !override) return setError('This clashes with another class. Change the time, or tick “Schedule anyway”.');
    const data = { batchId: f.batchId, subject: f.subject.trim(), topic: f.topic.trim() || f.subject.trim(), facultyName: f.facultyName, room: f.room.trim() || 'TBD', time };
    if (mode === 'weekly') {
      saveScheduleSlot({ ...data, id: slot?.id, day: f.day });
      onSaved(slot ? `${data.subject} updated in the weekly timetable.` : `${data.subject} added every ${f.day}.`);
    } else {
      addExtraClass({ ...data, date: f.date, reason: f.note.trim() || undefined });
      onSaved(`Extra class: ${data.subject} on ${formatDate(f.date)}, ${time}. Students in the batch see it in their schedule.`);
    }
  };

  return (
    <Modal
      title={slot ? 'Edit weekly class' : 'Schedule a class'}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            Cancel
          </button>
          <button onClick={save} className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-amber-600 rounded-lg">
            {slot ? 'Save changes' : mode === 'weekly' ? 'Add to weekly timetable' : 'Schedule class'}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        {!slot && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {(
              [
                ['once', 'One-time class', 'Extra, make-up or special class on a date'],
                ['weekly', 'Every week', 'Add to the regular timetable'],
                ['online', 'Online class', 'YouTube Live / Meet / Zoom with links to students']
              ] as const
            ).map(([id, label, desc]) => (
              <button
                key={id}
                type="button"
                onClick={() => (id === 'online' ? goOnline() : setMode(id))}
                className={`p-3 rounded-lg border text-left ${
                  mode === id ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40' : 'border-slate-200 dark:border-slate-700 hover:border-amber-400'
                }`}
              >
                <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  {id === 'once' ? <CalendarDays className="w-3.5 h-3.5" /> : id === 'weekly' ? <Repeat className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />} {label}
                </span>
                <span className="block mt-0.5 text-[11px] text-slate-500">{desc}</span>
              </button>
            ))}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={LBL}>Batch *</label>
            <select className={FIELD} value={f.batchId} onChange={e => set({ batchId: e.target.value })}>
              {batches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LBL}>Subject *</label>
            <input className={FIELD} list="tt-subjects" value={f.subject} onChange={e => set({ subject: e.target.value })} placeholder="Pick or type" />
            <datalist id="tt-subjects">
              {subjects.map(s => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div>
            <label className={LBL}>Topic</label>
            <input className={FIELD} value={f.topic} onChange={e => set({ topic: e.target.value })} placeholder="e.g. Fundamental Rights revision" />
          </div>
          <div>
            <label className={LBL}>Faculty *</label>
            <select className={FIELD} value={f.facultyName} onChange={e => set({ facultyName: e.target.value })}>
              {faculty.map(s => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LBL}>{mode === 'weekly' ? 'Day of the week' : 'Date'}</label>
            {mode === 'weekly' ? (
              <select className={FIELD} value={f.day} onChange={e => set({ day: e.target.value as Day })}>
                {DAYS.map(d => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            ) : (
              <input type="date" className={FIELD} value={f.date} min={today} onChange={e => set({ date: e.target.value })} />
            )}
          </div>
          <div>
            <label className={LBL}>Room</label>
            <input className={FIELD} list="tt-rooms" value={f.room} onChange={e => set({ room: e.target.value })} />
            <datalist id="tt-rooms">
              {rooms.map(r => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:col-span-2">
            <div>
              <label className={LBL}>Starts</label>
              <input type="time" className={FIELD} value={f.start} onChange={e => set({ start: e.target.value })} />
            </div>
            <div>
              <label className={LBL}>Ends</label>
              <input type="time" className={FIELD} value={f.end} onChange={e => set({ end: e.target.value })} />
            </div>
          </div>
          {mode === 'once' && (
            <div className="sm:col-span-2">
              <label className={LBL}>Note for students (optional)</label>
              <input className={FIELD} value={f.note} onChange={e => set({ note: e.target.value })} placeholder="e.g. Make-up for Monday's cancelled class" />
            </div>
          )}
        </div>
        {clashes.length > 0 && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1" data-clash>
            <div className="font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Clash
            </div>
            {clashes.map((c, i) => (
              <div key={i}>
                {c.what === 'batch' ? 'The batch already has' : c.what === 'faculty' ? `${f.facultyName} already teaches` : `${f.room} is already used for`} {c.with}
              </div>
            ))}
            <label className="flex items-center gap-1.5 pt-1">
              <input type="checkbox" checked={override} onChange={e => setOverride(e.target.checked)} /> Schedule anyway
            </label>
          </div>
        )}
        {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
      </div>
    </Modal>
  );
};
