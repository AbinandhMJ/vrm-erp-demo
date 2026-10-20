import React from 'react';
import { Printer } from 'lucide-react';
import { Batch, Course, Lead, Student } from '../../types';
import { Modal } from '../common/Modal';
import { ACADEMY, ADMISSION_DECLARATIONS } from '../../config/academy';
import { formatDate } from '../../lib/dates';
import { printLight } from '../../lib/print';

const PLAN_LABEL: Record<Student['paymentPlan'], string> = {
  one_time: 'One-time payment',
  two_installments: '2 installments',
  three_installments: '3 installments'
};

/** Everything the printed form shows; built from an admitted student or an online application. */
export interface PrintableAdmissionForm {
  heading: string; // modal subtitle
  date: string; // YYYY-MM-DD shown as "Date"
  courseName: string;
  batchName?: string;
  courseDetails?: string;
  name: string;
  qualification?: string;
  guardianName?: string;
  occupation?: string;
  dateOfBirth?: string;
  phone: string;
  guardianPhone?: string;
  email?: string;
  examsAttended?: string;
  address?: string;
  specialCategory?: string;
  aim?: string;
  reference?: string;
  photo?: string;
  declarationAcceptedAt?: string;
  officeUse: [string, string][];
}

export const printableFromStudent = (s: Student, includeFees = true): PrintableAdmissionForm => ({
  heading: `${s.name} · ${s.rollNumber}`,
  date: s.admissionDate,
  courseName: s.enrolledCourseName,
  batchName: s.enrolledBatchName,
  courseDetails: s.courseDetails,
  name: s.name,
  qualification: s.qualification,
  guardianName: s.guardianName,
  occupation: s.occupation,
  dateOfBirth: s.dateOfBirth,
  phone: s.phone,
  guardianPhone: s.guardianPhone !== s.phone ? s.guardianPhone : undefined,
  email: s.email,
  examsAttended: s.examsAttended,
  address: s.address,
  specialCategory: s.specialCategory,
  aim: s.aim,
  reference: s.reference,
  photo: s.photo,
  declarationAcceptedAt: s.declarationAcceptedAt,
  officeUse: [
    ['Roll No', s.rollNumber],
    ['Batch', s.enrolledBatchName],
    ...(includeFees ? ([['Fee', `₹${s.netFee.toLocaleString('en-IN')} (${PLAN_LABEL[s.paymentPlan]})`]] as [string, string][]) : []),
    ['Declaration accepted', s.declarationAcceptedAt ? formatDate(s.declarationAcceptedAt.slice(0, 10)) : '—']
  ]
});

export const printableFromApplication = (lead: Lead, courses: Course[], batches: Batch[]): PrintableAdmissionForm | null => {
  const a = lead.application;
  if (!a) return null;
  const batch = batches.find(b => b.id === a.preferredBatchId);
  return {
    heading: `${lead.studentName} · ${a.applicationNumber}`,
    date: a.submittedAt.slice(0, 10),
    courseName: courses.find(c => c.id === a.courseId)?.name || lead.targetCourse,
    batchName: batch ? `Preferred: ${batch.name}` : undefined,
    courseDetails: a.courseDetails,
    name: lead.studentName,
    qualification: a.qualification,
    guardianName: a.guardianName,
    occupation: a.occupation,
    dateOfBirth: a.dateOfBirth,
    phone: lead.phone,
    guardianPhone: a.guardianPhone,
    email: lead.email,
    examsAttended: a.examsAttended,
    address: a.address,
    specialCategory: a.specialCategory,
    aim: a.aim,
    reference: a.reference,
    photo: a.photo,
    declarationAcceptedAt: a.declarationAcceptedAt,
    officeUse: [
      ['Application No', a.applicationNumber],
      ['Submitted online', formatDate(a.submittedAt.slice(0, 10))],
      ['Counselor', lead.assignedCounselorName],
      ['Status', lead.status === 'converted' ? 'Admitted' : 'Pending admission']
    ]
  };
};

/** The academy's paper admission form, filled in, ready to print and sign. */
export const AdmissionFormPrint: React.FC<{ form: PrintableAdmissionForm; onClose: () => void }> = ({ form: f, onClose }) => {
  const rows: [string, React.ReactNode][] = [
    ['Course Applied for', f.courseName],
    ['Name of the Student', f.name],
    ['Qualification', f.qualification],
    ['Father/Husband Name', f.guardianName],
    ['Occupation', f.occupation],
    ['Date of Birth', f.dateOfBirth ? formatDate(f.dateOfBirth) : ''],
    ['Contact Number', [f.phone, f.guardianPhone ? `Parent: ${f.guardianPhone}` : ''].filter(Boolean).join('   ')],
    ['e-Mail ID', f.email],
    ['Exams attended Details', f.examsAttended],
    ['Address', f.address],
    ['Special Category', f.specialCategory],
    ['Aim', f.aim],
    ['Reference', f.reference],
    ['Course Details', [f.batchName, f.courseDetails].filter(Boolean).join(' · ')]
  ];

  return (
    <Modal
      title="Admission form"
      subtitle={f.heading}
      onClose={onClose}
      size="xl"
      bodyClassName="p-0 bg-slate-100 dark:bg-slate-950"
      headerActions={
        <button
          onClick={printLight}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-md"
        >
          <Printer className="w-3.5 h-3.5" />
          Print
        </button>
      }
    >
      <div className="p-3 sm:p-6">
        <div className="print-area mx-auto max-w-[760px] bg-white text-slate-900 border-[3px] border-double border-slate-900 p-4 sm:p-6 font-[Arial,sans-serif]">
          {/* Letterhead */}
          <div className="border-2 border-[#1f3a8a] rounded-2xl px-3 py-3 flex items-center gap-3">
            <img src="/vrm-logo.jpg" alt="" className="w-14 h-14 sm:w-20 sm:h-20 rounded-lg object-contain bg-white p-0.5 shrink-0" />
            <div className="flex-1 text-center min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-red-600">{ACADEMY.tagline}</p>
              <img src="/vrm-wordmark.jpg" alt="VRM IAS Academy" className="mt-1 mx-auto h-7 sm:h-11 w-auto max-w-full" />
              <p className="text-[9px] sm:text-[11px] font-bold text-red-700 mt-1">({ACADEMY.gateway})</p>
              <p className="text-[10px] sm:text-sm font-bold text-green-800">({ACADEMY.certification})</p>
              <p className="text-[9px] sm:text-xs text-[#1f3a8a]">{ACADEMY.addressLine}</p>
              <p className="text-[9px] sm:text-xs text-[#1f3a8a]">
                {ACADEMY.phone} | {ACADEMY.website} | E-mail : {ACADEMY.email}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <span className="w-16 sm:w-28" />
            <h2 className="px-4 py-1 border-2 border-[#1f3a8a] bg-blue-50 text-sm sm:text-lg font-black tracking-wide rounded">STUDENT ADMISSION FORM</h2>
            <span className="text-[11px] sm:text-sm font-bold whitespace-nowrap">Date: {formatDate(f.date)}</span>
          </div>

          {/* Fields + photo */}
          <div className="mt-4 relative">
            <div className="absolute right-0 top-0 w-24 h-30 sm:w-32 sm:h-40 rounded-xl border-2 border-[#1f3a8a] overflow-hidden bg-slate-50 flex items-center justify-center">
              {f.photo ? (
                <img src={f.photo} alt="Student" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-slate-400 text-center px-2">Affix passport photo</span>
              )}
            </div>
            <dl className="text-[12px] sm:text-sm">
              {rows.map(([label, value], i) => (
                <div key={label} className={`grid grid-cols-[9.5rem_0.75rem_1fr] sm:grid-cols-[12rem_1rem_1fr] py-1.5 ${i < 6 ? 'pr-28 sm:pr-36' : ''}`}>
                  <dt className="font-bold">{label}</dt>
                  <span className="font-bold">:</span>
                  <dd className="border-b border-dotted border-slate-400 min-h-[1.4em] whitespace-pre-line break-words">{value || ''}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Declaration */}
          <div className="mt-5 text-center">
            <span className="inline-block px-3 py-0.5 border-2 border-[#1f3a8a] bg-blue-50 font-black text-sm rounded">DECLARATION</span>
          </div>
          <ol className="mt-3 space-y-2 text-[11px] sm:text-xs font-semibold uppercase">
            {ADMISSION_DECLARATIONS.map(d => (
              <li key={d}>I, hereby, {d.replace(/^I /, '').replace(/\.$/, '')}.</li>
            ))}
          </ol>

          <div className="mt-12 flex justify-between text-[11px] sm:text-xs font-bold">
            <span className="border-t border-slate-500 pt-1 px-2">PARENT / GUARDIAN SIGN</span>
            <span className="border-t border-slate-500 pt-1 px-2">STUDENT SIGN</span>
          </div>

          {/* Office use */}
          <div className="mt-6 pt-3 border-t-2 border-dashed border-slate-400 text-[10px] sm:text-[11px] text-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {f.officeUse.map(([k, v]) => (
              <span key={k}>
                <b>{k}:</b> {v}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
