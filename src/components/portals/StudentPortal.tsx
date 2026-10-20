import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice, PaymentReceipt } from '../../types';
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
    currentUser,
    invoices,
    receipts,
    schedule,
    materials,
    studentAttempts,
    assessmentTests,
    recordFeePayment,
    viewReceipt,
    setActiveTab,
    createSupportTicket
  } = useApp();

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

  const currentStudent = students.find(s => s.rollNumber === 'VRM-2026-089') || students[0];

  const myInvoices = invoices.filter(i => i.studentId === currentStudent?.id || i.studentRollNumber === currentStudent?.rollNumber);
  const myReceipts = receipts.filter(r => r.studentId === currentStudent?.id || r.studentRollNumber === currentStudent?.rollNumber);
  const myAttempts = studentAttempts.filter(a => a.studentId === currentStudent?.id || a.studentName === currentStudent?.name);
  const mySchedule = schedule.filter(s => s.batchId === currentStudent?.enrolledBatchId || s.batchName === currentStudent?.enrolledBatchName);
  const myMaterials = materials.filter(m =>
    m.targetScope === 'all' ||
    (m.targetScope === 'batch' && m.targetBatchId === currentStudent?.enrolledBatchId) ||
    (m.targetScope === 'individual' && m.targetStudentId === currentStudent?.id)
  );

  const handlePayInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;
    setIsPayingProcessing(true);
    setTimeout(() => {
      const generatedReceipt = recordFeePayment(
        payingInvoice.id,
        payingInvoice.amount,
        payMethodChoice,
        `Student Online Portal Remittance - ${payingInvoice.invoiceNumber}`
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
                Cohort: <b className="text-amber-200">{currentStudent?.enrolledBatchName}</b> · Admitted on {currentStudent?.admissionDate}
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
              <span className="text-slate-400 text-[11px] block">Avg Mock Score</span>
              <span className="text-lg font-mono font-bold text-amber-400 tabular-nums">
                {currentStudent?.averageTestScore || 16.7} / 20
              </span>
            </div>
            <div className="p-2">
              <span className="text-slate-400 text-[11px] block">Batch Rank</span>
              <span className="text-lg font-mono font-bold text-white tabular-nums">
                #3
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
            <span>Next Lecture: <b>Indian Polity & Constitutional Writs</b> at 07:30 AM (Hall 101)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTicketModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Raise Mentor Query</span>
            </button>
            <button
              onClick={() => setActiveTab('tests')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors shadow-2xs"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Take Active Test</span>
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
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
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

          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Syllabus Milestones Completed
              </h3>
              
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                    <span>Indian Polity & Constitution</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">75%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-3/4" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                    <span>Indian Economy & Macro Policy</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">60%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-3/5" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                    <span>Modern Indian History</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">80%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-4/5" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                    <span>Ethics, Integrity & Case Studies</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">45%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full w-[45%]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-950 dark:text-amber-300 text-[11px] uppercase tracking-wider">
                <Brain className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span>Mentor Observation</span>
              </div>
              <p className="text-amber-900/90 dark:text-slate-300 leading-relaxed text-[11px]">
                "Strong conceptual foundation in Fundamental Rights and Judiciary. Focus on GS-3 Capital Account Convertibility & Fiscal Deficit nuances in upcoming weekend tests."
              </p>
              <span className="text-[10px] text-amber-800 dark:text-amber-400 font-semibold block">— Dr. K. Ramanathan (Polity Lead)</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Attendance History */}
      {activeSubTab === 'attendance' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Classroom Attendance Record: {currentStudent?.attendancePercentage}%
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                UPSC mandatory threshold: 75% minimum classroom presence required for test series clearance.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
              Compliant · Exemplary Record
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
              <span className="text-slate-500 dark:text-slate-400 font-medium block">Indian Polity & Constitution</span>
              <div className="text-xl font-mono font-bold text-slate-900 dark:text-white mt-1">94.0%</div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 block">30 / 32 Lectures Attended</span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
              <span className="text-slate-500 dark:text-slate-400 font-medium block">Indian Economy & Budget</span>
              <div className="text-xl font-mono font-bold text-slate-900 dark:text-white mt-1">90.0%</div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 block">27 / 30 Lectures Attended</span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
              <span className="text-slate-500 dark:text-slate-400 font-medium block">Ethics & Case Studies (GS-4)</span>
              <div className="text-xl font-mono font-bold text-slate-900 dark:text-white mt-1">91.0%</div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 block">20 / 22 Lectures Attended</span>
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
                    <span className="font-mono font-bold text-rose-700 dark:text-rose-400">-{attempt.incorrectAnswers * 0.66}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] block">Batch Rank</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">#{attempt.rankInBatch}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Mentor Remedial Feedback
                  </span>
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
                  Course: {currentStudent?.enrolledCourseName} · Plan: {currentStudent?.paymentPlan.replace('_', ' ')}
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
                              <span>Download Receipt</span>
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
                {myInvoices.filter(i => i.status !== 'paid').length} Pending
              </span>
            </div>

            <div className="space-y-3">
              {myInvoices.map(inv => {
                const receipt = receipts.find(r => r.invoiceId === inv.id);
                const isPaid = inv.status === 'paid';

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
                          <span className="text-[11px] text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 font-semibold">
                            Due on {inv.dueDate}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">
                        Installment {inv.installmentIndex} of {inv.totalInstallments} · {inv.courseName}
                      </p>
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
                          onClick={() => setPayingInvoice(inv)}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 rounded-lg transition-colors shadow-2xs"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay Installment Now</span>
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-amber-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Pay Tuition Installment: {payingInvoice.invoiceNumber}
                    </h3>
                  </div>
                  <button onClick={() => setPayingInvoice(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Installment:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Tranche {payingInvoice.installmentIndex} of {payingInvoice.totalInstallments}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Due Date:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{payingInvoice.dueDate}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-mono text-sm font-bold">
                    <span>Payable Amount:</span>
                    <span className="text-emerald-700 dark:text-emerald-400">₹{payingInvoice.amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

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
                          : `Pay ₹${payingInvoice.amount.toLocaleString('en-IN')} & Issue Receipt`}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Raise Query to Faculty / Administration</h3>
              <button onClick={() => setIsTicketModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                ✕
              </button>
            </div>

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
          </div>
        </div>
      )}

    </div>
  );
};
