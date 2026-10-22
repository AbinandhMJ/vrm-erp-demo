import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { FIELD, LBL } from '../admissions/AdmissionFormFields';
import { Question } from '../../types';

export type QuestionDraft = Omit<Question, 'id'> & { id?: string };

export const blankQuestion = (subject: string, author?: string): QuestionDraft => ({
  questionText: '',
  options: ['', '', '', ''],
  correctOptionIndex: 0,
  explanation: '',
  subject,
  topic: '',
  difficulty: 'Moderate',
  marks: 2,
  negativeMarks: 0.66,
  tags: [],
  authorFaculty: author
});

/** Add or edit one multiple-choice question. */
export const QuestionEditorModal: React.FC<{
  initial: QuestionDraft;
  subjects: string[];
  title?: string;
  note?: string;
  onClose: () => void;
  onSave: (q: QuestionDraft, addAnother: boolean) => void;
}> = ({ initial, subjects, title, note, onClose, onSave }) => {
  const [q, setQ] = useState<QuestionDraft>(initial);
  const [error, setError] = useState('');
  const set = (patch: Partial<QuestionDraft>) => setQ(prev => ({ ...prev, ...patch }));

  const save = (another: boolean) => {
    const opts = q.options.map(o => o.trim());
    if (!q.questionText.trim()) return setError('Type the question.');
    if (opts.filter(Boolean).length < 2) return setError('Give at least two options.');
    if (!opts[q.correctOptionIndex]) return setError('The correct answer option is empty.');
    // Drop empty options but keep the right answer pointing at the same text.
    const kept = opts.filter(Boolean);
    const correct = kept.indexOf(opts[q.correctOptionIndex]);
    onSave({ ...q, questionText: q.questionText.trim(), options: kept, correctOptionIndex: correct, subject: q.subject.trim() || 'General Studies' }, another);
    if (another) {
      setQ({ ...q, id: undefined, questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, explanation: '', topic: q.topic });
      setError('');
    }
  };

  const opts = [...q.options, '', '', '', ''].slice(0, Math.max(4, q.options.length));

  return (
    <Modal
      title={title || (q.id ? 'Edit question' : 'Add question')}
      subtitle={note}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex flex-col sm:flex-row justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            Cancel
          </button>
          {!q.id && (
            <button onClick={() => save(true)} className="px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg">
              Save & add another
            </button>
          )}
          <button onClick={() => save(false)} className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-amber-600 rounded-lg">
            Save question
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div>
          <label className={LBL}>Question *</label>
          <textarea rows={3} className={FIELD} value={q.questionText} onChange={e => set({ questionText: e.target.value })} placeholder="Type the question. Use new lines for statements 1, 2, 3…" />
        </div>
        <div>
          <label className={LBL}>Options (choose the correct one) *</label>
          <div className="space-y-1.5">
            {opts.map((o, i) => (
              <label key={i} className={`flex items-center gap-2 rounded-lg px-2 py-1 ${q.correctOptionIndex === i ? 'bg-emerald-50 dark:bg-emerald-950/40' : ''}`}>
                <input type="radio" name="correct-option" aria-label={`Option ${String.fromCharCode(65 + i)} is correct`} checked={q.correctOptionIndex === i} onChange={() => set({ correctOptionIndex: i })} />
                <span className="text-xs font-bold text-slate-500 w-4">{String.fromCharCode(65 + i)}</span>
                <input className={FIELD} value={o} onChange={e => set({ options: opts.map((x, j) => (j === i ? e.target.value : x)) })} placeholder={`Option ${String.fromCharCode(65 + i)}`} />
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="col-span-2">
            <label className={LBL}>Subject</label>
            <input className={FIELD} list="qe-subjects" value={q.subject} onChange={e => set({ subject: e.target.value })} />
            <datalist id="qe-subjects">
              {subjects.map(s => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div className="col-span-2">
            <label className={LBL}>Topic</label>
            <input className={FIELD} value={q.topic || ''} onChange={e => set({ topic: e.target.value })} placeholder="e.g. Parliament" />
          </div>
          <div>
            <label className={LBL}>Difficulty</label>
            <select className={FIELD} value={q.difficulty} onChange={e => set({ difficulty: e.target.value as Question['difficulty'] })}>
              <option>Easy</option>
              <option>Moderate</option>
              <option>Advanced</option>
            </select>
          </div>
          <div>
            <label className={LBL}>Marks</label>
            <input type="number" step="0.5" min={0} className={FIELD} value={q.marks} onChange={e => set({ marks: Number(e.target.value) })} />
          </div>
          <div>
            <label className={LBL}>Negative marks</label>
            <input type="number" step="0.01" min={0} className={FIELD} value={q.negativeMarks} onChange={e => set({ negativeMarks: Number(e.target.value) })} />
          </div>
          <div>
            <label className={LBL}>PYQ year</label>
            <input className={FIELD} value={q.pyqYear || ''} onChange={e => set({ pyqYear: e.target.value || undefined })} placeholder="e.g. 2023" />
          </div>
        </div>
        <div>
          <label className={LBL}>Explanation (shown after the exam)</label>
          <textarea rows={2} className={FIELD} value={q.explanation} onChange={e => set({ explanation: e.target.value })} />
        </div>
        {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
      </div>
    </Modal>
  );
};
