import { fromMarkdown } from 'mdast-util-from-markdown';

export interface Entry { text: string; target: string; file: { path: string }; isAlias: boolean }
export interface Options { caseSensitive: boolean; wholeWord: boolean }
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Only replace original text nodes, never generated links or Markdown syntax. */
export function autoLink(content: string, entries: Entry[], options: Options): string {
  const key = (s: string) => options.caseSensitive ? s : s.toLowerCase();
  const groups = new Map<string, Entry[]>();
  for (const entry of entries) {
    if (!entry.text || /[\[\]|#^\r\n]/.test(entry.target + entry.text)) continue;
    const k = key(entry.text);
    groups.set(k, [...(groups.get(k) ?? []), entry]);
  }
  const unique = new Map<string, Entry>();
  for (const [k, group] of groups) {
    // A shared name/alias must not silently link to an arbitrary file.
    if (new Set(group.map(e => e.file.path)).size === 1) unique.set(k, group[0]);
  }
  const terms = [...unique.values()].sort((a, b) => b.text.length - a.text.length);
  if (!terms.length) return content;
  const regex = new RegExp(terms.map(e => escape(e.text)).join('|'), options.caseSensitive ? 'gu' : 'giu');
  const protectedRanges: [number, number][] = [];
  const protect = (pattern: RegExp) => {
    for (const m of content.matchAll(pattern)) protectedRanges.push([m.index!, m.index! + m[0].length]);
  };
  protect(/^\uFEFF?---[^\S\r\n]*\r?\n[\s\S]*?(?:\r?\n(?:---|\.\.\.)[^\S\r\n]*(?=\r?\n|$)|$)/g);
  protect(/!?\[\[[\s\S]*?(?:\]\]|$)/g);
  protect(/%%[\s\S]*?(?:%%|$)/g);
  protect(/\$\$[\s\S]*?(?:\$\$|$)|\$[^\n$]+\$/g);
  protect(/(?:https?:\/\/|mailto:|www\.)[^\s<>]+/gi);
  // Preserve GFM tables and tags as units; pipe aliases can alter table syntax.
  protect(/^.*\|.*$/gm);
  protect(/#[\p{L}\p{N}_/-]+/gu);
  const edits: { start: number; end: number; value: string }[] = [];
  const word = /[\p{L}\p{M}\p{N}_]/u;
  const segmenter = typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(undefined, { granularity: 'word' }) : null;
  const tree = fromMarkdown(content);
  function visit(node: any): void {
    if (['link','image','linkReference','imageReference','definition','code','inlineCode','html'].includes(node.type)) return;
    if (node.type === 'text') {
      const start = node.position.start.offset as number;
      const end = node.position.end.offset as number;
      const raw = content.slice(start, end);
      // Escapes/entities are deliberately left untouched.
      if (raw !== node.value) return;
      const boundaries = new Set<number>();
      if (segmenter) {
        for (const segment of segmenter.segment(raw)) {
          boundaries.add(segment.index);
          boundaries.add(segment.index + segment.segment.length);
        }
      }
      regex.lastIndex = 0;
      for (const match of raw.matchAll(regex)) {
        const a = start + match.index!;
        const b = a + match[0].length;
        if (protectedRanges.some(([lo, hi]) => a < hi && b > lo)) continue;
        const before = Array.from(content.slice(Math.max(0, a - 2), a)).pop() ?? '';
        const after = Array.from(content.slice(b, b + 2))[0] ?? '';
        if (options.wholeWord && !(boundaries.has(a - start) && boundaries.has(b - start)) &&
            (word.test(before) || word.test(after))) continue;
        const entry = unique.get(key(match[0]));
        if (!entry) continue;
        const value = match[0] === entry.target ? `[[${entry.target}]]` : `[[${entry.target}|${match[0]}]]`;
        edits.push({ start: a, end: b, value });
      }
    } else for (const child of node.children ?? []) visit(child);
  }
  visit(tree);
  let output = content;
  for (const edit of edits.sort((a, b) => b.start - a.start)) output = output.slice(0, edit.start) + edit.value + output.slice(edit.end);
  return output;
}
