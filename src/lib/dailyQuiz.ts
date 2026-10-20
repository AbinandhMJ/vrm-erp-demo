import { Question } from '../types';

const hash = (str: string) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

export const DAILY_QUIZ_SIZE = 2;

/** Same questions for every student on a given day; rotates daily through the question bank. */
export const pickDailyQuestions = (bank: Question[], date: string, count = DAILY_QUIZ_SIZE): Question[] => {
  if (bank.length === 0) return [];
  const sorted = [...bank].sort((a, b) => a.id.localeCompare(b.id));
  const picked: Question[] = [];
  let seed = hash(date);
  while (picked.length < Math.min(count, sorted.length)) {
    const q = sorted[seed % sorted.length];
    if (!picked.includes(q)) picked.push(q);
    seed = hash(String(seed));
  }
  return picked;
};
