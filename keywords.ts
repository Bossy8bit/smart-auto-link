import { fromMarkdown } from 'mdast-util-from-markdown';

/** Explicit user terms are not filtered by inferred-title length or stop words. */
export function validKeyword(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 &&
    !/[\[\]|\r\n]/u.test(value);
}

export function propertyKeywords(value: unknown): string[] {
  return [...new Set((Array.isArray(value) ? value : [value])
    .filter(validKeyword).map(term => term.trim()))];
}

/** Read plain ==highlights== from prose, excluding Markdown code and links. */
export function highlightKeywords(content: string): string[] {
  const blocked: [number, number][] = [];
  const protect = (pattern: RegExp) => {
    for (const match of content.matchAll(pattern)) {
      blocked.push([match.index!, match.index! + match[0].length]);
    }
  };
  protect(/^\uFEFF?---[^\S\r\n]*\r?\n[\s\S]*?(?:\r?\n(?:---|\.\.\.)[^\S\r\n]*(?=\r?\n|$)|$)/g);
  protect(/!?\[\[[\s\S]*?(?:\]\]|$)/g);
  protect(/%%[\s\S]*?(?:%%|$)/g);
  protect(/\$\$[\s\S]*?(?:\$\$|$)|\$[^\n$]+\$/g);
  protect(/(?:https?:\/\/|mailto:|www\.)[^\s<>]+/gi);
  const result = new Set<string>();
  function visit(node: any): void {
    if (['link', 'image', 'linkReference', 'imageReference', 'definition', 'code', 'inlineCode', 'html'].includes(node.type)) return;
    if (node.type === 'text') {
      const offset: number = node.position.start.offset;
      const raw = content.slice(offset, node.position.end.offset);
      if (raw !== node.value) return;
      for (const match of raw.matchAll(/(?<!=)==([^=\r\n]*[^\s=][^=\r\n]*)==(?!=)/gu)) {
        const start = offset + match.index!;
        const end = start + match[0].length;
        if (blocked.some(([lo, hi]) => start < hi && end > lo)) continue;
        if (validKeyword(match[1])) result.add(match[1].trim());
      }
    } else {
      for (const child of node.children ?? []) visit(child);
    }
  }
  visit(fromMarkdown(content));
  return [...result];
}
