import React, { useMemo, useState } from 'react';
import { Copy, ExternalLink, FileText, Pencil, Search, UserPlus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdmissionFormValues, Lead, Student } from '../../types';
import { formatDate } from '../../lib/dates';
import { Modal } from '../common/Modal';
import { AdmissionFormFields, formFromStudent, validateAdmissionForm } from './AdmissionFormFields';
import { AdmissionFormPrint, PrintableAdmissionForm, printableFromApplication, printableFromStudent } from './AdmissionFormPrint';

// Details the office should complete on every form (photo is tracked separately).
const OPTIONAL_FIELDS: [keyof Student, string][] = [
  ['dateOfBirth', 'date of birth'],
  ['qualification', 'qualification'],
  ['guardianName', 'father/husband name'],
  ['address', 'address'],
  ['aim', 'aim']
];

const missingFor = (s: Student) => OPTIONAL_FIELDS.filter(([k]) => !s[k]).map(([, label]) => label);

/** Every admission form in one place: online applications waiting for admission, and admitted students' forms. */
export const AdmissionForms: React.FC = () => {
  const { leads, students, courses, batches, openModal, updateStudentForm, today } = useApp();
  const [view, setView] = useState<'applications' | 'students'>('applications');
  const [query, setQuery] = useState('');
  const [appFilter, setAppFilter] = useState<'pending' | 'admitted' | 'all'>('pending');
  const [printing, setPrinting] = useState<PrintableAdmissionForm | null>(null);
  const [editing, setEditing] = useState<Student | null>(null);
  const [editValues, setEditValues] = useState<AdmissionFormValues | null>(null);
  const [editError, setEditError] = useState('');
  const [copied, setCopied] = useState(false);
  const [shown, setShown] = useState(40);

  const applyUrl = `${window.location.origin}${window.location.pathname}#/apply`;
  const applications = useMemo(
    () => leads.filter(l => l.application).sort((a, b) => b.application!.submittedAt.localeCompare(a.application!.submittedAt)),
    [leads]
  );
  const pending = applications.filter(l => l.status !== 'converted' && l.status !== 'dropped');
  const thisMonth = applications.filter(l => l.application!.submittedAt.slice(0, 7) === today.slice(0, 7)).length;
  const admittedOnline = applications.filter(l => l.status === 'converted').length;
  const incomplete = students.filter(s => missingFor(s).length > 0).length;

  const q = query.trim().toLowerCase();
  const matchLead = (l: Lead) =>
    !q || l.studentName.toLowerCase().includes(q) || l.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')) || l.application!.applicationNumber.toLowerCase().includes(q);
  const matchStudent = (s: Student) =>
    !q || s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q) || s.phone.replace(/\s/g, '').includes(q.replace(/\s/g, ''));

  const appRows = applications
    .filter(l => (appFilter === 'all' ? true : appFilter === 'pending' ? l.status !== 'converted' && l.status !== 'dropped' : l.status === 'converted'))
    .filter(matchLead);
  const studentRows = [...students].sort((a, b) => b.admissionDate.localeCompare(a.admissionDate)).filter(matchStudent);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(applyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy the online admission form link:', applyUrl);
    }
  };

  const startEdit = (s: Student) => {
    setEditing(s);
    setEditValues(formFromStudent(s));
    setEditError('');
  };
  const saveEdit = () => {
    if (!editing || !editValues) return;
    const err = validateAdmissionForm(editValues);
    if (err) return setEditError(err);
    updateStudentForm(editing.id, editValues);
    setEditing(null);
  };

  const kpi = 'p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl';
  const tabBtn = (active: boolean) =>
    `px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap ${
      active ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
    }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Admission Forms</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Online applications and every admitted student's form. View, print or correct details.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={copyLink} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800">
            <Copy className="w-3.5 h-3.5" />
            {copied ? 'Link copied' : 'Copy online form link'}
          </button>
          <a href="#/apply" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800">
            <ExternalLink className="w-3.5 h-3.5" />
            Open online form
          </a>
          <button onClick={() => openModal('admission')} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-white bg-amber-600 hover:bg-amber-500">
            <UserPlus className="w-3.5 h-3.5" />
            New admission
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={kpi}>
          <span className="text-xs text-slate-500 dark:text-slate-400">Applications to process</span>
          <div className="text-2xl font-mono font-bold text-amber-700 dark:text-amber-400 mt-1">{pending.length}</div>
        </div>
        <div className={kpi}>
          <span className="text-xs text-slate-500 dark:text-slate-400">Received this month</span>
          <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white mt-1">{thisMonth}</div>
        </div>
        <div className={kpi}>
          <span className="text-xs text-slate-500 dark:text-slate-400">Admitted from online form</span>
          <div className="text-2xl font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-1">{admittedOnline}</div>
        </div>
        <div className={kpi}>
          <span className="text-xs text-slate-500 dark:text-slate-400">Student forms missing details</span>
          <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white mt-1">{incomplete}</div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
          <button className={tabBtn(view === 'applications')} onClick={() => setView('applications')}>
            Online applications ({applications.length})
          </button>
          <button className={tabBtn(view === 'students')} onClick={() => setView('students')}>
            Admitted students ({students.length})
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 md:max-w-lg w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={view === 'applications' ? 'Search name, phone, application no' : 'Search name, phone, roll no'}
              className="w-full pl-9 pr-3 py-1.5 text-sm sm:text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          {view === 'applications' && (
            <select
              value={appFilter}
              onChange={e => setAppFilter(e.target.value as typeof appFilter)}
              className="px-2.5 py-1.5 text-sm sm:text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="pending">To process</option>
              <option value="admitted">Admitted</option>
              <option value="all">All</option>
            </select>
          )}
        </div>
      </div>

      {view === 'applications' ? (
        appRows.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-500">
            {applications.length === 0 ? (
              <>
                No online applications yet. Share the online form link with applicants or put it on the academy website.
              </>
            ) : (
              'No applications match.'
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {appRows.map(l => {
              const a = l.application!;
              const course = courses.find(c => c.id === a.courseId);
              const isOpen = l.status !== 'converted' && l.status !== 'dropped';
              return (
                <div key={l.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex gap-3">
                  <div className="w-12 h-15 shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-lg font-bold">
                    {a.photo ? <img src={a.photo} alt="" className="w-full h-full object-cover" /> : l.studentName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">{l.studentName}</span>
                      <span className="font-mono text-[11px] text-slate-500">{a.applicationNumber}</span>
                      <span
                        className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                          l.status === 'converted'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : l.status === 'dropped'
                              ? 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                              : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}
                      >
                        {l.status === 'converted' ? 'Admitted' : l.status === 'dropped' ? 'Dropped' : 'To process'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{course?.name || l.targetCourse}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {l.phone} · Submitted {formatDate(a.submittedAt.slice(0, 10))} · Counselor {l.assignedCounselorName}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() => setPrinting(printableFromApplication(l, courses, batches))}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        <FileText className="w-3 h-3" /> View / print
                      </button>
                      {isOpen && (
                        <button
                          onClick={() => openModal('admission', { lead: l })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md text-white bg-amber-600 hover:bg-amber-500"
                        >
                          Admit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : studentRows.length === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-500">
          {students.length === 0 ? 'No students admitted yet.' : 'No students match.'}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Course & batch</th>
                  <th className="px-4 py-3">Admitted</th>
                  <th className="px-4 py-3">Form</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {studentRows.slice(0, shown).map(s => {
                  const missing = missingFor(s);
                  return (
                    <tr key={s.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-10 rounded overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center text-slate-400 font-bold">
                            {s.photo ? <img src={s.photo} alt="" className="w-full h-full object-cover" /> : s.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">{s.name}</div>
                            <div className="font-mono text-[11px] text-slate-500">{s.rollNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        <div className="max-w-xs truncate">{s.enrolledCourseName}</div>
                        <div className="text-[11px]">{s.enrolledBatchName}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">{formatDate(s.admissionDate)}</td>
                      <td className="px-4 py-3">
                        {missing.length === 0 ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                            Complete{!s.photo && <span className="font-normal text-slate-400"> · no photo</span>}
                          </span>
                        ) : (
                          <span className="text-amber-700 dark:text-amber-400" title={`Missing: ${missing.join(', ')}`}>
                            Missing {missing.slice(0, 2).join(', ')}
                            {missing.length > 2 ? ` +${missing.length - 2}` : ''}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => setPrinting(printableFromStudent(s))}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <FileText className="w-3 h-3" /> View / print
                        </button>
                        <button
                          onClick={() => startEdit(s)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {studentRows.length > shown && (
            <div className="p-3 text-center border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setShown(n => n + 40)} className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline">
                Show more ({studentRows.length - shown} remaining)
              </button>
            </div>
          )}
        </div>
      )}

      {printing && <AdmissionFormPrint form={printing} onClose={() => setPrinting(null)} />}

      {editing && editValues && (
        <Modal
          title="Edit admission form"
          subtitle={`${editing.name} · ${editing.rollNumber}`}
          onClose={() => setEditing(null)}
          size="xl"
          bodyClassName="px-5 py-4"
          footer={
            <div className="flex flex-wrap items-center justify-end gap-2">
              {editError && <span className="mr-auto text-xs text-rose-600">{editError}</span>}
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                Cancel
              </button>
              <button onClick={saveEdit} className="px-4 py-2 text-xs font-bold rounded-lg text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500">
                Save changes
              </button>
            </div>
          }
        >
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
            Course and batch can't be changed here. The student's login username stays the same.
          </p>
          <AdmissionFormFields
            value={editValues}
            onChange={p => {
              setEditValues(v => (v ? { ...v, ...p } : v));
              setEditError('');
            }}
            courses={courses}
            batches={batches}
            batchMode="locked"
          />
        </Modal>
      )}
    </div>
  );
};
