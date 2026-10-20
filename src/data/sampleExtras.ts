// Sample leave requests, online classes and reminders for "Load sample data", dated relative to today.
import type { ClassReminder, LeaveRequest, OnlineClass, StaffMember } from '../types';
import { addDays, parseISODate } from '../lib/dates';

export const YOUTUBE_CHANNEL = 'https://www.youtube.com/@vrmiasacademy';

export const buildSampleExtras = (today: string, staff: StaffMember[]) => {
  const byName = (part: string) => staff.find(s => s.name.includes(part));
  const mk = (
    s: StaffMember | undefined,
    type: LeaveRequest['type'],
    fromOffset: number,
    days: number,
    status: LeaveRequest['status'],
    reason: string
  ): LeaveRequest[] => {
    if (!s) return [];
    const from = addDays(today, fromOffset);
    let to = from;
    let counted = 1;
    while (counted < days) {
      to = addDays(to, 1);
      if (parseISODate(to).getDay() !== 0) counted++;
    }
    return [
      {
        id: `lv-${s.id}-${from}`,
        staffId: s.id,
        staffName: s.name,
        type,
        from,
        to,
        days,
        reason,
        status,
        appliedAt: new Date(parseISODate(addDays(today, Math.min(fromOffset, 0) - 3)).getTime() + 10 * 3600_000).toISOString(),
        ...(status !== 'pending' ? { decidedBy: 'Director', decidedAt: new Date(parseISODate(addDays(today, Math.min(fromOffset, 0) - 2)).getTime()).toISOString() } : {})
      }
    ];
  };

  const leaveRequests: LeaveRequest[] = [
    ...mk(byName('Meenakshi'), 'sick', -20, 2, 'approved', 'Viral fever, doctor advised rest.'),
    ...mk(byName('Shalini'), 'casual', -9, 1, 'approved', 'Family function in Trichy.'),
    ...mk(byName('Sathish'), 'casual', 3, 1, 'pending', 'Bank work and house registration.'),
    ...mk(byName('Prakash'), 'earned', 8, 3, 'pending', 'Attending a CSAT trainers workshop in Chennai.'),
    ...mk(byName('Vigneshwaran'), 'casual', -4, 1, 'rejected', 'Personal work.')
  ];

  const dow = (offset: number) => parseISODate(addDays(today, offset)).getDay();
  const createdAt = new Date(parseISODate(addDays(today, -14)).getTime()).toISOString();
  const base = {
    cancelledDates: [] as string[],
    recordings: {} as Record<string, string>,
    remindBeforeMinutes: 30,
    createdBy: 'Director',
    createdAt
  };
  const onlineClasses: OnlineClass[] = [
    {
      ...base,
      id: 'ocl-ca-daily',
      title: 'Daily Current Affairs Live',
      subject: 'Weekly Current Affairs & Mains Answer Writing',
      batchIds: [],
      facultyName: 'Dr. K. Ramanathan',
      platform: 'YouTube Live',
      link: `${YOUTUBE_CHANNEL}/live`,
      startDate: addDays(today, -14),
      startTime: '20:00',
      durationMinutes: 45,
      repeat: 'weekly',
      repeatDays: [1, 2, 3, 4, 5, 6],
      endDate: addDays(today, 60),
      notes: 'Open to all students. The recording stays on the channel.',
      recordings: Object.fromEntries(
        [-1, -2, -3, -4, -5, -6].filter(o => dow(o) !== 0).map(o => [addDays(today, o), `https://www.youtube.com/watch?v=vrm-ca-${addDays(today, o).replace(/-/g, '')}`])
      )
    },
    {
      ...base,
      id: 'ocl-polity-revision',
      title: 'Polity Revision: Parliament & Committees',
      subject: 'Indian Polity & Governance',
      batchIds: ['batch-01', 'batch-02'],
      facultyName: 'Dr. K. Ramanathan',
      platform: 'Google Meet',
      link: 'https://meet.google.com/vrm-poli-tyr',
      startDate: addDays(today, -7),
      startTime: '17:30',
      durationMinutes: 60,
      repeat: 'weekly',
      repeatDays: [dow(1) === 0 ? 1 : dow(1)],
      endDate: addDays(today, 35)
    },
    {
      ...base,
      id: 'ocl-csat-doubt',
      title: 'CSAT Doubt Clearing',
      subject: 'CSAT Quantitative Aptitude',
      batchIds: ['batch-05', 'batch-06'],
      facultyName: 'A. Prakash',
      platform: 'Zoom',
      link: 'https://zoom.us/j/9876543210',
      startDate: addDays(today, 2) ,
      startTime: '19:00',
      durationMinutes: 90,
      repeat: 'none',
      repeatDays: [],
      notes: 'Bring your doubts from the last two mock tests.'
    }
  ];

  const classReminders: ClassReminder[] = Object.keys(onlineClasses[0].recordings).map(date => ({
    id: `rem-ocl-ca-daily-${date}`,
    classId: 'ocl-ca-daily',
    date,
    sentAt: new Date(parseISODate(date).getTime() + (19 * 60 + 30) * 60_000).toISOString(),
    recipients: 0,
    channels: 'App, SMS, WhatsApp',
    manual: false
  }));

  return { leaveRequests, onlineClasses, classReminders };
};
