import { AttendanceSession, Student } from '../types';
import { addDays, parseISODate } from './dates';

/** Last `n` calendar months ending with the month of `today`, oldest first. */
export const lastMonths = (today: string, n = 6) => {
  const base = parseISODate(today.slice(0, 8) + '01');
  const out: { key: string; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-IN', { month: 'short' })
    });
  }
  return out;
};

/** Weekly class attendance % for the last `weeks` weeks (Monday-start), optionally for one batch. */
export const weeklyAttendance = (sessions: AttendanceSession[], students: Student[], today: string, weeks = 12, batchId?: string) => {
  const byBatch = new Map<string, Student[]>();
  for (const s of students) {
    const l = byBatch.get(s.enrolledBatchId) || [];
    l.push(s);
    byBatch.set(s.enrolledBatchId, l);
  }
  const t = parseISODate(today);
  const monday = addDays(today, -((t.getDay() + 6) % 7));
  const rows: { week: string; attendance: number | null }[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const start = addDays(monday, -7 * w);
    const end = addDays(start, 6);
    let present = 0;
    let total = 0;
    for (const s of sessions) {
      if (s.date < start || s.date > end) continue;
      if (batchId && s.batchId !== batchId) continue;
      const absent = new Set(s.absentIds);
      for (const st of byBatch.get(s.batchId) || []) {
        if (st.admissionDate > s.date) continue;
        total++;
        if (!absent.has(st.id)) present++;
      }
    }
    rows.push({
      week: parseISODate(start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      attendance: total ? Math.round((present / total) * 1000) / 10 : null
    });
  }
  return rows;
};

/** Counts of values in fixed percentage bands. */
export const bands = (values: number[], edges = [0, 50, 60, 75, 90, 101], labels = ['Below 50%', '50–59%', '60–74%', '75–89%', '90%+']) =>
  labels.map((label, i) => ({ band: label, students: values.filter(v => v >= edges[i] && v < edges[i + 1]).length }));
