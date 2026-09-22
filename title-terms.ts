const compactScript = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
const length = (value: string) => [...value].length;
const singleStop = new Set(['เดือน']);
const incompleteEnds = new Set(['เงิน']);
const stop = new Set([
  'การ', 'ของ', 'และ', 'ใน', 'จาก', 'กับ', 'เพื่อ', 'ที่', 'เป็น', 'ได้', 'ให้',
  'แนวทาง', 'วางแผน', 'ประหยัด', 'วิธี', 'คู่มือ', 'เรื่อง', 'เกี่ยวกับ', 'ฉบับ',
  'the', 'and', 'for', 'with', 'from', 'into', 'about', 'guide', 'notes',
]);

/** Extract title terms in any script supported by the host's Unicode word segmenter. */
export function titleTerms(title: string, minimumLength: number): string[] {
  if (typeof Intl.Segmenter !== 'function') return [];
  const segments = [...new Intl.Segmenter(undefined, { granularity: 'word' }).segment(title)];
  const result = new Set<string>();
  for (let i = 0; i < segments.length; i++) {
    const first = segments[i];
    if (!first.isWordLike || stop.has(first.segment.toLocaleLowerCase())) continue;
    const singleMin = compactScript.test(first.segment) ? minimumLength : Math.max(minimumLength, 5);
    if (length(first.segment) >= singleMin && !singleStop.has(first.segment.toLocaleLowerCase())) {
      result.add(first.segment);
    }
    for (let count = 2; count <= 3 && i + count <= segments.length; count++) {
      const group = segments.slice(i, i + count);
      if (group.some((item, j) => !item.isWordLike || stop.has(item.segment.toLocaleLowerCase()) ||
        (j > 0 && item.index !== group[j - 1].index + group[j - 1].segment.length))) break;
      if (incompleteEnds.has(group[group.length - 1].segment)) continue;
      const term = group.map(item => item.segment).join('');
      const phraseMin = compactScript.test(term) ? minimumLength : Math.max(minimumLength, 6);
      if (length(term) >= phraseMin) result.add(term);
    }
  }
  return [...result].filter(term => term !== title);
}
