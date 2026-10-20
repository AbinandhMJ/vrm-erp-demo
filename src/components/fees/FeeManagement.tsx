import React, { useState } from 'react';
import { formatDate } from '../../lib/dates';
import { printLight } from '../../lib/print';
import { BarsChart, ChartCard, lakhs } from '../charts/Charts';
import { lastMonths } from '../../lib/metrics';
import { invoiceBalance } from '../../lib/fees';
import { useApp } from '../../context/AppContext';
import { ACADEMY } from '../../config/academy';
import { Modal } from '../common/Modal';
import { Invoice, PaymentReceipt, Student } from '../../types';
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Printer,
  TrendingUp,
  Receipt,
  Users,
  Download,
  Calendar,
  Plus,
  ArrowRight,
  FileText,
  DollarSign,
  X
} from 'lucide-react';

export const FeeManagement: React.FC = () => {
  const {
    invoices,
    receipts,
    students,
    courses,
    recordFeePayment,
    recordDirectFeePayment,
    viewReceipt,
    studentOutstanding,
    today,
    role
  } = useApp();

  // Sub-Navigation Tabs: 'histories' | 'invoices' | 'student_accounts'
  const [activeTab, setActiveTab] = useState<'histories' | 'invoices' | 'student_accounts'>('histories');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [studentFilter, setStudentFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [selectedStudentForLedger, setSelectedStudentForLedger] = useState<Student | null>(null);
  const [selectedStudentForStatement, setSelectedStudentForStatement] = useState<Student | null>(null);

  // Invoicing Collect Fee Modal
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [payMethod, setPayMethod] = useState<PaymentReceipt['paymentMethod']>('UPI');
  const [payNotes, setPayNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [payError, setPayError] = useState('');

  // Direct Payment Recording Modal (for Offline/Direct Tranches)
  const [isDirectPayModalOpen, setIsDirectPayModalOpen] = useState(false);
  const [directPayStudentId, setDirectPayStudentId] = useState(students.find(s => s.balanceFee > 0)?.id || students[0]?.id || '');
  const [directPayAmount, setDirectPayAmount] = useState<number>(students.find(s => s.balanceFee > 0)?.balanceFee || 0);
  const [directPayMethod, setDirectPayMethod] = useState<PaymentReceipt['paymentMethod']>('UPI');
  const [directPayDescription, setDirectPayDescription] = useState('');
  const [directPayRef, setDirectPayRef] = useState('');
  const [directPayNotes, setDirectPayNotes] = useState('');

  // Financial Health KPIs
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalCollected = receipts.reduce((sum, r) => sum + r.amountPaid, 0);
  const totalOutstanding = students.reduce((sum, s) => sum + s.balanceFee, 0);
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const totalOverdue = overdueInvoices.reduce((sum, i) => sum + invoiceBalance(i), 0);
  const overdueStudents = new Set(overdueInvoices.map(i => i.studentId)).size;

  // Charts: collections per month, and what is due (overdue + upcoming months).
  const collectionRows = lastMonths(today, 6).map(m => ({
    month: m.label,
    collected: receipts.filter(r => (r.paidOn || '').slice(0, 7) === m.key).reduce((sum, r) => sum + r.amountPaid, 0)
  }));
  const dueRows = (() => {
    const rows = [{ month: 'Overdue', due: totalOverdue }];
    const base = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1, 1);
    for (let i = 0; i < 4; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      rows.push({
        month: d.toLocaleDateString('en-IN', { month: 'short' }),
        due: invoices
          .filter(i2 => i2.status !== 'paid' && i2.status !== 'overdue' && i2.dueDate.slice(0, 7) === key)
          .reduce((sum, i2) => sum + invoiceBalance(i2), 0)
      });
    }
    return rows;
  })();

  const openCollect = (inv: Invoice) => {
    setSelectedInvoiceForPayment(inv);
    setCollectAmount(invoiceBalance(inv));
    setPayError('');
  };
  const verifiedReceiptsCount = receipts.length;

  const selectedStudentFilterObj = students.find(s => s.id === studentFilter || s.rollNumber === studentFilter) || null;

  // Filtered Receipts for Payment Histories Tab
  const filteredReceipts = receipts.filter(rcpt => {
    const matchesSearch =
      rcpt.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rcpt.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rcpt.studentRollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rcpt.transactionReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rcpt.courseName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMethod = methodFilter === 'all' || rcpt.paymentMethod === methodFilter;
    const matchesStudent = studentFilter === 'all' || rcpt.studentId === studentFilter || rcpt.studentRollNumber === studentFilter;
    const matchesCourse = courseFilter === 'all' || rcpt.courseName.toLowerCase().includes(courseFilter.toLowerCase());

    return matchesSearch && matchesMethod && matchesStudent && matchesCourse;
  });

  // Filtered Invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.studentRollNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'open' ? inv.status !== 'paid' : inv.status === statusFilter);
    return matchesSearch && matchesStatus;
  }).sort((a, b) => (statusFilter === 'overdue' || statusFilter === 'open' ? a.dueDate.localeCompare(b.dueDate) : 0));

  // Filtered Student Accounts
  const filteredStudents = students.filter(s => {
    return (
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.enrolledCourseName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Handle Invoice Payment Clearance
  const handleProcessInvoicePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;
    const outstanding = studentOutstanding(selectedInvoiceForPayment.studentId);
    if (!collectAmount || collectAmount <= 0) {
      setPayError('Enter the amount received.');
      return;
    }
    if (collectAmount > outstanding) {
      setPayError(`The student owes only ₹${outstanding.toLocaleString('en-IN')} in total.`);
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const generatedReceipt = recordFeePayment(
        selectedInvoiceForPayment.id,
        collectAmount,
        payMethod,
        payNotes || `Collected against ${selectedInvoiceForPayment.invoiceNumber}`
      );

      setIsProcessing(false);
      setSelectedInvoiceForPayment(null);
      setPayNotes('');
      viewReceipt(generatedReceipt);
    }, 600);
  };

  // Handle Direct Payment Recording
  const handleRecordDirectPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directPayStudentId || directPayAmount <= 0) return;
    const outstanding = studentOutstanding(directPayStudentId);
    if (outstanding <= 0) {
      setPayError('This student has no outstanding fees.');
      return;
    }
    if (directPayAmount > outstanding) {
      setPayError(`The student owes only ₹${outstanding.toLocaleString('en-IN')}.`);
      return;
    }
    setPayError('');

    setIsProcessing(true);
    setTimeout(() => {
      const newRcpt = recordDirectFeePayment({
        studentId: directPayStudentId,
        amount: Number(directPayAmount),
        paymentMethod: directPayMethod,
        installmentDescription: directPayDescription || undefined,
        notes: directPayNotes || 'Direct installment logged at finance counter.',
        transactionReference: directPayRef || undefined
      });

      setIsProcessing(false);
      setIsDirectPayModalOpen(false);
      setDirectPayRef('');
      setDirectPayNotes('');
      setDirectPayDescription('');
      viewReceipt(newRcpt);
    }, 600);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Fee Management & Financial Audit
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Institutional Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Student payment histories · Automated installment invoicing · Digital receipt repository · Accounts reconciliation
          </p>
        </div>

        {/* Quick Direct Payment Action for Admin & Management */}
        {role !== 'student' && (
          <button
            onClick={() => { setPayError(""); setIsDirectPayModalOpen(true); }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors shadow-2xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Student Payment</span>
          </button>
        )}
      </div>

      {/* Financial Health KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Total Realized Collections</span>
          <div className="text-2xl font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">
            ₹{totalCollected.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Verified across all receipts</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Total Tuition Invoiced</span>
          <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            ₹{totalInvoiced.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Across cohort schedules</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Outstanding Dues</span>
          <div className="text-2xl font-mono font-bold text-rose-700 dark:text-rose-400 mt-1 tabular-nums">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">All unpaid installments · {verifiedReceiptsCount} receipts issued</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Overdue (Defaulters)</span>
          <div className="text-2xl font-mono font-bold text-rose-700 dark:text-rose-400 mt-1 tabular-nums">
            ₹{totalOverdue.toLocaleString('en-IN')}
          </div>
          <button
            onClick={() => {
              setActiveTab('invoices');
              setStatusFilter('overdue');
            }}
            className="text-[11px] text-rose-600 font-semibold mt-0.5 hover:underline"
          >
            {overdueStudents} students past due date →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Collections" note="Per month, last 6 months" empty={totalCollected === 0} emptyText="No payments recorded yet.">
          <BarsChart height={220} data={collectionRows} xKey="month" series={[{ key: 'collected', label: 'Collected' }]} formatValue={lakhs} />
        </ChartCard>
        <ChartCard title="Fees due" note="Overdue now and due in coming months" empty={totalOutstanding === 0} emptyText="Nothing outstanding.">
          <BarsChart height={220} data={dueRows} xKey="month" series={[{ key: 'due', label: 'Amount due' }]} formatValue={lakhs} />
        </ChartCard>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('histories')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'histories'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Student Payment Histories Ledger</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-900/10 dark:bg-slate-900/40">
            {receipts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('student_accounts')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'student_accounts'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Student 360 Fee Accounts</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-900/10 dark:bg-slate-900/40">
            {students.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'invoices'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Invoices & Installment Schedules</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-900/10 dark:bg-slate-900/40">
            {invoices.length}
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: ALL STUDENTS PAYMENT HISTORIES & AUDIT LEDGER           */}
      {/* ============================================================== */}
      {activeTab === 'histories' && (
        <div className="space-y-4">
          
          {/* Search & Multi-Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search receipt #, student name, roll number, or transaction ref..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Filter Dropdowns */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Student Filter Dropdown */}
                <select
                  value={studentFilter}
                  onChange={e => setStudentFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="all">All Enrolled Aspirants ({students.length})</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.rollNumber})
                    </option>
                  ))}
                </select>

                {/* Course Filter Dropdown */}
                <select
                  value={courseFilter}
                  onChange={e => setCourseFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="all">All Courses</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>

                {/* Method Filter Dropdown */}
                <select
                  value={methodFilter}
                  onChange={e => setMethodFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="all">All Payment Modes</option>
                  <option value="UPI">UPI</option>
                  <option value="Credit/Debit Card">Credit/Debit Card</option>
                  <option value="NetBanking">NetBanking / NEFT</option>
                  <option value="Demand Draft">Demand Draft (DD)</option>
                  <option value="Cash">Cash (Counter)</option>
                </select>

                {/* Clear Filters if active */}
                {(studentFilter !== 'all' || courseFilter !== 'all' || methodFilter !== 'all' || searchQuery) && (
                  <button
                    onClick={() => {
                      setStudentFilter('all');
                      setCourseFilter('all');
                      setMethodFilter('all');
                      setSearchQuery('');
                    }}
                    className="px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:underline"
                  >
                    Reset Filters
                  </button>
                )}

                {/* Print Filtered Ledger */}
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
                  title="Print Current Payment History Ledger"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print Ledger</span>
                </button>
              </div>

            </div>
          </div>

          {/* Dedicated Student Fee Account Summary Card (When Specific Student is Selected) */}
          {selectedStudentFilterObj && (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-800 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200 dark:border-amber-900/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center shrink-0">
                    {selectedStudentFilterObj.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        {selectedStudentFilterObj.name}
                      </h3>
                      <span className="font-mono text-xs font-bold text-amber-800 dark:text-amber-400 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800">
                        {selectedStudentFilterObj.rollNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedStudentFilterObj.enrolledCourseName} · {selectedStudentFilterObj.enrolledBatchName} · Phone: {selectedStudentFilterObj.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedStudentForStatement(selectedStudentFilterObj)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-2xs transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Print Student Statement</span>
                  </button>

                  <button
                    onClick={() => {
                      setDirectPayStudentId(selectedStudentFilterObj.id);
                      if (selectedStudentFilterObj.balanceFee > 0) {
                        setDirectPayAmount(selectedStudentFilterObj.balanceFee);
                      }
                      setIsDirectPayModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Record Remittance</span>
                  </button>

                  <button
                    onClick={() => setStudentFilter('all')}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded"
                    title="View All Students"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Financial Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                <div className="p-2.5 bg-white/70 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Total Course Fee</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                    ₹{selectedStudentFilterObj.totalFee.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-2.5 bg-white/70 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[11px] text-amber-700 dark:text-amber-400 block">Scholarship Saved</span>
                  <span className="font-mono font-bold text-amber-800 dark:text-amber-300 text-sm">
                    ₹{selectedStudentFilterObj.discountAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-2.5 bg-white/70 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 block">Net Fee Payable</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                    ₹{selectedStudentFilterObj.netFee.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold block">Total Remitted</span>
                  <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                    ₹{selectedStudentFilterObj.paidFee.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-2.5 bg-rose-50/70 dark:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-900">
                  <span className="text-[11px] text-rose-700 dark:text-rose-400 font-semibold block">Outstanding Due</span>
                  <span className="font-mono font-bold text-rose-800 dark:text-rose-300 text-sm">
                    ₹{selectedStudentFilterObj.balanceFee.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                    {selectedStudentFilterObj.netFee > 0
                      ? Math.round((selectedStudentFilterObj.paidFee / selectedStudentFilterObj.netFee) * 100)
                      : 100}% Cleared
                  </span>
                  <span className="text-slate-400">
                    Payment Plan: {selectedStudentFilterObj.paymentPlan.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all"
                    style={{
                      width: `${
                        selectedStudentFilterObj.netFee > 0
                          ? Math.min(100, Math.round((selectedStudentFilterObj.paidFee / selectedStudentFilterObj.netFee) * 100))
                          : 100
                      }%`
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Payment Histories Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Receipt Number</th>
                    <th className="px-4 py-3">Student Name & Roll No</th>
                    <th className="px-4 py-3">Course & Tranche Details</th>
                    <th className="px-4 py-3">Payment Method</th>
                    <th className="px-4 py-3 font-mono">Date & Time</th>
                    <th className="px-4 py-3 text-right">Amount Paid (₹)</th>
                    <th className="px-4 py-3">Audit Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredReceipts.map(rcpt => {
                    const studentObj = students.find(s => s.id === rcpt.studentId);

                    return (
                      <tr key={rcpt.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-amber-700 dark:text-amber-400">
                          {rcpt.receiptNumber}
                        </td>

                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              if (studentObj) setSelectedStudentForLedger(studentObj);
                            }}
                            className="font-semibold text-slate-900 dark:text-white hover:text-amber-600 text-left block"
                          >
                            {rcpt.studentName}
                          </button>
                          <span className="font-mono text-[11px] text-slate-400 block">{rcpt.studentRollNumber}</span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs">{rcpt.courseName}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{rcpt.installmentDescription || rcpt.batchName}</div>
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                            <span>{rcpt.paymentMethod}</span>
                          </span>
                          <span className="block font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                            {rcpt.transactionReference}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                          {rcpt.paidAt}
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                          ₹{rcpt.amountPaid.toLocaleString('en-IN')}
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verified</span>
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => viewReceipt(rcpt)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                            title="View / Print Digital Receipt"
                          >
                            <Printer className="w-3 h-3 text-amber-600" />
                            <span>Receipt</span>
                          </button>

                          <button
                            onClick={() => {
                              if (studentObj) setSelectedStudentForStatement(studentObj);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100/60 rounded-md transition-colors border border-amber-200 dark:border-amber-900"
                            title="View / Print Full Student Statement of Account"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Statement</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: STUDENT 360 FEE ACCOUNTS DIRECTORY                      */}
      {/* ============================================================== */}
      {activeTab === 'student_accounts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Student Enrolled Cohorts & Account Balances
              </h2>
              <p className="text-xs text-slate-500">
                Click "View Complete Payment History" to inspect all receipts and payment timeline
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStudents.map(stu => {
              const studentReceipts = receipts.filter(r => r.studentId === stu.id);
              const studentInvoices = invoices.filter(i => i.studentId === stu.id);
              const paidPct = stu.netFee > 0 ? Math.round((stu.paidFee / stu.netFee) * 100) : 100;

              return (
                <div
                  key={stu.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{stu.name}</h3>
                        <span className="font-mono text-xs text-slate-500 block">{stu.rollNumber} · {stu.enrolledBatchName}</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {stu.paymentPlan.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      Course: {stu.enrolledCourseName}
                    </p>

                    {/* Progress Bar of Fee Paid */}
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between font-mono">
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                          Paid: ₹{stu.paidFee.toLocaleString('en-IN')} ({paidPct}%)
                        </span>
                        <span className="text-slate-500">
                          Net: ₹{stu.netFee.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            stu.balanceFee === 0 ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${paidPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Financial balance breakdown card */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Course Fee</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">₹{stu.totalFee.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Scholarship</span>
                        <span className="font-mono font-bold text-amber-700 dark:text-amber-400">₹{stu.discountAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Balance Due</span>
                        <span className="font-mono font-bold text-rose-700 dark:text-rose-400">₹{stu.balanceFee.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">
                      {studentReceipts.length} Receipts · {studentInvoices.length} Invoices
                    </span>

                    <button
                      onClick={() => setSelectedStudentForLedger(stu)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-2xs"
                    >
                      <span>View Complete Payment History</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: TUITION INVOICES & INSTALLMENT SCHEDULES                 */}
      {/* ============================================================== */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoice number, student name, roll number..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
              {[
                { id: 'all', label: 'All' },
                { id: 'open', label: 'Unpaid' },
                { id: 'overdue', label: `Overdue (${overdueInvoices.length})` },
                { id: 'partially_paid', label: 'Part-paid' },
                { id: 'paid', label: 'Paid' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    statusFilter === tab.id
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Invoice Number</th>
                    <th className="px-4 py-3">Student Name & Roll No</th>
                    <th className="px-4 py-3">Course / Term</th>
                    <th className="px-4 py-3">Installment</th>
                    <th className="px-4 py-3 font-mono">Due Date</th>
                    <th className="px-4 py-3 text-right">Amount (₹)</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredInvoices.map(inv => {
                    const receipt = receipts.find(r => r.allocations?.some(a => a.invoiceId === inv.id) || r.invoiceId === inv.id);
                    const isPaid = inv.status === 'paid';

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-white">
                          {inv.invoiceNumber}
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-white">{inv.studentName}</div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{inv.studentRollNumber}</div>
                        </td>

                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 truncate max-w-xs">
                          {inv.courseName}
                        </td>

                        <td className="px-4 py-3 font-mono text-slate-800 dark:text-slate-200">
                          {inv.installmentIndex} of {inv.totalInstallments}
                        </td>

                        <td className={`px-4 py-3 font-mono whitespace-nowrap ${inv.status === 'overdue' ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                          {formatDate(inv.dueDate)}
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                          ₹{inv.amount.toLocaleString('en-IN')}
                          {!isPaid && inv.paidAmount > 0 && (
                            <div className="text-[10px] font-normal text-slate-500">₹{invoiceBalance(inv).toLocaleString('en-IN')} left</div>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Paid</span>
                            </span>
                          ) : (
                            <span
                              className={`font-semibold text-xs px-2 py-0.5 rounded border whitespace-nowrap ${
                                inv.status === 'overdue'
                                  ? 'text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                                  : 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                              }`}
                            >
                              {inv.status === 'overdue' ? 'Overdue' : inv.status === 'partially_paid' ? 'Part-paid' : 'Upcoming'}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right space-x-1">
                          {isPaid && receipt ? (
                            <button
                              onClick={() => viewReceipt(receipt)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                            >
                              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>View Receipt</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => openCollect(inv)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 rounded-md transition-colors shadow-2xs"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>Collect Fee</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: STUDENT 360 FULL PAYMENT HISTORY & FINANCIAL LEDGER    */}
      {/* ============================================================== */}
      {selectedStudentForLedger && (
        <Modal title={<>{selectedStudentForLedger.name} ({selectedStudentForLedger.rollNumber})</>} subtitle={<>Enrolled in {selectedStudentForLedger.enrolledCourseName} · {selectedStudentForLedger.enrolledBatchName}</>} onClose={() => setSelectedStudentForLedger(null)} size="xl" bodyClassName="px-5 py-4 space-y-6">

        {/* Account Financial Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <span className="text-slate-400 block">Total Tuition</span>
            <span className="text-base font-mono font-bold text-slate-900 dark:text-white mt-1 block">
              ₹{selectedStudentForLedger.totalFee.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
            <span className="text-amber-700 dark:text-amber-400 block">Scholarship Saved</span>
            <span className="text-base font-mono font-bold text-amber-800 dark:text-amber-300 mt-1 block">
              ₹{selectedStudentForLedger.discountAmount.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
            <span className="text-emerald-700 dark:text-emerald-400 block">Total Remitted</span>
            <span className="text-base font-mono font-bold text-emerald-800 dark:text-emerald-300 mt-1 block">
              ₹{selectedStudentForLedger.paidFee.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl">
            <span className="text-rose-700 dark:text-rose-400 block">Balance Pending</span>
            <span className="text-base font-mono font-bold text-rose-800 dark:text-rose-300 mt-1 block">
              ₹{selectedStudentForLedger.balanceFee.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Past Receipts & Payment History Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Cleared Payment Receipts Timeline
            </h4>
            <span className="text-xs font-mono text-slate-400">
              {receipts.filter(r => r.studentId === selectedStudentForLedger.id).length} Records
            </span>
          </div>

          {receipts.filter(r => r.studentId === selectedStudentForLedger.id).length === 0 ? (
            <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center text-xs text-slate-500">
              No payment receipts recorded for this student yet.
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5">Receipt #</th>
                    <th className="px-3 py-2.5">Description</th>
                    <th className="px-3 py-2.5">Method</th>
                    <th className="px-3 py-2.5">Date</th>
                    <th className="px-3 py-2.5 text-right">Amount (₹)</th>
                    <th className="px-3 py-2.5 text-right">Digital Slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {receipts
                    .filter(r => r.studentId === selectedStudentForLedger.id)
                    .map(rcpt => (
                      <tr key={rcpt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-3 py-2.5 font-mono font-bold text-amber-700 dark:text-amber-400">
                          {rcpt.receiptNumber}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300">
                          {rcpt.installmentDescription || 'Tuition Fee Tranche'}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-600 dark:text-slate-400">
                          {rcpt.paymentMethod}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-500 text-[11px]">
                          {rcpt.paidAt}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          ₹{rcpt.amountPaid.toLocaleString('en-IN')}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            onClick={() => viewReceipt(rcpt)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Print</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upcoming Installments for this Student */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Scheduled Installment Invoices
          </h4>

          <div className="space-y-2">
            {invoices
              .filter(i => i.studentId === selectedStudentForLedger.id)
              .map(inv => {
                const isPaid = inv.status === 'paid';
                return (
                  <div
                    key={inv.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{inv.invoiceNumber}</span>
                        <span className="text-[10px] text-slate-500">
                          Installment {inv.installmentIndex} of {inv.totalInstallments}
                        </span>
                      </div>
                      <span className={`text-[11px] font-mono ${inv.status === 'overdue' ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
                        {inv.status === 'overdue' ? 'Overdue since' : 'Due on'} {formatDate(inv.dueDate)}
                        {!isPaid && inv.paidAmount > 0 && ` · ₹${invoiceBalance(inv).toLocaleString('en-IN')} left`}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        ₹{inv.amount.toLocaleString('en-IN')}
                      </span>
                      {isPaid ? (
                        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          Paid
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            openCollect(inv);
                            setSelectedStudentForLedger(null);
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-white bg-slate-900 dark:bg-amber-600 rounded-md"
                        >
                          Collect
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setSelectedStudentForLedger(null)}
            className="px-5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Close Ledger
          </button>
        </div>

        </Modal>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: RECORD DIRECT / OFFLINE PAYMENT (ADMIN / MANAGEMENT)  */}
      {/* ============================================================== */}
      {isDirectPayModalOpen && (
        <Modal title="Record Student Payment Remittance" onClose={() => setIsDirectPayModalOpen(false)} size="sm" bodyClassName="px-5 py-4 space-y-4">

        <form onSubmit={handleRecordDirectPayment} className="space-y-3 text-xs">
          
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Enrolled Student *
            </label>
            <select
              value={directPayStudentId}
              onChange={e => {
                setDirectPayStudentId(e.target.value);
                const selected = students.find(s => s.id === e.target.value);
                setDirectPayAmount(selected?.balanceFee || 0);
                setPayError('');
              }}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none"
            >
              {students
                .filter(s => s.balanceFee > 0)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.rollNumber}) · Balance: ₹{s.balanceFee.toLocaleString('en-IN')}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount Paid (₹) *
              </label>
              <input
                type="number"
                min="1"
                value={directPayAmount}
                onChange={e => setDirectPayAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Method *
              </label>
              <select
                value={directPayMethod}
                onChange={e => setDirectPayMethod(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
              >
                <option value="UPI">UPI (GPay / PhonePe / QR)</option>
                <option value="Credit/Debit Card">Credit/Debit Card (POS)</option>
                <option value="NetBanking">NetBanking / NEFT / IMPS</option>
                <option value="Demand Draft">Demand Draft (DD)</option>
                <option value="Cash">Cash (Counter)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tranche / Installment Description
            </label>
            <input
              type="text"
              value={directPayDescription}
              onChange={e => setDirectPayDescription(e.target.value)}
              placeholder="Optional: filled in automatically from the installments paid"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Transaction / UTR / Cheque Ref
            </label>
            <input
              type="text"
              value={directPayRef}
              onChange={e => setDirectPayRef(e.target.value)}
              placeholder="e.g. UPI-99381023910 or DD-SBI-0041"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Remarks / Verified By Notes
            </label>
            <input
              type="text"
              value={directPayNotes}
              onChange={e => setDirectPayNotes(e.target.value)}
              placeholder="e.g. Paid at fee counter. Verified by Finance Controller."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
            />
          </div>

          {payError && (
            <div className="p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded text-rose-700 dark:text-rose-300">{payError}</div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsDirectPayModalOpen(false)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2 text-white font-bold bg-amber-600 hover:bg-amber-500 rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Generating Receipt...' : 'Record & Issue Receipt'}</span>
            </button>
          </div>

        </form>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: COLLECT INVOICE FEE GATEWAY MODAL                     */}
      {/* ============================================================== */}
      {selectedInvoiceForPayment && (
        <Modal title={<>Collect Installment: {selectedInvoiceForPayment.invoiceNumber}</>} onClose={() => setSelectedInvoiceForPayment(null)} size="sm" bodyClassName="px-5 py-4 space-y-4">

        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Student:</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {selectedInvoiceForPayment.studentName} ({selectedInvoiceForPayment.studentRollNumber})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Installment:</span>
            <span className="font-mono text-slate-800 dark:text-slate-200">
              {selectedInvoiceForPayment.installmentIndex} of {selectedInvoiceForPayment.totalInstallments}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Invoice amount / already paid:</span>
            <span className="font-mono text-slate-800 dark:text-slate-200">
              ₹{selectedInvoiceForPayment.amount.toLocaleString('en-IN')} / ₹{selectedInvoiceForPayment.paidAmount.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
            <span className="font-bold text-slate-700 dark:text-slate-300">Balance on this installment:</span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
              ₹{invoiceBalance(selectedInvoiceForPayment).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <form onSubmit={handleProcessInvoicePayment} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount Received (₹)</label>
            <input
              type="number"
              min={1}
              value={collectAmount}
              onChange={e => setCollectAmount(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-mono font-bold"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Less than the balance is recorded as a part payment. More is applied to the next installments.
            </p>
          </div>
          {payError && (
            <div className="p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded text-rose-700 dark:text-rose-300">{payError}</div>
          )}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payment Collection Mode
            </label>
            <select
              value={payMethod}
              onChange={e => setPayMethod(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none"
            >
              <option value="UPI">UPI (Instant Google Pay / PhonePe / BHIM)</option>
              <option value="Credit/Debit Card">Credit / Debit Card (Razorpay Gateway)</option>
              <option value="NetBanking">NetBanking / Corporate NEFT</option>
              <option value="Demand Draft">Demand Draft (DD)</option>
              <option value="Cash">Cash Deposit at Academy Accounts Desk</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Accounting Reference / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. UTR / Transaction No / Cheque details"
              value={payNotes}
              onChange={e => setPayNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {isProcessing
                  ? 'Reconciling Ledger...'
                  : `Record ₹${(collectAmount || 0).toLocaleString('en-IN')} & Issue Receipt`}
              </span>
            </button>
          </div>
        </form>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: OFFICIAL STUDENT FEE ACCOUNT STATEMENT                */}
      {/* ============================================================== */}
      {selectedStudentForStatement && (
        <Modal
          title="Fee Account Statement"
          subtitle={`${selectedStudentForStatement.name} · ${selectedStudentForStatement.rollNumber}`}
          onClose={() => setSelectedStudentForStatement(null)}
          size="xl"
          bodyClassName="p-0"
          headerActions={
            <button
              type="button"
              onClick={printLight}
              className="hidden sm:inline-flex px-3 py-1.5 text-white font-bold bg-amber-600 hover:bg-amber-500 rounded-lg shadow-xs items-center gap-1.5 text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          }
        >
          <div className="print-area bg-white dark:bg-slate-900 p-5 sm:p-8 space-y-6">
            
            {/* Header / Letterhead */}
            <div className="border-b-2 border-slate-900 dark:border-amber-500 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-xs">
                    VRM
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white uppercase">
                      VRM IAS Academy
                    </h2>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      {ACADEMY.addressLine} · {ACADEMY.phone}
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                  Official Statement of Student Fee Account & Remittance History
                </div>
              </div>

              <div className="text-right text-xs space-y-1">
                <span className="font-mono font-bold text-slate-900 dark:text-slate-200 block">
                  Statement ID: STM-{selectedStudentForStatement.rollNumber.split('-')[2]}-{Date.now().toString().slice(-4)}
                </span>
                <span className="text-slate-500 text-[11px] block">
                  Generated: {new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </span>
                <span className="inline-block text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  Accounts Department Verified
                </span>
              </div>
            </div>

            {/* Student Particulars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Aspirant Name:</span>
                <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">{selectedStudentForStatement.name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Roll Number:</span>
                <span className="font-mono font-bold text-amber-700 dark:text-amber-400 mt-0.5 block">{selectedStudentForStatement.rollNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Enrolled Course:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">{selectedStudentForStatement.enrolledCourseName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Classroom Batch:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">{selectedStudentForStatement.enrolledBatchName}</span>
              </div>
            </div>

            {/* Account Financial Standing */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Total Course Fee</span>
                <div className="font-mono font-bold text-slate-900 dark:text-white text-base mt-1">
                  ₹{selectedStudentForStatement.totalFee.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                <span className="text-amber-700 dark:text-amber-400">Scholarship / Concession</span>
                <div className="font-mono font-bold text-amber-800 dark:text-amber-300 text-base mt-1">
                  ₹{selectedStudentForStatement.discountAmount.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Total Paid to Date</span>
                <div className="font-mono font-bold text-emerald-800 dark:text-emerald-300 text-base mt-1">
                  ₹{selectedStudentForStatement.paidFee.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900">
                <span className="text-rose-700 dark:text-rose-400 font-semibold">Balance Outstanding</span>
                <div className="font-mono font-bold text-rose-800 dark:text-rose-300 text-base mt-1">
                  ₹{selectedStudentForStatement.balanceFee.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Historical Payments Ledger Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Itemized Historical Receipts & Remittance Log
              </h4>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-3.5 py-2.5">Receipt #</th>
                      <th className="px-3.5 py-2.5 font-mono">Date</th>
                      <th className="px-3.5 py-2.5">Tranche Description</th>
                      <th className="px-3.5 py-2.5">Mode</th>
                      <th className="px-3.5 py-2.5">UTR / Reference</th>
                      <th className="px-3.5 py-2.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {receipts
                      .filter(r => r.studentId === selectedStudentForStatement.id || r.studentRollNumber === selectedStudentForStatement.rollNumber)
                      .map(rcpt => (
                        <tr key={rcpt.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="px-3.5 py-2.5 font-mono font-bold text-amber-700 dark:text-amber-400">
                            {rcpt.receiptNumber}
                          </td>
                          <td className="px-3.5 py-2.5 font-mono text-slate-600 dark:text-slate-400">
                            {rcpt.paidAt}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-800 dark:text-slate-200 font-medium">
                            {rcpt.installmentDescription || 'Tuition Fee Remittance'}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-700 dark:text-slate-300">
                            {rcpt.paymentMethod}
                          </td>
                          <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-500">
                            {rcpt.transactionReference}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            ₹{rcpt.amountPaid.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Certification & Authorization Footnote */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="text-[11px] text-slate-500 max-w-md">
                Certified that the above statements and cleared transaction records have been verified against the official VRM IAS Academy Financial Ledger. Valid for educational bank loans, state scholarships, and Section 80C income tax deduction verification.
              </div>

              <div className="text-right">
                <div className="font-bold text-slate-900 dark:text-white">Dr. V. R. Murugan, Ex-IRS</div>
                <div className="text-[10px] text-slate-400">Managing Director & Finance Controller</div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 print:hidden">
              <button
                type="button"
                onClick={() => setSelectedStudentForStatement(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold"
              >
                Close Statement
              </button>
              <button
                type="button"
                onClick={printLight}
                className="px-5 py-2 text-white font-bold bg-amber-600 hover:bg-amber-500 rounded-lg shadow-xs flex items-center gap-1.5 text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Statement (PDF)</span>
              </button>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
};
