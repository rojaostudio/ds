// Line-based CSS declaration extractor (keeps line numbers, unlike the block-regex in
// validate-themes.ts). Good enough for authored CSS; not a full AST.
import type { StyleItem } from './types';

export function extractCssItems(content: string, file: string): StyleItem[] {
  const items: StyleItem[] = [];
  const lines = content.split(/\r?\n/);
  let inComment = false;

  for (let i = 0; i < lines.length; i++) {
    let s = lines[i];
    if (inComment) {
      const end = s.indexOf('*/');
      if (end < 0) continue;
      s = s.slice(end + 2);
      inComment = false;
    }
    s = s.replace(/\/\*.*?\*\//g, '');
    const open = s.indexOf('/*');
    if (open >= 0) {
      s = s.slice(0, open);
      inComment = true;
    }
    // Extract every `prop: value` terminated by `;` or `}` — handles inline decls
    // like `.a { color: #000; }` while skipping selectors and at-rules.
    const declRe = /(?:^|[{;])\s*([a-zA-Z-]+)\s*:\s*([^;{}]+?)\s*(?=[;}])/g;
    let m: RegExpExecArray | null;
    while ((m = declRe.exec(s))) {
      items.push({
        kind: 'css-decl',
        value: `${m[1]}: ${m[2].trim()}`,
        raw: lines[i],
        file,
        line: i + 1,
      });
    }
  }
  return items;
}
