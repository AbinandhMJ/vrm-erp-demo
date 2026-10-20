import type { Batch, OnlineClass } from '../types';
import { addDays, parseISODate } from './dates';

export interface ClassOccurrence {
  cls: OnlineClass;
  date: string; // YYYY-MM-DD
  start: Date;
  end: Date;
  cancelled: boolean;
  recording?: string;
}

const atTime = (date: string, time: string): Date => {
  const d = parseISODate(date);
  const [h, m] = time.split(':').map(Number);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
};

/** All occurrence dates of a class between from and to (inclusive). */
export const occurrenceDates = (c: OnlineClass, from: string, to: string): string[] => {
  const out: string[] = [];
  if (c.repeat === 'none') {
    if (c.startDate >= from && c.startDate <= to) out.push(c.startDate);
    return out;
  }
  const last = c.endDate && c.endDate < to ? c.endDate : to;
  let d = c.startDate > from ? c.startDate : from;
  let guard = 0;
  while (d <= last && guard++ < 800) {
    const dow = parseISODate(d).getDay();
    if (c.repeat === 'daily' || c.repeatDays.includes(dow)) out.push(d);
    d = addDays(d, 1);
  }
  return out;
};

export const occurrencesBetween = (classes: OnlineClass[], from: string, to: string): ClassOccurrence[] =>
  classes
    .flatMap(cls =>
      occurrenceDates(cls, from, to).map(date => {
        const start = atTime(date, cls.startTime);
        return {
          cls,
          date,
          start,
          end: new Date(start.getTime() + cls.durationMinutes * 60_000),
          cancelled: cls.cancelledDates.includes(date),
          recording: cls.recordings[date]
        };
      })
    )
    .sort((a, b) => a.start.getTime() - b.start.getTime());

export const occurrenceStatus = (o: ClassOccurrence, now: Date): 'cancelled' | 'live' | 'upcoming' | 'ended' =>
  o.cancelled ? 'cancelled' : now >= o.start && now < o.end ? 'live' : now < o.start ? 'upcoming' : 'ended';

/** Is this class meant for a student of the given batch? (empty batchIds = all students) */
export const classIsFor = (c: OnlineClass, batchId?: string) => c.batchIds.length === 0 || (!!batchId && c.batchIds.includes(batchId));

export const audienceLabel = (c: OnlineClass, batches: Batch[]) =>
  c.batchIds.length === 0 ? 'All students' : c.batchIds.map(id => batches.find(b => b.id === id)?.name || id).join(', ');

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const repeatLabel = (c: OnlineClass) =>
  c.repeat === 'none' ? 'One-time' : c.repeat === 'daily' ? 'Every day' : `Every ${c.repeatDays.slice().sort().map(d => DAY_SHORT[d]).join(', ')}`;

export const timeLabel = (d: Date) => d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

export const occurrenceKey = (o: { cls: OnlineClass; date: string }) => `${o.cls.id}|${o.date}`;
