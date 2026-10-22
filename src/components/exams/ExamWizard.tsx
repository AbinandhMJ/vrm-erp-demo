import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { FIELD, LBL } from '../admissions/AdmissionFormFields';
import { AssessmentTest, Question } from '../../types';
import { examWindow, examStatus, fmtDateTime, toLocalInput, totalMarksOf } from '../../lib/exams';
import { QuestionPicker } from './QuestionPicker';
import { QuestionEditorModal, QuestionDraft, blankQuestion } from './QuestionEditorModal';
import { QuestionImportModal } from '../academics/QuestionImportModal';
import { ArrowUp, ArrowDown, Trash2, Pencil, Plus, Library, FileUp, Check, AlertTriangle } from 'lucide-react';

const STEPS = ['Details', 'Questions', 'Schedule & rules', 'Review'] as const;
const CATEGORIES: AssessmentTest['category'][] = ['Prelims Mock', 'Subject Drill', 'Mains Practice'];

const roundUp = (d: Date, mins = 15) => new Date(Math.ceil(d.getTime() / (mins * 60_000)) * mins * 60_000);

/** Create or edit an exam in four steps: details → questions → schedule → review. */
export const ExamWizard: React.FC<{
  exam?: AssessmentTest | null;
  startStep?: number;
  initialQuestions?: Question[];
  onClose: () => void;
  onSaved: (exam: AssessmentTest, action: 'draft' | 'scheduled' | 'started') => void;
}> = ({ exam, startStep = 0, initialQuestions, onClose, onSaved }) => {
  const { batches, assessmentTests, studentAttempts, questionBank, currentStaff, currentUser, role, schedule, saveExam, addQuestionToBank, updateQuestionInBank, startExamNow } = useApp();
  const hasAttempts = !!exam && studentAttempts.some(a => a.testId === exam.id);
  const myBatchIds = role === 'faculty' ? new Set(schedule.filter(s => s.facultyName === currentUser.name).map(s => s.batchId)) : null;

  const defaultStart = roundUp(new Date(Date.now() + 24 * 3600_000));
  defaultStart.setHours(10, 0, 0, 0);
  const [step, setStep] = useState(startStep);
  const [f, setF] = useState({
    title: exam?.title || '',
    code: exam?.code || `VRM-T-${String(assessmentTests.length + 1).padStart(3, '0')}`,
    subject: exam?.subject || currentStaff?.subjectsHandling?.[0] || 'General Studies',
    category: exam?.category || ('Subject Drill' as AssessmentTest['category']),
    mode: exam?.mode || ('online' as 'online' | 'offline'),
    batchIds: exam?.batchIds || (myBatchIds ? [...myBatchIds] : []),
    instructions: exam?.instructions || 'Each question has one correct answer. Wrong answers carry negative marks.',
    questions: exam?.questions || initialQuestions || ([] as Question[]),
    offlineTotal: String(exam?.mode === 'offline' && !exam.questions.length ? exam.totalMarks : 100),
    startAt: exam?.startAt || toLocalInput(defaultStart),
    endAt: exam?.endAt || toLocalInput(new Date(defaultStart.getTime() + 2 * 3600_000)),
    durationMinutes: String(exam?.durationMinutes || 60),
    negativeMarksPerWrong: String(exam?.negativeMarksPerWrong ?? 0.66),
    shuffleQuestions: exam?.shuffleQuestions ?? true,
    resultRelease: exam?.resultRelease || ('immediate' as NonNullable<AssessmentTest['resultRelease']>),
    passPercent: String(exam?.passPercent ?? 40)
  });
  const set = (patch: Partial<typeof f>) => setF(prev => ({ ...prev, ...patch }));
  const [error, setError] = useState('');
  const [picker, setPicker] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editing, setEditing] = useState<QuestionDraft | null>(null);

  const subjects = useMemo(() => [...new Set([...questionBank.map(q => q.subject), ...schedule.map(s => s.subject)])].sort(), [questionBank, schedule]);
  const marks = f.questions.length ? totalMarksOf(f.questions) : Number(f.offlineTotal) || 0;
  const start = new Date(f.startAt);
  const end = new Date(f.endAt);
  const windowMin = Math.round((end.getTime() - start.getTime()) / 60000);

  // Other exams for the same batches whose windows overlap.
  const clashes = assessmentTests.filter(t => {
    if (t.id === exam?.id || t.status === 'draft' || !t.batchIds.some(b => f.batchIds.includes(b))) return false;
    const w = examWindow(t);
    return w.start < end && start < w.end;
  });

  const validate = (upTo: number): string => {
    if (upTo >= 0) {
      if (!f.title.trim()) return 'Give the exam a name.';
      if (f.batchIds.length === 0) return 'Choose at least one batch.';
    }
    if (upTo >= 1) {
      if (f.mode === 'online' && f.questions.length === 0) return 'Add at least one question (new, from the bank, or import a file).';
      if (f.mode === 'offline' && !f.questions.length && !(Number(f.offlineTotal) > 0)) return 'Enter the total marks for the written exam.';
    }
    if (upTo >= 2) {
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Choose the start and end time.';
      if (end <= start) return 'The exam must end after it starts.';
      if (f.mode === 'online' && !(Number(f.durationMinutes) > 0)) return 'Enter the exam duration.';
    }
    return '';
  };

  const next = () => {
    const e = validate(step);
    if (e) return setError(e);
    setError('');
    setStep(s => Math.min(STEPS.length - 1, s + 1));
  };

  const build = (status: 'draft' | 'published') => ({
    id: exam?.id,
    title: f.title.trim(),
    code: f.code.trim() || `VRM-T-${Date.now().toString(36).toUpperCase()}`,
    subject: f.subject.trim() || 'General Studies',
    category: f.category,
    mode: f.mode,
    batchIds: f.batchIds,
    instructions: f.instructions.trim(),
    questions: f.questions,
    totalMarks: Number(f.offlineTotal) || 0,
    durationMinutes: Number(f.durationMinutes) || Math.max(10, windowMin),
    negativeMarksPerWrong: Number(f.negativeMarksPerWrong) || 0,
    startAt: f.startAt,
    endAt: f.endAt,
    shuffleQuestions: f.shuffleQuestions,
    resultRelease: f.mode === 'offline' ? ('manual' as const) : f.resultRelease,
    resultsPublished: exam?.resultsPublished || false,
    passPercent: Number(f.passPercent) || undefined,
    status
  });

  const finish = (action: 'draft' | 'scheduled' | 'started') => {
    if (action !== 'draft') {
      const e = validate(2);
      if (e) return setError(e);
    } else if (!f.title.trim()) return setError('Give the exam a name first.');
    const saved = saveExam(build(action === 'draft' ? 'draft' : 'published'));
    if (action === 'started') startExamNow(saved.id);
    onSaved(saved, action);
  };

  const addQuestions = (qs: Question[]) => {
    const have = new Set(f.questions.map(q => q.id));
    set({ questions: [...f.questions, ...qs.filter(q => !have.has(q.id))] });
  };
  const move = (i: number, d: -1 | 1) => {
    const qs = f.questions.slice();
    const j = i + d;
    if (j < 0 || j >= qs.length) return;
    [qs[i], qs[j]] = [qs[j], qs[i]];
    set({ questions: qs });
  };

  const live = exam && examStatus(exam, new Date()) === 'live';

  return (
    <>
      <Modal
        title={exam ? `Edit exam: ${exam.title}` : 'Schedule a new exam'}
        subtitle={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}
        onClose={onClose}
        size="xl"
        footer={
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <button onClick={() => finish('draft')} className="self-start px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:underline">
              Save as draft
            </button>
            <div className="flex justify-end gap-2">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)} className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg">
                  Back
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button onClick={next} className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-amber-600 rounded-lg">
                  Next: {STEPS[step + 1]}
                </button>
              ) : (
                <>
                  {!live && (
                    <button onClick={() => finish('started')} className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg">
                      Start now
                    </button>
                  )}
                  <button onClick={() => finish('scheduled')} className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg">
                    {exam?.status === 'published' ? 'Save changes' : 'Schedule exam'}
                  </button>
                </>
              )}
            </div>
          </div>
        }
      >
        <ol className="flex gap-1 mb-4" aria-label="Steps">
          {STEPS.map((s, i) => (
            <li key={s} className="flex-1">
              <button
                type="button"
                onClick={() => (i <= step || !validate(i - 1)) && setStep(i)}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] font-semibold border ${
                  i === step ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200' : i < step ? 'border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                {i < step && <Check className="inline w-3 h-3 mr-0.5" />}
                {i + 1}. {s}
              </button>
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className={LBL}>Exam name *</label>
                <input className={FIELD} value={f.title} onChange={e => set({ title: e.target.value })} placeholder="e.g. Polity Weekly Test 05: Parliament" />
              </div>
              <div>
                <label className={LBL}>Exam code</label>
                <input className={`${FIELD} font-mono`} value={f.code} onChange={e => set({ code: e.target.value })} />
              </div>
              <div>
                <label className={LBL}>Subject</label>
                <input className={FIELD} list="wiz-subjects" value={f.subject} onChange={e => set({ subject: e.target.value })} />
                <datalist id="wiz-subjects">
                  {subjects.map(s => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className={LBL}>Type</label>
                <select className={FIELD} value={f.category} onChange={e => set({ category: e.target.value as AssessmentTest['category'] })}>
                  {CATEGORIES.map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LBL}>How students write it</label>
                <select className={FIELD} value={f.mode} onChange={e => set({ mode: e.target.value as 'online' | 'offline' })} disabled={hasAttempts}>
                  <option value="online">Online in the app (auto-marked)</option>
                  <option value="offline">Written in class (staff enter marks)</option>
                </select>
              </div>
            </div>
            <div>
              <label className={LBL}>Batches taking this exam *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                {batches.map(b => (
                  <label key={b.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <input type="checkbox" checked={f.batchIds.includes(b.id)} onChange={e => set({ batchIds: e.target.checked ? [...f.batchIds, b.id] : f.batchIds.filter(x => x !== b.id) })} />
                    {b.name}
                    {myBatchIds?.has(b.id) && <span className="text-[10px] text-emerald-600">your batch</span>}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={LBL}>Instructions for students</label>
              <textarea rows={2} className={FIELD} value={f.instructions} onChange={e => set({ instructions: e.target.value })} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            {hasAttempts && (
              <p className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Students have already taken this exam, so its questions can't change. Duplicate the exam to make a new version.
              </p>
            )}
            {f.mode === 'offline' && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <p>For a written exam, questions are optional: add them to print the question paper and answer key, or just enter the total marks.</p>
                {f.questions.length === 0 && (
                  <div className="max-w-[200px]">
                    <label className={LBL}>Total marks *</label>
                    <input type="number" min={1} className={FIELD} value={f.offlineTotal} onChange={e => set({ offlineTotal: e.target.value })} />
                  </div>
                )}
              </div>
            )}
            {!hasAttempts && (
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setEditing(blankQuestion(f.subject, currentUser.name))} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-amber-600 rounded-lg">
                  <Plus className="w-3.5 h-3.5" /> New question
                </button>
                <button onClick={() => setPicker(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg">
                  <Library className="w-3.5 h-3.5" /> From question bank
                </button>
                <button onClick={() => setImporting(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg">
                  <FileUp className="w-3.5 h-3.5" /> Import Excel / Word / PDF / photo
                </button>
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span>
                <b>{f.questions.length}</b> questions · <b>{marks}</b> marks
              </span>
              {f.questions.length > 1 && !hasAttempts && <span className="text-slate-400">Use the arrows to change the order</span>}
            </div>
            <div className="space-y-1.5" data-wizard-questions>
              {f.questions.map((q, i) => (
                <div key={q.id} className="flex items-start gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="font-mono text-slate-400 w-6 shrink-0">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-900 dark:text-white line-clamp-2">{q.questionText}</div>
                    <div className="text-[11px] text-slate-500">
                      {q.subject} · {q.difficulty} · +{q.marks}/−{q.negativeMarks} · Answer {String.fromCharCode(65 + q.correctOptionIndex)}
                    </div>
                  </div>
                  {!hasAttempts && (
                    <div className="flex shrink-0">
                      <button onClick={() => move(i, -1)} aria-label="Move up" className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => move(i, 1)} aria-label="Move down" className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditing(q)} aria-label="Edit question" className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => set({ questions: f.questions.filter(x => x.id !== q.id) })} aria-label="Remove from exam" className="p-1 text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={LBL}>{f.mode === 'online' ? 'Opens at' : 'Exam starts'}</label>
                <input type="datetime-local" className={FIELD} value={f.startAt} onChange={e => set({ startAt: e.target.value })} />
              </div>
              <div>
                <label className={LBL}>{f.mode === 'online' ? 'Closes at (last time to start)' : 'Exam ends'}</label>
                <input type="datetime-local" className={FIELD} value={f.endAt} min={f.startAt} onChange={e => set({ endAt: e.target.value })} />
              </div>
              {f.mode === 'online' && (
                <>
                  <div>
                    <label className={LBL}>Time allowed per student (minutes)</label>
                    <input type="number" min={5} className={FIELD} value={f.durationMinutes} onChange={e => set({ durationMinutes: e.target.value })} />
                  </div>
                  <div>
                    <label className={LBL}>Negative marks per wrong answer (default)</label>
                    <input type="number" step="0.01" min={0} className={FIELD} value={f.negativeMarksPerWrong} onChange={e => set({ negativeMarksPerWrong: e.target.value })} />
                  </div>
                </>
              )}
              <div>
                <label className={LBL}>Pass mark (%)</label>
                <input type="number" min={0} max={100} className={FIELD} value={f.passPercent} onChange={e => set({ passPercent: e.target.value })} />
              </div>
            </div>
            {f.mode === 'online' && windowMin > 0 && windowMin < Number(f.durationMinutes) && (
              <p className="text-xs text-amber-700 dark:text-amber-400">The window ({windowMin} min) is shorter than the time allowed: students who start late get less time.</p>
            )}
            <div className="flex flex-wrap gap-1.5 text-xs">
              {[
                ['Tomorrow 10 AM', 1, 10],
                ['Today 6 PM', 0, 18],
                ['This Sunday 10 AM', -1, 10]
              ].map(([label, d, h]) => (
                <button
                  key={String(label)}
                  type="button"
                  onClick={() => {
                    const s = new Date();
                    if (d === -1) s.setDate(s.getDate() + ((7 - s.getDay()) % 7 || 7));
                    else s.setDate(s.getDate() + Number(d));
                    s.setHours(Number(h), 0, 0, 0);
                    const dur = Number(f.durationMinutes) || 60;
                    set({ startAt: toLocalInput(s), endAt: toLocalInput(new Date(s.getTime() + (dur + 30) * 60_000)) });
                  }}
                  className="px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                >
                  {label}
                </button>
              ))}
            </div>
            {f.mode === 'online' && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <input type="checkbox" checked={f.shuffleQuestions} onChange={e => set({ shuffleQuestions: e.target.checked })} /> Shuffle question order for each student
                </label>
                <div>
                  <label className={LBL}>When students see their results</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {(
                      [
                        ['immediate', 'Right after submitting'],
                        ['after_close', 'After the exam closes'],
                        ['manual', 'When I publish them']
                      ] as const
                    ).map(([v, label]) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => set({ resultRelease: v })}
                        className={`p-2 rounded-lg border font-semibold ${
                          f.resultRelease === v ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {clashes.length > 0 && (
              <p className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-900 dark:text-amber-200">
                <AlertTriangle className="inline w-3.5 h-3.5 mr-1" />
                Same time as {clashes.map(c => `“${c.title}”`).join(', ')} for one of these batches.
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 text-xs" data-wizard-review>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              {[
                ['Questions', f.questions.length || '—'],
                ['Total marks', marks],
                [f.mode === 'online' ? 'Time allowed' : 'Mode', f.mode === 'online' ? `${f.durationMinutes} min` : 'Written'],
                ['Students', batches.filter(b => f.batchIds.includes(b.id)).reduce((s, b) => s + b.enrolledCount, 0)]
              ].map(([k, v]) => (
                <div key={String(k)} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <div className="text-[10px] text-slate-500">{k}</div>
                  <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">{v}</div>
                </div>
              ))}
            </div>
            <dl className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                ['Exam', `${f.title} (${f.code})`],
                ['Subject / type', `${f.subject} · ${f.category}`],
                ['Batches', batches.filter(b => f.batchIds.includes(b.id)).map(b => b.name).join(', ')],
                ['When', `${fmtDateTime(start)} → ${fmtDateTime(end)}`],
                ['Results', f.mode === 'offline' ? 'Published after staff enter marks' : { immediate: 'Right after submitting', after_close: 'After the exam closes', manual: 'When staff publish them' }[f.resultRelease]],
                ['Pass mark', `${f.passPercent}%`]
              ].map(([k, v]) => (
                <div key={k} className="py-2 grid grid-cols-3 gap-2">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="col-span-2 font-medium text-slate-900 dark:text-white">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="text-slate-500">Students in these batches see the exam on their dashboard and in notifications, with a countdown until it opens.</p>
          </div>
        )}
        {error && <p className="mt-3 text-xs text-rose-600 font-semibold">{error}</p>}
      </Modal>

      {picker && (
        <QuestionPicker
          examName={f.title || 'this exam'}
          excludeIds={f.questions.map(q => q.id)}
          onClose={() => setPicker(false)}
          onPick={qs => {
            addQuestions(qs);
            setPicker(false);
          }}
        />
      )}
      {importing && (
        <QuestionImportModal
          targetLabel={f.title || 'this exam'}
          onClose={() => setImporting(false)}
          onImported={qs => {
            addQuestions(qs);
            setImporting(false);
          }}
        />
      )}
      {editing && (
        <QuestionEditorModal
          initial={editing}
          subjects={subjects}
          note={editing.id ? 'Changes also update the question bank.' : 'Saved to this exam and to the question bank.'}
          onClose={() => setEditing(null)}
          onSave={(q, another) => {
            if (q.id) {
              const { id, ...rest } = q;
              updateQuestionInBank(id, rest);
              set({ questions: f.questions.map(x => (x.id === id ? ({ ...x, ...rest } as Question) : x)) });
            } else {
              const created = addQuestionToBank({ ...q, createdAt: new Date().toISOString().slice(0, 10) });
              setF(prev => ({ ...prev, questions: [...prev.questions, created] }));
            }
            if (!another) setEditing(null);
          }}
        />
      )}
    </>
  );
};
