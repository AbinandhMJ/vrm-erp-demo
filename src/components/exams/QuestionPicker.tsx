import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { FIELD } from '../admissions/AdmissionFormFields';
import { Question } from '../../types';
import { Shuffle } from 'lucide-react';

/** Choose questions from the bank: tick them one by one, or pick a number at random from a subject/difficulty. */
export const QuestionPicker: React.FC<{
  excludeIds: string[];
  onClose: () => void;
  onPick: (qs: Question[]) => void;
  examName?: string;
}> = ({ excludeIds, onClose, onPick, examName }) => {
  const { questionBank, assessmentTests } = useApp();
  const used = useMemo(() => {
    const m = new Map<string, number>();
    assessmentTests.forEach(t => t.questions.forEach(q => m.set(q.id, (m.get(q.id) || 0) + 1)));
    return m;
  }, [assessmentTests]);
  const exclude = new Set(excludeIds);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [unusedOnly, setUnusedOnly] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [randomN, setRandomN] = useState(10);

  const subjects = [...new Set(questionBank.map(q => q.subject))].sort();
  const list = questionBank.filter(
    q =>
      !exclude.has(q.id) &&
      (subject === 'all' || q.subject === subject) &&
      (difficulty === 'all' || q.difficulty === difficulty) &&
      (!unusedOnly || !used.get(q.id)) &&
      (!search.trim() || `${q.questionText} ${q.topic || ''} ${q.pyqYear || ''}`.toLowerCase().includes(search.trim().toLowerCase()))
  );
  const toggle = (id: string) => setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));
  const allShown = list.length > 0 && list.every(q => picked.includes(q.id));
  const marks = questionBank.filter(q => picked.includes(q.id)).reduce((s, q) => s + (q.marks || 0), 0);

  const pickRandom = () => {
    const pool = list.filter(q => !picked.includes(q.id));
    const shuffled = pool.map(q => [Math.random(), q] as const).sort((a, b) => a[0] - b[0]).map(x => x[1]);
    setPicked(p => [...p, ...shuffled.slice(0, randomN).map(q => q.id)]);
  };

  return (
    <Modal
      title={examName ? `Add questions to ${examName}` : 'Choose questions from the bank'}
      subtitle={`${questionBank.length - excludeIds.length} available · tick questions or pick at random`}
      onClose={onClose}
      size="xl"
      footer={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs text-slate-600 dark:text-slate-300">
            <b>{picked.length}</b> selected · {Math.round(marks * 100) / 100} marks
          </span>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              Cancel
            </button>
            <button
              disabled={picked.length === 0}
              onClick={() => onPick(picked.map(id => questionBank.find(q => q.id === id)!).filter(Boolean))}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-amber-600 rounded-lg disabled:opacity-50"
            >
              Add {picked.length || ''} question{picked.length === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input className={`${FIELD} sm:col-span-2`} placeholder="Search question, topic or year" value={search} onChange={e => setSearch(e.target.value)} />
          <select className={FIELD} value={subject} onChange={e => setSubject(e.target.value)} aria-label="Subject">
            <option value="all">All subjects</option>
            {subjects.map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select className={FIELD} value={difficulty} onChange={e => setDifficulty(e.target.value)} aria-label="Difficulty">
            <option value="all">Any difficulty</option>
            <option>Easy</option>
            <option>Moderate</option>
            <option>Advanced</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={allShown} onChange={() => setPicked(p => (allShown ? p.filter(id => !list.some(q => q.id === id)) : [...new Set([...p, ...list.map(q => q.id)])]))} />
              Select all shown ({list.length})
            </label>
            <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={unusedOnly} onChange={e => setUnusedOnly(e.target.checked)} /> Not used in any exam
            </label>
          </div>
          <div className="flex items-center gap-1.5">
            <input type="number" min={1} max={200} value={randomN} onChange={e => setRandomN(Math.max(1, Number(e.target.value) || 1))} className={`${FIELD} w-16`} aria-label="How many at random" />
            <button onClick={pickRandom} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200">
              <Shuffle className="w-3.5 h-3.5" /> Pick at random
            </button>
          </div>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl max-h-[50vh] overflow-y-auto">
          {list.length === 0 && <p className="p-6 text-center text-xs text-slate-500">No questions match. Add questions to the bank or change the filters.</p>}
          {list.map(q => (
            <label key={q.id} className="flex items-start gap-3 p-3 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <input type="checkbox" className="mt-0.5" checked={picked.includes(q.id)} onChange={() => toggle(q.id)} />
              <span className="flex-1 min-w-0">
                <span className="block text-slate-900 dark:text-white line-clamp-2">{q.questionText}</span>
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  {q.subject}
                  {q.topic ? ` · ${q.topic}` : ''} · {q.difficulty} · {q.marks} marks{q.pyqYear ? ` · PYQ ${q.pyqYear}` : ''}
                  {used.get(q.id) ? ` · used in ${used.get(q.id)} exam${used.get(q.id)! > 1 ? 's' : ''}` : ''}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>
    </Modal>
  );
};
