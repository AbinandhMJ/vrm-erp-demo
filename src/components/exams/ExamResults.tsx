import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Avatar } from '../common/PhotoPicker';
import { FIELD } from '../admissions/AdmissionFormFields';
import { AssessmentTest } from '../../types';
import { examStatus, examWindow, fmtDateTime, rankAttempts } from '../../lib/exams';
import { printLight } from '../../lib/print';
import { ACADEMY } from '../../config/academy';
import { Download, Printer, Send, Save } from 'lucide-react';

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Results of one exam: rank list, question analysis, who missed it, and marks entry for written exams. */
export const ExamResultsModal: React.FC<{ exam: AssessmentTest; onClose: () => void }> = ({ exam, onClose }) => {
  const { students, batches, studentAttempts, recordOfflineMarks, publishExamResults } = useApp();
  const offline = exam.mode === 'offline';
  const [view, setView] = useState<'ranks' | 'questions' | 'absent' | 'marks'>(offline ? 'marks' : 'ranks');
  const [batch, setBatch] = useState('all');
  const [notice, setNotice] = useState('');

  const roster = students.filter(s => exam.batchIds.includes(s.enrolledBatchId) && s.status === 'active' && (batch === 'all' || s.enrolledBatchId === batch));
  const rosterIds = new Set(roster.map(s => s.id));
  const attempts = studentAttempts.filter(a => a.testId === exam.id && rosterIds.has(a.studentId));
  const ranked = rankAttempts(attempts);
  const takenIds = new Set(attempts.map(a => a.studentId));
  const absent = roster.filter(s => !takenIds.has(s.id));
  const scores = ranked.map(r => r.attempt.score);
  const avg = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : 0;
  const passMark = exam.passPercent ? (exam.totalMarks * exam.passPercent) / 100 : null;
  const passed = passMark === null ? null : scores.filter(s => s >= passMark).length;
  const studentOf = (id: string) => students.find(s => s.id === id);

  const questionStats = useMemo(
    () =>
      exam.questions.map(q => {
        const answered = attempts.filter(a => a.userAnswers[q.id] !== undefined);
        const right = answered.filter(a => a.userAnswers[q.id] === q.correctOptionIndex).length;
        const counts = q.options.map((_, i) => answered.filter(a => a.userAnswers[q.id] === i).length);
        return { q, answered: answered.length, right, pct: attempts.length ? Math.round((right / attempts.length) * 100) : 0, counts };
      }),
    [exam, attempts]
  );

  // Marks entry (written exams)
  const [marks, setMarks] = useState<Record<string, string>>(() =>
    Object.fromEntries(studentAttempts.filter(a => a.testId === exam.id).map(a => [a.studentId, String(a.score)]))
  );

  const exportCsv = () => {
    const rows = [
      ['Rank', 'Roll number', 'Name', 'Batch', 'Score', 'Total', ...(offline ? [] : ['Correct', 'Wrong', 'Not answered']), 'Result'],
      ...ranked.map(({ attempt: a, rank }) => {
        const st = studentOf(a.studentId);
        return [
          rank,
          st?.rollNumber || '',
          a.studentName,
          st?.enrolledBatchName || '',
          a.score,
          a.totalMarks,
          ...(offline ? [] : [a.correctAnswers, a.incorrectAnswers, a.unattempted]),
          passMark === null ? '' : a.score >= passMark ? 'Pass' : 'Below pass mark'
        ];
      }),
      ...absent.map(st => ['', st.rollNumber, st.name, st.enrolledBatchName, 'Absent', exam.totalMarks, ...(offline ? [] : ['', '', '']), ''])
    ];
    const blob = new Blob(['﻿' + rows.map(r => r.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${exam.code}-results.csv`;
    a.click();
  };

  const status = examStatus(exam, new Date());
  const needsPublish = (exam.resultRelease === 'manual' || (exam.resultRelease === 'after_close' && status !== 'completed')) && !exam.resultsPublished;

  const tab = (id: typeof view, label: string) => (
    <button
      onClick={() => setView(id)}
      className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap ${view === id ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
    >
      {label}
    </button>
  );

  return (
    <Modal
      title={`Results: ${exam.title}`}
      subtitle={`${exam.code} · ${fmtDateTime(examWindow(exam).start)} · ${exam.totalMarks} marks`}
      onClose={onClose}
      size="2xl"
      headerActions={
        <>
          <button onClick={exportCsv} className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200">
            <Download className="w-3.5 h-3.5" /> Excel (CSV)
          </button>
          <button onClick={printLight} className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {notice && <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">{notice}</div>}
        {needsPublish && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>Students can't see these results yet.</span>
            <button
              onClick={() => {
                publishExamResults(exam.id);
                setNotice('Results published. Students can now see their scores and answers.');
              }}
              className="self-start inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold"
            >
              <Send className="w-3.5 h-3.5" /> Publish results to students
            </button>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
          {[
            ['Took the exam', `${ranked.length} / ${roster.length}`],
            ['Average', `${avg} / ${exam.totalMarks}`],
            ['Highest', scores.length ? Math.max(...scores) : '—'],
            ['Lowest', scores.length ? Math.min(...scores) : '—'],
            ['Passed', passed === null ? '—' : `${passed} (${exam.passPercent}%)`]
          ].map(([k, v]) => (
            <div key={String(k)} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="text-[10px] text-slate-500">{k}</div>
              <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">{v}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit max-w-full overflow-x-auto">
            {offline && tab('marks', 'Enter marks')}
            {tab('ranks', `Rank list (${ranked.length})`)}
            {!offline && exam.questions.length > 0 && tab('questions', 'Question analysis')}
            {tab('absent', `Did not take (${absent.length})`)}
          </div>
          {exam.batchIds.length > 1 && (
            <select value={batch} onChange={e => setBatch(e.target.value)} className={`${FIELD} sm:max-w-[240px]`} aria-label="Batch">
              <option value="all">All batches</option>
              {exam.batchIds.map(id => (
                <option key={id} value={id}>
                  {batches.find(b => b.id === id)?.name || id}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="print-area">
          <div className="hidden print:block mb-3">
            <div className="text-lg font-bold">{ACADEMY.name}</div>
            <div className="text-sm">
              {exam.title} ({exam.code}) · {fmtDateTime(examWindow(exam).start)} · Total {exam.totalMarks} marks
            </div>
          </div>

          {view === 'marks' && offline && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">Type each student's marks out of {exam.totalMarks}. Leave blank for absent. Students see their marks after you publish the results.</p>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {roster.map(st => (
                      <tr key={st.id}>
                        <td className="px-3 py-1.5 font-mono text-slate-500">{st.rollNumber}</td>
                        <td className="px-3 py-1.5 font-semibold text-slate-900 dark:text-white">{st.name}</td>
                        <td className="px-3 py-1.5 w-32">
                          <input
                            type="number"
                            min={0}
                            max={exam.totalMarks}
                            step="0.5"
                            aria-label={`Marks for ${st.name}`}
                            className={FIELD}
                            value={marks[st.id] ?? ''}
                            onChange={e => setMarks(m => ({ ...m, [st.id]: e.target.value }))}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() => {
                    const bad = roster.find(st => marks[st.id] && (Number(marks[st.id]) < 0 || Number(marks[st.id]) > exam.totalMarks));
                    if (bad) return setNotice(`${bad.name}'s marks must be between 0 and ${exam.totalMarks}.`);
                    recordOfflineMarks(
                      exam.id,
                      roster.map(st => ({ studentId: st.id, score: marks[st.id] === undefined || marks[st.id] === '' ? null : Number(marks[st.id]) }))
                    );
                    setNotice('Marks saved. Ranks are updated.');
                  }}
                  className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-amber-600 rounded-lg"
                >
                  <Save className="w-3.5 h-3.5" /> Save marks
                </button>
              </div>
            </div>
          )}

          {view === 'ranks' && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
              <table className="w-full text-xs text-left" data-rank-list>
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Rank</th>
                    <th className="px-3 py-2">Student</th>
                    <th className="px-3 py-2">Batch</th>
                    <th className="px-3 py-2 text-right">Score</th>
                    {!offline && <th className="px-3 py-2 text-right">Right / Wrong / Skipped</th>}
                    {passMark !== null && <th className="px-3 py-2">Result</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ranked.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                        No one has taken this exam yet.
                      </td>
                    </tr>
                  )}
                  {ranked.map(({ attempt: a, rank }) => {
                    const st = studentOf(a.studentId);
                    return (
                      <tr key={a.id}>
                        <td className="px-3 py-2 font-mono font-bold">#{rank}</td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-2">
                            <Avatar photo={st?.photo} name={a.studentName} className="w-6 h-6 text-[10px] print:hidden" />
                            <span className="font-semibold text-slate-900 dark:text-white">{a.studentName}</span>
                            <span className="font-mono text-slate-400">{st?.rollNumber}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-500">{st?.enrolledBatchName}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold">
                          {a.score} / {a.totalMarks}
                        </td>
                        {!offline && (
                          <td className="px-3 py-2 text-right font-mono text-slate-500">
                            {a.correctAnswers} / {a.incorrectAnswers} / {a.unattempted}
                          </td>
                        )}
                        {passMark !== null && <td className={`px-3 py-2 font-semibold ${a.score >= passMark ? 'text-emerald-600' : 'text-rose-600'}`}>{a.score >= passMark ? 'Pass' : 'Below'}</td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {view === 'questions' && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">Questions most students got wrong are worth revising in class.</p>
              {questionStats
                .slice()
                .sort((a, b) => a.pct - b.pct)
                .map(({ q, pct, counts, answered }) => (
                  <div key={q.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-slate-900 dark:text-white line-clamp-2">
                        <b>Q{exam.questions.indexOf(q) + 1}.</b> {q.questionText.split('\n')[0]}
                      </p>
                      <span className={`shrink-0 font-mono font-bold ${pct < 40 ? 'text-rose-600' : pct < 70 ? 'text-amber-600' : 'text-emerald-600'}`}>{pct}% right</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                      {q.options.map((o, i) => (
                        <div key={i} className={`px-2 py-1 rounded ${i === q.correctOptionIndex ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                          {String.fromCharCode(65 + i)}: {counts[i]} <span className="truncate">· {o.slice(0, 24)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-[11px] text-slate-500">{attempts.length - answered} skipped</div>
                  </div>
                ))}
            </div>
          )}

          {view === 'absent' && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
              <table className="w-full text-xs text-left">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {absent.length === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-center text-slate-400">Everyone took the exam.</td>
                    </tr>
                  )}
                  {absent.map(st => (
                    <tr key={st.id}>
                      <td className="px-3 py-2 font-mono text-slate-500">{st.rollNumber}</td>
                      <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white">{st.name}</td>
                      <td className="px-3 py-2 text-slate-500">{st.enrolledBatchName}</td>
                      <td className="px-3 py-2 font-mono text-slate-500">{st.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

/** Printable question paper (and answer key) for written exams or record keeping. */
export const QuestionPaperModal: React.FC<{ exam: AssessmentTest; onClose: () => void }> = ({ exam, onClose }) => {
  const [withKey, setWithKey] = useState(false);
  return (
    <Modal
      title={`Question paper: ${exam.title}`}
      onClose={onClose}
      size="xl"
      headerActions={
        <>
          <label className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={withKey} onChange={e => setWithKey(e.target.checked)} /> Show answer key
          </label>
          <button onClick={printLight} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        </>
      }
    >
      <label className="sm:hidden flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 mb-3">
        <input type="checkbox" checked={withKey} onChange={e => setWithKey(e.target.checked)} /> Show answer key
      </label>
      <div className="print-area bg-white text-slate-900 p-4 sm:p-6 rounded-lg border border-slate-200 text-sm">
        <div className="text-center border-b border-slate-300 pb-3 mb-4">
          <div className="text-lg font-bold">{ACADEMY.name}</div>
          <div className="text-xs">{ACADEMY.addressLine}</div>
          <div className="mt-2 font-bold">{exam.title}</div>
          <div className="text-xs">
            {exam.code} · {exam.subject} · Time: {exam.durationMinutes} min · Maximum marks: {exam.totalMarks}
          </div>
        </div>
        <div className="flex justify-between text-xs mb-4">
          <span>Name: ______________________</span>
          <span>Roll no: ____________</span>
        </div>
        {exam.instructions && <p className="text-xs italic mb-4">Instructions: {exam.instructions}</p>}
        <ol className="space-y-4">
          {exam.questions.map((q, i) => (
            <li key={q.id} className="break-inside-avoid">
              <div className="flex justify-between gap-2">
                <span className="whitespace-pre-line">
                  <b>{i + 1}.</b> {q.questionText}
                </span>
                <span className="text-xs text-slate-500 shrink-0">[{q.marks}]</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5 mt-1 pl-4 text-xs">
                {q.options.map((o, oi) => (
                  <span key={oi} className={withKey && oi === q.correctOptionIndex ? 'font-bold underline' : ''}>
                    ({String.fromCharCode(97 + oi)}) {o}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ol>
        {withKey && (
          <div className="mt-6 pt-3 border-t border-slate-300 text-xs">
            <b>Answer key:</b> {exam.questions.map((q, i) => `${i + 1}-${String.fromCharCode(97 + q.correctOptionIndex)}`).join('  ')}
          </div>
        )}
      </div>
    </Modal>
  );
};
