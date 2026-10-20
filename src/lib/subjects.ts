// Subject names are written differently in different places ("Indian Polity", "Indian Polity & Governance",
// "Indian Polity (GS-2)"). These helpers match them by their key words.
const STOP = new Set(['indian', 'and', 'the', 'of', 'paper', 'gs', 'i', 'ii', 'iii', 'iv', '1', '2', '3', '4', 'weekly', 'mains', 'answer', 'writing', 'studies', 'case', 'macro', 'trends', 'general']);

export const subjectTokens = (s: string): string[] =>
  s
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter(t => t.length > 1 && !STOP.has(t));

/** True when two subject names refer to the same subject (they share a key word). */
export const sameSubject = (a: string, b: string): boolean => {
  if (a === b) return true;
  const ta = subjectTokens(a);
  const tb = new Set(subjectTokens(b));
  return ta.some(t => tb.has(t));
};
