// Extracts className-like string literals from .tsx using the TypeScript Compiler API.
// More robust than regex: catches class strings in className attrs AND in the class-map
// objects that dominate this repo (e.g. variantColorClasses in components/button.tsx).
import ts from 'typescript';
import type { StyleItem } from './types';

// A string "looks like Tailwind classes" if it has at least one utility-shaped token.
const UTILITY_TOKEN =
  /(?:^|\s)(?:[\w-]+:|\[[^\]]*\]:)*(?:bg-|text-|border|ring|rounded|shadow|from-|via-|to-|backdrop-|animate-|p[xytrbl]?-|m[xytrbl]?-|gap-|space-[xy]-|flex|grid|inline|hidden|items-|justify-|font-|leading-|tracking-|opacity-|w-|h-|size-|absolute|relative|fixed|sticky)/;

function looksLikeClasses(s: string): boolean {
  if (!s || s.length > 2000) return false;
  return UTILITY_TOKEN.test(s);
}

export function extractTsxItems(content: string, file: string): StyleItem[] {
  const sf = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const items: StyleItem[] = [];

  const push = (text: string, node: ts.Node) => {
    if (!looksLikeClasses(text)) return;
    const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
    items.push({ kind: 'class', value: text, raw: text, file, line });
  };

  const visit = (node: ts.Node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      push(node.text, node);
    } else if (ts.isTemplateExpression(node)) {
      // Grab the literal spans of a template (head + middles/tail); dynamic ${} parts are skipped.
      push(node.head.text, node.head);
      for (const span of node.templateSpans) push(span.literal.text, span.literal);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return items;
}
