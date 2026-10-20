/**
 * VRM's admission form, shared by the admission popup, the public online application page
 * and the "edit form" screen. Same fields and order as the academy's printed form.
 */
import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { AdmissionFormValues, Batch, Course, Lead, Student } from '../../types';
import { resizePhoto } from '../../lib/photo';
import { ADMISSION_DECLARATIONS } from '../../config/academy';

export type { AdmissionFormValues };

export const FIELD =
  'w-full px-3 py-2 text-sm sm:text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500';
export const LBL = 'block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1';

export const firstOpenBatch = (batches: Batch[], courseId: string) => {
  const list = batches.filter(b => b.courseId === courseId);
  return list.find(b => b.enrolledCount < b.maxCapacity) || list[0];
};

export const blankForm = (courseId = '', batchId = ''): AdmissionFormValues => ({
  courseId,
  batchId,
  courseDetails: '',
  studentName: '',
  qualification: '',
  guardianName: '',
  occupation: '',
  dateOfBirth: '',
  phone: '',
  email: '',
  guardianPhone: '',
  specialCategory: '',
  examsAttended: '',
  address: '',
  aim: '',
  reference: '',
  photo: ''
});

/** Pre-fill from a CRM lead; uses the online application's details when there is one. */
export const formFromLead = (lead: Lead, courses: Course[], batches: Batch[]): AdmissionFormValues => {
  const app = lead.application;
  const courseId = app?.courseId || courses.find(c => c.name === lead.targetCourse)?.id || courses[0]?.id || '';
  const preferred = app?.preferredBatchId && batches.find(b => b.id === app.preferredBatchId && b.enrolledCount < b.maxCapacity);
  return {
    ...blankForm(courseId, preferred ? preferred.id : firstOpenBatch(batches, courseId)?.id || ''),
    studentName: lead.studentName,
    phone: lead.phone,
    email: lead.email,
    address: app?.address || lead.location || '',
    courseDetails: app?.courseDetails || '',
    qualification: app?.qualification || '',
    guardianName: app?.guardianName || '',
    occupation: app?.occupation || '',
    dateOfBirth: app?.dateOfBirth || '',
    guardianPhone: app?.guardianPhone || '',
    specialCategory: app?.specialCategory || '',
    examsAttended: app?.examsAttended || '',
    aim: app?.aim || '',
    reference: app?.reference || `${lead.source.replace('_', ' ')} enquiry, counselor ${lead.assignedCounselorName}`,
    photo: app?.photo || ''
  };
};

export const formFromStudent = (s: Student): AdmissionFormValues => ({
  courseId: s.enrolledCourseId,
  batchId: s.enrolledBatchId,
  courseDetails: s.courseDetails || '',
  studentName: s.name,
  qualification: s.qualification || '',
  guardianName: s.guardianName || '',
  occupation: s.occupation || '',
  dateOfBirth: s.dateOfBirth || '',
  phone: s.phone,
  email: s.email,
  guardianPhone: s.guardianPhone && s.guardianPhone !== s.phone ? s.guardianPhone : '',
  specialCategory: s.specialCategory || '',
  examsAttended: s.examsAttended || '',
  address: s.address || '',
  aim: s.aim || '',
  reference: s.reference || '',
  photo: s.photo || ''
});

/** Returns an error message, or '' when the form is complete. */
export const validateAdmissionForm = (v: AdmissionFormValues, opts: { batches?: Batch[]; requireBatch?: boolean } = {}): string => {
  const missing = [
    !v.courseId && 'course applied for',
    !v.studentName.trim() && 'name of the student',
    !v.guardianName.trim() && 'father / husband name',
    !v.dateOfBirth && 'date of birth',
    !v.phone.trim() && 'contact number'
  ].filter(Boolean);
  if (missing.length) return `Please fill in: ${missing.join(', ')}.`;
  if (v.phone.replace(/\D/g, '').length < 10) return 'Enter a valid 10-digit contact number.';
  if (v.email && !/^\S+@\S+\.\S+$/.test(v.email.trim())) return 'Enter a valid e-mail ID, or leave it empty.';
  if (v.dateOfBirth && v.dateOfBirth > new Date().toISOString().slice(0, 10)) return 'Date of birth cannot be in the future.';
  if (opts.requireBatch) {
    const batch = opts.batches?.find(b => b.id === v.batchId);
    if (!batch) return 'This course has no batch to join yet. Create a batch first.';
    if (batch.enrolledCount >= batch.maxCapacity) return `${batch.name} is full. Choose another batch.`;
  }
  return '';
};

interface FieldsProps {
  value: AdmissionFormValues;
  onChange: (patch: Partial<AdmissionFormValues>) => void;
  courses: Course[];
  batches: Batch[];
  /** required: staff assign a batch · preferred: applicant may pick one · locked: course/batch shown read-only */
  batchMode?: 'required' | 'preferred' | 'locked';
}

export const AdmissionFormFields: React.FC<FieldsProps> = ({ value: v, onChange, courses, batches, batchMode = 'required' }) => {
  const [photoError, setPhotoError] = useState('');
  const course = courses.find(c => c.id === v.courseId);
  const courseBatches = batches.filter(b => b.courseId === v.courseId);
  const batch = batches.find(b => b.id === v.batchId);
  const today = new Date().toISOString().slice(0, 10);
  const set = (k: keyof AdmissionFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    onChange({ [k]: e.target.value } as Partial<AdmissionFormValues>);

  return (
    <div className="space-y-6">
      {/* Course applied for */}
      <section className="space-y-3">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Course applied for</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={LBL}>Course applied for *</label>
            <select
              value={v.courseId}
              disabled={batchMode === 'locked'}
              onChange={e => {
                const courseId = e.target.value;
                onChange({ courseId, batchId: batchMode === 'preferred' ? '' : firstOpenBatch(batches, courseId)?.id || '' });
              }}
              className={FIELD}
            >
              {!v.courseId && <option value="">Select a course</option>}
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} (₹{c.totalFee.toLocaleString('en-IN')})
                </option>
              ))}
            </select>
            {course && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {course.durationMonths} months · {course.category}
              </p>
            )}
          </div>
          <div>
            <label className={LBL}>{batchMode === 'preferred' ? 'Preferred batch' : 'Batch *'}</label>
            <select value={v.batchId} disabled={batchMode === 'locked'} onChange={set('batchId')} className={FIELD}>
              {batchMode === 'preferred' && <option value="">Any batch / decide later</option>}
              {courseBatches.length === 0 && batchMode !== 'preferred' && <option value="">No batch for this course yet</option>}
              {courseBatches.map(b => {
                const full = b.enrolledCount >= b.maxCapacity;
                return (
                  <option key={b.id} value={b.id} disabled={full && batchMode !== 'locked'}>
                    {full ? '[FULL] ' : ''}
                    {b.name} ({b.timing})
                  </option>
                );
              })}
            </select>
            {batch && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {batch.days} · {batch.room}
                {batchMode === 'required' && ` · ${batch.enrolledCount}/${batch.maxCapacity} seats filled`}
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className={LBL}>Course details</label>
            <input value={v.courseDetails} onChange={set('courseDetails')} className={FIELD} placeholder="e.g. Classroom, morning batch, Prelims + Mains" />
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
              <input value={v.studentName} onChange={set('studentName')} className={FIELD} placeholder="As in certificates" autoComplete="name" />
            </div>
            <div>
              <label className={LBL}>Qualification</label>
              <input value={v.qualification} onChange={set('qualification')} className={FIELD} placeholder="e.g. B.Sc Mathematics" list="qual-options" />
              <datalist id="qual-options">
                {['10th', '12th', 'Diploma', 'B.A.', 'B.Sc', 'B.Com', 'B.E. / B.Tech', 'M.A.', 'M.Sc', 'M.B.A.', 'Ph.D'].map(q => (
                  <option key={q} value={q} />
                ))}
              </datalist>
            </div>
            <div>
              <label className={LBL}>Father / Husband name *</label>
              <input value={v.guardianName} onChange={set('guardianName')} className={FIELD} aria-label="Father / Husband name" />
            </div>
            <div>
              <label className={LBL}>Occupation</label>
              <input value={v.occupation} onChange={set('occupation')} className={FIELD} placeholder="e.g. Student, Farmer, Teacher" />
            </div>
            <div>
              <label className={LBL}>Date of birth *</label>
              <input type="date" value={v.dateOfBirth} max={today} onChange={set('dateOfBirth')} className={FIELD} />
            </div>
          </div>

          <div className="sm:w-36 shrink-0">
            <label className={LBL}>Photo</label>
            <label className="block w-32 h-40 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 overflow-hidden cursor-pointer hover:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500">
              {v.photo ? (
                <img src={v.photo} alt="Student photo" className="w-full h-full object-cover" />
              ) : (
                <span className="h-full flex flex-col items-center justify-center text-center text-[11px] text-slate-500 px-2">
                  <Camera className="w-5 h-5 mb-1" />
                  Add passport photo
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={async e => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    onChange({ photo: await resizePhoto(f) });
                    setPhotoError('');
                  } catch (err) {
                    setPhotoError(err instanceof Error ? err.message : 'Could not use this image.');
                  }
                }}
              />
            </label>
            {v.photo && (
              <button type="button" onClick={() => onChange({ photo: '' })} className="mt-1 text-[11px] text-rose-600 hover:underline">
                Remove photo
              </button>
            )}
            {photoError && <p className="mt-1 text-[11px] text-rose-600">{photoError}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={LBL}>Contact number *</label>
            <input type="tel" inputMode="tel" value={v.phone} onChange={set('phone')} className={FIELD} placeholder="+91 9XXXX XXXXX" autoComplete="tel" />
          </div>
          <div>
            <label className={LBL}>e-Mail ID</label>
            <input type="email" value={v.email} onChange={set('email')} className={FIELD} placeholder="name@gmail.com" autoComplete="email" />
          </div>
          <div>
            <label className={LBL}>Parent / guardian phone</label>
            <input type="tel" inputMode="tel" value={v.guardianPhone} onChange={set('guardianPhone')} className={FIELD} placeholder="For attendance and fee alerts" />
          </div>
          <div>
            <label className={LBL}>Special category</label>
            <input value={v.specialCategory} onChange={set('specialCategory')} className={FIELD} placeholder="None" list="cat-options" />
            <datalist id="cat-options">
              {['None', 'Person with disability', 'Ex-serviceman', 'Destitute widow', 'First graduate', 'Sports person'].map(c => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="md:col-span-2">
            <label className={LBL}>Exams attended details</label>
            <textarea rows={2} value={v.examsAttended} onChange={set('examsAttended')} className={FIELD} placeholder="e.g. TNPSC Group 4 (2024), cleared prelims; UPSC CSE 2025 prelims" />
          </div>
          <div className="md:col-span-2">
            <label className={LBL}>Address</label>
            <textarea rows={2} value={v.address} onChange={set('address')} className={FIELD} placeholder="Door no, street, town, district, PIN" autoComplete="street-address" />
          </div>
          <div>
            <label className={LBL}>Aim</label>
            <input value={v.aim} onChange={set('aim')} className={FIELD} placeholder="e.g. IAS, Deputy Collector, SI of Police" />
          </div>
          <div>
            <label className={LBL}>Reference</label>
            <input value={v.reference} onChange={set('reference')} className={FIELD} placeholder="Who referred / how they heard of us" />
          </div>
        </div>
      </section>
    </div>
  );
};

export const useDeclarations = () => {
  const [checked, setChecked] = useState<boolean[]>(ADMISSION_DECLARATIONS.map(() => false));
  const [agreed, setAgreed] = useState(false);
  return { checked, setChecked, agreed, setAgreed, complete: checked.every(Boolean) && agreed };
};

export const DeclarationChecklist: React.FC<{
  checked: boolean[];
  agreed: boolean;
  onChange: (checked: boolean[], agreed: boolean) => void;
  agreeLabel?: string;
}> = ({ checked, agreed, onChange, agreeLabel = 'The student and parent/guardian have read and agreed to the above. They will sign the printed form.' }) => (
  <section className="space-y-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Declaration *</h4>
    {ADMISSION_DECLARATIONS.map((d, i) => (
      <label key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
        <input
          type="checkbox"
          checked={checked[i]}
          onChange={e => onChange(checked.map((c, j) => (j === i ? e.target.checked : c)), agreed)}
          className="mt-0.5 w-4 h-4 accent-amber-600 shrink-0"
        />
        <span>{d}</span>
      </label>
    ))}
    <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-2 border-t border-slate-200 dark:border-slate-700">
      <input type="checkbox" checked={agreed} onChange={e => onChange(checked, e.target.checked)} className="mt-0.5 w-4 h-4 accent-amber-600 shrink-0" />
      <span>{agreeLabel}</span>
    </label>
  </section>
);
