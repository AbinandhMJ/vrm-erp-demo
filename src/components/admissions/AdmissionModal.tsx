import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Lead, ScholarshipType, PaymentPlanType, PaymentReceipt, Student } from '../../types';
import { AdmissionFormPrint, printableFromStudent } from './AdmissionFormPrint';
import { computeDiscount } from '../../lib/fees';
import {
  AdmissionFormFields,
  AdmissionFormValues,
  DeclarationChecklist,
  blankForm,
  firstOpenBatch,
  formFromLead,
  useDeclarations,
  validateAdmissionForm
} from './AdmissionFormFields';
import { formatDate } from '../../lib/dates';
import {
  X,
  UserCheck,
  CreditCard,
  CheckCircle2,
  Lock,
  Layers,
  ArrowRight,
  ShieldCheck,
  Camera
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
  
  // The academy's admission form (shared with the online application page)
  const [form, setForm] = useState<AdmissionFormValues>(() =>
    initialLead ? formFromLead(initialLead, courses, batches) : blankForm(courses[0]?.id || '', firstOpenBatch(batches, courses[0]?.id || '')?.id || '')
  );
  const patchForm = (patch: Partial<AdmissionFormValues>) => {
    setForm(f => ({ ...f, ...patch }));
    setFormError('');
  };
  const decl = useDeclarations();
  const [formError, setFormError] = useState('');
  const { studentName, phone, email, address, guardianName, guardianPhone } = form;
  const selectedCourseId = form.courseId;
  const selectedBatchId = form.batchId;
  const selectedBatchObj = batches.find(b => b.id === selectedBatchId);

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
    student: Student;
  } | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleProcessAdmission = () => {
    if (!studentName.trim() || !phone.trim()) {
      setFormError('Please fill in the student name and contact number.');
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
        gender: 'Not specified',
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
        form: {
          qualification: form.qualification.trim(),
          occupation: form.occupation.trim(),
          dateOfBirth: form.dateOfBirth,
          examsAttended: form.examsAttended.trim(),
          specialCategory: form.specialCategory.trim() || 'None',
          aim: form.aim.trim(),
          reference: form.reference.trim(),
          courseDetails: form.courseDetails.trim(),
          photo: form.photo || undefined,
          declarationAcceptedAt: new Date().toISOString()
        },
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
        phone: result.student.phone,
        student: result.student
      });
      setStep(3);
    }, 1200);
  };

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

        {/* Step 1: the academy's admission form, in the same order as the printed form */}
        {step === 1 && (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Fields follow VRM's printed admission form. * required</span>
              <span>Date: <b className="text-slate-800 dark:text-slate-200">{formatDate(new Date().toISOString().slice(0, 10))}</b></span>
            </div>

            <AdmissionFormFields value={form} onChange={patchForm} courses={courses} batches={batches} batchMode="required" />

            <DeclarationChecklist
              checked={decl.checked}
              agreed={decl.agreed}
              onChange={(c, a) => {
                decl.setChecked(c);
                decl.setAgreed(a);
                setFormError('');
              }}
            />

            {formError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-700 dark:text-rose-300 text-xs">
                {formError}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const err = validateAdmissionForm(form, { batches, requireBatch: true });
                  if (err) {
                    setFormError(err);
                    return;
                  }
                  if (!decl.complete) {
                    setFormError('Tick all declarations to continue.');
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
                onClick={() => setShowForm(true)}
                className="px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Print Admission Form
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
      {showForm && paymentSuccessData && <AdmissionFormPrint form={printableFromStudent(paymentSuccessData.student)} onClose={() => setShowForm(false)} />}
    </Modal>
  );
};
