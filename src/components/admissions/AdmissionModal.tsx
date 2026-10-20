import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Lead, ScholarshipType, PaymentPlanType, PaymentReceipt, Student } from '../../types';
import { AdmissionFormPrint } from './AdmissionFormPrint';
import { computeDiscount } from '../../lib/fees';
import { resizePhoto } from '../../lib/photo';
import { ADMISSION_DECLARATIONS } from '../../config/academy';
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

const FIELD = 'w-full px-3 py-2 text-sm sm:text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500';
const LBL = 'block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1';

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
  const [address, setAddress] = useState(initialLead?.location || '');
  const [guardianName, setGuardianName] = useState(''); // Father / Husband name
  const [formError, setFormError] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  // Fields from the academy's printed admission form
  const [qualification, setQualification] = useState('');
  const [occupation, setOccupation] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [examsAttended, setExamsAttended] = useState('');
  const [specialCategory, setSpecialCategory] = useState('');
  const [aim, setAim] = useState('');
  const [reference, setReference] = useState(
    initialLead ? `${initialLead.source.replace('_', ' ')} enquiry, counselor ${initialLead.assignedCounselorName}` : ''
  );
  const [courseDetails, setCourseDetails] = useState('');
  const [photo, setPhoto] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [declarations, setDeclarations] = useState<boolean[]>(ADMISSION_DECLARATIONS.map(() => false));
  const [signedBy, setSignedBy] = useState(false);

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
          qualification: qualification.trim(),
          occupation: occupation.trim(),
          dateOfBirth,
          examsAttended: examsAttended.trim(),
          specialCategory: specialCategory.trim() || 'None',
          aim: aim.trim(),
          reference: reference.trim(),
          courseDetails: courseDetails.trim(),
          photo: photo || undefined,
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

        {/* Step 1: the academy's admission form, in the same order as the printed form */}
        {step === 1 && (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Fields follow VRM's printed admission form. * required</span>
              <span>Date: <b className="text-slate-800 dark:text-slate-200">{formatDate(new Date().toISOString().slice(0, 10))}</b></span>
            </div>

            {/* Course applied for */}
            <section className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Course applied for</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={LBL}>Course applied for *</label>
                  <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} className={FIELD}>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} (₹{c.totalFee.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {currentCourse?.durationMonths} months · {currentCourse?.category}
                  </p>
                </div>
                <div>
                  <label className={LBL}>Batch *</label>
                  <select value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)} className={FIELD}>
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
                      <option value="">No batch for this course yet</option>
                    )}
                  </select>
                  {selectedBatchObj && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {selectedBatchObj.days} · {selectedBatchObj.room} · {selectedBatchObj.enrolledCount}/{selectedBatchObj.maxCapacity} seats filled
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className={LBL}>Course details</label>
                  <input value={courseDetails} onChange={e => setCourseDetails(e.target.value)} className={FIELD} placeholder="e.g. Classroom, morning batch, Prelims + Mains" />
                </div>
              </div>
            </section>

            {/* Student details + photo */}
            <section className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Student details</h4>
              <div className="flex flex-col-reverse sm:flex-row gap-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={LBL}>Name of the student *</label>
                    <input value={studentName} onChange={e => setStudentName(e.target.value)} className={FIELD} placeholder="As in certificates" />
                  </div>
                  <div>
                    <label className={LBL}>Qualification</label>
                    <input value={qualification} onChange={e => setQualification(e.target.value)} className={FIELD} placeholder="e.g. B.Sc Mathematics" list="qual-options" />
                    <datalist id="qual-options">
                      {['10th', '12th', 'Diploma', 'B.A.', 'B.Sc', 'B.Com', 'B.E. / B.Tech', 'M.A.', 'M.Sc', 'M.B.A.', 'Ph.D'].map(q => (
                        <option key={q} value={q} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className={LBL}>Father / Husband name *</label>
                    <input value={guardianName} onChange={e => setGuardianName(e.target.value)} className={FIELD} />
                  </div>
                  <div>
                    <label className={LBL}>Occupation</label>
                    <input value={occupation} onChange={e => setOccupation(e.target.value)} className={FIELD} placeholder="e.g. Student, Farmer, Teacher" />
                  </div>
                  <div>
                    <label className={LBL}>Date of birth *</label>
                    <input type="date" value={dateOfBirth} max={new Date().toISOString().slice(0, 10)} onChange={e => setDateOfBirth(e.target.value)} className={FIELD} />
                  </div>
                </div>

                <div className="sm:w-36 shrink-0">
                  <label className={LBL}>Photo</label>
                  <label className="block w-32 h-40 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 overflow-hidden cursor-pointer hover:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500">
                    {photo ? (
                      <img src={photo} alt="Student photo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="h-full flex flex-col items-center justify-center text-center text-[11px] text-slate-500 px-2">
                        <Camera className="w-5 h-5 mb-1" />
                        Add passport photo
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      className="sr-only"
                      onChange={async e => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        try {
                          setPhoto(await resizePhoto(f));
                          setPhotoError('');
                        } catch (err) {
                          setPhotoError(err instanceof Error ? err.message : 'Could not use this image.');
                        }
                      }}
                    />
                  </label>
                  {photo && (
                    <button type="button" onClick={() => setPhoto('')} className="mt-1 text-[11px] text-rose-600 hover:underline">
                      Remove photo
                    </button>
                  )}
                  {photoError && <p className="mt-1 text-[11px] text-rose-600">{photoError}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={LBL}>Contact number *</label>
                  <input type="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} className={FIELD} placeholder="+91 9XXXX XXXXX" />
                </div>
                <div>
                  <label className={LBL}>e-Mail ID</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={FIELD} placeholder="name@gmail.com" />
                </div>
                <div>
                  <label className={LBL}>Parent / guardian phone</label>
                  <input type="tel" inputMode="tel" value={guardianPhone} onChange={e => setGuardianPhone(e.target.value)} className={FIELD} placeholder="For attendance and fee alerts" />
                </div>
                <div>
                  <label className={LBL}>Special category</label>
                  <input value={specialCategory} onChange={e => setSpecialCategory(e.target.value)} className={FIELD} placeholder="None" list="cat-options" />
                  <datalist id="cat-options">
                    {['None', 'Person with disability', 'Ex-serviceman', 'Destitute widow', 'First graduate', 'Sports person'].map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div className="md:col-span-2">
                  <label className={LBL}>Exams attended details</label>
                  <textarea rows={2} value={examsAttended} onChange={e => setExamsAttended(e.target.value)} className={FIELD} placeholder="e.g. TNPSC Group 4 (2024), cleared prelims; UPSC CSE 2025 prelims" />
                </div>
                <div className="md:col-span-2">
                  <label className={LBL}>Address</label>
                  <textarea rows={2} value={address} onChange={e => setAddress(e.target.value)} className={FIELD} placeholder="Door no, street, town, district, PIN" />
                </div>
                <div>
                  <label className={LBL}>Aim</label>
                  <input value={aim} onChange={e => setAim(e.target.value)} className={FIELD} placeholder="e.g. IAS, Deputy Collector, SI of Police" />
                </div>
                <div>
                  <label className={LBL}>Reference</label>
                  <input value={reference} onChange={e => setReference(e.target.value)} className={FIELD} placeholder="Who referred / how they heard of us" />
                </div>
              </div>
            </section>

            {/* Declaration */}
            <section className="space-y-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Declaration *</h4>
              {ADMISSION_DECLARATIONS.map((d, i) => (
                <label key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declarations[i]}
                    onChange={e => {
                      setDeclarations(prev => prev.map((v, j) => (j === i ? e.target.checked : v)));
                      setFormError('');
                    }}
                    className="mt-0.5 w-4 h-4 accent-amber-600 shrink-0"
                  />
                  <span>{d}</span>
                </label>
              ))}
              <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-2 border-t border-slate-200 dark:border-slate-700">
                <input type="checkbox" checked={signedBy} onChange={e => {
                    setSignedBy(e.target.checked);
                    setFormError('');
                  }} className="mt-0.5 w-4 h-4 accent-amber-600 shrink-0" />
                <span>The student and parent/guardian have read and agreed to the above. They will sign the printed form.</span>
              </label>
            </section>

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
                  const missing = [
                    !studentName.trim() && 'name of the student',
                    !guardianName.trim() && 'father / husband name',
                    !dateOfBirth && 'date of birth',
                    !phone.trim() && 'contact number'
                  ].filter(Boolean);
                  if (missing.length) {
                    setFormError(`Please fill in: ${missing.join(', ')}.`);
                    return;
                  }
                  if (phone.replace(/\D/g, '').length < 10) {
                    setFormError('Enter a valid 10-digit contact number.');
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
                  if (!declarations.every(Boolean) || !signedBy) {
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
      {showForm && paymentSuccessData && <AdmissionFormPrint student={paymentSuccessData.student} onClose={() => setShowForm(false)} />}
    </Modal>
  );
};
