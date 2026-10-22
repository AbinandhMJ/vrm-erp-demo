import React, { useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { FIELD, LBL } from '../admissions/AdmissionFormFields';
import { Question } from '../../types';
import {
  DraftQuestion,
  ImportDefaults,
  ImportSource,
  PASTE_EXAMPLE,
  draftProblems,
  importQuestionsFromFile,
  newDraft,
  templateCsv,
  textToDrafts
} from '../../lib/questionImport';
import { FileSpreadsheet, FileText, Camera, ClipboardPaste, Download, AlertTriangle, CheckCircle2, Trash2, RefreshCw } from 'lucide-react';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const SOURCE_LABEL: Record<ImportSource, string> = {
  spreadsheet: 'spreadsheet',
  word: 'Word file',
  pdf: 'PDF',
  image: 'photo',
  text: 'text'
};

export const QuestionImportModal: React.FC<{
  onClose: () => void;
  onImported: (questions: Question[]) => void;
  /** Shown in the title when importing straight into an exam. */
  targetLabel?: string;
}> = ({ onClose, onImported, targetLabel }) => {
  const { questionBank, importQuestions, currentUser, today, currentStaff } = useApp();
  const existing = useMemo(() => new Set(questionBank.map(q => norm(q.questionText))), [questionBank]);

  const [defaults, setDefaults] = useState<ImportDefaults>({
    subject: currentStaff?.subjectsHandling?.[0] || 'General Studies',
    difficulty: 'Moderate',
    marks: 2,
    negativeMarks: 0.66
  });
  const [step, setStep] = useState<'pick' | 'review'>('pick');
  const [drafts, setDrafts] = useState<(DraftQuestion & { include: boolean })[]>([]);
  const [rawText, setRawText] = useState('');
  const [source, setSource] = useState<ImportSource | null>(null);
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [pasteMode, setPasteMode] = useState(false);
  const [onlyProblems, setOnlyProblems] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const accept = (list: DraftQuestion[], src: ImportSource, text?: string) => {
    setDrafts(list.map(d => ({ ...d, include: !existing.has(norm(d.questionText)) })));
    setSource(src);
    setRawText(text || '');
    setStep('review');
    if (list.length === 0) setError(`No questions were found in this ${SOURCE_LABEL[src]}. Check the format below${text !== undefined ? ', or fix the extracted text and read it again' : ''}.`);
    else setError('');
  };

  const readFile = async (file: File) => {
    setError('');
    setFileName(file.name);
    try {
      const r = await importQuestionsFromFile(file, defaults, setBusy);
      accept(r.drafts, r.source, r.rawText);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read this file.');
    } finally {
      setBusy('');
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob(['﻿' + templateCsv()], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'VRM-question-bank-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const update = (key: string, patch: Partial<DraftQuestion & { include: boolean }>) => setDrafts(prev => prev.map(d => (d.key === key ? { ...d, ...patch } : d)));
  const included = drafts.filter(d => d.include);
  const ready = included.filter(d => draftProblems(d).length === 0);
  const blocked = included.length - ready.length;
  const shown = onlyProblems ? drafts.filter(d => draftProblems(d).length > 0 || existing.has(norm(d.questionText))) : drafts;

  const doImport = () => {
    const qs: Omit<Question, 'id'>[] = ready.map(d => ({
      questionText: d.questionText.trim(),
      options: d.options.map(o => o.trim()).filter(Boolean),
      correctOptionIndex: d.correctOptionIndex,
      explanation: d.explanation.trim(),
      subject: d.subject.trim() || defaults.subject,
      topic: d.topic.trim() || undefined,
      difficulty: d.difficulty,
      marks: d.marks,
      negativeMarks: d.negativeMarks,
      pyqYear: d.pyqYear,
      tags: [`Imported from ${source ? SOURCE_LABEL[source] : 'file'}`],
      createdAt: today,
      authorFaculty: currentUser.name
    }));
    // Options may have had blanks removed: keep the right answer pointing at the same text.
    qs.forEach((q, i) => {
      const d = ready[i];
      q.correctOptionIndex = q.options.indexOf(d.options[d.correctOptionIndex].trim());
    });
    onImported(importQuestions(qs));
  };

  const pickCard = (icon: React.ReactNode, title: string, desc: string, onClick: () => void, testId: string) => (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-amber-500 text-left flex gap-3"
    >
      <span className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">{icon}</span>
      <span>
        <span className="block text-sm font-bold text-slate-900 dark:text-white">{title}</span>
        <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{desc}</span>
      </span>
    </button>
  );

  return (
    <Modal
      title={targetLabel ? `Import questions into ${targetLabel}` : "Bulk import questions"}
      subtitle={step === 'review' ? `${drafts.length} found in ${fileName || 'pasted text'} · review before adding to the bank` : 'Excel / CSV, Word, PDF, a photo of a printed page, or pasted text'}
      onClose={onClose}
      dismissible={!busy}
      size="2xl"
      footer={
        step === 'review' ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[11px] text-slate-600 dark:text-slate-400">
              <b className="text-emerald-700 dark:text-emerald-400">{ready.length} ready</b>
              {blocked > 0 && <b className="text-rose-600"> · {blocked} need fixing</b>}
              {drafts.length - included.length > 0 && <> · {drafts.length - included.length} skipped</>}
            </span>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setStep('pick');
                  setDrafts([]);
                  setError('');
                }}
                className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Choose another file
              </button>
              <button onClick={doImport} disabled={ready.length === 0} className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-amber-600 rounded-lg disabled:opacity-50">
                Add {ready.length} question{ready.length === 1 ? '' : 's'} to bank
              </button>
            </div>
          </div>
        ) : undefined
      }
    >
      {step === 'pick' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className={LBL}>Default subject</label>
              <input className={FIELD} value={defaults.subject} onChange={e => setDefaults({ ...defaults, subject: e.target.value })} />
            </div>
            <div>
              <label className={LBL}>Default difficulty</label>
              <select className={FIELD} value={defaults.difficulty} onChange={e => setDefaults({ ...defaults, difficulty: e.target.value as Question['difficulty'] })}>
                <option>Easy</option>
                <option>Moderate</option>
                <option>Advanced</option>
              </select>
            </div>
            <div>
              <label className={LBL}>Marks</label>
              <input type="number" step="0.5" min={0} className={FIELD} value={defaults.marks} onChange={e => setDefaults({ ...defaults, marks: Number(e.target.value) })} />
            </div>
            <div>
              <label className={LBL}>Negative marks</label>
              <input type="number" step="0.01" min={0} className={FIELD} value={defaults.negativeMarks} onChange={e => setDefaults({ ...defaults, negativeMarks: Number(e.target.value) })} />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 -mt-3">Used when the file doesn't say. A spreadsheet's own Subject / Marks columns take priority.</p>

          {busy ? (
            <div className="p-8 text-center text-sm text-slate-700 dark:text-slate-300">
              <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-amber-600" />
              {busy}
            </div>
          ) : pasteMode ? (
            <div className="space-y-2">
              <label className={LBL}>Paste questions (from WhatsApp, an email or a document)</label>
              <textarea rows={12} className={`${FIELD} font-mono`} value={rawText} onChange={e => setRawText(e.target.value)} placeholder={PASTE_EXAMPLE} />
              <div className="flex justify-between gap-2">
                <button onClick={() => setPasteMode(false)} className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Back
                </button>
                <button
                  onClick={() => {
                    setFileName('');
                    accept(textToDrafts(rawText, defaults), 'text', rawText);
                  }}
                  disabled={!rawText.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-amber-600 rounded-lg disabled:opacity-50"
                >
                  Read questions
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pickCard(<FileSpreadsheet className="w-5 h-5" />, 'Excel or CSV', 'One question per row. Most reliable. Download the template below.', () => fileRef.current?.click(), 'pick-excel')}
                {pickCard(<FileText className="w-5 h-5" />, 'Word or PDF', 'Numbered questions with (a)–(d) options and an “Answer:” line or an answer key.', () => fileRef.current?.click(), 'pick-doc')}
                {pickCard(<Camera className="w-5 h-5" />, 'Photo of a page', 'Take a picture of a printed question paper. Text is read on this device; check it carefully.', () => cameraRef.current?.click(), 'pick-photo')}
                {pickCard(<ClipboardPaste className="w-5 h-5" />, 'Paste text', 'Copy questions from anywhere and paste them.', () => setPasteMode(true), 'pick-paste')}
              </div>
              <input
                ref={fileRef}
                type="file"
                data-testid="qimport-file"
                accept=".xlsx,.xlsm,.csv,.tsv,.docx,.pdf,.txt,image/*"
                className="sr-only"
                onChange={e => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) readFile(f);
                }}
              />
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={e => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) readFile(f);
                }}
              />
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <b className="text-slate-800 dark:text-slate-200">Spreadsheet columns</b>
                  <button onClick={downloadTemplate} className="inline-flex items-center gap-1 self-start px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200">
                    <Download className="w-3.5 h-3.5" /> Download template (.csv, opens in Excel)
                  </button>
                </div>
                <p className="font-mono text-[11px]">Question · Option A · Option B · Option C · Option D · Answer (A–D or the option text) · Explanation · Subject · Topic · Difficulty · Marks · Negative Marks · PYQ Year</p>
                <b className="block text-slate-800 dark:text-slate-200 pt-1">Word / PDF / photo layout</b>
                <pre className="font-mono text-[11px] whitespace-pre-wrap">{PASTE_EXAMPLE}</pre>
                <p>An answer key at the end also works: a line “Answer Key” followed by “1-b 2-c 3-a …”. Old .doc files: save as .docx first. Scanned PDFs: use the photo option on each page.</p>
              </div>
            </>
          )}
          {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-3">
          {error && (
            <p className="text-xs text-rose-600 font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> {error}
            </p>
          )}
          {source && source !== 'spreadsheet' && (
            <details className="rounded-lg border border-slate-200 dark:border-slate-800" open={drafts.length === 0}>
              <summary className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                Text read from the {SOURCE_LABEL[source]} (fix mistakes here and read again)
              </summary>
              <div className="p-3 space-y-2">
                <textarea rows={8} className={`${FIELD} font-mono`} value={rawText} onChange={e => setRawText(e.target.value)} />
                <button onClick={() => accept(textToDrafts(rawText, defaults), source, rawText)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-amber-600 text-white text-xs font-semibold">
                  <RefreshCw className="w-3.5 h-3.5" /> Read again
                </button>
              </div>
            </details>
          )}
          {drafts.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <input type="checkbox" checked={onlyProblems} onChange={e => setOnlyProblems(e.target.checked)} /> Show only questions that need attention
              </label>
              <div className="flex gap-3">
                <button onClick={() => setDrafts(prev => prev.map(d => ({ ...d, include: true })))} className="font-semibold text-amber-700 dark:text-amber-400 hover:underline">
                  Include all
                </button>
                <button onClick={() => setDrafts(prev => prev.map(d => ({ ...d, include: false })))} className="font-semibold text-slate-500 hover:underline">
                  Skip all
                </button>
              </div>
            </div>
          )}
          <div className="space-y-3" data-import-review>
            {shown.map((d, idx) => {
              const problems = draftProblems(d);
              const dupe = existing.has(norm(d.questionText));
              return (
                <div
                  key={d.key}
                  data-draft
                  className={`p-3 rounded-xl border ${!d.include ? 'opacity-60 border-slate-200 dark:border-slate-800' : problems.length ? 'border-rose-300 dark:border-rose-800' : 'border-emerald-200 dark:border-emerald-900'}`}
                >
                  <div className="flex items-start gap-2">
                    <input type="checkbox" aria-label="Include this question" checked={d.include} onChange={e => update(d.key, { include: e.target.checked })} className="mt-2" />
                    <span className="text-xs font-mono text-slate-400 mt-2 w-6 shrink-0">{drafts.indexOf(d) + 1 || idx + 1}.</span>
                    <div className="flex-1 space-y-2 min-w-0">
                      <textarea rows={2} aria-label="Question text" className={FIELD} value={d.questionText} onChange={e => update(d.key, { questionText: e.target.value })} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {d.options.map((o, i) => (
                          <label key={i} className={`flex items-center gap-2 rounded-lg px-2 py-1 ${d.correctOptionIndex === i ? 'bg-emerald-50 dark:bg-emerald-950/40' : ''}`}>
                            <input type="radio" name={`ans-${d.key}`} aria-label={`Option ${String.fromCharCode(65 + i)} is correct`} checked={d.correctOptionIndex === i} onChange={() => update(d.key, { correctOptionIndex: i })} />
                            <span className="text-[11px] font-bold text-slate-500">{String.fromCharCode(65 + i)}</span>
                            <input
                              className={FIELD}
                              value={o}
                              onChange={e => update(d.key, { options: d.options.map((x, j) => (j === i ? e.target.value : x)) })}
                              placeholder={`Option ${String.fromCharCode(65 + i)}`}
                            />
                          </label>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                        <input className={`${FIELD} col-span-2`} aria-label="Subject" value={d.subject} onChange={e => update(d.key, { subject: e.target.value })} placeholder="Subject" />
                        <select className={FIELD} aria-label="Difficulty" value={d.difficulty} onChange={e => update(d.key, { difficulty: e.target.value as Question['difficulty'] })}>
                          <option>Easy</option>
                          <option>Moderate</option>
                          <option>Advanced</option>
                        </select>
                        <input type="number" step="0.5" aria-label="Marks" className={FIELD} value={d.marks} onChange={e => update(d.key, { marks: Number(e.target.value) })} title="Marks" />
                        <input type="number" step="0.01" aria-label="Negative marks" className={FIELD} value={d.negativeMarks} onChange={e => update(d.key, { negativeMarks: Number(e.target.value) })} title="Negative marks" />
                      </div>
                      <input className={FIELD} aria-label="Explanation" value={d.explanation} onChange={e => update(d.key, { explanation: e.target.value })} placeholder="Explanation (shown to students after the test)" />
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        {problems.length === 0 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" /> Needs {problems.join(', ')}
                          </span>
                        )}
                        {dupe && <span className="text-amber-700 dark:text-amber-400 font-semibold">Already in the bank (skipped by default)</span>}
                      </div>
                    </div>
                    <button onClick={() => setDrafts(prev => prev.filter(x => x.key !== d.key))} aria-label="Remove" className="p-1 text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {drafts.length > 0 && (
            <button
              onClick={() =>
                setDrafts(prev => [
                  ...prev,
                  { ...newDraft(defaults), include: true }
                ])
              }
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline"
            >
              + Add a missed question by hand
            </button>
          )}
        </div>
      )}
    </Modal>
  );
};
