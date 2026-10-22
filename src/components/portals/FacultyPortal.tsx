import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Clock, CheckCircle2, Upload, AlertTriangle, BookOpen, Video, ChevronDown, ChevronUp, ClipboardList, CalendarDays, CalendarCheck } from 'lucide-react';
import { formatDate, weekdayOf } from '../../lib/dates';
import { sameSubject } from '../../lib/subjects';
import { classesOn } from '../../lib/timetable';
import { Avatar } from '../common/PhotoPicker';

type Mark = 'present' | 'absent' | 'late';

export const FacultyPortal: React.FC = () => {
  const {
    role,
    students,
    batches,
    schedule,
    recordBatchAttendance,
    getSessionStatuses,
    salaryPayouts,
    setActiveTab,
    staffMembers,
    currentStaff,
    dailyQuizAttempts,
    attendance,
    studentAttempts,
    onlineClasses,
    scheduleChanges,
    today
  } = useApp();

  // Management can open this portal for any faculty member.
  const facultyList = staffMembers.filter(s => s.department === 'Faculty');
  const [viewAsId, setViewAsId] = useState(facultyList[0]?.id || '');
  const currentFaculty = role === 'faculty' ? currentStaff : facultyList.find(f => f.id === viewAsId) || facultyList[0];

  // Batches this faculty teaches: lead faculty, or has a timetable slot.
  const myBatches = useMemo(() => {
    if (!currentFaculty) return [];
    const taught = new Set(schedule.filter(s => s.facultyName === currentFaculty.name).map(s => s.batchId));
    return batches.filter(b => b.leadFacultyId === currentFaculty.id || taught.has(b.id));
  }, [batches, schedule, currentFaculty]);

  const mySlots = schedule.filter(s => s.facultyName === currentFaculty?.name);
  // Subjects this faculty teaches: from the timetable first, then any listed on their profile.
  const mySubjects = useMemo(() => {
    const fromSlots = [...new Set(mySlots.map(s => s.subject))];
    const extra = (currentFaculty?.subjectsHandling || []).filter(h => !fromSlots.some(f => sameSubject(f, h)));
    return [...fromSlots, ...extra];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule, currentFaculty]);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const activeSubject = mySubjects.includes(subjectFilter) ? subjectFilter : 'all';
  const inSubject = (subject: string) => activeSubject === 'all' || sameSubject(subject, activeSubject);

  const todaysClasses = classesOn(today, schedule, scheduleChanges)
    .filter(c => c.facultyName === currentFaculty?.name && c.kind !== 'cancelled' && inSubject(c.subject))
    .map(c => ({ ...c, id: c.key }));

  const [selectedBatchId, setSelectedBatchId] = useState('');
  const batchId = myBatches.some(b => b.id === selectedBatchId) ? selectedBatchId : myBatches[0]?.id || '';
  const [attendanceDate, setAttendanceDate] = useState(today);
  const slotForDay = schedule.find(s => s.batchId === batchId && s.day === weekdayOf(attendanceDate));
  const [lectureTopic, setLectureTopic] = useState('');
  // Subjects this faculty teaches in the selected batch (for recording which subject the class was).
  const batchSubjects = [...new Set(mySlots.filter(s => s.batchId === batchId).map(s => s.subject))];
  const subjectChoices = batchSubjects.length ? batchSubjects : mySubjects;
  const [attSubject, setAttSubject] = useState('');
  const sessionSubject = subjectChoices.includes(attSubject)
    ? attSubject
    : slotForDay && slotForDay.facultyName === currentFaculty?.name
      ? slotForDay.subject
      : activeSubject !== 'all' && subjectChoices.includes(activeSubject)
        ? activeSubject
        : subjectChoices[0] || 'General';

  const batchStudents = students
    .filter(s => s.enrolledBatchId === batchId && s.admissionDate <= attendanceDate && s.status === 'active')
    .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));

  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<string, Mark>>({});
  const [alreadyRecorded, setAlreadyRecorded] = useState(false);
  const [isAttendanceSaved, setIsAttendanceSaved] = useState(false);

  // Load any attendance already taken for this batch/date so it can be corrected.
  useEffect(() => {
    const existing = getSessionStatuses(batchId, attendanceDate);
    setAttendanceStatuses(existing || {});
    setAlreadyRecorded(!!existing);
    setLectureTopic(slotForDay?.topic || '');
    setAttSubject('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId, attendanceDate]);

  const setMark = (studentId: string, status: Mark) => setAttendanceStatuses(prev => ({ ...prev, [studentId]: status }));

  const handleMarkAllPresent = () => {
    const all: Record<string, Mark> = {};
    batchStudents.forEach(s => (all[s.id] = 'present'));
    setAttendanceStatuses(all);
  };

  const handleSaveAttendance = () => {
    if (!batchId || batchStudents.length === 0) return;
    const records = batchStudents.map(s => ({
      studentId: s.id,
      studentName: s.name,
      rollNumber: s.rollNumber,
      status: attendanceStatuses[s.id] || ('present' as Mark)
    }));
    recordBatchAttendance(batchId, attendanceDate, sessionSubject, records);
    setAlreadyRecorded(true);
    setIsAttendanceSaved(true);
    setTimeout(() => setIsAttendanceSaved(false), 3000);
  };

  const counts = batchStudents.reduce(
    (acc, s) => {
      acc[attendanceStatuses[s.id] || 'present']++;
      return acc;
    },
    { present: 0, late: 0, absent: 0 } as Record<Mark, number>
  );

  const subjectBatchIds = new Set(mySlots.filter(x => inSubject(x.subject)).map(x => x.batchId));
  const batchOverview = myBatches.filter(b => activeSubject === 'all' || subjectBatchIds.has(b.id)).map(b => {
    const roster = students.filter(s => s.enrolledBatchId === b.id);
    const avgAtt = roster.length ? Math.round((roster.reduce((sum, s) => sum + s.attendancePercentage, 0) / roster.length) * 10) / 10 : 0;
    const tested = roster.filter(s => s.averageTestScore > 0);
    const avgScore = tested.length ? Math.round((tested.reduce((sum, s) => sum + s.averageTestScore, 0) / tested.length) * 10) / 10 : 0;
    const ids = new Set(roster.map(s => s.id));
    const quizToday = dailyQuizAttempts.filter(a => a.date === today && ids.has(a.studentId)).length;
    return { batch: b, size: roster.length, avgAtt, avgScore, quizToday, lowAttendance: roster.filter(s => s.attendancePercentage < 75).length };
  });

  const myPayouts = salaryPayouts.filter(p => p.staffId === currentFaculty?.id);

  if (!currentFaculty) {
    return (
      <div className="p-8 text-center text-sm text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        No staff record is linked to this account.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {role !== 'faculty' && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs">
          <span className="font-semibold text-emerald-900 dark:text-emerald-300">Viewing the portal as:</span>
          <select
            value={currentFaculty.id}
            onChange={e => setViewAsId(e.target.value)}
            className="flex-1 sm:max-w-md px-3 py-1.5 border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
          >
            {facultyList.map(f => (
              <option key={f.id} value={f.id}>
                {f.name} · {f.designation}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Faculty Hero Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 font-bold text-xl flex items-center justify-center border border-emerald-500/30 shrink-0">
              {currentFaculty.name.charAt(0)}
            </div>
            <div>
              <span className="text-xs font-mono text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Faculty
              </span>
              <h2 className="text-xl font-bold mt-1 text-white">{currentFaculty.name}</h2>
              <p className="text-xs text-slate-300">{currentFaculty.designation}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {currentFaculty.subjectsHandling?.map((sub, i) => (
                  <span key={i} className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 text-center text-xs">
            <div className="p-2">
              <span className="text-slate-400 text-[11px] block">My Attendance</span>
              <span className="text-lg font-mono font-bold text-emerald-400 tabular-nums">{currentFaculty.attendanceRate}%</span>
            </div>
            <div className="p-2">
              <span className="text-slate-400 text-[11px] block">Batches</span>
              <span className="text-lg font-mono font-bold text-white tabular-nums">{myBatches.length}</span>
            </div>
            <div className="p-2">
              <span className="text-slate-400 text-[11px] block">Monthly Salary</span>
              <span className="text-sm font-mono font-bold text-amber-300 tabular-nums">₹{currentFaculty.monthlySalary.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
            {todaysClasses.length ? (
              <span>
                Today:{' '}
                {todaysClasses.map((c, i) => (
                  <React.Fragment key={c.id}>
                    {i > 0 && ' · '}
                    <b>{c.subject}</b> ({c.batchName}, {c.time}, {c.room})
                  </React.Fragment>
                ))}
              </span>
            ) : (
              <span>No classes scheduled for you today.</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5" data-quick-actions>
            {(
              [
                ['tests', 'Schedule exam', ClipboardList],
                ['timetable', 'Schedule class', CalendarDays],
                ['online_classes', 'Online class', Video],
                ['materials', 'Share notes', Upload],
                ['leave', 'Apply leave', CalendarCheck]
              ] as const
            ).map(([tab, label, Icon], i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  i === 0 ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Subject switcher: faculty who teach several subjects work one subject at a time */}
      {mySubjects.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-2" data-subject-switcher>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <BookOpen className="w-4 h-4 text-emerald-600" /> My subjects ({mySubjects.length})
            <span className="font-normal text-slate-500">Pick one to see only its classes, batches and student performance.</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {['all', ...mySubjects].map(sub => {
              const weekly = sub === 'all' ? mySlots.length : mySlots.filter(x => sameSubject(x.subject, sub)).length;
              return (
                <button
                  key={sub}
                  onClick={() => setSubjectFilter(sub)}
                  aria-pressed={activeSubject === sub}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap ${
                    activeSubject === sub
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {sub === 'all' ? 'All subjects' : sub}
                  <span className={`ml-1.5 text-[10px] ${activeSubject === sub ? 'text-emerald-100' : 'text-slate-400'}`}>{weekly}/wk</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <SubjectPerformance
        subjects={activeSubject === 'all' ? mySubjects : [activeSubject]}
        slots={mySlots}
        onPick={setSubjectFilter}
        compact={activeSubject === 'all'}
        facultyName={currentFaculty.name}
      />

      {/* My batches at a glance */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Batches: Student Performance</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {batchOverview.map(o => (
            <div key={o.batch.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white">{o.batch.name}</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block">Students</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{o.size}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Avg Attendance</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{o.avgAtt}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Avg Test Score</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{o.avgScore ? `${o.avgScore}%` : '—'}</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Daily quiz today: <b className="text-slate-800 dark:text-slate-200">{o.quizToday}</b> of {o.size} answered
              </div>
              {o.lowAttendance > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {o.lowAttendance} student{o.lowAttendance > 1 ? 's' : ''} below 75% attendance
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Attendance marker */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Take Class Attendance</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Everyone starts as present. Mark absentees and latecomers, then save. Students see it in their portal immediately.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllPresent}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors"
            >
              ✓ Mark All Present
            </button>
            <button
              onClick={handleSaveAttendance}
              disabled={batchStudents.length === 0}
              className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {alreadyRecorded ? 'Update Attendance' : 'Save Attendance'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Batch</label>
            <select
              value={batchId}
              onChange={e => setSelectedBatchId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {myBatches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                  {activeSubject !== 'all' && !subjectBatchIds.has(b.id) ? ' (other subject)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Date</label>
            <input
              type="date"
              value={attendanceDate}
              max={today}
              onChange={e => e.target.value && setAttendanceDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
            <select
              value={sessionSubject}
              onChange={e => setAttSubject(e.target.value)}
              aria-label="Subject taught"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {subjectChoices.map(sub => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Topic</label>
            <input
              type="text"
              value={lectureTopic}
              onChange={e => setLectureTopic(e.target.value)}
              placeholder="Topic covered in class"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-slate-500">
            {formatDate(attendanceDate)} ({weekdayOf(attendanceDate)})
            {!slotForDay && ' · no class on the timetable this day'}
          </span>
          <span className="font-mono text-emerald-600">Present {counts.present}</span>
          <span className="font-mono text-amber-600">Late {counts.late}</span>
          <span className="font-mono text-rose-600">Absent {counts.absent}</span>
          {alreadyRecorded && !isAttendanceSaved && (
            <span className="text-amber-700 dark:text-amber-400 font-semibold">Already recorded: you are editing it.</span>
          )}
        </div>

        {isAttendanceSaved && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Attendance saved. Student attendance percentages are updated.</span>
          </div>
        )}

        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Roll Number</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Overall Attendance</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {batchStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                      No students enrolled in this batch on this date.
                    </td>
                  </tr>
                ) : (
                  batchStudents.map(student => {
                    const status = attendanceStatuses[student.id] || 'present';
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{student.rollNumber}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">{student.name}</td>
                        <td
                          className={`px-4 py-3 font-mono tabular-nums ${
                            student.attendancePercentage < 75 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {student.attendancePercentage}%
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                          {(['present', 'late', 'absent'] as Mark[]).map(m => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setMark(student.id, m)}
                              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                                status === m
                                  ? m === 'present'
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : m === 'late'
                                      ? 'bg-amber-500 text-slate-950 shadow-2xs'
                                      : 'bg-rose-600 text-white shadow-2xs'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                            >
                              {m === 'present' ? 'Present' : m === 'late' ? 'Late' : 'Absent'}
                            </button>
                          ))}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Salary & payout history */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Salary &amp; Payout History</h3>
        <div className="space-y-2">
          {myPayouts.length === 0 && <p className="text-xs text-slate-400">No payouts yet.</p>}
          {myPayouts.map(p => (
            <div
              key={p.id}
              className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between gap-3 text-xs"
            >
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">{p.month}</span>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Base ₹{p.baseSalary.toLocaleString('en-IN')} + incentives ₹{p.incentives.toLocaleString('en-IN')} − deductions ₹
                  {p.deductions.toLocaleString('en-IN')} · Paid {formatDate(p.paymentDate)}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm tabular-nums">₹{p.netPayout.toLocaleString('en-IN')}</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold block text-[11px]">{p.status === 'paid' ? 'Paid' : 'Processing'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

type PerfRow = {
  batchId: string;
  batchName: string;
  students: { id: string; name: string; roll: string; photo?: string; att: number | null; score: number | null }[];
  sessions: number;
  avgAtt: number | null;
  avgScore: number | null;
};

const pctOrDash = (v: number | null) => (v === null ? '—' : `${v}%`);
const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);

/** Per-subject view for faculty: attendance in that subject's classes and scores on that subject's questions, per batch. */
const SubjectPerformance: React.FC<{
  subjects: string[];
  slots: ReturnType<typeof useApp>['schedule'];
  onPick: (s: string) => void;
  compact: boolean;
  facultyName: string;
}> = ({ subjects, slots, onPick, compact, facultyName }) => {
  const { students, batches, attendance, studentAttempts, onlineClasses, assessmentTests, today } = useApp();
  const [openBatch, setOpenBatch] = useState<string | null>(null);
  const testById = useMemo(() => new Map(assessmentTests.map(t => [t.id, t])), [assessmentTests]);

  const perf = (subject: string): PerfRow[] => {
    const batchIds = [...new Set(slots.filter(x => sameSubject(x.subject, subject)).map(x => x.batchId))];
    return batchIds.map(batchId => {
      const roster = students.filter(st => st.enrolledBatchId === batchId && st.status === 'active');
      const sessions = attendance.filter(a => a.batchId === batchId && sameSubject(a.subject, subject));
      const rows = roster.map(st => {
        const held = sessions.filter(a => a.date >= st.admissionDate);
        const absent = held.filter(a => a.absentIds.includes(st.id)).length;
        const att = held.length ? Math.round(((held.length - absent) / held.length) * 1000) / 10 : null;
        let got = 0;
        let tot = 0;
        // Marks on this subject's questions only, from each test the student took.
        studentAttempts
          .filter(a => a.studentId === st.id)
          .forEach(a => {
            const test = testById.get(a.testId);
            test?.questions
              .filter(q => sameSubject(q.subject, subject))
              .forEach(q => {
                tot += q.marks;
                const ans = a.userAnswers[q.id];
                if (ans === undefined) return;
                got += ans === q.correctOptionIndex ? q.marks : -(q.negativeMarks ?? test.negativeMarksPerWrong);
              });
          });
        const score = tot > 0 ? Math.round((Math.max(0, got) / tot) * 1000) / 10 : null;
        return { id: st.id, name: st.name, roll: st.rollNumber, photo: st.photo, att, score };
      });
      return {
        batchId,
        batchName: batches.find(b => b.id === batchId)?.name || batchId,
        students: rows,
        sessions: sessions.length,
        avgAtt: avg(rows.flatMap(r => (r.att === null ? [] : [r.att]))),
        avgScore: avg(rows.flatMap(r => (r.score === null ? [] : [r.score])))
      };
    });
  };

  const needsAttention = (r: PerfRow['students'][number]) => (r.att !== null && r.att < 75) || (r.score !== null && r.score < 40);
  const upcomingOnline = (subject: string) =>
    onlineClasses.filter(c => c.facultyName === facultyName && sameSubject(c.subject, subject) && (c.repeat === 'none' ? c.startDate >= today : !c.endDate || c.endDate >= today)).length;

  if (subjects.length === 0) return null;

  if (compact)
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3" data-subject-cards>
        {subjects.map(sub => {
          const rows = perf(sub);
          const all = rows.flatMap(r => r.students);
          const flagged = all.filter(needsAttention).length;
          return (
            <button
              key={sub}
              onClick={() => onPick(sub)}
              className="text-left p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 shadow-2xs space-y-2"
            >
              <div className="text-sm font-bold text-slate-900 dark:text-white">{sub}</div>
              <div className="text-[11px] text-slate-500">
                {rows.length} batch{rows.length === 1 ? '' : 'es'} · {all.length} students · {slots.filter(x => sameSubject(x.subject, sub)).length} classes/week
                {upcomingOnline(sub) > 0 && ` · ${upcomingOnline(sub)} online`}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Attendance</div>
                  <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{pctOrDash(avg(rows.flatMap(r => (r.avgAtt === null ? [] : [r.avgAtt]))))}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Test score</div>
                  <div className="font-mono font-bold text-amber-600 dark:text-amber-400">{pctOrDash(avg(rows.flatMap(r => (r.avgScore === null ? [] : [r.avgScore]))))}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Need help</div>
                  <div className={`font-mono font-bold ${flagged ? 'text-rose-600' : 'text-slate-500'}`}>{flagged}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );

  const sub = subjects[0];
  const rows = perf(sub);
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4" data-subject-detail>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{sub}: student performance</h3>
          <p className="text-[11px] text-slate-500">
            Attendance counts only this subject's classes. Scores count only this subject's questions in tests.
            {upcomingOnline(sub) > 0 && (
              <span className="inline-flex items-center gap-1 ml-1">
                <Video className="w-3 h-3" /> {upcomingOnline(sub)} online class schedule{upcomingOnline(sub) > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
      </div>
      {rows.length === 0 && <p className="text-xs text-slate-500">No batch has this subject with you on the timetable yet.</p>}
      <div className="space-y-2">
        {rows.map(r => {
          const flagged = r.students.filter(needsAttention);
          const open = openBatch === r.batchId;
          const list = (open ? r.students : flagged).slice().sort((a, b) => (a.score ?? 101) - (b.score ?? 101));
          return (
            <div key={r.batchId} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenBatch(open ? null : r.batchId)}
                className="w-full p-3 flex flex-col sm:flex-row sm:items-center gap-2 text-left text-xs bg-slate-50 dark:bg-slate-800/60"
                aria-expanded={open}
              >
                <span className="flex-1 font-semibold text-slate-900 dark:text-white">{r.batchName}</span>
                <span className="text-slate-500">{r.students.length} students · {r.sessions} classes held</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400">Att {pctOrDash(r.avgAtt)}</span>
                <span className="font-mono text-amber-700 dark:text-amber-400">Score {pctOrDash(r.avgScore)}</span>
                <span className={`font-semibold ${flagged.length ? 'text-rose-600' : 'text-slate-500'}`}>{flagged.length} need help</span>
                {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {list.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="text-slate-500 text-left">
                      <tr>
                        <th className="px-3 py-1.5 font-semibold">{open ? 'All students' : 'Students needing attention'}</th>
                        <th className="px-3 py-1.5 font-semibold">Subject attendance</th>
                        <th className="px-3 py-1.5 font-semibold">Subject score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {list.map(st => (
                        <tr key={st.id}>
                          <td className="px-3 py-1.5">
                            <span className="inline-flex items-center gap-2">
                              <Avatar photo={st.photo} name={st.name} className="w-6 h-6 text-[10px]" />
                              <span className="font-semibold text-slate-900 dark:text-white">{st.name}</span>
                              <span className="font-mono text-slate-400">{st.roll}</span>
                            </span>
                          </td>
                          <td className={`px-3 py-1.5 font-mono ${st.att !== null && st.att < 75 ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>{pctOrDash(st.att)}</td>
                          <td className={`px-3 py-1.5 font-mono ${st.score !== null && st.score < 40 ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>{pctOrDash(st.score)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!open && flagged.length === 0 && <p className="px-3 py-2 text-[11px] text-slate-500">Everyone is above 75% attendance and 40% score. Click to see all students.</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
