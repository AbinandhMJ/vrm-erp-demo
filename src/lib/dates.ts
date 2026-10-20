// Small date helpers. All business dates are stored as local `YYYY-MM-DD` strings.

export const toISODate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const todayISO = (): string => toISODate(new Date());

export const parseISODate = (iso: string): Date => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (iso: string, days: number): string => {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

export const daysBetween = (fromISO: string, toISO: string): number =>
  Math.round((parseISODate(toISO).getTime() - parseISODate(fromISO).getTime()) / 86_400_000);

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export const weekdayOf = (iso: string): (typeof WEEKDAYS)[number] => WEEKDAYS[parseISODate(iso).getDay()];

export const formatDate = (iso?: string): string => {
  if (!iso) return '—';
  return parseISODate(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const nowDisplay = (): string =>
  new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
