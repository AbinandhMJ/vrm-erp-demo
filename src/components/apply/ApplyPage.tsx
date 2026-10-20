import React, { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ACADEMY } from '../../config/academy';
import { AdmissionFormValues, Lead } from '../../types';
import { AdmissionFormFields, DeclarationChecklist, blankForm, useDeclarations, validateAdmissionForm } from '../admissions/AdmissionFormFields';
import { AdmissionFormPrint, printableFromApplication } from '../admissions/AdmissionFormPrint';

/** Public admission form (no login). Opened at /#/apply, e.g. from the academy website. */
export const ApplyPage: React.FC = () => {
  const { courses, batches, submitOnlineApplication, theme } = useApp();
  const [form, setForm] = useState<AdmissionFormValues>(() => blankForm(''));
  const decl = useDeclarations();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ lead: Lead; applicationNumber: string } | null>(null);
  const [showPrint, setShowPrint] = useState(false);

  const patch = (p: Partial<AdmissionFormValues>) => {
    setForm(f => ({ ...f, ...p }));
    setError('');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateAdmissionForm(form);
    if (err) return setError(err);
    if (!decl.complete) return setError('Please tick all the declarations.');
    setBusy(true);
    setTimeout(() => {
      const res = submitOnlineApplication(form);
      setBusy(false);
      setDone({ lead: res.lead, applicationNumber: res.applicationNumber });
      document.getElementById('apply-top')?.scrollIntoView();
    }, 400);
  };

  const printable = done ? printableFromApplication(done.lead, courses, batches) : null;

  return (
    <div className={`min-h-[100dvh] bg-[#f6f7f9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 ${theme === 'dark' ? 'dark' : ''}`}>
      <header id="apply-top" className="bg-[#14213d] text-white">
        <div className="max-w-3xl mx-auto px-5 py-6 flex items-center gap-4">
          <img src="/vrm-logo.jpg" alt="" className="w-14 h-14 rounded-lg object-contain bg-white p-0.5 ring-2 ring-[#e09f3e]/60 shrink-0" />
          <div className="min-w-0">
            <p className="text-xl font-extrabold tracking-tight">{ACADEMY.name}</p>
            <p className="text-sm text-slate-300">{ACADEMY.addressLine}</p>
            <p className="text-sm text-slate-300">
              {ACADEMY.phone} · {ACADEMY.email}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-5 py-8">
        {done ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Application received</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Your application number is <b className="font-mono text-slate-900 dark:text-white">{done.applicationNumber}</b>. Keep it for reference.
              </p>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
              <li>
                {done.lead.assignedCounselorName} from our admissions team will call you on {done.lead.phone} within one working day.
              </li>
              <li>Visit the academy with your certificates, two passport photos and a parent or guardian.</li>
              <li>Pay the admission advance. You will get your roll number and student portal login the same day.</li>
            </ol>
            <div className="flex flex-wrap gap-2 pt-2">
              {printable && (
                <button onClick={() => setShowPrint(true)} className="px-4 py-2 text-sm font-bold rounded-lg bg-[#14213d] text-white hover:bg-[#1d2f55]">
                  View / print my application
                </button>
              )}
              <button
                onClick={() => {
                  setDone(null);
                  setForm(blankForm(''));
                  decl.setChecked(decl.checked.map(() => false));
                  decl.setAgreed(false);
                }}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Submit another application
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Student admission form</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-prose">
                Apply online for any of our courses. Our admissions team will call you to confirm your batch and fees. Fields marked * are required.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6">
              <AdmissionFormFields value={form} onChange={patch} courses={courses} batches={batches} batchMode="preferred" />
            </div>

            <DeclarationChecklist
              checked={decl.checked}
              agreed={decl.agreed}
              agreeLabel="My parent / guardian and I have read and agree to the above. We will sign the printed form at admission."
              onChange={(c, a) => {
                decl.setChecked(c);
                decl.setAgreed(a);
                setError('');
              }}
            />

            {error && (
              <p role="alert" className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-sm text-rose-700 dark:text-rose-300">
                {error}
              </p>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                type="submit"
                disabled={busy}
                className="h-11 px-6 rounded-lg bg-[#14213d] dark:bg-[#e09f3e] text-white dark:text-slate-950 text-sm font-bold hover:bg-[#1d2f55] disabled:opacity-70 inline-flex items-center justify-center gap-2"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit application
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400">Demo: applications are saved in this browser and appear in the academy's CRM.</p>
            </div>
          </form>
        )}
        <p className="mt-10 text-center text-xs text-slate-400">
          <a href="#/" className="underline underline-offset-2 hover:text-slate-600">
            Staff and student sign in
          </a>
        </p>
      </main>

      {showPrint && printable && <AdmissionFormPrint form={printable} onClose={() => setShowPrint(false)} />}
    </div>
  );
};
