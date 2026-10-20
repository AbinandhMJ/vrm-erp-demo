import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Invoice } from '../../types';
import { addDays, formatDate, weekdayOf } from '../../lib/dates';
import { invoiceBalance } from '../../lib/fees';
import { DailyQuizCard } from './DailyQuizCard';
import {
  GraduationCap,
  Calendar,
  Clock,
  BookOpen,
  ClipboardCheck,
  CreditCard,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Brain,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  FileText,
  Receipt,
  Download,
  X
} from 'lucide-react';

export const StudentPortal: React.FC = () => {
  const {
    students,
    role,
    currentStudent: loggedInStudent,
    invoices,
    receipts,
    schedule,
    attendance,
    materials,
    studentAttempts,
    assessmentTests,
    recordFeePayment,
    viewReceipt,
    setActiveTab,
    createSupportTicket,
    today
  } = useApp();

  // Staff can open this portal in "view as" mode for any student.
  const [viewAsId, setViewAsId] = useState<string>('');
  const isViewAs = role !== 'student';

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'attendance' | 'tests' | 'fees' | 'materials'>('overview');
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState<any>('Test Evaluation');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketSent, setTicketSent] = useState(false);

  // Online Installment Payment Modal State
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [payMethodChoice, setPayMethodChoice] = useState<'UPI' | 'Credit/Debit Card' | 'NetBanking'>('UPI');
  const [isPayingProcessing, setIsPayingProcessing] = useState(false);

  const currentStudent = isViewAs ? students.find(s => s.id === viewAsId) || students[0] : loggedInStudent;

  const myInvoices = invoices
    .filter(i => i.studentId === currentStudent?.id)
    .sort((a, b) => a.installmentIndex - b.installmentIndex);
  const myReceipts = receipts.filter(r => r.studentId === currentStudent?.id);
  const myAttempts = studentAttempts
    .filter(a => a.studentId === currentStudent?.id)
    .sort((a, b) => b.attemptedAt.localeCompare(a.attemptedAt));
  const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mySchedule = schedule
    .filter(s => s.batchId === currentStudent?.enrolledBatchId)
    .sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
  const myMaterials = materials.filter(m =>
    m.targetScope === 'all' ||
    (m.targetScope === 'batch' && m.targetBatchId === currentStudent?.enrolledBatchId) ||
    (m.targetScope === 'individual' && m.targetStudentId === currentStudent?.id)
  );

  // Next class: first timetable slot from today onwards.
  const nextClass = useMemo(() => {
    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i);
      const slot = mySchedule.find(s => s.day === weekdayOf(date));
      if (slot) return { slot, date };
    }
    return null;
  }, [mySchedule, today]);

  // Attendance built from the stored class sessions.
  const myAttendance = useMemo(() => {
    if (!currentStudent) return { sessions: [], bySubject: [] as { subject: string; attended: number; total: number }[] };
    const sessions = attendance
      .filter(a => a.batchId === currentStudent.enrolledBatchId && a.date >= currentStudent.admissionDate)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(a => ({
        ...a,
        status: a.absentIds.includes(currentStudent.id) ? 'absent' : a.lateIds.includes(currentStudent.id) ? 'late' : 'present'
      }));
    const map = new Map<string, { attended: number; total: number }>();
    for (const s of sessions) {
      const m = map.get(s.subject) || { attended: 0, total: 0 };
      m.total++;
      if (s.status !== 'absent') m.attended++;
      map.set(s.subject, m);
    }
    return { sessions, bySubject: [...map.entries()].map(([subject, v]) => ({ subject, ...v })) };
  }, [attendance, currentStudent]);

  // Subject-wise performance across all attempts.
  const subjectPerformance = useMemo(() => {
    const map = new Map<string, { score: number; total: number }>();
    for (const a of myAttempts) {
      for (const b of a.subjectBreakdown) {
        const m = map.get(b.subject) || { score: 0, total: 0 };
        m.score += Math.max(0, b.score);
        m.total += b.total;
        map.set(b.subject, m);
      }
    }
    return [...map.entries()]
      .map(([subject, v]) => ({ subject, pct: v.total ? Math.round((v.score / v.total) * 100) : 0 }))
      .sort((a, b) => a.pct - b.pct); // weakest first
  }, [myAttempts]);

  const improvementAreas = useMemo(() => {
    const weak = subjectPerformance.filter(s => s.pct < 60).map(s => s.subject);
    const fromAttempts = myAttempts.flatMap(a => a.improvementAreas);
    return [...new Set([...weak.map(w => `Strengthen ${w} (below 60% so far).`), ...fromAttempts])].slice(0, 4);
  }, [subjectPerformance, myAttempts]);

  const nextDueInvoice = myInvoices.find(i => i.status !== 'paid');
  const latestRank = myAttempts[0]?.rankInBatch;

  if (!currentStudent) {
    return (
      <div className="p-8 text-center text-sm text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        No student record is linked to this account.
      </div>
    );
  }

  const handlePayInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;
    setIsPayingProcessing(true);
    setTimeout(() => {
      const generatedReceipt = recordFeePayment(
        payingInvoice.id,
        invoiceBalance(payingInvoice),
        payMethodChoice,
        `Paid online via student portal for ${payingInvoice.invoiceNumber}`
      );
      setIsPayingProcessing(false);
      setPayingInvoice(null);
      viewReceipt(generatedReceipt);
    }, 600);
  };

  const handleRaiseTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketDesc) return;

    createSupportTicket({
      studentOrStaffId: currentStudent.id,
      userName: currentStudent.name,
      userRole: 'student',
      category: ticketCategory,
      subject: ticketSubject,
      description: ticketDesc,
      priority: 'medium'
    });

    setTicketSent(true);
    setTimeout(() => {
      setTicketSent(false);
      setIsTicketModalOpen(false);
      setTicketSubject('');
      setTicketDesc('');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      
      {isViewAs && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs">
          <span className="font-semibold text-amber-900 dark:text-amber-300">Viewing the portal as:</span>
          <select
            value={currentStudent.id}
            onChange={e => setViewAsId(e.target.value)}
            className="flex-1 sm:max-w-md px-3 py-1.5 border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
          >
            {students.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.rollNumber} · {s.enrolledBatchName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Student Welcome & Profile Hero Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 font-bold text-xl flex items-center justify-center border border-amber-500/30 shrink-0">
              {currentStudent?.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {currentStudent?.rollNumber}
                </span>
                <span className="text-xs text-slate-400">Classroom Aspirant</span>
              </div>
              <h2 className="text-xl font-bold mt-1 text-white">
                {currentStudent?.name}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {currentStudent?.enrolledCourseName}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Batch: <b className="text-amber-200">{currentStudent?.enrolledBatchName}</b> · Admitted on {formatDate(currentStudent?.admissionDate)}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 text-center text-xs">
            <div className="p-2">
              <span className="text-slate-400 text-[11px] block">Attendance</span>
              <span className="text-lg font-mono font-bold text-emerald-400 tabular-nums">
                {currentStudent?.attendancePercentage}%
              </span>
            </div>
            <div className="p-2">
              <span className="text-slate-400 text-[11px] block">Avg Test Score</span>
              <span className="text-lg font-mono font-bold text-amber-400 tabular-nums">
                {myAttempts.length ? `${currentStudent.averageTestScore}%` : '—'}
              </span>
            </div>
            <div className="p-2">
              <span className="text-slate-400 text-[11px] block">Latest Batch Rank</span>
              <span className="text-lg font-mono font-bold text-white tabular-nums">
                {latestRank ? `#${latestRank}` : '—'}
              </span>
            </div>
            <div className="p-2">
              <span className="text-slate-400 text-[11px] block">Fee Clearance</span>
              <span className={`text-sm font-mono font-bold tabular-nums ${currentStudent?.balanceFee === 0 ? 'text-emerald-400' : 'text-amber-300'}`}>
                {currentStudent?.balanceFee === 0 ? 'Cleared' : `₹${currentStudent?.balanceFee.toLocaleString('en-IN')} Due`}
              </span>
            </div>
          </div>
        </div>

        {/* Action strip */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            {nextClass ? (
              <span>
                Next class{nextClass.date === today ? ' (today)' : ` (${nextClass.slot.day})`}: <b>{nextClass.slot.subject}</b> ·{' '}
                {nextClass.slot.time} · {nextClass.slot.room}
              </span>
            ) : (
              <span>No upcoming classes scheduled.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTicketModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ask Faculty / Office</span>
            </button>
            <button
              onClick={() => setActiveTab('tests')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors shadow-2xs"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Take a Test</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
        {[
          { id: 'overview', label: 'Dashboard & Timetable' },
          { id: 'attendance', label: 'Attendance History' },
          { id: 'tests', label: 'My Test Grades & Analytics' },
          { id: 'fees', label: 'Fee Payments & Receipts' },
          { id: 'materials', label: 'Study Dossiers Received' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeSubTab === tab.id
                ? 'bg-slate-900 dark:bg-amber-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Dashboard Overview & Daily Timetable */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
          <DailyQuizCard studentId={currentStudent.id} readOnly={isViewAs} />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Weekly Class Schedule ({currentStudent?.enrolledBatchName})
              </h3>
              <span className="text-xs text-slate-400 dark:text-slate-500">Regular Classes</span>
            </div>

            <div className="space-y-3">
              {mySchedule.map(item => (
                <div
                  key={item.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{item.day}</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">· {item.time}</span>
                    </div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{item.subject}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.topic}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-semibold text-slate-900 dark:text-white block">{item.facultyName}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{item.room}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          </div>
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Subject-wise Performance
              </h3>
              <p className="text-[11px] text-slate-400 -mt-2">Weakest topics first, across all tests taken</p>
              {subjectPerformance.length === 0 ? (
                <p className="text-xs text-slate-400">No tests taken yet.</p>
              ) : (
                <div className="space-y-3 text-xs">
                  {subjectPerformance.slice(0, 6).map(sp => (
                    <div key={sp.subject}>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1 gap-2">
                        <span className="truncate">{sp.subject}</span>
                        <span className="font-mono font-semibold text-slate-900 dark:text-white">{sp.pct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${sp.pct >= 75 ? 'bg-emerald-500' : sp.pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${sp.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-950 dark:text-amber-300 text-[11px] uppercase tracking-wider">
                <Brain className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span>Areas of Improvement</span>
              </div>
              {improvementAreas.length === 0 ? (
                <p className="text-amber-900/90 dark:text-slate-300 text-[11px]">Take a test to get personalised suggestions.</p>
              ) : (
                <ul className="list-disc list-inside space-y-1 text-amber-900/90 dark:text-slate-300 text-[11px]">
                  {improvementAreas.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider">
                <CreditCard className="w-4 h-4 text-amber-500" />
                <span>Upcoming Payment</span>
              </div>
              {nextDueInvoice ? (
                <>
                  <p className="text-slate-600 dark:text-slate-300">
                    Installment {nextDueInvoice.installmentIndex} of {nextDueInvoice.totalInstallments}:{' '}
                    <b className="font-mono">₹{invoiceBalance(nextDueInvoice).toLocaleString('en-IN')}</b>
                  </p>
                  <p className={nextDueInvoice.status === 'overdue' ? 'text-rose-600 font-semibold' : 'text-slate-500'}>
                    {nextDueInvoice.status === 'overdue' ? 'Overdue since' : 'Due on'} {formatDate(nextDueInvoice.dueDate)}
                  </p>
                  <button onClick={() => setActiveSubTab('fees')} className="text-amber-700 dark:text-amber-400 font-semibold hover:underline pt-1">
                    View fees →
                  </button>
                </>
              ) : (
                <p className="text-emerald-600 font-semibold">All fees cleared.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Attendance History */}
      {activeSubTab === 'attendance' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Class Attendance: {currentStudent.attendancePercentage}%
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {myAttendance.sessions.filter(x => x.status !== 'absent').length} of {myAttendance.sessions.length} classes attended since{' '}
                {formatDate(currentStudent.admissionDate)} · Academy policy: minimum 75% attendance.
              </p>
            </div>
            {currentStudent.attendancePercentage >= 75 ? (
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 self-start">
                Meets 75% requirement
              </span>
            ) : (
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-md border border-rose-200 dark:border-rose-800 self-start">
                Below 75% requirement
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {myAttendance.bySubject.map(sub => {
              const pct = sub.total ? Math.round((sub.attended / sub.total) * 1000) / 10 : 100;
              return (
                <div key={sub.subject} className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <span className="text-slate-500 dark:text-slate-400 font-medium block">{sub.subject}</span>
                  <div className="text-xl font-mono font-bold text-slate-900 dark:text-white mt-1">{pct}%</div>
                  <span className={`text-[11px] font-medium mt-1 block ${pct >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {sub.attended} / {sub.total} classes attended
                  </span>
                </div>
              );
            })}
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Recent Classes</h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Subject</th>
                      <th className="px-4 py-2.5">Faculty</th>
                      <th className="px-4 py-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {myAttendance.sessions.slice(0, 30).map(sess => (
                      <tr key={sess.id}>
                        <td className="px-4 py-2 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(sess.date)} <span className="text-slate-400">({weekdayOf(sess.date).slice(0, 3)})</span>
                        </td>
                        <td className="px-4 py-2 text-slate-800 dark:text-slate-200">{sess.subject}</td>
                        <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{sess.facultyName}</td>
                        <td className="px-4 py-2 text-right">
                          <span
                            className={`px-2 py-0.5 rounded font-semibold ${
                              sess.status === 'present'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : sess.status === 'late'
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                            }`}
                          >
                            {sess.status === 'present' ? 'Present' : sess.status === 'late' ? 'Late' : 'Absent'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {myAttendance.sessions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                          No classes recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Test Grades & Analytics */}
      {activeSubTab === 'tests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Mock Test Attempts & Evaluations</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Instant automated scoring with negative grading analysis</p>
            </div>
            <button
              onClick={() => setActiveTab('tests')}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 rounded-lg shadow-xs"
            >
              Take Another Mock
            </button>
          </div>

          <div className="space-y-3">
            {myAttempts.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                No tests attempted yet.
              </div>
            )}
            {myAttempts.map(attempt => (
              <div
                key={attempt.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                      Attempted: {new Date(attempt.attemptedAt).toLocaleDateString('en-IN')}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{attempt.testTitle}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 dark:text-slate-500 block">Marks Obtained</span>
                    <span className="text-xl font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {attempt.score} / {attempt.totalMarks}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-700 text-center text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] block">Accuracy</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{attempt.accuracyPercentage}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] block">Correct</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{attempt.correctAnswers}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] block">Negative Penalty</span>
                    <span className="font-mono font-bold text-rose-700 dark:text-rose-400">
                      -{Math.round(attempt.incorrectAnswers * (assessmentTests.find(t => t.id === attempt.testId)?.negativeMarksPerWrong ?? 0.66) * 100) / 100}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] block">Batch Rank</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">#{attempt.rankInBatch}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Areas to Improve
                  </span>
                  {attempt.improvementAreas.length === 0 && <p className="text-emerald-600">No mistakes in this test.</p>}
                  <ul className="list-disc list-inside space-y-1">
                    {attempt.improvementAreas.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Student Payment History, Digital Receipts & Invoices */}
      {activeSubTab === 'fees' && (
        <div className="space-y-6">
          
          {/* Fee Overview Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                  Student Fee Ledger · {currentStudent?.rollNumber}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  Tuition Account & Payment History
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Course: {currentStudent?.enrolledCourseName} · Plan: {currentStudent?.paymentPlan.replace(/_/g, ' ')}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-400 dark:text-slate-500 block">Total Remitted to Date</span>
                <span className="text-xl font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  ₹{currentStudent?.paidFee.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Financial Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-slate-400 block">Base Course Fee</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white mt-1 block">
                  ₹{currentStudent?.totalFee.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                <span className="text-amber-700 dark:text-amber-400 block">Scholarship Saved</span>
                <span className="font-mono font-bold text-amber-800 dark:text-amber-300 mt-1 block">
                  ₹{currentStudent?.discountAmount.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                <span className="text-emerald-700 dark:text-emerald-400 block">Net Fee Payable</span>
                <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300 mt-1 block">
                  ₹{currentStudent?.netFee.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg">
                <span className="text-rose-700 dark:text-rose-400 block">Balance Outstanding</span>
                <span className="font-mono font-bold text-rose-800 dark:text-rose-300 mt-1 block">
                  ₹{currentStudent?.balanceFee.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Fee Completion Progress Bar */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  {currentStudent && currentStudent.netFee > 0
                    ? Math.round((currentStudent.paidFee / currentStudent.netFee) * 100)
                    : 100}% Remitted
                </span>
                <span className="text-slate-400">
                  ₹{currentStudent?.balanceFee.toLocaleString('en-IN')} Remaining
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{
                    width: `${
                      currentStudent && currentStudent.netFee > 0
                        ? Math.min(100, Math.round((currentStudent.paidFee / currentStudent.netFee) * 100))
                        : 100
                    }%`
                  }}
                />
              </div>
            </div>
          </div>

          {/* Cleared Payment Receipts & History Timeline */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Payment History & Cleared Receipts
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {myReceipts.length} Cleared Transactions
              </span>
            </div>

            {myReceipts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No payment receipts issued yet.
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Receipt Number</th>
                        <th className="px-4 py-3">Installment Description</th>
                        <th className="px-4 py-3">Payment Mode</th>
                        <th className="px-4 py-3 font-mono">Date & Time</th>
                        <th className="px-4 py-3 text-right">Amount Paid</th>
                        <th className="px-4 py-3 text-right">Digital Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {myReceipts.map(rcpt => (
                        <tr key={rcpt.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-amber-700 dark:text-amber-400">
                            {rcpt.receiptNumber}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {rcpt.installmentDescription || 'Tuition Fee Tranche'}
                            </div>
                            <span className="font-mono text-[10px] text-slate-400 block">
                              Ref: {rcpt.transactionReference}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                            {rcpt.paymentMethod}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                            {rcpt.paidAt}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                            ₹{rcpt.amountPaid.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => viewReceipt(rcpt)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-2xs"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>View / Print</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Upcoming Invoices & Scheduled Installments */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Tuition Invoices & Upcoming Installments
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {myInvoices.filter(i => i.status !== 'paid').length} Open
              </span>
            </div>

            <div className="space-y-3">
              {myInvoices.map(inv => {
                const receipt = receipts.find(r => r.allocations?.some(a => a.invoiceId === inv.id) || r.invoiceId === inv.id);
                const isPaid = inv.status === 'paid';
                const balance = invoiceBalance(inv);

                return (
                  <div
                    key={inv.id}
                    className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{inv.invoiceNumber}</span>
                        {isPaid ? (
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-semibold">
                            Paid & Cleared
                          </span>
                        ) : (
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded border font-semibold ${
                              inv.status === 'overdue'
                                ? 'text-rose-800 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                                : 'text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {inv.status === 'overdue' ? 'Overdue since' : 'Due on'} {formatDate(inv.dueDate)}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">
                        Installment {inv.installmentIndex} of {inv.totalInstallments} · {inv.courseName}
                      </p>
                      {!isPaid && inv.paidAmount > 0 && (
                        <p className="text-slate-500 dark:text-slate-400">
                          ₹{inv.paidAmount.toLocaleString('en-IN')} paid · ₹{balance.toLocaleString('en-IN')} remaining
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm tabular-nums">
                        ₹{inv.amount.toLocaleString('en-IN')}
                      </span>
                      {isPaid && receipt ? (
                        <button
                          onClick={() => viewReceipt(receipt)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 dark:border-slate-600"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-500" />
                          <span>View Receipt</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => (role === 'student' ? setPayingInvoice(inv) : setActiveTab('fees'))}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 rounded-lg transition-colors shadow-2xs"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{role === 'student' ? `Pay ₹${balance.toLocaleString('en-IN')}` : 'Collect at Fees desk'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Student Online Payment Checkout Modal */}
          {payingInvoice && (
            <Modal title={<>Pay Tuition Installment: {payingInvoice.invoiceNumber}</>} onClose={() => setPayingInvoice(null)} size="sm" bodyClassName="px-5 py-4 space-y-4">

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Installment:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  Tranche {payingInvoice.installmentIndex} of {payingInvoice.totalInstallments}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Due Date:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{formatDate(payingInvoice.dueDate)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-mono text-sm font-bold">
                <span>Payable Amount:</span>
                <span className="text-emerald-700 dark:text-emerald-400">₹{invoiceBalance(payingInvoice).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Demo payment gateway: no real money is charged. A receipt is issued instantly.
            </p>
            <form onSubmit={handlePayInvoice} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Choose Payment Method
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'UPI', label: 'Instant UPI (Google Pay, PhonePe, Paytm, QR)' },
                    { id: 'Credit/Debit Card', label: 'Credit or Debit Card (Visa / Mastercard / RuPay)' },
                    { id: 'NetBanking', label: 'NetBanking (HDFC, SBI, ICICI, Axis)' }
                  ].map(mode => (
                    <label
                      key={mode.id}
                      className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                        payMethodChoice === mode.id
                          ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 text-slate-900 dark:text-white font-semibold'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payMethod"
                        checked={payMethodChoice === mode.id}
                        onChange={() => setPayMethodChoice(mode.id as any)}
                        className="text-amber-600"
                      />
                      <span>{mode.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPayingProcessing}
                  className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isPayingProcessing
                      ? 'Authorizing Transaction...'
                      : `Pay ₹${invoiceBalance(payingInvoice).toLocaleString('en-IN')} & Issue Receipt`}
                  </span>
                </button>
              </div>
            </form>
            </Modal>
          )}

        </div>
      )}

      {/* Tab 5: Study Materials */}
      {activeSubTab === 'materials' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Study Dossiers & Compendiums Allocated to You</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Official digital materials released for {currentStudent?.enrolledBatchName}</p>
            </div>
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500">{myMaterials.length} Documents</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myMaterials.map(mat => (
              <div
                key={mat.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 uppercase">
                    {mat.subject}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1 leading-snug">{mat.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{mat.summary}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400 dark:text-slate-500 text-[11px]">{mat.pageCount} Pages · {mat.fileSize}</span>
                  <button
                    onClick={() => setActiveTab('materials')}
                    className="inline-flex items-center gap-1 text-amber-800 dark:text-amber-400 font-semibold hover:underline"
                  >
                    <span>Read PDF Digest</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raise Mentor Query / Support Modal */}
      {isTicketModalOpen && (
        <Modal title="Raise Query to Faculty / Administration" onClose={() => setIsTicketModalOpen(false)} size="sm" bodyClassName="px-5 py-4 space-y-4">

        <form onSubmit={handleRaiseTicket} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Query Category</label>
            <select
              value={ticketCategory}
              onChange={e => setTicketCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
            >
              <option value="Test Evaluation">Test Evaluation & Mentor Feedback</option>
              <option value="Fee & Invoicing">Fee Installment & Receipt Query</option>
              <option value="Material Access">Study Material Access Issue</option>
              <option value="Classroom & Batch">Classroom Attendance / Schedule Change</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject / Question Summary *</label>
            <input
              type="text"
              value={ticketSubject}
              onChange={e => setTicketSubject(e.target.value)}
              placeholder="e.g. Doubts in Question 4 of Polity Mock"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Detailed Explanation *</label>
            <textarea
              rows={3}
              value={ticketDesc}
              onChange={e => setTicketDesc(e.target.value)}
              placeholder="Explain your doubt or slot request..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
              required
            />
          </div>

          {ticketSent && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Ticket lodged! Faculty desk notified.</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsTicketModalOpen(false)}
              className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 font-semibold text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 rounded-lg"
            >
              Submit Query
            </button>
          </div>
        </form>
        </Modal>
      )}

    </div>
  );
};
