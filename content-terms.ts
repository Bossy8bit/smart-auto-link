/** Extract words that repeat inside a note's content and use them as link terms. */
const stop = new Set([
  // English function/common words
  'the', 'and', 'for', 'with', 'from', 'into', 'about', 'that', 'this', 'these', 'those',
  'when', 'while', 'where', 'which', 'who', 'whom', 'whose', 'have', 'has', 'had', 'being',
  'were', 'been', 'would', 'should', 'could', 'might', 'must', 'shall', 'will', 'just', 'now',
  'all', 'any', 'both', 'each', 'more', 'most', 'other', 'some', 'such', 'only', 'own', 'same',
  'than', 'too', 'very', 'there', 'their', 'then', 'them', 'they', 'your', 'you', 'what', 'will',
  // Thai function words — exact same spelling convention as title-terms.ts (tuned for these notes)
  'การ', 'ของ', 'และ', 'ใน', 'จาก', 'กัับ', 'เพื่่อ', 'ท่ี', 'เป็็น', 'ไ้ด', 'ให',
  'ที่', 'ได้', 'ไม่', 'มา', 'ไป', 'จะ', 'แบบ', 'ตาม', 'หรือ', 'คือ', 'ส่วน', 'ตัว', 'ต้อง', 'ถูก', 'ต่ำ', 'ต้น', 'สูง', 'ยื่น', 'กลับ', 'เสีย', 'ค่า', 'คุณ', 'เพื่อ',
]);
const compactScript = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
const length = (value: string) => [...value].length;

/**
 * ponytail: minCount=3 / maxTerms=3 are hardcoded with a known ceiling; promote to
 * settings if per-vault tuning of "how repetitive" matters. O(content) per note.
 */
export function contentTerms(content: string, minimumLength: number, minCount = 3, maxTerms = 5): string[] {
  if (typeof Intl.Segmenter !== 'function' || !content) return [];
  const blocked: [number, number][] = [];
  const protect = (pattern: RegExp) => {
    for (const m of content.matchAll(pattern)) blocked.push([m.index!, m.index! + m[0].length]);
  };
  protect(/^\uFEFF?---[^\S\r\n]*\r?\n[\s\S]*?(?:\r?\n(?:---|\.\.\.)[^\S\r\n]*(?=\r?\n|$)|$)/g);
  protect(/!?\[\[[\s\S]*?(?:\]\]|$)/g);
  protect(/%%[\s\S]*?(?:%%|$)/g);
  protect(/\$\$[\s\S]*?(?:\$\$|$)|\$[^\n$]+\$/g);
  protect(/(?:https?:\/\/|mailto:|www\.)[^\s<>]+/gi);
  const inBlock = (start: number, end: number) => blocked.some(([lo, hi]) => start < hi && end > lo);
  const counts = new Map<string, { count: number; word: string }>();
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });
  for (const seg of segmenter.segment(content)) {
    if (!seg.isWordLike) continue;
    const start = seg.index, end = seg.index + seg.segment.length;
    if (inBlock(start, end)) continue;
    const word = seg.segment;
    if (length(word) < minimumLength) continue;
    const lower = word.toLocaleLowerCase();
    if (stop.has(lower)) continue;
    const entry = counts.get(lower);
    if (entry) entry.count++;
    else counts.set(lower, { count: 1, word });
  }
  return [...counts.values()]
    .filter(entry => entry.count >= minCount)
    .sort((a, b) => b.count - a.count || length(b.word) - length(a.word))
    .slice(0, maxTerms)
    .map(entry => entry.word);
}
