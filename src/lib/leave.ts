import type { Holiday, LeaveRequest, LeaveType } from '../types';
import { addDays, parseISODate } from './dates';

/** Yearly entitlement per leave type (the academy can change these). Unpaid has no limit. */
export const LEAVE_QUOTA: Record<LeaveType, number> = { casual: 12, sick: 10, earned: 15, unpaid: Infinity };
export const LEAVE_LABEL: Record<LeaveType, string> = { casual: 'Casual leave', sick: 'Sick leave', earned: 'Earned leave', unpaid: 'Loss of pay' };

/** Working days in a range: Monday–Saturday (Sunday is the weekly off), excluding holidays. */
export const workingDaysIn = (from: string, to: string, holidays: Holiday[]): string[] => {
  const hol = new Set(holidays.map(h => h.date));
  const out: string[] = [];
  for (let d = from, g = 0; d <= to && g < 400; d = addDays(d, 1), g++) {
    if (parseISODate(d).getDay() !== 0 && !hol.has(d)) out.push(d);
  }
  return out;
};

export const leaveUsed = (requests: LeaveRequest[], staffId: string, type: LeaveType, year: string) =>
  requests
    .filter(r => r.staffId === staffId && r.type === type && r.status === 'approved' && r.from.startsWith(year))
    .reduce((s, r) => s + r.days, 0);

export const leaveBalance = (requests: LeaveRequest[], staffId: string, type: LeaveType, year: string) =>
  LEAVE_QUOTA[type] - leaveUsed(requests, staffId, type, year);

/** Tamil Nadu / national holidays for the academic year (editable in the Leave screen). */
export const DEFAULT_HOLIDAYS = (year: number): { date: string; name: string }[] => [
  { date: `${year}-01-01`, name: "New Year's Day" },
  { date: `${year}-01-14`, name: 'Pongal' },
  { date: `${year}-01-15`, name: 'Thiruvalluvar Day' },
  { date: `${year}-01-16`, name: 'Uzhavar Thirunal' },
  { date: `${year}-01-26`, name: 'Republic Day' },
  { date: `${year}-04-14`, name: 'Tamil New Year / Ambedkar Jayanti' },
  { date: `${year}-05-01`, name: 'May Day' },
  { date: `${year}-08-15`, name: 'Independence Day' },
  { date: `${year}-10-02`, name: 'Gandhi Jayanti' },
  { date: `${year}-12-25`, name: 'Christmas' }
];
