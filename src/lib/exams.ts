import type { AssessmentTest, StudentTestAttempt } from '../types';

export type ExamStatus = 'draft' | 'scheduled' | 'live' | 'completed';

const parseLocal = (s: string): Date => {
  const [d, t = '00:00'] = s.split('T');
  const [y, m, day] = d.split('-').map(Number);
  const [h, min] = t.split(':').map(Number);
  return new Date(y, m - 1, day, h || 0, min || 0);
};

export const toLocalInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`;

/** Window in which students can start the exam. Older data (date only) = 9 AM to 9 PM that day. */
export const examWindow = (t: AssessmentTest) => ({
  start: parseLocal(t.startAt || `${t.scheduledDate}T09:00`),
  end: parseLocal(t.endAt || `${t.scheduledDate}T21:00`)
});

export const examStatus = (t: AssessmentTest, now: Date): ExamStatus => {
  if (t.status === 'draft') return 'draft';
  const w = examWindow(t);
  if (now < w.start) return 'scheduled';
  if (now < w.end) return 'live';
  return 'completed';
};

/** Can a student see their score and the answers now? */
export const resultsVisible = (t: AssessmentTest, now: Date) => {
  const r = t.resultRelease || 'immediate';
  if (r === 'immediate') return true;
  if (r === 'manual') return !!t.resultsPublished;
  return examStatus(t, now) === 'completed' || !!t.resultsPublished;
};

export const STATUS_LABEL: Record<ExamStatus, string> = { draft: 'Draft', scheduled: 'Upcoming', live: 'Live now', completed: 'Completed' };
export const STATUS_STYLE: Record<ExamStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  scheduled: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  live: 'bg-rose-600 text-white',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
};

export const fmtDateTime = (d: Date) =>
  d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' });

export const countdown = (to: Date, now: Date) => {
  const ms = to.getTime() - now.getTime();
  if (ms <= 0) return 'now';
  const m = Math.round(ms / 60000);
  if (m < 60) return `in ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 48) return `in ${h} h ${m % 60} min`;
  return `in ${Math.round(h / 24)} days`;
};

export const totalMarksOf = (qs: { marks: number }[]) => Math.round(qs.reduce((s, q) => s + (q.marks || 0), 0) * 100) / 100;

/** Exam results: one row per student, ranked. */
export const rankAttempts = (attempts: StudentTestAttempt[]) => {
  const best = new Map<string, StudentTestAttempt>();
  for (const a of attempts) {
    const cur = best.get(a.studentId);
    if (!cur || a.score > cur.score) best.set(a.studentId, a);
  }
  const rows = [...best.values()].sort((a, b) => b.score - a.score);
  return rows.map((a, i) => ({ attempt: a, rank: rows.findIndex(x => x.score === a.score) + 1 || i + 1 }));
};

/** Fisher–Yates shuffle with a seed, so a student sees the same order if they reopen. */
export const seededShuffle = <T,>(arr: T[], seedStr: string): T[] => {
  let h = 2166136261;
  for (const c of seedStr) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const rnd = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
