/**
 * config-files.ts — the project files the 0.x/1.x → 2.0 migration edits besides the code: `.npmrc` and the
 * `transpilePackages` of `next.config`. Both are someone else's configuration: the codemod takes out only what the
 * DS put there and leaves the rest as it found it. When it cannot tell what is the DS's (a variable, a spread), the
 * change is reported as manual instead of guessed.
 *
 * Pure functions (text in, text out), so each case is a fixture in __fixtures__/config.
 */
import { Node, Project, SyntaxKind, ts } from 'ts-morph';
import type { ArrayLiteralExpression, ObjectLiteralElementLike } from 'ts-morph';

const GITHUB_PACKAGES = 'npm.pkg.github.com';

/** `@rojao:registry=` or `@rojaostudio:registry=` pointing at GitHub Packages. */
const DS_REGISTRY = /^\s*@(?:rojao|rojaostudio):registry\s*=\s*\S*npm\.pkg\.github\.com/i;
/** The GitHub Packages token line. */
const GITHUB_TOKEN = /^\s*\/\/npm\.pkg\.github\.com\/:_authToken\s*=/i;
const COMMENT = /^\s*[#;]/;

export interface NpmrcChange {
  /** The new content; `''` means nothing is left and the file can go. */
  output: string;
  /** The lines taken out, as they were. */
  removed: string[];
  /** The token line stayed because another scope still points at GitHub Packages (those lines). */
  tokenKeptFor: string[];
}

/**
 * Takes the DS scope off GitHub Packages (the scope is public on npmjs since 1.0.0, #102). Only the
 * `@rojao:registry` / `@rojaostudio:registry` lines go. The `//npm.pkg.github.com/:_authToken` line goes too, but
 * only when nothing else in the file still points at `npm.pkg.github.com`: another scope of the project may live
 * there, and taking its token would break its install. Returns undefined when the file has no DS registry line.
 */
export function cleanNpmrc(text: string): NpmrcChange | undefined {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r?\n/);
  const removed = lines.filter((l) => DS_REGISTRY.test(l));
  if (!removed.length) return undefined;

  let kept = lines.filter((l) => !DS_REGISTRY.test(l));
  const othersOnGithub = kept.filter((l) => !COMMENT.test(l) && !GITHUB_TOKEN.test(l) && l.includes(GITHUB_PACKAGES));
  if (!othersOnGithub.length) {
    removed.push(...kept.filter((l) => GITHUB_TOKEN.test(l)));
    kept = kept.filter((l) => !GITHUB_TOKEN.test(l));
  }

  const body = kept.join(eol).replace(/(\r?\n){3,}/g, eol + eol).replace(/\s+$/, '');
  return {
    output: body.trim() ? body + eol : '',
    removed,
    tokenKeptFor: othersOnGithub.map((l) => l.trim()),
  };
}

// ── next.config ───────────────────────────────────────────────────────────────────────────────────

/** The DS entries of `transpilePackages`; nothing else is taken out. */
const DS_PACKAGES = new Set(['@rojaostudio/ds', '@rojao/ds']);

export type NextConfigChange =
  | { kind: 'none' }
  | { kind: 'changed'; output: string; removed: string[]; removedKey: boolean }
  | { kind: 'manual'; reason: string };

const project = new Project({
  useInMemoryFileSystem: true,
  skipAddingFilesFromTsConfig: true,
  compilerOptions: { allowJs: true, jsx: ts.JsxEmit.Preserve },
});

interface Range {
  start: number;
  end: number;
}

/**
 * Takes `@rojaostudio/ds` / `@rojao/ds` out of `transpilePackages` (it existed because `exports` pointed at
 * `.ts`/`.tsx`; the package ships compiled since #100). The other packages stay. The key goes only when the array
 * is left empty. An array the codemod cannot read whole (a variable, a spread, a computed entry, an assignment
 * outside the object) is manual.
 */
export function cleanNextConfig(text: string, fileName: string): NextConfigChange {
  if (!text.includes('transpilePackages')) return { kind: 'none' };
  const ext = /\.[mc]?ts$/.test(fileName) ? '.ts' : '.js';
  const sf = project.createSourceFile(`/virtual/next.config${ext}`, text, { overwrite: true });
  try {
    const props: ObjectLiteralElementLike[] = [];
    let other = false;
    sf.forEachDescendant((node) => {
      if (Node.isPropertyAssignment(node) || Node.isShorthandPropertyAssignment(node)) {
        if (propName(node) === 'transpilePackages') props.push(node);
      } else if (Node.isBinaryExpression(node) && node.getOperatorToken().getKind() === SyntaxKind.EqualsToken) {
        // config.transpilePackages = […] / config['transpilePackages'] = […]
        const left = node.getLeft();
        if (Node.isPropertyAccessExpression(left) && left.getName() === 'transpilePackages') other = true;
        if (Node.isElementAccessExpression(left) && /^['"`]transpilePackages['"`]$/.test(left.getArgumentExpression()?.getText() ?? '')) other = true;
      }
    });
    if (other) {
      return { kind: 'manual', reason: '`transpilePackages` é atribuído fora do objeto de configuração: tire @rojaostudio/ds de lá à mão' };
    }
    if (!props.length) return { kind: 'none' };

    const ranges: Range[] = [];
    const removed: string[] = [];
    let removedKey = false;
    for (const prop of props) {
      if (!Node.isPropertyAssignment(prop)) {
        return { kind: 'manual', reason: '`transpilePackages` vem de uma variável: tire @rojaostudio/ds da lista à mão' };
      }
      const init = prop.getInitializer();
      if (!init || !Node.isArrayLiteralExpression(init)) {
        return { kind: 'manual', reason: '`transpilePackages` não é uma lista literal (variável ou expressão): tire @rojaostudio/ds à mão' };
      }
      const elements = init.getElements();
      if (elements.some((e) => !Node.isStringLiteral(e) && !Node.isNoSubstitutionTemplateLiteral(e))) {
        return { kind: 'manual', reason: '`transpilePackages` tem spread ou item calculado: tire @rojaostudio/ds da lista à mão' };
      }
      const isDs = elements.map((e) => DS_PACKAGES.has((e as unknown as { getLiteralValue(): string }).getLiteralValue()));
      if (!isDs.some(Boolean)) continue;
      removed.push(...elements.filter((_, i) => isDs[i]).map((e) => e.getText()));
      if (isDs.every(Boolean)) {
        ranges.push(propertyRange(text, prop.getStart(), prop.getEnd()));
        removedKey = true;
      } else {
        ranges.push(...elementRanges(init, isDs));
      }
    }
    if (!ranges.length) return { kind: 'none' };

    let output = text;
    for (const r of ranges.sort((a, b) => b.start - a.start)) output = output.slice(0, r.start) + output.slice(r.end);
    return { kind: 'changed', output, removed, removedKey };
  } finally {
    project.removeSourceFile(sf);
  }
}

function propName(node: ObjectLiteralElementLike): string | undefined {
  if (Node.isShorthandPropertyAssignment(node)) return node.getName();
  if (Node.isPropertyAssignment(node)) {
    const name = node.getNameNode();
    if (Node.isIdentifier(name)) return name.getText();
    if (Node.isStringLiteral(name)) return name.getLiteralValue();
  }
  return undefined;
}

/** The DS entries of the array, each with the separator that goes with it, so the rest stays well formed. */
function elementRanges(array: ArrayLiteralExpression, isDs: boolean[]): Range[] {
  const elements = array.getElements();
  const lastKept = isDs.lastIndexOf(false);
  const ranges: Range[] = [];
  // Before the last kept entry: from the entry to the next one (its comma and spacing go with it).
  for (let i = 0; i < lastKept; i++) {
    if (isDs[i]) ranges.push({ start: elements[i].getStart(), end: elements[i + 1].getStart() });
  }
  // After it: from the end of the last kept entry to the end of the last one (a trailing comma, if any, stays).
  if (lastKept < elements.length - 1) {
    ranges.push({ start: elements[lastKept].getEnd(), end: elements[elements.length - 1].getEnd() });
  }
  return ranges;
}

/** The property, its comma and, when it sits alone on its line, the whole line. */
function propertyRange(text: string, start: number, end: number): Range {
  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
  let after = end;
  while (after < text.length && (text[after] === ' ' || text[after] === '\t')) after++;
  const comma = text[after] === ',';
  if (comma) after++;

  if (/^[ \t]*$/.test(text.slice(lineStart, start))) {
    let lineEnd = after;
    while (lineEnd < text.length && (text[lineEnd] === ' ' || text[lineEnd] === '\t')) lineEnd++;
    if (text.startsWith('\r\n', lineEnd)) return { start: lineStart, end: lineEnd + 2 };
    if (text[lineEnd] === '\n') return { start: lineStart, end: lineEnd + 1 };
  }
  if (comma) {
    while (after < text.length && (text[after] === ' ' || text[after] === '\t')) after++;
    return { start, end: after };
  }
  // The last property on a shared line: the comma before it goes instead.
  let before = start - 1;
  while (before >= 0 && /\s/.test(text[before])) before--;
  return { start: text[before] === ',' ? before : start, end };
}
