import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { AssessmentTest, StudentTestAttempt } from '../../types';
import { examWindow, resultsVisible, seededShuffle, fmtDateTime } from '../../lib/exams';
import { Clock, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

const fmt = (secs: number) => `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;

/**
 * Takes an exam: timer, question palette, mark for review, auto-submit when time runs out
 * (or when the exam window closes). Students' attempts are saved; staff get a preview.
 */
export const ExamRunner: React.FC<{ exam: AssessmentTest; onClose: () => void; onDone: (attempt: StudentTestAttempt) => void }> = ({ exam, onClose, onDone }) => {
  const { currentStudent, currentUser, submitTestAttempt } = useApp();
  const questions = useMemo(
    () => (exam.shuffleQuestions && currentStudent ? seededShuffle(exam.questions, `${exam.id}|${currentStudent.id}`) : exam.questions),
    [exam, currentStudent]
  );
  // Time left = exam duration, but never beyond the window's end.
  const initialSeconds = useMemo(() => {
    const byWindow = Math.floor((examWindow(exam).end.getTime() - Date.now()) / 1000);
    const full = exam.durationMinutes * 60;
    return currentStudent && exam.status !== 'draft' ? Math.max(30, Math.min(full, byWindow)) : full;
  }, [exam, currentStudent]);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [review, setReview] = useState<Record<string, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [started, setStarted] = useState(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const submittedRef = useRef(false);

  const submit = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const chosen = answersRef.current;
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    let score = 0;
    const byTopic = new Map<string, { score: number; total: number; wrong: boolean }>();
    for (const q of exam.questions) {
      const c = chosen[q.id];
      const marks = q.marks || 2;
      const neg = q.negativeMarks ?? exam.negativeMarksPerWrong ?? 0;
      const key = q.topic || q.subject;
      const t = byTopic.get(key) || { score: 0, total: 0, wrong: false };
      t.total += marks;
      if (c === undefined) {
        skipped++;
        t.wrong = true;
      } else if (c === q.correctOptionIndex) {
        correct++;
        score += marks;
        t.score += marks;
      } else {
        wrong++;
        score -= neg;
        t.score -= neg;
        t.wrong = true;
      }
      byTopic.set(key, t);
    }
    const data = {
      testId: exam.id,
      testTitle: exam.title,
      studentId: currentStudent?.id || currentUser.id,
      studentName: currentStudent?.name || currentUser.name,
      score: Math.round(score * 100) / 100,
      totalMarks: exam.totalMarks,
      accuracyPercentage: correct + wrong ? Math.round((correct / (correct + wrong)) * 100) : 0,
      correctAnswers: correct,
      incorrectAnswers: wrong,
      unattempted: skipped,
      rankInBatch: 0,
      userAnswers: chosen,
      subjectBreakdown: [...byTopic.entries()].map(([subject, v]) => ({ subject, score: Math.round(v.score * 100) / 100, total: v.total })),
      improvementAreas: [...byTopic.entries()].filter(([, v]) => v.wrong).map(([k]) => `Revise ${k}: review the explanation for each question you missed.`)
    };
    const attempt = currentStudent ? submitTestAttempt(data) : { ...data, id: `preview-${Date.now()}`, attemptedAt: new Date().toISOString() };
    onDone(attempt);
  };

  useEffect(() => {
    if (!started) return;
    const t = window.setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          window.clearInterval(t);
          submit();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  const confirmSubmit = () => {
    const left = exam.questions.length - Object.keys(answers).length;
    if (window.confirm(left > 0 ? `You have ${left} unanswered question${left > 1 ? 's' : ''}. Submit anyway?` : 'Submit your answers now?')) submit();
  };

  // Instructions screen first.
  if (!started)
    return (
      <Modal
        title={exam.title}
        subtitle={`${exam.code} · ${exam.subject}`}
        onClose={onClose}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              Not now
            </button>
            <button onClick={() => setStarted(true)} className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg">
              {currentStudent ? 'Start exam' : 'Start preview'}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              ['Questions', exam.questions.length],
              ['Total marks', exam.totalMarks],
              ['Time', `${Math.round(initialSeconds / 60)} min`]
            ].map(([k, v]) => (
              <div key={String(k)} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="text-[10px] text-slate-500">{k}</div>
                <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">{v}</div>
              </div>
            ))}
          </div>
          {initialSeconds < exam.durationMinutes * 60 && (
            <p className="text-amber-700 dark:text-amber-400 font-semibold">The exam window closes soon, so you have {Math.round(initialSeconds / 60)} minutes instead of {exam.durationMinutes}.</p>
          )}
          <ul className="list-disc pl-4 space-y-1">
            {exam.instructions && <li>{exam.instructions}</li>}
            <li>Wrong answers lose {exam.negativeMarksPerWrong} marks (per question value shown on each question). Unanswered questions lose nothing.</li>
            <li>Answers are submitted automatically when the timer ends.</li>
            {currentStudent ? <li>You can take this exam once.</li> : <li>Staff preview: nothing is saved.</li>}
          </ul>
        </div>
      </Modal>
    );

  const q = questions[idx];
  const chosen = q ? answers[q.id] : undefined;
  const answered = Object.keys(answers).length;

  return (
    <Modal
      title={exam.title}
      subtitle={`${exam.code} · ${exam.subject}`}
      headerTone="dark"
      size="2xl"
      className="sm:h-[92dvh]"
      bodyClassName="p-0 flex flex-col"
      dismissible={false}
      onClose={() => window.confirm('Leave the exam? Your answers will not be saved.') && onClose()}
      headerActions={
        <>
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono font-bold text-sm border ${
              secondsLeft < 60 ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-800 text-amber-400 border-slate-700'
            }`}
            aria-label="Time left"
          >
            <Clock className="w-4 h-4" />
            <span>{fmt(secondsLeft)}</span>
          </div>
          <button onClick={confirmSubmit} className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg">
            Submit
          </button>
        </>
      }
    >
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
        <div className="md:flex-1 p-4 sm:p-6 md:overflow-y-auto space-y-6">
          {q && (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
                <span className="font-mono font-bold text-slate-500 uppercase">
                  Question {idx + 1} of {questions.length}
                </span>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">+{q.marks || 2}</span>
                  <span className="font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded">−{q.negativeMarks ?? exam.negativeMarksPerWrong}</span>
                </div>
              </div>
              <div className="text-sm sm:text-base text-slate-900 dark:text-white leading-relaxed font-medium whitespace-pre-line">{q.questionText}</div>
              <div className="space-y-2.5">
                {q.options.map((opt, oi) => {
                  const sel = chosen === oi;
                  return (
                    <button
                      key={oi}
                      type="button"
                      role="radio"
                      aria-checked={sel}
                      onClick={() => setAnswers(a => ({ ...a, [q.id]: oi }))}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs flex items-start gap-3 transition-colors ${
                        sel
                          ? 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/40 font-semibold text-slate-950 dark:text-amber-200'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full font-mono text-[11px] flex items-center justify-center shrink-0 ${
                          sel ? 'bg-amber-600 text-white font-bold' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className="pt-0.5 leading-relaxed">{opt}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  {chosen !== undefined && (
                    <button
                      onClick={() =>
                        setAnswers(a => {
                          const c = { ...a };
                          delete c[q.id];
                          return c;
                        })
                      }
                      className="px-3 py-1.5 text-xs text-rose-600"
                    >
                      Clear answer
                    </button>
                  )}
                  <button
                    onClick={() => setReview(r => ({ ...r, [q.id]: !r[q.id] }))}
                    className={`px-3 py-1.5 text-xs rounded-lg border font-medium ${
                      review[q.id] ? 'border-purple-300 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {review[q.id] ? '✓ Marked for review' : 'Mark for review'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIdx(i => Math.max(0, i - 1))}
                    disabled={idx === 0}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  {idx < questions.length - 1 ? (
                    <button onClick={() => setIdx(i => i + 1)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-amber-600 rounded-lg">
                      Save & Next <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={confirmSubmit} className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg">
                      Submit Test
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  Answered <b>{answered}</b> of {questions.length} questions
                </span>
                <button onClick={confirmSubmit} className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg">
                  Submit Test
                </button>
              </div>
            </>
          )}
        </div>
        <div className="w-full md:w-64 shrink-0 bg-slate-50 dark:bg-slate-950 p-5 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Questions</h4>
          <div className="grid grid-cols-5 md:grid-cols-4 gap-2">
            {questions.map((x, i) => (
              <button
                key={x.id}
                onClick={() => setIdx(i)}
                aria-label={`Question ${i + 1}`}
                className={`h-9 rounded-lg font-mono text-xs font-bold border ${
                  review[x.id] ? 'bg-purple-600 text-white border-purple-600' : answers[x.id] !== undefined ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                } ${i === idx ? 'ring-2 ring-amber-500 ring-offset-1' : ''}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-1.5 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-600" /> Answered
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-purple-600" /> Marked for review
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded border border-slate-300 dark:border-slate-700" /> Not answered
            </div>
          </div>
          <button onClick={confirmSubmit} className="mt-4 w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg">
            Submit Test
          </button>
        </div>
      </div>
    </Modal>
  );
};

/** Score card after an exam (or when a student opens a past result). */
export const ExamScorecard: React.FC<{ attempt: StudentTestAttempt; exam?: AssessmentTest; onClose: () => void }> = ({ attempt, exam, onClose }) => {
  const now = new Date();
  const preview = attempt.id.startsWith('preview-');
  const visible = !exam || preview || resultsVisible(exam, now);
  if (!visible)
    return (
      <Modal title={attempt.testTitle} onClose={onClose} size="sm">
        <div className="text-center space-y-2 py-4">
          <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600" />
          <p className="text-sm font-bold text-slate-900 dark:text-white">Your answers are submitted.</p>
          <p className="text-xs text-slate-500">
            {exam?.resultRelease === 'manual'
              ? 'Results will appear here once your faculty publishes them.'
              : `Results are published after the exam closes (${fmtDateTime(examWindow(exam!).end)}).`}
          </p>
        </div>
      </Modal>
    );
  const offline = exam?.mode === 'offline';
  return (
    <Modal title={attempt.testTitle} onClose={onClose} size="lg" bodyClassName="px-5 py-4 space-y-5">
      <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="text-xs text-slate-400 block">Marks obtained</span>
          <span className="text-3xl font-mono font-bold">
            {attempt.score} <span className="text-lg text-slate-400">/ {attempt.totalMarks}</span>
          </span>
          {exam?.passPercent ? (
            <span className={`ml-2 text-xs font-bold ${attempt.score >= (exam.totalMarks * exam.passPercent) / 100 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {attempt.score >= (exam.totalMarks * exam.passPercent) / 100 ? 'Passed' : 'Below pass mark'}
            </span>
          ) : null}
        </div>
        <div className="text-xs text-slate-300 text-right">
          {!offline && (
            <div>
              <b className="text-emerald-400">{attempt.correctAnswers}</b> correct · <b className="text-rose-400">{attempt.incorrectAnswers}</b> incorrect · <b>{attempt.unattempted}</b> not answered
            </div>
          )}
          <div className="mt-0.5">{preview ? 'Preview only (not saved)' : `Saved to your record${attempt.rankInBatch ? ` · Batch rank #${attempt.rankInBatch}` : ''}`}</div>
        </div>
      </div>
      {!offline && exam && (
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-900 dark:text-white block">Answer review</span>
          {exam.questions.map((q, qi) => {
            const c = attempt.userAnswers[q.id];
            const right = c === q.correctOptionIndex;
            return (
              <div key={q.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-slate-800 dark:text-slate-200 line-clamp-2">
                    <b>Q{qi + 1}.</b> {q.questionText.split('\n')[0]}
                  </p>
                  <span className={`shrink-0 font-semibold ${c === undefined ? 'text-slate-400' : right ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {c === undefined ? 'Not answered' : right ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  Your answer: {c === undefined ? '—' : `${String.fromCharCode(65 + c)}. ${q.options[c]}`} · Correct: {String.fromCharCode(65 + q.correctOptionIndex)}.{' '}
                  {q.options[q.correctOptionIndex]}
                </p>
                {q.explanation && !right && <p className="text-slate-600 dark:text-slate-400">{q.explanation}</p>}
              </div>
            );
          })}
        </div>
      )}
      {attempt.improvementAreas?.length > 0 && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 text-xs">
          <span className="font-bold text-slate-900 dark:text-white block">Areas to improve</span>
          <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400">
            {attempt.improvementAreas.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
};
