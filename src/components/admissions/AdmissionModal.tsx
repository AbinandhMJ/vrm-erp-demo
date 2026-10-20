import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Lead, ScholarshipType, PaymentPlanType, PaymentReceipt } from '../../types';
import { computeDiscount } from '../../lib/fees';
import {
  X,
  UserCheck,
  CreditCard,
  CheckCircle2,
  Lock,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface AdmissionModalProps {
  initialLead?: Lead;
  onClose: () => void;
}

export const AdmissionModal: React.FC<AdmissionModalProps> = ({ initialLead, onClose }) => {
  const {
    courses,
    batches,
    convertLeadToAdmission,
    viewReceipt
  } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // Student Info
  const [studentName, setStudentName] = useState(initialLead?.studentName || '');
  const [phone, setPhone] = useState(initialLead?.phone || '');
  const [email, setEmail] = useState(initialLead?.email || '');
  const [gender, setGender] = useState('Male');
  const [address, setAddress] = useState(initialLead?.location || '');
  const [guardianName, setGuardianName] = useState('');
  const [formError, setFormError] = useState('');
  const [guardianPhone, setGuardianPhone] = useState(initialLead?.phone || '');

  // Course & Batch
  const defaultCourse = courses.find(c => c.name === initialLead?.targetCourse) || courses[0];
  const [selectedCourseId, setSelectedCourseId] = useState(defaultCourse?.id || courses[0]?.id || '');
  
  const courseBatches = batches.filter(b => b.courseId === selectedCourseId);
  const firstOpen = (list: typeof batches) => list.find(b => b.enrolledCount < b.maxCapacity) || list[0];
  const [selectedBatchId, setSelectedBatchId] = useState(firstOpen(courseBatches)?.id || '');

  useEffect(() => {
    // Only reset the batch when the course changes (not when seat counts update after admission).
    setSelectedBatchId(firstOpen(batches.filter(b => b.courseId === selectedCourseId))?.id || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId]);

  // Fee & Scholarship
  const currentCourse = courses.find(c => c.id === selectedCourseId) || courses[0];
  const baseFee = currentCourse?.totalFee || 135000;

  const [scholarship, setScholarship] = useState<ScholarshipType>('none');
  const [customDiscount, setCustomDiscount] = useState<number>(15000);
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlanType>('two_installments');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Credit/Debit Card' | 'NetBanking' | 'Demand Draft' | 'Cash'>('UPI');
  
  const calculatedDiscount = computeDiscount(baseFee, scholarship, customDiscount);

  const netFee = Math.max(0, baseFee - calculatedDiscount);
  
  const defaultAdvance = paymentPlan === 'one_time' 
    ? netFee 
    : paymentPlan === 'two_installments' 
    ? Math.round(netFee / 2) 
    : Math.round(netFee / 3);

  const [advanceAmount, setAdvanceAmount] = useState<number>(defaultAdvance);

  useEffect(() => {
    setAdvanceAmount(defaultAdvance);
  }, [defaultAdvance]);

  // Gateway Simulation State
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    studentRoll: string;
    studentName: string;
    receiptId: string;
    receiptObj: PaymentReceipt;
    password: string;
    phone: string;
  } | null>(null);

  const handleProcessAdmission = () => {
    if (!studentName.trim() || !phone.trim() || !email.trim()) {
      setFormError('Please fill in the student name, phone number and email.');
      return;
    }
    if (!advanceAmount || advanceAmount <= 0) {
      setFormError('Enter the advance amount being collected now.');
      return;
    }
    if (advanceAmount > netFee) {
      setFormError(`Advance cannot exceed the net fee of ₹${netFee.toLocaleString('en-IN')}.`);
      return;
    }
    setFormError('');
    setIsProcessing(true);

    setTimeout(() => {
      let result;
      try {
        result = convertLeadToAdmission({
        leadId: initialLead?.id,
        studentName,
        email,
        phone,
        gender,
        address,
        guardianName,
        guardianPhone,
        courseId: selectedCourseId,
        batchId: selectedBatchId,
        scholarship,
        customDiscountAmount: customDiscount,
        paymentPlan,
        paymentMethod,
        advancePaymentAmount: Number(advanceAmount),
        transactionRef: `GATEWAY-${paymentMethod.replace(/[^a-zA-Z]/g, '')}-${Date.now().toString().slice(-6)}`
        });
      } catch (err) {
        setIsProcessing(false);
        setFormError(err instanceof Error ? err.message : 'Admission failed.');
        return;
      }

      setIsProcessing(false);
      setPaymentSuccessData({
        studentRoll: result.student.rollNumber,
        studentName: result.student.name,
        receiptId: result.receipt.receiptNumber,
        receiptObj: result.receipt,
        password: result.credentials.password,
        phone: result.student.phone
      });
      setStep(3);
    }, 1200);
  };

  const selectedBatchObj = batches.find(b => b.id === selectedBatchId);

  return (
    <Modal
      title={initialLead ? `Admit: ${initialLead.studentName}` : 'New Student Admission'}
      subtitle="Student details · Fee plan · Payment & portal login"
      icon={
        <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
          <UserCheck className="w-4 h-4" />
        </div>
      }
      headerTone="dark"
      onClose={onClose}
      size="xl"
      bodyClassName="p-0"
      dismissible={!isProcessing}
    >
        {/* Wizard Step Progress */}
        <div className="sticky top-0 z-10 flex flex-wrap gap-y-1 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 sm:px-6 py-3 text-xs">
          <div className={`flex items-center gap-2 font-medium ${step === 1 ? 'text-amber-800 dark:text-amber-300 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 1 ? 'bg-amber-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
              1
            </span>
            <span className="hidden sm:inline">Student & Batch Details</span>
          </div>
          <div className="mx-2 sm:mx-4 text-slate-300 dark:text-slate-700">/</div>
          <div className={`flex items-center gap-2 font-medium ${step === 2 ? 'text-amber-800 dark:text-amber-300 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 2 ? 'bg-amber-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
              2
            </span>
            <span className="hidden sm:inline">Fee Structure & Payment</span>
          </div>
          <div className="mx-2 sm:mx-4 text-slate-300 dark:text-slate-700">/</div>
          <div className={`flex items-center gap-2 font-medium ${step === 3 ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
              3
            </span>
            <span className="hidden sm:inline">Roster & Digital Receipt</span>
          </div>
        </div>

        {/* Step 1: Student Information & Course/Batch */}
        {step === 1 && (
          <div className="p-4 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Student Full Name *
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g. S. Ramanujam"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Mobile Number *
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="+91 98401 XXXXX"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="aspirant@gmail.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Gender & Residential Address
                </label>
                <div className="flex gap-2">
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className="w-28 px-2 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                    placeholder="Locality, City (e.g. Anna Nagar, Chennai)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Parent / Guardian Name
                </label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={e => setGuardianName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  placeholder="Parent Name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Parent / Guardian Contact
                </label>
                <input
                  type="text"
                  value={guardianPhone}
                  onChange={e => setGuardianPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  placeholder="Emergency Contact"
                />
              </div>
            </div>

            {/* Course & Batch Selection */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                Course & Batch Allocation
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Program / Course
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={e => setSelectedCourseId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} — ₹{c.totalFee.toLocaleString('en-IN')}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Duration: {currentCourse?.durationMonths} Months · {currentCourse?.category}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assign Classroom Batch
                  </label>
                  <select
                    value={selectedBatchId}
                    onChange={e => setSelectedBatchId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  >
                    {courseBatches.length > 0 ? (
                      courseBatches.map(b => {
                        const full = b.enrolledCount >= b.maxCapacity;
                        return (
                          <option key={b.id} value={b.id} disabled={full}>
                            {full ? '[FULL] ' : ''}
                            {b.name} ({b.timing})
                          </option>
                        );
                      })
                    ) : (
                      <option value="">No active batches for this course</option>
                    )}
                  </select>
                  {selectedBatchObj && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 flex items-center justify-between">
                      <span>Room: {selectedBatchObj.room}</span>
                      <span className="font-medium text-amber-700 dark:text-amber-400">
                        Capacity: {selectedBatchObj.enrolledCount} / {selectedBatchObj.maxCapacity} seats filled
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {formError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-700 dark:text-rose-300 text-xs">
                {formError}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!studentName.trim() || !phone.trim() || !email.trim()) {
                    setFormError('Please provide the student name, phone and email.');
                    return;
                  }
                  if (!selectedBatchObj) {
                    setFormError('This course has no batch to join yet. Create a batch first.');
                    return;
                  }
                  if (selectedBatchObj.enrolledCount >= selectedBatchObj.maxCapacity) {
                    setFormError(`${selectedBatchObj.name} is full. Choose another batch.`);
                    return;
                  }
                  setFormError('');
                  setStep(2);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 rounded-lg transition-colors"
              >
                <span>Continue to Fee Structure</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Custom Fee Structure, Scholarship & Payment Gateway */}
        {step === 2 && (
          <div className="p-4 sm:p-6 space-y-5">
            
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                Flexible Fee & Scholarship Structure
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Select tuition waiver or concession category based on student background, merit or economic criteria.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className={`p-3 border rounded-lg cursor-pointer transition-colors ${scholarship === 'none' ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                  <input
                    type="radio"
                    name="scholarship"
                    value="none"
                    checked={scholarship === 'none'}
                    onChange={() => setScholarship('none')}
                    className="mr-2 text-amber-600"
                  />
                  <span className="font-semibold text-slate-900 dark:text-white">Standard Full Fee</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">No concession applied. Standard fee ₹{baseFee.toLocaleString('en-IN')}</p>
                </label>

                <label className={`p-3 border rounded-lg cursor-pointer transition-colors ${scholarship === 'merit_25' ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                  <input
                    type="radio"
                    name="scholarship"
                    value="merit_25"
                    checked={scholarship === 'merit_25'}
                    onChange={() => setScholarship('merit_25')}
                    className="mr-2 text-amber-600"
                  />
                  <span className="font-semibold text-slate-900 dark:text-white">Merit Scholarship (25% Waiver)</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">For university rank holders. Saves ₹{Math.round(baseFee * 0.25).toLocaleString('en-IN')}</p>
                </label>

                <label className={`p-3 border rounded-lg cursor-pointer transition-colors ${scholarship === 'ews_rural_40' ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                  <input
                    type="radio"
                    name="scholarship"
                    value="ews_rural_40"
                    checked={scholarship === 'ews_rural_40'}
                    onChange={() => setScholarship('ews_rural_40')}
                    className="mr-2 text-amber-600"
                  />
                  <span className="font-semibold text-slate-900 dark:text-white">EWS / Rural Aid (40% Waiver)</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Underprivileged quota. Saves ₹{Math.round(baseFee * 0.40).toLocaleString('en-IN')}</p>
                </label>

                <label className={`p-3 border rounded-lg cursor-pointer transition-colors ${scholarship === 'full_lump_sum_10' ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                  <input
                    type="radio"
                    name="scholarship"
                    value="full_lump_sum_10"
                    checked={scholarship === 'full_lump_sum_10'}
                    onChange={() => setScholarship('full_lump_sum_10')}
                    className="mr-2 text-amber-600"
                  />
                  <span className="font-semibold text-slate-900 dark:text-white">One-Time Payment Rebate (10%)</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Saves ₹{Math.round(baseFee * 0.10).toLocaleString('en-IN')} on full clearance.</p>
                </label>
              </div>
            </div>

            {/* Fee Summary Cards */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Base Program Fee</span>
                <span className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                  ₹{baseFee.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg">
                <span className="text-[11px] text-amber-800 dark:text-amber-300 block">Concession Discount</span>
                <span className="text-sm font-mono font-bold text-amber-900 dark:text-amber-200 tabular-nums">
                  -₹{calculatedDiscount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 bg-slate-900 dark:bg-slate-950 border border-slate-800 text-white rounded-lg">
                <span className="text-[11px] text-amber-300 block">Final Net Tuition Fee</span>
                <span className="text-base font-mono font-bold text-white tabular-nums">
                  ₹{netFee.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Payment Cycle Plan */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Preferred Payment Cycle / Plan
              </label>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentPlan('one_time')}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${paymentPlan === 'one_time' ? 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/40 font-semibold text-slate-900 dark:text-white' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                >
                  <div>1-Time Full Payment</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">1 invoice of ₹{netFee.toLocaleString('en-IN')}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentPlan('two_installments')}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${paymentPlan === 'two_installments' ? 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/40 font-semibold text-slate-900 dark:text-white' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                >
                  <div>2-Installment Plan</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">50% Advance + 50% in 60 days</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentPlan('three_installments')}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${paymentPlan === 'three_installments' ? 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/40 font-semibold text-slate-900 dark:text-white' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                >
                  <div>3-Installment Plan</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Equal 3 tranches across term</div>
                </button>
              </div>
            </div>

            {/* Simulated Payment Gateway Section */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Automated Secure Payment Gateway
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">Demo mode: no real payment</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Advance Payment to Collect Now (₹) *
                  </label>
                  <input
                    type="number"
                    value={advanceAmount}
                    onChange={e => setAdvanceAmount(Number(e.target.value))}
                    max={netFee}
                    min={1}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-mono font-bold tabular-nums"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Remaining balance: ₹{Math.max(0, netFee - advanceAmount).toLocaleString('en-IN')}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Payment Instrument / Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  >
                    <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                    <option value="Credit/Debit Card">Credit / Debit Card (Visa, RuPay, MC)</option>
                    <option value="NetBanking">NetBanking (SBI, HDFC, ICICI, Canara)</option>
                    <option value="Demand Draft">Demand Draft / Bank Cheque</option>
                    <option value="Cash">Cash at Academy Accounts Desk</option>
                  </select>
                </div>
              </div>
            </div>

            {formError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-700 dark:text-rose-300 text-xs">
                {formError}
              </div>
            )}
            {/* Step 2 Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              >
                Back to Student Details
              </button>
              
              <button
                type="button"
                onClick={handleProcessAdmission}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Gateway Remittance...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Charge ₹{advanceAmount.toLocaleString('en-IN')} & Confirm Admission</span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}

        {/* Step 3: Success Confirmation */}
        {step === 3 && paymentSuccessData && (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Admission Enrolled Successfully!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                The student is on the batch roster, their installment invoices are created, and a portal login has been set up.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-5 max-w-md mx-auto text-left space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Allocated Roll Number:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{paymentSuccessData.studentRoll}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Classroom Batch:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedBatchObj?.name}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Digital Receipt ID:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{paymentSuccessData.receiptId}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Portal Username:</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">{paymentSuccessData.studentRoll}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Portal Password:</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">{paymentSuccessData.password}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                Login details sent by SMS to {paymentSuccessData.phone} (simulated in this demo). Sign out and log in with them to see the student's portal.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  viewReceipt(paymentSuccessData.receiptObj);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>View & Print Official Receipt</span>
              </button>
              
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Done / Close
              </button>
            </div>
          </div>
        )}
    </Modal>
  );
};
