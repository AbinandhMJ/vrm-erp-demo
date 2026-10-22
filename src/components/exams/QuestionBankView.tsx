import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FIELD } from '../admissions/AdmissionFormFields';
import { AssessmentTest, Question } from '../../types';
import { examStatus, STATUS_LABEL, STATUS_STYLE } from '../../lib/exams';
import { QuestionEditorModal, QuestionDraft, blankQuestion } from './QuestionEditorModal';
import { QuestionPicker } from './QuestionPicker';
import { QuestionImportModal } from '../academics/QuestionImportModal';
import { Library, FolderOpen, Inbox, Plus, FileUp, Pencil, Copy, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Settings2, Lock, ClipboardList } from 'lucide-react';

type Folder = { kind: 'all' } | { kind: 'unused' } | { kind: 'exam'; id: string };

/**
 * Question bank organised by exam: every exam is a folder with its questions; "All questions" is the
 * full library and "Not in any exam" shows questions that haven't been used yet.
 */
export const QuestionBankView: React.FC<{
  onEditExam: (exam: AssessmentTest, step?: number) => void;
  onNewExamWith: (qs: Question[]) => void;
  flash: (msg: string) => void;
}> = ({ onEditExam, onNewExamWith, flash }) => {
  const { questionBank, assessmentTests, studentAttempts, addQuestionToBank, updateQuestionInBank, deleteQuestionFromBank, setExamQuestions, currentUser, schedule } = useApp();
  const now = new Date();
  const [folder, setFolder] = useState<Folder>({ kind: 'all' });
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [showAnswers, setShowAnswers] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<QuestionDraft | null>(null);
  const [picker, setPicker] = useState(false);
  const [importing, setImporting] = useState(false);
  const [moveTarget, setMoveTarget] = useState('');

  const usedIn = useMemo(() => {
    const m = new Map<string, AssessmentTest[]>();
    assessmentTests.forEach(t => t.questions.forEach(q => m.set(q.id, [...(m.get(q.id) || []), t])));
    return m;
  }, [assessmentTests]);
  const takenIds = useMemo(() => new Set(studentAttempts.map(a => a.testId)), [studentAttempts]);
  const exams = useMemo(
    () =>
      assessmentTests
        .slice()
        .sort((a, b) => (b.startAt || b.scheduledDate).localeCompare(a.startAt || a.scheduledDate)),
    [assessmentTests]
  );
  const exam = folder.kind === 'exam' ? assessmentTests.find(t => t.id === folder.id) : undefined;
  const locked = !!exam && takenIds.has(exam.id);
  const subjects = useMemo(() => [...new Set([...questionBank.map(q => q.subject), ...schedule.map(s => s.subject)])].sort(), [questionBank, schedule]);

  const base: Question[] = folder.kind === 'exam' ? exam?.questions || [] : folder.kind === 'unused' ? questionBank.filter(q => !usedIn.get(q.id)) : questionBank;
  const list = base.filter(
    q =>
      (subject === 'all' || q.subject === subject) &&
      (difficulty === 'all' || q.difficulty === difficulty) &&
      (!search.trim() || `${q.questionText} ${q.topic || ''} ${q.pyqYear || ''} ${q.explanation}`.toLowerCase().includes(search.trim().toLowerCase()))
  );
  const listSubjects = [...new Set(base.map(q => q.subject))].sort();
  const editableExams = exams.filter(t => !takenIds.has(t.id));

  const saveQuestion = (q: QuestionDraft) => {
    if (q.id) {
      const { id, ...rest } = q;
      if (questionBank.some(x => x.id === id)) updateQuestionInBank(id, rest);
      if (exam && !locked) setExamQuestions(exam.id, exam.questions.map(x => (x.id === id ? ({ ...x, ...rest } as Question) : x)));
      flash('Question updated.');
    } else {
      const created = addQuestionToBank({ ...q, createdAt: new Date().toISOString().slice(0, 10) });
      if (exam && !locked) setExamQuestions(exam.id, [...exam.questions, created]);
      flash(exam ? `Question added to ${exam.title} and the bank.` : 'Question added to the bank.');
    }
  };

  const addToExam = (examId: string, qs: Question[]) => {
    const t = assessmentTests.find(x => x.id === examId);
    if (!t) return;
    const have = new Set(t.questions.map(q => q.id));
    const fresh = qs.filter(q => !have.has(q.id));
    setExamQuestions(examId, [...t.questions, ...fresh]);
    flash(`${fresh.length} question${fresh.length === 1 ? '' : 's'} added to ${t.title}.`);
  };

  const move = (i: number, d: -1 | 1) => {
    if (!exam) return;
    const qs = exam.questions.slice();
    const j = i + d;
    if (j < 0 || j >= qs.length) return;
    [qs[i], qs[j]] = [qs[j], qs[i]];
    setExamQuestions(exam.id, qs);
  };

  const folderBtn = (f: Folder, label: React.ReactNode, count: number, icon: React.ReactNode, extra?: React.ReactNode) => {
    const active = JSON.stringify(f) === JSON.stringify(folder);
    return (
      <button
        key={JSON.stringify(f)}
        onClick={() => {
          setFolder(f);
          setSelected([]);
        }}
        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-start gap-2 ${
          active ? 'bg-slate-900 text-white dark:bg-amber-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
        }`}
      >
        <span className="mt-0.5 shrink-0">{icon}</span>
        <span className="flex-1 min-w-0">
          <span className="block font-semibold truncate">{label}</span>
          {extra}
        </span>
        <span className={`font-mono text-[11px] ${active ? 'text-white/80' : 'text-slate-400'}`}>{count}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Folders */}
      <aside className="lg:w-72 shrink-0">
        <div className="lg:hidden">
          <select
            className={FIELD}
            aria-label="Question folder"
            value={folder.kind === 'exam' ? folder.id : folder.kind}
            onChange={e => {
              const v = e.target.value;
              setFolder(v === 'all' || v === 'unused' ? { kind: v } : { kind: 'exam', id: v });
              setSelected([]);
            }}
          >
            <option value="all">All questions ({questionBank.length})</option>
            <option value="unused">Not in any exam ({questionBank.filter(q => !usedIn.get(q.id)).length})</option>
            <optgroup label="Exams">
              {exams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.questions.length})
                </option>
              ))}
            </optgroup>
          </select>
        </div>
        <div className="hidden lg:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 space-y-0.5 lg:sticky lg:top-0 max-h-[75vh] overflow-y-auto" data-bank-folders>
          <div className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Library</div>
          {folderBtn({ kind: 'all' }, 'All questions', questionBank.length, <Library className="w-3.5 h-3.5" />)}
          {folderBtn({ kind: 'unused' }, 'Not in any exam', questionBank.filter(q => !usedIn.get(q.id)).length, <Inbox className="w-3.5 h-3.5" />)}
          <div className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Exams ({exams.length})</div>
          {exams.map(t => {
            const st = examStatus(t, now);
            return folderBtn(
              { kind: 'exam', id: t.id },
              t.title,
              t.questions.length,
              <FolderOpen className="w-3.5 h-3.5" />,
              <span className="flex items-center gap-1 mt-0.5">
                <span className={`px-1.5 rounded text-[9px] font-bold ${STATUS_STYLE[st]}`}>{STATUS_LABEL[st]}</span>
                <span className="text-[10px] opacity-70 font-mono truncate">{t.code}</span>
              </span>
            );
          })}
        </div>
      </aside>

      {/* Questions */}
      <section className="flex-1 min-w-0 space-y-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate" data-folder-title>
                {exam ? exam.title : folder.kind === 'unused' ? 'Questions not in any exam' : 'All questions'}
              </h3>
              <p className="text-xs text-slate-500">
                {exam ? (
                  <>
                    {exam.code} · {exam.subject} · {exam.questions.length} questions · {exam.totalMarks} marks
                    {locked && (
                      <span className="ml-1 inline-flex items-center gap-0.5 text-amber-700 dark:text-amber-400 font-semibold">
                        <Lock className="w-3 h-3" /> taken by students: questions locked
                      </span>
                    )}
                  </>
                ) : (
                  `${base.length} questions${folder.kind === 'all' ? ` across ${listSubjects.length} subjects` : ''}`
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {exam && (
                <button onClick={() => onEditExam(exam, 0)} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg">
                  <Settings2 className="w-3.5 h-3.5" /> Exam settings & schedule
                </button>
              )}
              {(!exam || !locked) && (
                <>
                  <button onClick={() => setEditing(blankQuestion(exam?.subject || (subject !== 'all' ? subject : 'General Studies'), currentUser.name))} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-amber-600 rounded-lg">
                    <Plus className="w-3.5 h-3.5" /> New question
                  </button>
                  {exam && (
                    <button onClick={() => setPicker(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg">
                      <Library className="w-3.5 h-3.5" /> Add from bank
                    </button>
                  )}
                  <button onClick={() => setImporting(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg">
                    <FileUp className="w-3.5 h-3.5" /> Bulk import
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input className={`${FIELD} sm:col-span-2`} placeholder="Search question, topic, year or explanation" value={search} onChange={e => setSearch(e.target.value)} />
            <select className={FIELD} value={subject} onChange={e => setSubject(e.target.value)} aria-label="Subject filter">
              <option value="all">All subjects</option>
              {listSubjects.map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select className={FIELD} value={difficulty} onChange={e => setDifficulty(e.target.value)} aria-label="Difficulty filter">
              <option value="all">Any difficulty</option>
              <option>Easy</option>
              <option>Moderate</option>
              <option>Advanced</option>
            </select>
          </div>
          {!exam && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={list.length > 0 && list.every(q => selected.includes(q.id))}
                  onChange={e => setSelected(e.target.checked ? [...new Set([...selected, ...list.map(q => q.id)])] : selected.filter(id => !list.some(q => q.id === id)))}
                />
                Select all shown
              </label>
              {selected.length > 0 && (
                <>
                  <span className="font-semibold text-slate-900 dark:text-white">{selected.length} selected:</span>
                  <button
                    onClick={() => onNewExamWith(questionBank.filter(q => selected.includes(q.id)))}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold"
                  >
                    <ClipboardList className="w-3.5 h-3.5" /> New exam with these
                  </button>
                  <select value={moveTarget} onChange={e => setMoveTarget(e.target.value)} className={`${FIELD} w-auto`} aria-label="Exam to add to">
                    <option value="">Add to exam…</option>
                    {editableExams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                  <button
                    disabled={!moveTarget}
                    onClick={() => {
                      addToExam(moveTarget, questionBank.filter(q => selected.includes(q.id)));
                      setSelected([]);
                      setMoveTarget('');
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-40"
                  >
                    Add
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {list.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
            {exam ? 'No questions in this exam yet. Add new ones, pick from the bank, or import a file.' : 'No questions match.'}
          </div>
        )}
        <div className="space-y-2" data-bank-list>
          {list.map(q => {
            const exams = usedIn.get(q.id) || [];
            const i = exam ? exam.questions.indexOf(q) : -1;
            const open = !!showAnswers[q.id];
            return (
              <div key={q.id} data-question className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  {!exam && <input type="checkbox" aria-label="Select question" className="mt-0.5" checked={selected.includes(q.id)} onChange={() => setSelected(s => (s.includes(q.id) ? s.filter(x => x !== q.id) : [...s, q.id]))} />}
                  {exam && <span className="font-mono font-bold text-slate-400 w-6 shrink-0">{i + 1}.</span>}
                  <p className="flex-1 text-sm text-slate-900 dark:text-white whitespace-pre-line leading-relaxed">{q.questionText}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pl-6">
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{q.subject}</span>
                  {q.topic && <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">{q.topic}</span>}
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">{q.difficulty}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-mono">+{q.marks}</span>
                  <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-mono">−{q.negativeMarks}</span>
                  {q.pyqYear && <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">PYQ {q.pyqYear}</span>}
                  {!exam &&
                    (exams.length ? (
                      exams.map(t => (
                        <button key={t.id} onClick={() => setFolder({ kind: 'exam', id: t.id })} className="px-2 py-0.5 rounded border border-sky-200 dark:border-sky-900 text-sky-700 dark:text-sky-300 hover:underline">
                          {t.title.length > 30 ? `${t.title.slice(0, 30)}…` : t.title}
                        </button>
                      ))
                    ) : (
                      <span className="px-2 py-0.5 rounded border border-dashed border-slate-300 dark:border-slate-700 text-slate-400">Not in any exam</span>
                    ))}
                </div>
                {open && (
                  <div className="pl-6 space-y-1">
                    {q.options.map((o, oi) => (
                      <div key={oi} className={`px-2 py-1 rounded ${oi === q.correctOptionIndex ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}>
                        {String.fromCharCode(65 + oi)}. {o}
                      </div>
                    ))}
                    {q.explanation && <p className="text-slate-500 italic">{q.explanation}</p>}
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2 pl-6 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={() => setShowAnswers(s => ({ ...s, [q.id]: !open }))} className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
                    {open ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} {open ? 'Hide' : 'Show'} options & answer
                  </button>
                  <div className="flex items-center">
                    {exam && !locked && (
                      <>
                        <button onClick={() => move(i, -1)} aria-label="Move up" className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => move(i, 1)} aria-label="Move down" className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {!locked && (
                      <button onClick={() => setEditing(q)} aria-label="Edit question" className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {!exam && (
                      <button
                        onClick={() => {
                          const { id: _id, ...rest } = q;
                          addQuestionToBank({ ...rest, questionText: `${q.questionText}`, createdAt: new Date().toISOString().slice(0, 10) });
                          flash('Question duplicated.');
                        }}
                        aria-label="Duplicate question"
                        className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {exam && !locked && (
                      <button onClick={() => setExamQuestions(exam.id, exam.questions.filter(x => x.id !== q.id))} className="px-2 py-1 text-rose-600 font-semibold hover:underline">
                        Remove from exam
                      </button>
                    )}
                    {!exam && (
                      <button
                        onClick={() => window.confirm(exams.length ? `This question is in ${exams.length} exam(s); they keep their copy. Delete it from the bank?` : 'Delete this question?') && deleteQuestionFromBank(q.id)}
                        aria-label="Delete question"
                        className="p-1.5 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {editing && (
        <QuestionEditorModal
          initial={editing}
          subjects={subjects}
          note={exam ? (editing.id ? `In ${exam.title}` : `Adds to ${exam.title} and the bank`) : undefined}
          onClose={() => setEditing(null)}
          onSave={(q, another) => {
            saveQuestion(q);
            if (!another) setEditing(null);
          }}
        />
      )}
      {picker && exam && (
        <QuestionPicker
          examName={exam.title}
          excludeIds={exam.questions.map(q => q.id)}
          onClose={() => setPicker(false)}
          onPick={qs => {
            addToExam(exam.id, qs);
            setPicker(false);
          }}
        />
      )}
      {importing && (
        <QuestionImportModal
          targetLabel={exam?.title}
          onClose={() => setImporting(false)}
          onImported={qs => {
            setImporting(false);
            if (exam && !locked) addToExam(exam.id, qs);
            else flash(`${qs.length} question${qs.length === 1 ? '' : 's'} added to the bank.`);
          }}
        />
      )}
    </div>
  );
};
