import type { ClassScheduleItem, ScheduleChange } from '../types';
import { weekdayOf } from './dates';

/** "07:30 AM – 10:30 AM" ⇄ minutes since midnight. */
const toMin = (t: string): number => {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return NaN;
  let h = Number(m[1]);
  const min = Number(m[2]);
  if (m[3]) {
    const pm = m[3].toUpperCase() === 'PM';
    if (h === 12) h = pm ? 12 : 0;
    else if (pm) h += 12;
  }
  return h * 60 + min;
};

export const parseRange = (range: string): { start: number; end: number } => {
  const [a, b] = range.split(/\s*[–-]\s*/);
  return { start: toMin(a || ''), end: toMin(b || '') };
};

/** 24h "HH:MM" → "07:30 AM". */
export const to12h = (hhmm: string): string => {
  const [h, m] = hhmm.split(':').map(Number);
  const pm = h >= 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${pm ? 'PM' : 'AM'}`;
};
/** "07:30 AM" → "07:30" (24h). */
export const to24h = (t: string): string => {
  const v = toMin(t);
  if (Number.isNaN(v)) return '09:00';
  return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;
};
export const makeRange = (start24: string, end24: string) => `${to12h(start24)} – ${to12h(end24)}`;

export const overlaps = (a: string, b: string): boolean => {
  const x = parseRange(a);
  const y = parseRange(b);
  if ([x.start, x.end, y.start, y.end].some(Number.isNaN)) return false;
  return x.start < y.end && y.start < x.end;
};

export interface DatedClass {
  key: string;
  date: string;
  kind: 'regular' | 'extra' | 'cancelled';
  batchId: string;
  batchName: string;
  subject: string;
  topic: string;
  facultyName: string;
  room: string;
  time: string;
  slotId?: string;
  changeId?: string;
  reason?: string;
}

/** The actual classes on a date: weekly slots, minus cancellations, plus extra classes. */
export const classesOn = (date: string, schedule: ClassScheduleItem[], changes: ScheduleChange[]): DatedClass[] => {
  const day = weekdayOf(date);
  const dayChanges = changes.filter(c => c.date === date);
  const regular: DatedClass[] = schedule
    .filter(s => s.day === day)
    .map(s => {
      const cancel = dayChanges.find(c => c.kind === 'cancelled' && c.slotId === s.id);
      return {
        key: `${s.id}|${date}`,
        date,
        kind: cancel ? 'cancelled' : 'regular',
        batchId: s.batchId,
        batchName: s.batchName,
        subject: s.subject,
        topic: s.topic,
        facultyName: s.facultyName,
        room: s.room,
        time: s.time,
        slotId: s.id,
        changeId: cancel?.id,
        reason: cancel?.reason
      };
    });
  const extra: DatedClass[] = dayChanges
    .filter(c => c.kind === 'extra')
    .map(c => ({
      key: c.id,
      date,
      kind: 'extra',
      batchId: c.batchId,
      batchName: c.batchName,
      subject: c.subject,
      topic: c.topic,
      facultyName: c.facultyName,
      room: c.room,
      time: c.time,
      changeId: c.id,
      reason: c.reason
    }));
  return [...regular, ...extra].sort((a, b) => parseRange(a.time).start - parseRange(b.time).start);
};

export type Clash = { what: 'batch' | 'faculty' | 'room'; with: string };

/** Clashes for a class at `time` on a weekday (and, if given, a specific date). */
export const findClashes = (
  candidate: { batchId: string; facultyName: string; room: string; time: string; day: string; date?: string; ignoreSlotId?: string; ignoreChangeId?: string },
  schedule: ClassScheduleItem[],
  changes: ScheduleChange[]
): Clash[] => {
  const others: { batchId: string; batchName: string; facultyName: string; room: string; time: string; label: string }[] = candidate.date
    ? classesOn(candidate.date, schedule, changes)
        .filter(
          c =>
            c.kind !== 'cancelled' &&
            (!candidate.ignoreSlotId || c.slotId !== candidate.ignoreSlotId) &&
            (!candidate.ignoreChangeId || c.changeId !== candidate.ignoreChangeId)
        )
        .map(c => ({ ...c, label: `${c.subject} (${c.batchName}, ${c.time})` }))
    : schedule
        .filter(s => s.day === candidate.day && (!candidate.ignoreSlotId || s.id !== candidate.ignoreSlotId))
        .map(s => ({ ...s, label: `${s.subject} (${s.batchName}, ${s.time})` }));
  const out: Clash[] = [];
  for (const o of others) {
    if (!overlaps(o.time, candidate.time)) continue;
    if (o.batchId === candidate.batchId) out.push({ what: 'batch', with: o.label });
    if (o.facultyName === candidate.facultyName) out.push({ what: 'faculty', with: o.label });
    if (candidate.room && o.room === candidate.room && !/online/i.test(candidate.room)) out.push({ what: 'room', with: o.label });
  }
  return out;
};
