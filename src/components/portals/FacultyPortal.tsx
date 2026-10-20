import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  UserCheck,
  Calendar,
  Clock,
  BookOpen,
  ClipboardCheck,
  Upload,
  CheckCircle2,
  XCircle,
  TrendingUp,
  CreditCard,
  Layers,
  Users
} from 'lucide-react';

export const FacultyPortal: React.FC = () => {
  const {
    students,
    batches,
    recordBatchAttendance,
    salaryPayouts,
    setActiveTab,
    staffMembers
  } = useApp();

  const currentFaculty = staffMembers.find(s => s.id === 'usr-fac-03') || staffMembers[0];
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || '');
  const [lectureTopic, setLectureTopic] = useState('Preamble, Fundamental Rights & Judicial Review (Art. 14-19)');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

  const batchStudents = students.filter(s => s.enrolledBatchId === selectedBatchId);
  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [isAttendanceSaved, setIsAttendanceSaved] = useState(false);

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendanceStatuses(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAllPresent = () => {
    const allP: Record<string, 'present' | 'absent' | 'late'> = {};
    batchStudents.forEach(s => {
      allP[s.id] = 'present';
    });
    setAttendanceStatuses(allP);
  };

  const handleSaveAttendance = () => {
    const records = batchStudents.map(s => ({
      studentId: s.id,
      studentName: s.name,
      rollNumber: s.rollNumber,
      status: attendanceStatuses[s.id] || 'present'
    }));

    recordBatchAttendance(selectedBatchId, attendanceDate, currentFaculty.subjectsHandling?.[0] || 'Polity', records);
    setIsAttendanceSaved(true);
    setTimeout(() => setIsAttendanceSaved(false), 3000);
  };

  const myPayouts = salaryPayouts.filter(p => p.staffId === currentFaculty.id || p.staffName.includes('Ramanathan'));

  return (
    <div className="space-y-6">
      
      {/* Faculty Hero Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 font-bold text-xl flex items-center justify-center border border-emerald-500/30 shrink-0">
              {currentFaculty.name.charAt(0)}
            </div>
            <div>
              <span className="text-xs font-mono text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Senior Faculty & Academic Lead
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
              <span className="text-slate-400 text-[11px] block">Attendance Rate</span>
              <span className="text-lg font-mono font-bold text-emerald-400 tabular-nums">
                {currentFaculty.attendanceRate}%
              </span>
            </div>
            <div className="p-2">
              <span className="text-slate-400 text-[11px] block">Assigned Batches</span>
              <span className="text-lg font-mono font-bold text-white tabular-nums">
                {currentFaculty.assignedBatches?.length || 2}
              </span>
            </div>
            <div className="p-2">
              <span className="text-slate-400 text-[11px] block">Monthly Compensation</span>
              <span className="text-sm font-mono font-bold text-amber-300 tabular-nums">
                ₹{currentFaculty.monthlySalary.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Today's Lecture: <b>Morning Regular Batch (Alpha-26)</b> at 07:30 AM in Hall 101</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('materials')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Share Notes to Batch</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Classroom Attendance Marker Tool */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Classroom Attendance Marker
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Take daily lecture attendance for allocated student rosters with 1-click batch sync.
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
              className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 rounded-lg transition-colors shadow-xs"
            >
              Save Attendance
            </button>
          </div>
        </div>

        {/* Logistics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Classroom Batch</label>
            <select
              value={selectedBatchId}
              onChange={e => setSelectedBatchId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Attendance Date</label>
            <input
              type="date"
              value={attendanceDate}
              onChange={e => setAttendanceDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Lecture Topic Delivered</label>
            <input
              type="text"
              value={lectureTopic}
              onChange={e => setLectureTopic(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {isAttendanceSaved && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Attendance successfully logged! Student compliance metrics updated in real-time.</span>
          </div>
        )}

        {/* Student Roster Attendance Matrix */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Roll Number</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Current Attendance Rate</th>
                <th className="px-4 py-3 text-right">Today's Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {batchStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    No students currently allocated to this batch.
                  </td>
                </tr>
              ) : (
                batchStudents.map(student => {
                  const status = attendanceStatuses[student.id] || 'present';
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {student.rollNumber}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {student.name}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {student.attendancePercentage}%
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'present')}
                          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                            status === 'present'
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'late')}
                          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                            status === 'late'
                              ? 'bg-amber-500 text-slate-950 shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          Late
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'absent')}
                          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                            status === 'absent'
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          Absent
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary & Payout History */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          My Monthly Remuneration & Payout History
        </h3>
        <div className="space-y-2">
          {myPayouts.map(p => (
            <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">{p.month}</span>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{p.transactionRef} · Disbursed on {p.paymentDate}</div>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm tabular-nums">
                  ₹{p.netPayout.toLocaleString('en-IN')}
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold block text-[11px]">NEFT Cleared</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
