import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FIELD } from '../admissions/AdmissionFormFields';
import { AssessmentTest, Question, StudentTestAttempt } from '../../types';
import { ExamStatus, STATUS_LABEL, STATUS_STYLE, countdown, examStatus, examWindow, fmtDateTime, resultsVisible } from '../../lib/exams';
import { ExamWizard } from './ExamWizard';
import { ExamRunner, ExamScorecard } from './ExamRunner';
import { ExamResultsModal, QuestionPaperModal } from './ExamResults';
import { QuestionBankView } from './QuestionBankView';
import { ChartCard, LinesChart, pct } from '../charts/Charts';
import {
  Plus,
  Play,
  Square,
  Pencil,
  Copy,
  Trash2,
  BarChart3,
  FileText,
  Eye,
  CalendarClock,
  Radio,
  CheckCircle2,
  FileEdit,
  Users,
  Clock,
  Send,
  ClipboardList,
  Library
} from 'lucide-react';

const useNow = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 20_000);
    return () => window.clearInterval(t);
  }, []);
  return now;
};

const card = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs';

export const ExamsModule: React.FC = () => {
  const { role } = useApp();
  return role === 'student' ? <StudentExams /> : <StaffExams />;
};

/* ------------------------------------------------------------------ */
/* Staff                                                               */
/* ------------------------------------------------------------------ */

const StaffExams: React.FC = () => {
  const { assessmentTests, studentAttempts, students, batches, role, currentUser, schedule, deleteExam, duplicateExam, startExamNow, endExamNow, publishExamResults } = useApp();
  const now = useNow();
  const [tab, setTab] = useState<'exams' | 'bank' | 'results'>('exams');
  const [filter, setFilter] = useState<'all' | ExamStatus>('all');
  const [search, setSearch] = useState('');
  const myBatchIds = useMemo(() => (role === 'faculty' ? new Set(schedule.filter(s => s.facultyName === currentUser.name).map(s => s.batchId)) : null), [role, schedule, currentUser.name]);
  const [batchFilter, setBatchFilter] = useState(role === 'faculty' ? 'mine' : 'all');
  const [wizard, setWizard] = useState<{ exam: AssessmentTest | null; step?: number; questions?: Question[] } | null>(null);
  const [results, setResults] = useState<AssessmentTest | null>(null);
  const [paper, setPaper] = useState<AssessmentTest | null>(null);
  const [preview, setPreview] = useState<AssessmentTest | null>(null);
  const [previewDone, setPreviewDone] = useState<{ attempt: StudentTestAttempt; exam: AssessmentTest } | null>(null);
  const [toast, setToast] = useState('');
  const flash = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(''), 4000);
  };

  const withStatus = assessmentTests.map(t => ({ t, st: examStatus(t, now) }));
  const inBatch = (t: AssessmentTest) =>
    batchFilter === 'all' ? true : batchFilter === 'mine' ? !myBatchIds || t.batchIds.some(b => myBatchIds.has(b)) : t.batchIds.includes(batchFilter);
  const scoped = withStatus.filter(({ t }) => inBatch(t) && (!search.trim() || `${t.title} ${t.code} ${t.subject}`.toLowerCase().includes(search.trim().toLowerCase())));
  const counts = { all: scoped.length, live: 0, scheduled: 0, draft: 0, completed: 0 } as Record<'all' | ExamStatus, number>;
  scoped.forEach(({ st }) => counts[st]++);
  const order: Record<ExamStatus, number> = { live: 0, scheduled: 1, draft: 2, completed: 3 };
  const shown = scoped
    .filter(({ st }) => filter === 'all' || st === filter)
    .sort((a, b) => order[a.st] - order[b.st] || (a.st === 'completed' ? examWindow(b.t).start.getTime() - examWindow(a.t).start.getTime() : examWindow(a.t).start.getTime() - examWindow(b.t).start.getTime()));

  const rosterSize = (t: AssessmentTest) => students.filter(s => s.status === 'active' && t.batchIds.includes(s.enrolledBatchId)).length;
  const takers = (t: AssessmentTest) => new Set(studentAttempts.filter(a => a.testId === t.id).map(a => a.studentId)).size;
  const needsAction = withStatus.filter(
    ({ t, st }) => inBatch(t) && ((t.mode === 'offline' && st === 'completed' && takers(t) === 0) || (t.resultRelease === 'manual' && !t.resultsPublished && st === 'completed'))
  ).length;

  const btn = 'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800';

  const examCard = ({ t, st }: { t: AssessmentTest; st: ExamStatus }) => {
    const w = examWindow(t);
    const done = takers(t);
    const size = rosterSize(t);
    const resultsHidden = t.resultRelease === 'manual' && !t.resultsPublished;
    return (
      <div key={t.id} data-exam={t.title} className={`${card} p-4 space-y-3 ${st === 'live' ? 'ring-2 ring-rose-500/60' : ''}`}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_STYLE[st]}`}>
                {st === 'live' && <Radio className="w-3 h-3 animate-pulse" />}
                {STATUS_LABEL[st]}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{t.category}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{t.mode === 'offline' ? 'Written in class' : 'Online'}</span>
              <span className="text-[10px] font-mono text-slate-400">{t.code}</span>
            </div>
            <h3 className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{t.title}</h3>
            <p className="text-xs text-slate-500">
              {t.subject} · {t.batchIds.map(id => batches.find(b => b.id === id)?.name || id).join(', ')}
            </p>
          </div>
          <div className="text-xs text-right shrink-0">
            <div className="font-semibold text-slate-900 dark:text-white flex items-center sm:justify-end gap-1">
              <CalendarClock className="w-3.5 h-3.5 text-slate-400" /> {fmtDateTime(w.start)}
            </div>
            <div className="text-slate-500">
              {st === 'scheduled' ? `Opens ${countdown(w.start, now)}` : st === 'live' ? `Closes ${countdown(w.end, now)}` : `until ${fmtDateTime(w.end)}`}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
          <span>
            <b>{t.questions.length || '—'}</b> questions
          </span>
          <span>
            <b>{t.totalMarks}</b> marks
          </span>
          {t.mode !== 'offline' && (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> {t.durationMinutes} min
            </span>
          )}
          {(st === 'live' || st === 'completed') && (
            <span className="inline-flex items-center gap-1">
              <Users className="w-3 h-3" /> <b>{done}</b> of {size} {t.mode === 'offline' ? 'marked' : 'submitted'}
            </span>
          )}
          {st === 'completed' && resultsHidden && <span className="text-amber-700 dark:text-amber-400 font-semibold">Results not published</span>}
        </div>
        {st === 'live' && size > 0 && (
          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-rose-500" style={{ width: `${Math.round((done / size) * 100)}%` }} />
          </div>
        )}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          {(st === 'draft' || st === 'scheduled') && (
            <button
              onClick={() => {
                if (t.questions.length === 0 && t.mode !== 'offline') return flash('Add questions before starting the exam.');
                if (window.confirm(`Start “${t.title}” now? Students in its batches can begin immediately.`)) {
                  startExamNow(t.id);
                  flash(`“${t.title}” is live. Students can start it now.`);
                }
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-500"
            >
              <Play className="w-3.5 h-3.5" /> Start now
            </button>
          )}
          {st === 'draft' && (
            <button onClick={() => setWizard({ exam: t, step: 2 })} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600">
              <CalendarClock className="w-3.5 h-3.5" /> Schedule
            </button>
          )}
          {st === 'live' && (
            <button
              onClick={() => window.confirm(`End “${t.title}” now? Students who haven't submitted can no longer start.`) && endExamNow(t.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-900 dark:bg-slate-700"
            >
              <Square className="w-3.5 h-3.5" /> End now
            </button>
          )}
          {(st === 'live' || st === 'completed') && (
            <button onClick={() => setResults(t)} className={btn}>
              <BarChart3 className="w-3.5 h-3.5" /> {t.mode === 'offline' ? 'Enter marks & results' : 'Results'}
            </button>
          )}
          {st === 'completed' && resultsHidden && (
            <button
              onClick={() => {
                publishExamResults(t.id);
                flash('Results published to students.');
              }}
              className={btn}
            >
              <Send className="w-3.5 h-3.5" /> Publish results
            </button>
          )}
          <button onClick={() => setWizard({ exam: t, step: st === 'draft' ? 0 : 1 })} className={btn}>
            <Pencil className="w-3.5 h-3.5" /> {st === 'completed' ? 'View questions' : 'Edit'}
          </button>
          {t.questions.length > 0 && t.mode !== 'offline' && (
            <button onClick={() => setPreview(t)} className={btn}>
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
          )}
          {t.questions.length > 0 && (
            <button onClick={() => setPaper(t)} className={btn}>
              <FileText className="w-3.5 h-3.5" /> Question paper
            </button>
          )}
          <button
            onClick={() => {
              const c = duplicateExam(t.id);
              if (c) {
                flash(`Copied as a draft: “${c.title}”.`);
                setWizard({ exam: c, step: 0 });
              }
            }}
            className={btn}
          >
            <Copy className="w-3.5 h-3.5" /> Duplicate
          </button>
          <button
            onClick={() => window.confirm(done ? `Delete “${t.title}” and its ${done} results?` : `Delete “${t.title}”?`) && deleteExam(t.id)}
            aria-label={`Delete ${t.title}`}
            className="p-1.5 text-slate-400 hover:text-rose-600"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const completed = withStatus.filter(({ t, st }) => st === 'completed' && inBatch(t)).map(({ t }) => t);
  const trend = completed
    .slice()
    .sort((a, b) => examWindow(a).start.getTime() - examWindow(b).start.getTime())
    .slice(-10)
    .map(t => {
      const at = studentAttempts.filter(a => a.testId === t.id);
      return {
        name: t.code,
        avg: at.length && t.totalMarks ? Math.round((at.reduce((s, a) => s + a.score, 0) / at.length / t.totalMarks) * 100) : 0,
        part: rosterSize(t) ? Math.round((new Set(at.map(a => a.studentId)).size / rosterSize(t)) * 100) : 0
      };
    });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Exams & Question Bank</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Schedule or start exams, build question papers, and see results.</p>
        </div>
        <button onClick={() => setWizard({ exam: null })} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg self-start shadow-xs">
          <Plus className="w-4 h-4" /> Schedule new exam
        </button>
      </div>

      {toast && (
        <div role="status" className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-900 dark:text-emerald-200">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['Live now', counts.live, <Radio key="i" className="w-4 h-4 text-rose-600" />, 'live'],
          ['Upcoming', counts.scheduled, <CalendarClock key="i" className="w-4 h-4 text-sky-600" />, 'scheduled'],
          ['Drafts', counts.draft, <FileEdit key="i" className="w-4 h-4 text-slate-500" />, 'draft'],
          ['Need marks / publishing', needsAction, <CheckCircle2 key="i" className="w-4 h-4 text-amber-600" />, 'completed']
        ].map(([label, n, icon, f]) => (
          <button
            key={String(label)}
            onClick={() => {
              setTab('exams');
              setFilter(f as ExamStatus);
            }}
            className={`${card} p-4 text-left hover:border-amber-400`}
          >
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              {icon} {label}
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{n as number}</div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit max-w-full overflow-x-auto">
        {(
          [
            ['exams', 'Exams', <ClipboardList key="i" className="w-3.5 h-3.5" />],
            ['bank', 'Question bank', <Library key="i" className="w-3.5 h-3.5" />],
            ['results', 'Results & analysis', <BarChart3 key="i" className="w-3.5 h-3.5" />]
          ] as const
        ).map(([id, label, icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap ${
              tab === id ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {tab === 'exams' && (
        <div className="space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2">
            <div className="flex gap-1 overflow-x-auto">
              {(['all', 'live', 'scheduled', 'draft', 'completed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                    filter === f ? 'bg-slate-900 text-white border-slate-900 dark:bg-amber-600 dark:border-amber-600' : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {f === 'all' ? 'All' : STATUS_LABEL[f]} ({counts[f]})
                </button>
              ))}
            </div>
            <input className={`${FIELD} lg:max-w-xs lg:ml-auto`} placeholder="Search exams" value={search} onChange={e => setSearch(e.target.value)} />
            <select className={`${FIELD} lg:max-w-[220px]`} value={batchFilter} onChange={e => setBatchFilter(e.target.value)} aria-label="Batch filter">
              {myBatchIds && <option value="mine">My batches</option>}
              <option value="all">All batches</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          {shown.length === 0 && (
            <div className={`${card} p-10 text-center text-xs text-slate-500 space-y-3`}>
              <p>{assessmentTests.length === 0 ? 'No exams yet.' : 'No exams match.'}</p>
              <button onClick={() => setWizard({ exam: null })} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 rounded-lg">
                <Plus className="w-4 h-4" /> Schedule new exam
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">{shown.map(examCard)}</div>
        </div>
      )}

      {tab === 'bank' && (
        <QuestionBankView onEditExam={(exam, step) => setWizard({ exam, step })} onNewExamWith={qs => setWizard({ exam: null, questions: qs })} flash={flash} />
      )}

      {tab === 'results' && (
        <div className="space-y-4">
          <ChartCard title="Last 10 exams" note="Average score and how many students took each" empty={trend.length === 0} emptyText="Results appear here after exams are completed.">
            <LinesChart
              data={trend}
              xKey="name"
              series={[
                { key: 'avg', label: 'Average score %' },
                { key: 'part', label: 'Took the exam %' }
              ]}
              yMax={100}
              formatValue={pct}
            />
          </ChartCard>
          <div className={`${card} overflow-x-auto`}>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2.5">Exam</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Took it</th>
                  <th className="px-4 py-2.5">Average</th>
                  <th className="px-4 py-2.5">Top score</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {completed.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                      No completed exams yet.
                    </td>
                  </tr>
                )}
                {completed
                  .slice()
                  .sort((a, b) => examWindow(b).start.getTime() - examWindow(a).start.getTime())
                  .map(t => {
                    const at = studentAttempts.filter(a => a.testId === t.id);
                    const avg = at.length ? Math.round((at.reduce((s, a) => s + a.score, 0) / at.length) * 10) / 10 : null;
                    return (
                      <tr key={t.id}>
                        <td className="px-4 py-2.5">
                          <div className="font-semibold text-slate-900 dark:text-white">{t.title}</div>
                          <div className="text-slate-500">{t.subject}</div>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-slate-600 dark:text-slate-300">{fmtDateTime(examWindow(t).start)}</td>
                        <td className="px-4 py-2.5 font-mono">
                          {takers(t)} / {rosterSize(t)}
                        </td>
                        <td className="px-4 py-2.5 font-mono">{avg === null ? '—' : `${avg} / ${t.totalMarks}`}</td>
                        <td className="px-4 py-2.5 font-mono">{at.length ? Math.max(...at.map(a => a.score)) : '—'}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button onClick={() => setResults(t)} className={btn}>
                            <BarChart3 className="w-3.5 h-3.5" /> Open
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {wizard && (
        <ExamWizard
          exam={wizard.exam}
          startStep={wizard.step}
          initialQuestions={wizard.questions}
          onClose={() => setWizard(null)}
          onSaved={(e, action) => {
            setWizard(null);
            setTab('exams');
            setFilter('all');
            flash(
              action === 'draft'
                ? `“${e.title}” saved as a draft. Only staff can see it.`
                : action === 'started'
                  ? `“${e.title}” is live now. Students in its batches can start it.`
                  : `“${e.title}” is scheduled for ${fmtDateTime(examWindow(e).start)}. Students see it on their dashboard.`
            );
          }}
        />
      )}
      {results && <ExamResultsModal exam={assessmentTests.find(t => t.id === results.id) || results} onClose={() => setResults(null)} />}
      {paper && <QuestionPaperModal exam={paper} onClose={() => setPaper(null)} />}
      {preview && (
        <ExamRunner
          exam={preview}
          onClose={() => setPreview(null)}
          onDone={attempt => {
            setPreviewDone({ attempt, exam: preview });
            setPreview(null);
          }}
        />
      )}
      {previewDone && <ExamScorecard attempt={previewDone.attempt} exam={previewDone.exam} onClose={() => setPreviewDone(null)} />}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Students                                                            */
/* ------------------------------------------------------------------ */

const StudentExams: React.FC = () => {
  const { assessmentTests, studentAttempts, currentStudent } = useApp();
  const now = useNow();
  const [running, setRunning] = useState<AssessmentTest | null>(null);
  const [showing, setShowing] = useState<{ attempt: StudentTestAttempt; exam?: AssessmentTest } | null>(null);
  const mine = assessmentTests.filter(t => t.status !== 'draft' && currentStudent && t.batchIds.includes(currentStudent.enrolledBatchId));
  const myAttempts = studentAttempts.filter(a => a.studentId === currentStudent?.id);
  const attemptFor = (t: AssessmentTest) => myAttempts.find(a => a.testId === t.id);
  const live = mine.filter(t => examStatus(t, now) === 'live');
  const upcoming = mine.filter(t => examStatus(t, now) === 'scheduled').sort((a, b) => examWindow(a).start.getTime() - examWindow(b).start.getTime());
  const past = mine.filter(t => examStatus(t, now) === 'completed').sort((a, b) => examWindow(b).start.getTime() - examWindow(a).start.getTime());

  const trend = past
    .slice()
    .reverse()
    .map(t => {
      const a = attemptFor(t);
      if (!a || !resultsVisible(t, now) || !t.totalMarks) return null;
      const batchAt = studentAttempts.filter(x => x.testId === t.id);
      return {
        name: t.code,
        me: Math.round((a.score / t.totalMarks) * 100),
        batch: batchAt.length ? Math.round((batchAt.reduce((s, x) => s + x.score, 0) / batchAt.length / t.totalMarks) * 100) : 0
      };
    })
    .filter(Boolean) as { name: string; me: number; batch: number }[];

  const row = (t: AssessmentTest) => {
    const st = examStatus(t, now);
    const a = attemptFor(t);
    const w = examWindow(t);
    const visible = resultsVisible(t, now);
    return (
      <div key={t.id} data-student-exam={t.title} className={`${card} p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${st === 'live' && !a ? 'ring-2 ring-rose-500/60' : ''}`}>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_STYLE[st]}`}>{a && st === 'live' ? 'Submitted' : STATUS_LABEL[st]}</span>
            <span className="text-[10px] text-slate-500">{t.mode === 'offline' ? 'Written in class' : `${t.durationMinutes} min · ${t.questions.length} questions`}</span>
          </div>
          <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{t.title}</div>
          <div className="text-xs text-slate-500">
            {t.subject} · {t.totalMarks} marks · {st === 'scheduled' ? `${fmtDateTime(w.start)} (opens ${countdown(w.start, now)})` : st === 'live' ? `open until ${fmtDateTime(w.end)}` : fmtDateTime(w.start)}
          </div>
        </div>
        <div className="shrink-0">
          {a ? (
            visible ? (
              <button onClick={() => setShowing({ attempt: a, exam: t })} className="px-3 py-2 rounded-lg text-xs font-bold bg-slate-900 dark:bg-slate-700 text-white">
                {a.score} / {a.totalMarks}
                {a.rankInBatch ? ` · #${a.rankInBatch}` : ''} · View
              </button>
            ) : (
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Submitted · result pending</span>
            )
          ) : st === 'live' && t.mode !== 'offline' ? (
            <button onClick={() => setRunning(t)} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white">
              <Play className="w-3.5 h-3.5" /> Start exam
            </button>
          ) : st === 'scheduled' ? (
            <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">Opens {countdown(w.start, now)}</span>
          ) : t.mode === 'offline' ? (
            <span className="text-xs text-slate-500">{st === 'completed' ? 'Marks not entered yet' : 'Written in class'}</span>
          ) : (
            <span className="text-xs font-semibold text-rose-600">Missed</span>
          )}
        </div>
      </div>
    );
  };

  const section = (title: string, list: AssessmentTest[], empty: string) => (
    <div className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {title} ({list.length})
      </h3>
      {list.length === 0 ? <p className="text-xs text-slate-400">{empty}</p> : list.map(row)}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">My Exams</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Exams for {currentStudent?.enrolledBatchName}. Start a live exam, see what's coming, and review your results.</p>
      </div>
      {section('Live now', live, 'No exam is open right now.')}
      {section('Upcoming', upcoming, 'No upcoming exams.')}
      <ChartCard title="My scores" note="My score % vs batch average" empty={trend.length < 2} emptyText="Your score trend appears after two exams.">
        <LinesChart
          data={trend}
          xKey="name"
          series={[
            { key: 'me', label: 'My score %' },
            { key: 'batch', label: 'Batch average %' }
          ]}
          yMax={100}
          formatValue={pct}
        />
      </ChartCard>
      {section('Completed', past, 'No completed exams yet.')}

      {running && (
        <ExamRunner
          exam={running}
          onClose={() => setRunning(null)}
          onDone={attempt => {
            setShowing({ attempt, exam: running });
            setRunning(null);
          }}
        />
      )}
      {showing && <ExamScorecard attempt={showing.attempt} exam={showing.exam} onClose={() => setShowing(null)} />}
    </div>
  );
};

/** Dashboard card for students: live and upcoming exams. */
export const UpcomingExamsCard: React.FC<{ batchId?: string; studentId?: string }> = ({ batchId, studentId }) => {
  const { assessmentTests, studentAttempts, setActiveTab } = useApp();
  const now = useNow();
  const list = assessmentTests
    .filter(t => t.status !== 'draft' && batchId && t.batchIds.includes(batchId))
    .map(t => ({ t, st: examStatus(t, now) }))
    .filter(({ st }) => st === 'live' || st === 'scheduled')
    .sort((a, b) => examWindow(a.t).start.getTime() - examWindow(b.t).start.getTime())
    .slice(0, 4);
  return (
    <div className={`${card} p-5 space-y-3`} data-upcoming-exams>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <ClipboardList className="w-4 h-4 text-amber-600" /> Exams
        </h3>
        <button onClick={() => setActiveTab('tests')} className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline">
          All exams
        </button>
      </div>
      {list.length === 0 && <p className="text-xs text-slate-500">No live or upcoming exams.</p>}
      {list.map(({ t, st }) => {
        const done = studentAttempts.some(a => a.testId === t.id && a.studentId === studentId);
        const w = examWindow(t);
        return (
          <div key={t.id} className="flex items-center gap-3 text-xs">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${STATUS_STYLE[st]}`}>{done ? 'Done' : STATUS_LABEL[st]}</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-900 dark:text-white truncate">{t.title}</div>
              <div className="text-slate-500">{st === 'live' ? `Open until ${fmtDateTime(w.end)}` : `${fmtDateTime(w.start)} · ${countdown(w.start, now)}`}</div>
            </div>
            {st === 'live' && !done && t.mode !== 'offline' && (
              <button onClick={() => setActiveTab('tests')} className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white font-bold">
                Start
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
