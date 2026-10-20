import type { Student, StudyMaterial } from '../types';

/** Is this material shared with this student (all students, one of their batches, or them personally)? */
export const materialIsFor = (m: StudyMaterial, s?: Pick<Student, 'id' | 'enrolledBatchId'>): boolean => {
  if (!s) return false;
  if (m.targetScope === 'all') return true;
  if (m.targetScope === 'batch') return m.targetBatchId === s.enrolledBatchId || !!m.targetBatchIds?.includes(s.enrolledBatchId);
  return m.targetStudentId === s.id;
};

export const MATERIAL_TYPES: StudyMaterial['type'][] = [
  'PDF Notes',
  'Handwritten Digest',
  'Mindmap',
  'Question Compendium',
  'Current Affairs',
  'Slides',
  'Worksheet',
  'Video',
  'Other'
];

/** Guess the material type from a file. */
export const typeForFile = (f: File): StudyMaterial['type'] => {
  const n = f.name.toLowerCase();
  if (f.type.startsWith('video/')) return 'Video';
  if (/\.(pptx?|key|odp)$/.test(n)) return 'Slides';
  if (f.type.startsWith('image/')) return 'Handwritten Digest';
  if (/\.(xlsx?|csv)$/.test(n)) return 'Worksheet';
  if (/question|mcq|pyq|qbank/.test(n)) return 'Question Compendium';
  if (/current.?affairs|\bca\b/.test(n)) return 'Current Affairs';
  if (/mind.?map/.test(n)) return 'Mindmap';
  return n.endsWith('.pdf') || /\.docx?$/.test(n) ? 'PDF Notes' : 'Other';
};

/** "polity_parliament-notes_v2.pdf" → "Polity parliament notes v2" */
export const titleFromFileName = (name: string) => {
  const base = name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return base.charAt(0).toUpperCase() + base.slice(1);
};

export const MAX_FILE_BYTES = 60 * 1024 * 1024;

/** Number of pages in a PDF (0 if it can't be read). Loads the PDF reader on demand. */
export const pdfPageCount = async (file: File): Promise<number> => {
  try {
    const pdfjs = await import('pdfjs-dist');
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    return doc.numPages;
  } catch {
    return 0;
  }
};
