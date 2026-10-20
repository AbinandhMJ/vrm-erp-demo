import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, XCircle, Flame } from 'lucide-react';
import { addDays } from '../../lib/dates';

/** Two questions a day from the question bank. Students answer once; staff see the student's result in view-as mode. */
export const DailyQuizCard: React.FC<{ studentId: string; readOnly?: boolean }> = ({ studentId, readOnly = false }) => {
  const { todaysQuiz, dailyQuizAttempts, submitDailyQuiz, today } = useApp();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [error, setError] = useState('');

  const mine = dailyQuizAttempts.filter(a => a.studentId === studentId);
  const todayAttempt = mine.find(a => a.date === today);

  const streak = useMemo(() => {
    const days = new Set(mine.map(a => a.date));
    let d = days.has(today) ? today : addDays(today, -1);
    let n = 0;
    while (days.has(d)) {
      n++;
      d = addDays(d, -1);
    }
    return n;
  }, [mine, today]);

  const last7 = mine.filter(a => a.date > addDays(today, -7));
  const last7Correct = last7.reduce((s, a) => s + a.correct, 0);
  const last7Total = last7.reduce((s, a) => s + a.total, 0);

  if (todaysQuiz.length === 0) return null;

  const submit = () => {
    if (todaysQuiz.some(q => answers[q.id] === undefined)) {
      setError('Answer both questions to submit.');
      return;
    }
    setError('');
    submitDailyQuiz(answers);
  };

  const shownAnswers = todayAttempt?.answers || answers;
  const done = !!todayAttempt;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Today's 2-minute quiz</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {done ? `You scored ${todayAttempt.correct} of ${todayAttempt.total} today.` : 'Two questions, new every day. Answers show after you submit.'}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400" title="Days in a row">
            <Flame className="w-4 h-4" /> {streak} day streak
          </span>
          {last7Total > 0 && (
            <span className="text-slate-500 dark:text-slate-400">
              Last 7 days: {last7Correct}/{last7Total}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-5">
        {todaysQuiz.map((q, qi) => {
          const chosen = shownAnswers[q.id];
          return (
            <div key={q.id} className="space-y-2">
              <p className="text-sm text-slate-900 dark:text-slate-100 whitespace-pre-line leading-relaxed">
                <span className="font-bold mr-1">Q{qi + 1}.</span>
                {q.questionText}
              </p>
              <div className="grid gap-2">
                {q.options.map((opt, oi) => {
                  const isChosen = chosen === oi;
                  const isCorrect = oi === q.correctOptionIndex;
                  let cls = 'border-slate-200 dark:border-slate-700 hover:border-amber-400 bg-white dark:bg-slate-800/60';
                  if (done) {
                    if (isCorrect) cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30';
                    else if (isChosen) cls = 'border-rose-500 bg-rose-50 dark:bg-rose-950/30';
                    else cls = 'border-slate-200 dark:border-slate-700 opacity-70';
                  } else if (isChosen) cls = 'border-amber-500 bg-amber-50 dark:bg-amber-950/30';
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={done || readOnly}
                      onClick={() => {
                        setAnswers(a => ({ ...a, [q.id]: oi }));
                        setError('');
                      }}
                      className={`flex items-start gap-2 text-left px-3 py-2 rounded-lg border text-xs text-slate-800 dark:text-slate-200 transition-colors disabled:cursor-default ${cls}`}
                    >
                      <span className="font-mono font-bold w-4 shrink-0">{String.fromCharCode(65 + oi)}</span>
                      <span className="flex-1">{opt}</span>
                      {done && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                      {done && isChosen && !isCorrect && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {done && q.explanation && (
                <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3 leading-relaxed">{q.explanation}</p>
              )}
            </div>
          );
        })}
      </div>

      {!done && !readOnly && (
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={submit} className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 rounded-lg">
            Submit answers
          </button>
          {error && <span className="text-xs text-rose-600">{error}</span>}
        </div>
      )}
      {!done && readOnly && <p className="text-xs text-slate-400">This student hasn't answered today's quiz yet.</p>}
    </div>
  );
};
