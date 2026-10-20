import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Clock, CheckCircle2, Upload, AlertTriangle } from 'lucide-react';
import { formatDate, weekdayOf } from '../../lib/dates';

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

  const todaysClasses = schedule.filter(s => s.facultyName === currentFaculty?.name && s.day === weekdayOf(today));

  const [selectedBatchId, setSelectedBatchId] = useState('');
  const batchId = myBatches.some(b => b.id === selectedBatchId) ? selectedBatchId : myBatches[0]?.id || '';
  const [attendanceDate, setAttendanceDate] = useState(today);
  const slotForDay = schedule.find(s => s.batchId === batchId && s.day === weekdayOf(attendanceDate));
  const [lectureTopic, setLectureTopic] = useState('');

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
    recordBatchAttendance(batchId, attendanceDate, slotForDay?.subject || currentFaculty?.subjectsHandling?.[0] || 'General', records);
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

  const batchOverview = myBatches.map(b => {
    const roster = students.filter(s => s.enrolledBatchId === b.id);
    const avgAtt = roster.length ? Math.round((roster.reduce((sum, s) => sum + s.attendancePercentage, 0) / roster.length) * 10) / 10 : 0;
    const tested = roster.filter(s => s.averageTestScore > 0);
    const avgScore = tested.length ? Math.round((tested.reduce((sum, s) => sum + s.averageTestScore, 0) / tested.length) * 10) / 10 : 0;
    return { batch: b, size: roster.length, avgAtt, avgScore, lowAttendance: roster.filter(s => s.attendancePercentage < 75).length };
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
          <button
            onClick={() => setActiveTab('materials')}
            className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Share Notes to Batch</span>
          </button>
        </div>
      </div>

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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
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
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Topic {slotForDay ? `(${slotForDay.subject})` : ''}
            </label>
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
