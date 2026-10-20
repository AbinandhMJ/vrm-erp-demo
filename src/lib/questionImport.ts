// Bulk question import: Excel / CSV, Word (.docx), PDF and photos (OCR).
// Heavy parsers are loaded on demand so they don't slow down the rest of the app.
import type { Question } from '../types';

export type DraftQuestion = {
  key: string;
  questionText: string;
  options: string[];
  /** -1 when the file had no answer for this question (must be picked before import). */
  correctOptionIndex: number;
  explanation: string;
  subject: string;
  topic: string;
  difficulty: Question['difficulty'];
  marks: number;
  negativeMarks: number;
  pyqYear?: string;
};

export type ImportSource = 'spreadsheet' | 'word' | 'pdf' | 'image' | 'text';

export const IMPORT_COLUMNS = [
  'Question',
  'Option A',
  'Option B',
  'Option C',
  'Option D',
  'Answer',
  'Explanation',
  'Subject',
  'Topic',
  'Difficulty',
  'Marks',
  'Negative Marks',
  'PYQ Year'
] as const;

const TEMPLATE_ROWS = [
  [
    'Which Article of the Constitution deals with the Finance Commission?',
    'Article 270',
    'Article 280',
    'Article 300',
    'Article 324',
    'B',
    'Article 280 provides for a Finance Commission constituted every five years.',
    'Indian Polity',
    'Fiscal federalism',
    'Moderate',
    '2',
    '0.66',
    '2023'
  ],
  [
    'The Tropic of Cancer does NOT pass through which state?',
    'Gujarat',
    'Odisha',
    'Tripura',
    'Mizoram',
    'Odisha',
    'It passes through 8 states; Odisha is not one of them.',
    'Geography',
    'Indian geography',
    'Easy',
    '2',
    '0.66',
    ''
  ]
];

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** CSV template with the expected columns and two example rows (opens in Excel). */
export const templateCsv = (): string =>
  [IMPORT_COLUMNS as readonly string[], ...TEMPLATE_ROWS].map(r => r.map(csvCell).join(',')).join('\r\n');

export const PASTE_EXAMPLE = `1. Which Article deals with the Finance Commission?
(a) Article 270  (b) Article 280  (c) Article 300  (d) Article 324
Answer: b
Explanation: Article 280 provides for a Finance Commission every five years.

2. The Tropic of Cancer does NOT pass through
A) Gujarat
B) Odisha
C) Tripura
D) Mizoram
Ans: B`;

let keySeq = 0;
const newKey = () => `draft-${Date.now().toString(36)}-${keySeq++}`;

const DIFFICULTIES: Question['difficulty'][] = ['Easy', 'Moderate', 'Advanced'];
const normDifficulty = (v: string, fallback: Question['difficulty']): Question['difficulty'] => {
  const s = v.trim().toLowerCase();
  if (!s) return fallback;
  if (s.startsWith('e')) return 'Easy';
  if (s.startsWith('a') || s.startsWith('h') || s.startsWith('d')) return 'Advanced';
  if (s.startsWith('m')) return 'Moderate';
  return DIFFICULTIES.find(d => d.toLowerCase() === s) || fallback;
};

/** "B", "b", "2", "(b)", "Option B" or the option's text → index, -1 if unknown. */
export const answerToIndex = (raw: string, options: string[]): number => {
  const s = raw.trim().replace(/^option\s*/i, '').replace(/[().\]]/g, '').trim();
  if (!s) return -1;
  if (/^[a-d]$/i.test(s)) return s.toUpperCase().charCodeAt(0) - 65;
  if (/^[1-4]$/.test(s)) return Number(s) - 1;
  const t = raw.trim().toLowerCase();
  const idx = options.findIndex(o => o.trim().toLowerCase() === t);
  return idx;
};

export type ImportDefaults = { subject: string; difficulty: Question['difficulty']; marks: number; negativeMarks: number };

const blankDraft = (d: ImportDefaults): DraftQuestion => ({
  key: newKey(),
  questionText: '',
  options: ['', '', '', ''],
  correctOptionIndex: -1,
  explanation: '',
  subject: d.subject,
  topic: '',
  difficulty: d.difficulty,
  marks: d.marks,
  negativeMarks: d.negativeMarks
});

/** An empty draft, for adding a question the reader missed. */
export const newDraft = (d: ImportDefaults): DraftQuestion => blankDraft(d);

// ---------------- spreadsheets ----------------

const headerIndex = (header: string[], ...names: string[]) => {
  const h = header.map(x => x.toLowerCase().replace(/[^a-z]/g, ''));
  for (const n of names) {
    const i = h.indexOf(n.toLowerCase().replace(/[^a-z]/g, ''));
    if (i >= 0) return i;
  }
  return -1;
};

/** Rows (first row = header) → draft questions. Accepts the template columns and common variants. */
export const rowsToDrafts = (rows: string[][], d: ImportDefaults): DraftQuestion[] => {
  const nonEmpty = rows.filter(r => r.some(c => String(c ?? '').trim()));
  if (nonEmpty.length === 0) return [];
  const header = nonEmpty[0].map(c => String(c ?? ''));
  let qi = headerIndex(header, 'question', 'questiontext', 'question text', 'q');
  const hasHeader = qi >= 0;
  if (!hasHeader) qi = 0;
  const oi = [
    headerIndex(header, 'option a', 'optiona', 'a', 'option1', 'opt a'),
    headerIndex(header, 'option b', 'optionb', 'b', 'option2', 'opt b'),
    headerIndex(header, 'option c', 'optionc', 'c', 'option3', 'opt c'),
    headerIndex(header, 'option d', 'optiond', 'd', 'option4', 'opt d')
  ].map((i, n) => (hasHeader ? i : n + 1));
  const ai = hasHeader ? headerIndex(header, 'answer', 'correct', 'correct answer', 'correctoption', 'key', 'ans') : 5;
  const ei = hasHeader ? headerIndex(header, 'explanation', 'solution', 'reason') : 6;
  const si = hasHeader ? headerIndex(header, 'subject') : 7;
  const ti = hasHeader ? headerIndex(header, 'topic', 'chapter') : 8;
  const di = hasHeader ? headerIndex(header, 'difficulty', 'level') : 9;
  const mi = hasHeader ? headerIndex(header, 'marks', 'mark') : 10;
  const ni = hasHeader ? headerIndex(header, 'negative marks', 'negative', 'negativemark', 'minus') : 11;
  const yi = hasHeader ? headerIndex(header, 'pyq year', 'year', 'pyq') : 12;
  const cell = (r: string[], i: number) => (i >= 0 ? String(r[i] ?? '').trim() : '');

  return nonEmpty.slice(hasHeader ? 1 : 0).flatMap(r => {
    const questionText = cell(r, qi);
    if (!questionText) return [];
    const options = oi.map(i => cell(r, i));
    const marks = Number(cell(r, mi));
    const neg = Number(cell(r, ni));
    return [
      {
        ...blankDraft(d),
        questionText,
        options,
        correctOptionIndex: answerToIndex(cell(r, ai), options),
        explanation: cell(r, ei),
        subject: cell(r, si) || d.subject,
        topic: cell(r, ti),
        difficulty: normDifficulty(cell(r, di), d.difficulty),
        marks: Number.isFinite(marks) && marks > 0 ? marks : d.marks,
        negativeMarks: cell(r, ni) !== '' && Number.isFinite(neg) && neg >= 0 ? neg : d.negativeMarks,
        pyqYear: cell(r, yi) || undefined
      }
    ];
  });
};

/** Minimal RFC-4180 CSV reader (quoted fields, embedded commas/newlines). */
export const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',' || ch === '\t') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
};

// ---------------- free text (Word, PDF, photo, pasted) ----------------

const OPTION_MARK = /(?:^|\s)\(?([a-dA-D])[).\]]\s+/g;
const QUESTION_START = /^\s*(?:Q(?:uestion)?\s*\.?\s*)?(\d{1,3})\s*[).:-]\s*(.*)$/i;
const ANSWER_LINE = /^\s*(?:correct\s+)?(?:answer|ans|key)\s*[:.\-–]?\s*(?:option\s*)?\(?([a-dA-D1-4])\)?\b\s*(.*)$/i;
const EXPLANATION_LINE = /^\s*(?:explanation|solution|reason|exp)\s*[:.\-–]\s*(.*)$/i;

/** Split "…(a) x (b) y (c) z (d) w" into the stem and the options found. */
const splitOptions = (line: string): { before: string; options: string[] } | null => {
  const marks = [...line.matchAll(OPTION_MARK)];
  if (marks.length === 0) return null;
  // Options must start with a/A and go in order.
  const seq = marks.filter((m, i, all) => i === 0 || m[1].toLowerCase().charCodeAt(0) === all[i - 1][1].toLowerCase().charCodeAt(0) + 1);
  if (seq[0][1].toLowerCase() !== 'a' && !/^\s*\(?[b-d][).\]]/i.test(line)) return null;
  const before = line.slice(0, seq[0].index).trim();
  const options = seq.map((m, i) => {
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < seq.length ? seq[i + 1].index : line.length;
    return line.slice(start, end).trim();
  });
  return { before, options };
};

/** Parse an answer key such as "1-b, 2-c, 3 (a)" or "1. B  2. D" found anywhere in the text. */
const parseAnswerKey = (text: string): Map<number, string> => {
  const map = new Map<number, string>();
  const keySection = text.split(/\n\s*(?:answer\s*key|answers|key)\s*:?\s*\n/i)[1];
  if (!keySection) return map;
  for (const m of keySection.matchAll(/(\d{1,3})\s*[).:\-–]?\s*\(?([a-dA-D])\)?(?![a-z])/g)) map.set(Number(m[1]), m[2]);
  return map;
};

/**
 * Turns text extracted from a Word file, PDF or photo into draft questions.
 * Understands numbered questions, (a)/(b)/A)/a. options (one per line or inline),
 * "Answer:/Ans:" lines, "Explanation:" lines, and an answer key at the end.
 */
export const textToDrafts = (raw: string, d: ImportDefaults): DraftQuestion[] => {
  const text = raw.replace(/\r/g, '').replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
  const answerKey = parseAnswerKey(text);
  const body = text.split(/\n\s*(?:answer\s*key|answers)\s*:?\s*\n/i)[0];
  const lines = body.split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);

  const drafts: (DraftQuestion & { num?: number; ansRaw?: string })[] = [];
  let cur: (DraftQuestion & { num?: number; ansRaw?: string }) | null = null;
  let mode: 'stem' | 'options' | 'explanation' = 'stem';
  let optionCount = 0;

  const push = () => {
    if (cur && cur.questionText.trim()) drafts.push(cur);
    cur = null;
  };

  for (const line of lines) {
    const ans = line.match(ANSWER_LINE);
    if (ans && cur) {
      cur.ansRaw = ans[1];
      const rest = ans[2].replace(/^[-–:.)\s]+/, '');
      if (rest && EXPLANATION_LINE.test(rest)) cur.explanation = rest.replace(EXPLANATION_LINE, '$1');
      mode = 'explanation';
      continue;
    }
    const exp = line.match(EXPLANATION_LINE);
    if (exp && cur) {
      cur.explanation = exp[1];
      mode = 'explanation';
      continue;
    }
    const q = line.match(QUESTION_START);
    // A new number starts a new question unless we're still collecting this one's stem with no options yet.
    if (q && (!cur || optionCount > 0 || mode === 'explanation')) {
      push();
      cur = { ...blankDraft(d), num: Number(q[1]) };
      optionCount = 0;
      mode = 'stem';
      const split = splitOptions(q[2]);
      if (split && split.options.length >= 2) {
        cur.questionText = split.before;
        split.options.slice(0, 4).forEach((o, i) => (cur!.options[i] = o));
        optionCount = Math.min(4, split.options.length);
        mode = 'options';
      } else cur.questionText = q[2];
      continue;
    }
    if (!cur) continue;
    const split = splitOptions(line);
    if (split && mode !== 'explanation' && (split.before === '' || optionCount === 0)) {
      if (split.before) cur.questionText = `${cur.questionText} ${split.before}`.trim();
      for (const o of split.options) {
        if (optionCount < 4) cur.options[optionCount++] = o;
      }
      mode = 'options';
      continue;
    }
    if (mode === 'stem') cur.questionText = `${cur.questionText} ${line}`.trim();
    else if (mode === 'options' && optionCount > 0) cur.options[optionCount - 1] = `${cur.options[optionCount - 1]} ${line}`.trim();
    else if (mode === 'explanation') cur.explanation = `${cur.explanation} ${line}`.trim();
  }
  push();

  return drafts.map(({ num, ansRaw, ...draft }) => {
    const key = ansRaw ?? (num !== undefined ? answerKey.get(num) : undefined);
    return { ...draft, correctOptionIndex: key ? answerToIndex(key, draft.options) : -1 };
  });
};

// ---------------- file readers ----------------

export const sourceOf = (file: File): ImportSource | null => {
  const n = file.name.toLowerCase();
  if (/\.(xlsx|xlsm)$/.test(n) || /\.(csv|tsv)$/.test(n)) return 'spreadsheet';
  if (n.endsWith('.docx')) return 'word';
  if (n.endsWith('.pdf') || file.type === 'application/pdf') return 'pdf';
  if (file.type.startsWith('image/') || /\.(jpe?g|png|webp|heic)$/.test(n)) return 'image';
  if (n.endsWith('.txt')) return 'text';
  return null;
};

const readSpreadsheet = async (file: File): Promise<string[][]> => {
  if (/\.(csv|tsv)$/i.test(file.name)) return parseCsv(await file.text());
  const { readSheet } = await import('read-excel-file/universal');
  const data = await readSheet(file);
  return data.map(r => r.map(c => (c === null || c === undefined ? '' : c instanceof Date ? c.toISOString().slice(0, 10) : String(c))));
};

const readWord = async (file: File): Promise<string> => {
  const mammoth = await import('mammoth');
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return value;
};

const readPdf = async (file: File, onProgress?: (msg: string) => void): Promise<string> => {
  const pdfjs = await import('pdfjs-dist');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    onProgress?.(`Reading page ${p} of ${doc.numPages}…`);
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    // Rebuild lines from the text items' vertical positions.
    let lastY: number | null = null;
    let line = '';
    const out: string[] = [];
    for (const item of content.items as { str: string; transform: number[]; hasEOL?: boolean }[]) {
      const y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        out.push(line);
        line = '';
      }
      line += (line && !line.endsWith(' ') ? ' ' : '') + item.str;
      lastY = y;
      if (item.hasEOL) {
        out.push(line);
        line = '';
        lastY = null;
      }
    }
    if (line) out.push(line);
    pages.push(out.join('\n'));
  }
  return pages.join('\n');
};

const readImage = async (file: File, onProgress?: (msg: string) => void): Promise<string> => {
  const { createWorker } = await import('tesseract.js');
  onProgress?.('Loading the text reader (first time takes a few seconds)…');
  // The OCR engine is served from this site (public/ocr, copied by scripts/copy-ocr.mjs), not from a CDN.
  const base = new URL(`${import.meta.env.BASE_URL}ocr/`, window.location.href).href;
  const worker = await createWorker('eng', 1, {
    workerPath: `${base}worker.min.js`,
    corePath: `${base}core`,
    langPath: `${base}lang`,
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text') onProgress?.(`Reading the photo… ${Math.round(m.progress * 100)}%`);
    }
  });
  try {
    const { data } = await worker.recognize(file);
    return data.text;
  } finally {
    await worker.terminate();
  }
};

export type ImportResult = { drafts: DraftQuestion[]; source: ImportSource; rawText?: string };

/** Reads any supported file into draft questions for review. */
export const importQuestionsFromFile = async (
  file: File,
  defaults: ImportDefaults,
  onProgress?: (msg: string) => void
): Promise<ImportResult> => {
  const source = sourceOf(file);
  if (!source) throw new Error('Unsupported file. Use Excel (.xlsx), CSV, Word (.docx), PDF, a photo (JPG/PNG) or a .txt file.');
  onProgress?.('Reading the file…');
  if (source === 'spreadsheet') return { source, drafts: rowsToDrafts(await readSpreadsheet(file), defaults) };
  const rawText =
    source === 'word' ? await readWord(file) : source === 'pdf' ? await readPdf(file, onProgress) : source === 'image' ? await readImage(file, onProgress) : await file.text();
  return { source, rawText, drafts: textToDrafts(rawText, defaults) };
};

export const draftProblems = (q: DraftQuestion): string[] => {
  const p: string[] = [];
  if (!q.questionText.trim()) p.push('question text');
  if (q.options.filter(o => o.trim()).length < 2) p.push('at least 2 options');
  if (q.correctOptionIndex < 0 || !q.options[q.correctOptionIndex]?.trim()) p.push('correct answer');
  return p;
};
