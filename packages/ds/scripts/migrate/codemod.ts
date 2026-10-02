/**
 * codemod.ts — rewrites a consumer's .ts/.tsx from the 0.x/1.x API of `@rojaostudio/ds` to the 2.0 API.
 *
 * The rules are data in ./map.ts; this file is the engine. It parses with ts-morph and never prints the AST back:
 * every change is a text edit on the original source (start, end, replacement), applied once at the end. That keeps
 * the consumer's formatting, and it is what makes the Drawer ↔ Sheet swap safe — both renames read the original
 * text, so one never sees the other's output.
 *
 * Two outcomes per usage:
 *  - auto: the change is mechanical and is applied;
 *  - manual: it is not (structure changes, dynamic values, props with no 2.0 equivalent). The usage is left as it
 *    is and reported; with `annotate` (the CLI's --apply) a `TODO(ds-2.0): …` comment is written above it.
 * Plus notices: usages that compile and render on 2.0 but should move on (deprecated wrappers, an IconButton
 * without a Tooltip). Only reported, never written, not even as a TODO.
 *
 * Granularity: a component whose name stays (Button, Input…) is migrated usage by usage. A renamed one (Modal →
 * Dialog) is all-or-nothing per file, because its import and every reference change together.
 */
import { Node, Project, SyntaxKind, ts } from 'ts-morph';
import type {
  Identifier,
  ImportDeclaration,
  ImportSpecifier,
  JsxAttribute,
  JsxElement,
  JsxOpeningElement,
  JsxSelfClosingElement,
  SourceFile,
} from 'ts-morph';
import {
  BADGE_VARIANTS,
  BUTTON_MANUAL,
  BUTTON_TONES,
  BUTTON_VARIANTS,
  COMPONENTS,
  DEPRECATED,
  DS_PACKAGE,
  EMPTY_STATE_ICONS,
  EXPORTS_MANUAL,
  FILE_OF_EXPORT,
  FILE_REMOVED_NOTES,
  FILE_RENAMES,
  ICON_BUTTON_TOOLTIP,
  MOVED_EXPORTS,
  NOTICE_TONES,
  PACKAGE_RENAMES,
  SKELETON_VARIANTS,
  TOAST_MANUAL,
  TOAST_TONES,
  TYPES,
} from './map';
import type { ComponentRule, PropRule } from './map';

export interface Finding {
  /** 1-based line in the original source. */
  line: number;
  /** A stable id for grouping (`Button`, `Select`, `Modal.headerAction`…). */
  rule: string;
  /** What was done (auto) or what to do (manual), in pt-BR. */
  message: string;
}

export interface TransformResult {
  output: string;
  changed: boolean;
  auto: Finding[];
  manual: Finding[];
  /** Left as they are on purpose: deprecated wrappers still in the package, IconButton without a Tooltip. */
  notices: Finding[];
}

export interface TransformOptions {
  /** Write a `TODO(ds-2.0)` comment above each manual usage (the CLI's --apply). */
  annotate?: boolean;
}

const project = new Project({
  useInMemoryFileSystem: true,
  skipAddingFilesFromTsConfig: true,
  compilerOptions: { jsx: ts.JsxEmit.Preserve, allowJs: true },
});

/** Does this source import the DS at all? A cheap test before parsing. */
export function mentionsDs(code: string): boolean {
  return /['"]@rojao(?:studio)?\/ds(?:\/[^'"]*)?['"]/.test(code);
}

export function transformSource(source: string, fileName: string, options: TransformOptions = {}): TransformResult {
  // The parser drops a byte-order mark from its positions: edit without it and put it back.
  const bom = source.charCodeAt(0) === 0xfeff ? source[0] : '';
  const code = bom ? source.slice(1) : source;
  const ext = fileName.endsWith('.ts') && !fileName.endsWith('.d.ts') ? '.ts' : '.tsx';
  const sf = project.createSourceFile(`/virtual/source${ext}`, code, { overwrite: true });
  try {
    const result = new Migrator(sf, code, options).run();
    return { ...result, output: bom + result.output };
  } finally {
    project.removeSourceFile(sf);
  }
}

// ── text edits ─────────────────────────────────────────────────────────────────────────────────────

interface Edit {
  start: number;
  end: number;
  text: string;
}

function applyEdits(code: string, edits: Edit[]): string {
  // Replacements before inserts at the same position, so an insert lands in front of what replaced the range.
  const sorted = [...edits].sort((a, b) => b.start - a.start || b.end - a.end);
  let out = code;
  let floor = Infinity;
  for (const e of sorted) {
    if (e.end > floor) throw new Error(`overlapping edits at ${e.start}-${e.end}`);
    out = out.slice(0, e.start) + e.text + out.slice(e.end);
    floor = e.start;
  }
  return out;
}

// ── JSX attribute values ───────────────────────────────────────────────────────────────────────────

type AttrValue =
  | { kind: 'true' }
  | { kind: 'string'; value: string }
  | { kind: 'number'; value: number }
  | { kind: 'bool'; value: boolean }
  | { kind: 'expr'; text: string; node: Node };

function attrValue(attr: JsxAttribute): AttrValue {
  const init = attr.getInitializer();
  if (!init) return { kind: 'true' };
  if (Node.isStringLiteral(init)) return { kind: 'string', value: init.getLiteralValue() };
  if (Node.isJsxExpression(init)) {
    const e = init.getExpression();
    if (!e) return { kind: 'expr', text: '', node: init };
    if (Node.isStringLiteral(e) || Node.isNoSubstitutionTemplateLiteral(e)) return { kind: 'string', value: e.getLiteralValue() };
    if (Node.isNumericLiteral(e)) return { kind: 'number', value: e.getLiteralValue() };
    if (e.getKind() === SyntaxKind.TrueKeyword) return { kind: 'bool', value: true };
    if (e.getKind() === SyntaxKind.FalseKeyword) return { kind: 'bool', value: false };
    return { kind: 'expr', text: e.getText(), node: e };
  }
  return { kind: 'expr', text: init.getText(), node: init };
}

const isTrue = (v: AttrValue) => v.kind === 'true' || (v.kind === 'bool' && v.value);
const literal = (v: AttrValue) => (v.kind === 'string' ? v.value : undefined);

function matchesLiteral(v: AttrValue, expected: string | boolean): boolean {
  if (typeof expected === 'boolean') return expected ? isTrue(v) : v.kind === 'bool' && !v.value;
  return v.kind === 'string' && v.value === expected;
}

function stringAttr(name: string, value: string): string {
  return value.includes('"') ? `${name}={${JSON.stringify(value)}}` : `${name}="${value}"`;
}

/** The attribute's value as it would be written after `name=` (or nothing for a bare boolean). */
function initializerText(attr: JsxAttribute): string {
  const init = attr.getInitializer();
  return init ? `=${init.getText()}` : '';
}

/** A JSX child for a string: plain text when it is safe, `{"…"}` otherwise. */
function jsxTextFor(value: string): string {
  return /^[^{}<>\n]*$/.test(value) && value.trim() === value && value !== '' ? value : `{${JSON.stringify(value)}}`;
}

/** An attribute value or expression as a JSX child. */
function childFromValue(v: AttrValue): string | undefined {
  if (v.kind === 'string') return jsxTextFor(v.value);
  if (v.kind === 'number') return String(v.value);
  if (v.kind === 'expr') return `{${v.text}}`;
  return undefined;
}

const SIMPLE_OPERAND = new Set([
  SyntaxKind.Identifier,
  SyntaxKind.PropertyAccessExpression,
  SyntaxKind.ElementAccessExpression,
  SyntaxKind.CallExpression,
  SyntaxKind.NumericLiteral,
  SyntaxKind.ParenthesizedExpression,
]);

// ── element context ────────────────────────────────────────────────────────────────────────────────

type Tag = JsxOpeningElement | JsxSelfClosingElement;

interface ManualNote {
  rule: string;
  message: string;
}

/** One JSX usage and the edits planned for it. Nothing reaches the source until the Migrator commits it. */
class ElementCtx {
  readonly attrs = new Map<string, JsxAttribute>();
  readonly hasSpread: boolean;
  private readonly ops = new Map<JsxAttribute, string | null>();
  private readonly adds: string[] = [];
  readonly manual: ManualNote[] = [];
  readonly changes: string[] = [];
  /** Text that becomes the element's children (label → children). */
  childrenText?: string;
  /** Drop the children and make the element self-closing (children → description). */
  dropChildren = false;
  /** Per-usage conversion to another export (Badge → Status, Input → PasswordInput, Notice → Alert). */
  convertTo?: string;
  /** DS exports this usage needs imported (Button for an Alert action…). */
  readonly needs = new Set<string>();
  /** Imports from other packages (`lucide-react` icons for the EmptyState). */
  readonly externalNeeds: { module: string; name: string }[] = [];

  constructor(
    readonly tag: Tag,
    readonly component: string,
  ) {
    for (const a of tag.getAttributes()) {
      if (Node.isJsxAttribute(a)) this.attrs.set(a.getNameNode().getText(), a);
    }
    this.hasSpread = tag.getAttributes().some((a) => Node.isJsxSpreadAttribute(a));
  }

  get element(): JsxElement | JsxSelfClosingElement {
    return Node.isJsxSelfClosingElement(this.tag) ? this.tag : (this.tag.getParentOrThrow() as JsxElement);
  }

  has(name: string) {
    return this.attrs.has(name);
  }
  value(name: string): AttrValue | undefined {
    const a = this.attrs.get(name);
    return a ? attrValue(a) : undefined;
  }
  /** Replace an attribute with other text (one or more attributes). */
  replace(name: string, text: string) {
    const a = this.attrs.get(name);
    if (a) this.ops.set(a, text);
  }
  remove(name: string) {
    const a = this.attrs.get(name);
    if (a) this.ops.set(a, null);
  }
  rename(name: string, to: string) {
    const a = this.attrs.get(name);
    if (a) this.ops.set(a, `${to}${initializerText(a)}`);
  }
  add(text: string) {
    this.adds.push(text);
  }
  isTouched(name: string) {
    const a = this.attrs.get(name);
    return a ? this.ops.has(a) : false;
  }
  addManual(rule: string, message: string) {
    this.manual.push({ rule, message });
  }
  note(change: string) {
    if (!this.changes.includes(change)) this.changes.push(change);
  }

  /** The children as written, ignoring whitespace-only text. */
  children(): Node[] {
    const el = this.element;
    if (!Node.isJsxElement(el)) return [];
    return el.getJsxChildren().filter((c) => !(Node.isJsxText(c) && c.containsOnlyTriviaWhiteSpaces()));
  }

  get dirty() {
    return this.ops.size > 0 || this.adds.length > 0 || this.childrenText !== undefined || this.dropChildren || !!this.convertTo;
  }

  /** The edits for this usage. `tagName` is the name the element ends up with. */
  edits(code: string, tagName: string, currentName: string): Edit[] {
    const edits: Edit[] = [];
    for (const [attr, text] of this.ops) {
      if (text === null) edits.push({ start: attr.getFullStart(), end: attr.getEnd(), text: '' });
      else edits.push({ start: attr.getStart(), end: attr.getEnd(), text });
    }
    const attrsNode = this.tag.getAttributes();
    const lastAttr = attrsNode[attrsNode.length - 1];
    const anchor = lastAttr ? lastAttr.getEnd() : this.tag.getTagNameNode().getEnd();
    if (this.adds.length) edits.push({ start: anchor, end: anchor, text: ' ' + this.adds.join(' ') });

    if (tagName !== currentName) {
      const tagNode = this.tag.getTagNameNode();
      edits.push({ start: tagNode.getStart(), end: tagNode.getEnd(), text: tagName });
      const el = this.element;
      if (Node.isJsxElement(el)) {
        const closing = el.getClosingElement().getTagNameNode();
        edits.push({ start: closing.getStart(), end: closing.getEnd(), text: tagName });
      }
    }

    const el = this.element;
    if (this.childrenText !== undefined) {
      if (Node.isJsxSelfClosingElement(el)) {
        // `… />` → `…>children</Tag>`, trimming the space before `/>`.
        let i = el.getEnd() - 2;
        while (i > anchor && /\s/.test(code[i - 1])) i--;
        edits.push({ start: i, end: el.getEnd(), text: `>${this.childrenText}</${tagName}>` });
      } else {
        const opening = el.getOpeningElement();
        const closing = el.getClosingElement();
        edits.push({ start: opening.getEnd(), end: closing.getStart(), text: this.childrenText });
      }
    } else if (this.dropChildren && Node.isJsxElement(el)) {
      // `…>children</Tag>` → `… />`
      const opening = el.getOpeningElement();
      const gt = opening.getEnd() - 1;
      const before = code[gt - 1];
      edits.push({ start: gt, end: el.getEnd(), text: /\s/.test(before) ? '/>' : ' />' });
    }
    return edits;
  }
}

// ── imports ────────────────────────────────────────────────────────────────────────────────────────

interface DsImport {
  decl: ImportDeclaration;
  /** The specifier with the package already renamed (`@rojao/ds/x` → `@rojaostudio/ds/x`). */
  module: string;
  /** `components` (the barrel), `components/<file>` (deep) or anything else. */
  kind: 'barrel' | 'deep' | 'other';
  file?: string;
  quote: string;
  semicolon: boolean;
  typeOnly: boolean;
}

interface Binding {
  imp: DsImport;
  spec: ImportSpecifier;
  imported: string;
  local: string;
  aliased: boolean;
  typeOnly: boolean;
  /** Decided name after migration (imported side). */
  to?: string;
  /** Local name references are renamed to (only when not aliased). */
  localTo?: string;
  /** Remove the specifier: merged into another, or every usage converted away. */
  remove?: boolean;
  /** Left on the old API on purpose (manual, or already 2.0): keep its old module too. */
  keep?: boolean;
}

function parseModule(spec: string): { module: string; kind: DsImport['kind']; file?: string } | undefined {
  let module = spec;
  for (const [from, to] of Object.entries(PACKAGE_RENAMES)) {
    if (spec === from || spec.startsWith(from + '/')) module = to + spec.slice(from.length);
  }
  if (module !== DS_PACKAGE && !module.startsWith(DS_PACKAGE + '/')) return undefined;
  const sub = module.slice(DS_PACKAGE.length);
  if (sub === '/components') return { module, kind: 'barrel' };
  const m = /^\/components\/([\w-]+)$/.exec(sub);
  if (m) return { module, kind: 'deep', file: m[1] };
  return { module, kind: 'other' };
}

// ── the migrator ───────────────────────────────────────────────────────────────────────────────────

const FOCUSABLE_TAGS = new Set(['button', 'a', 'input', 'select', 'textarea', 'summary']);

class Migrator {
  private readonly edits: Edit[] = [];
  private readonly auto: Finding[] = [];
  private readonly manual: (Finding & { pos: number })[] = [];
  private readonly notices: Finding[] = [];
  private readonly imports: DsImport[] = [];
  private readonly bindings: Binding[] = [];
  private readonly refs = new Map<string, Identifier[]>();
  private readonly declared = new Set<string>();
  private readonly quote: string;
  /** DS exports to add, by name. */
  private readonly toAdd = new Set<string>();
  private readonly externalToAdd: { module: string; name: string }[] = [];

  constructor(
    private readonly sf: SourceFile,
    private readonly code: string,
    private readonly options: TransformOptions,
  ) {
    const firstQuote = /from\s+(['"])@rojao/.exec(code);
    this.quote = firstQuote ? firstQuote[1] : "'";
  }

  private line(pos: number) {
    return this.sf.getLineAndColumnAtPos(pos).line;
  }

  private reportAuto(pos: number, rule: string, message: string) {
    this.auto.push({ line: this.line(pos), rule, message });
  }

  private reportNotice(pos: number, rule: string, message: string) {
    const line = this.line(pos);
    if (!this.notices.some((m) => m.line === line && m.rule === rule)) this.notices.push({ line, rule, message });
  }

  private reportManual(pos: number, rule: string, message: string) {
    const line = this.line(pos);
    if (this.manual.some((m) => m.line === line && m.message === message)) return;
    this.manual.push({ line, rule, message, pos });
  }

  run(): TransformResult {
    this.collectImports();
    if (!this.imports.length) return { output: this.code, changed: false, auto: [], manual: [], notices: [] };
    this.collectNames();

    this.collectNotices();
    this.migrateComponents();
    this.migrateToast();
    this.migrateTypesAndExports();
    this.emitImports();

    if (this.options.annotate) this.emitTodos();

    const output = this.edits.length ? applyEdits(this.code, this.edits) : this.code;
    const byLine = (a: Finding, b: Finding) => a.line - b.line;
    return {
      output,
      changed: output !== this.code,
      auto: this.auto.sort(byLine),
      manual: this.manual.map(({ line, rule, message }) => ({ line, rule, message })).sort(byLine),
      notices: this.notices.sort(byLine),
    };
  }

  // ── collection ──────────────────────────────────────────────────────────────────────────────────

  private collectImports() {
    for (const decl of this.sf.getImportDeclarations()) {
      const spec = decl.getModuleSpecifierValue();
      const parsed = parseModule(spec);
      if (!parsed) continue;
      const raw = decl.getModuleSpecifier().getText();
      const imp: DsImport = {
        decl,
        module: parsed.module,
        kind: parsed.kind,
        file: parsed.file,
        quote: raw[0],
        semicolon: decl.getText().trimEnd().endsWith(';'),
        typeOnly: decl.isTypeOnly(),
      };
      this.imports.push(imp);
      if (imp.kind === 'other') continue;

      if (decl.getNamespaceImport() || decl.getDefaultImport()) {
        this.reportManual(
          decl.getStart(),
          'import-namespace',
          'import default/namespace do DS: troque por imports nomeados para o codemod conseguir migrar.',
        );
      }
      if (imp.kind === 'deep' && imp.file && FILE_RENAMES[imp.file] === null) {
        this.reportManual(decl.getStart(), `import:${imp.file}`, FILE_REMOVED_NOTES[imp.file] ?? `components/${imp.file} saiu na 2.0.`);
      }
      for (const spec of decl.getNamedImports()) {
        const alias = spec.getAliasNode();
        this.bindings.push({
          imp,
          spec,
          imported: spec.getName(),
          local: alias ? alias.getText() : spec.getName(),
          aliased: !!alias,
          typeOnly: imp.typeOnly || spec.isTypeOnly(),
        });
      }
    }

    // Re-exports from the DS keep their old names: renaming them would change this module's own API.
    for (const exp of this.sf.getExportDeclarations()) {
      const spec = exp.getModuleSpecifierValue();
      if (spec && parseModule(spec) && parseModule(spec)!.kind !== 'other') {
        this.reportManual(exp.getStart(), 'reexport', 'export … from do DS: reexporte com os nomes da 2.0 à mão (o codemod não muda a API deste módulo).');
      }
    }
  }

  private collectNames() {
    this.sf.forEachDescendant((node) => {
      if (!Node.isIdentifier(node)) return;
      const parent = node.getParent();
      if (!parent) return;
      if (node.getFirstAncestorByKind(SyntaxKind.ImportDeclaration)) {
        if ((Node.isImportSpecifier(parent) && (parent.getAliasNode() ?? parent.getNameNode()) === node) || Node.isImportClause(parent) || Node.isNamespaceImport(parent)) {
          this.declared.add(node.getText());
        }
        return;
      }
      if (isDeclarationName(node, parent)) {
        this.declared.add(node.getText());
        return;
      }
      if (!isReference(node, parent)) return;
      const list = this.refs.get(node.getText()) ?? [];
      list.push(node);
      this.refs.set(node.getText(), list);
    });
  }

  private refsOf(b: Binding): Identifier[] {
    return this.refs.get(b.local) ?? [];
  }

  private jsxTagsOf(b: Binding): Tag[] {
    const tags: Tag[] = [];
    for (const id of this.refsOf(b)) {
      const p = id.getParent();
      if ((Node.isJsxOpeningElement(p) || Node.isJsxSelfClosingElement(p)) && p.getTagNameNode() === id) tags.push(p);
    }
    return tags;
  }

  /** A DS binding's local name for `name`, or undefined. */
  private dsLocal(name: string): string | undefined {
    const b = this.bindings.find((x) => !x.typeOnly && (x.to ?? x.imported) === name && !x.remove);
    return b ? (b.aliased ? b.local : (b.localTo ?? b.local)) : undefined;
  }

  /** Can `name` be imported from the DS without clashing? Returns the local name to use. */
  private canUse(name: string): string | undefined {
    const existing = this.dsLocal(name) ?? this.bindings.find((x) => !x.typeOnly && x.imported === name)?.local;
    if (existing) return existing;
    if (this.declared.has(name)) return undefined;
    return name;
  }

  // ── notices ─────────────────────────────────────────────────────────────────────────────────────

  /** Deprecated wrappers still in the package, and IconButtons not wrapped in a Tooltip: reported only. */
  private collectNotices() {
    const tooltipLocals = new Set(['Tooltip', ...this.bindings.filter((b) => b.imported === 'Tooltip').map((b) => b.local)]);
    for (const b of this.bindings) {
      if (b.imp.kind === 'other' || b.typeOnly) continue;
      const message = DEPRECATED[b.imported];
      if (message) {
        const tags = this.jsxTagsOf(b);
        if (tags.length) for (const t of tags) this.reportNotice(t.getStart(), `deprecated:${b.imported}`, message);
        else this.reportNotice(b.spec.getStart(), `deprecated:${b.imported}`, message);
      }
      // Compound members (`<PageShell.Header>`).
      for (const id of this.refsOf(b)) {
        const access = id.getParent();
        if (!Node.isPropertyAccessExpression(access) || access.getExpression() !== id) continue;
        const member = `${b.imported}.${access.getName()}`;
        const tag = access.getParent();
        if (!DEPRECATED[member] || !(Node.isJsxOpeningElement(tag) || Node.isJsxSelfClosingElement(tag)) || tag.getTagNameNode() !== access) continue;
        this.reportNotice(tag.getStart(), `deprecated:${member}`, DEPRECATED[member]);
      }
      if (b.imported === 'IconButton') {
        for (const t of this.jsxTagsOf(b)) {
          const el = Node.isJsxSelfClosingElement(t) ? t : t.getParent();
          const parent = el?.getParent();
          const inTooltip = Node.isJsxElement(parent) && tooltipLocals.has(parent.getOpeningElement().getTagNameNode().getText());
          if (!inTooltip) this.reportNotice(t.getStart(), 'IconButton.tooltip', ICON_BUTTON_TOOLTIP);
        }
      }
    }
  }

  // ── components ──────────────────────────────────────────────────────────────────────────────────

  private migrateComponents() {
    // Decide renamed bindings first: whether each will be renamed affects the collision checks of the others
    // (BottomSheet → Drawer only works if the old Drawer leaves the name free).
    const planned: { b: Binding; rule: ComponentRule; ctxs: ElementCtx[] }[] = [];

    for (const b of this.bindings) {
      if (b.imp.kind === 'other' || b.typeOnly) continue;
      const rule = COMPONENTS[b.imported];
      if (!rule) continue;
      const tags = this.jsxTagsOf(b);

      if (rule.manual) {
        const isNew = rule.newApiProps && tags.some((t) => hasAnyAttr(t, rule.newApiProps!));
        if (isNew) {
          b.keep = true;
          continue;
        }
        b.keep = true;
        if (rule.silent) continue; // reported with its group (the Table)
        if (tags.length) for (const t of tags) this.reportManual(t.getStart(), b.imported, rule.manual);
        else this.reportManual(b.spec.getStart(), b.imported, rule.manual);
        continue;
      }

      if (rule.to && rule.newApiProps && tags.some((t) => hasAnyAttr(t, rule.newApiProps!))) {
        // Already the 2.0 component with this name (the 2.0 Drawer, the 2.0 Toggle): nothing to migrate.
        b.keep = true;
        continue;
      }

      const ctxs = tags
        .filter((t) => !(rule.newApiProps && hasAnyAttr(t, rule.newApiProps)))
        .map((t) => this.processElement(t, b, rule));
      planned.push({ b, rule, ctxs });
    }

    // Renamed components: all or nothing.
    const renamed = planned.filter((p) => p.rule.to);
    for (const p of renamed) {
      if (p.ctxs.some((c) => c.manual.length)) p.b.keep = true;
    }
    // Families: a follower stays with a leader that stays.
    for (const p of planned) {
      const leaders = p.rule.follows ?? [];
      if (this.bindings.some((x) => leaders.includes(x.imported) && x.imp.kind !== 'other' && x.keep)) p.b.keep = true;
    }
    // Collisions: the new name must be free, counting the old names that are leaving.
    let changed = true;
    while (changed) {
      changed = false;
      const leaving = new Set(renamed.filter((p) => !p.b.keep && !p.b.aliased).map((p) => p.b.local));
      for (const p of renamed) {
        if (p.b.keep) continue;
        const to = p.rule.to!;
        const sameDs = this.bindings.find((x) => x !== p.b && !x.typeOnly && x.imported === to && x.imp.kind !== 'other' && !COMPONENTS[to]?.to);
        if (sameDs) continue; // merged below
        if (!p.b.aliased && this.declared.has(to) && !leaving.has(to)) {
          p.b.keep = true;
          this.reportManual(p.b.spec.getStart(), `${p.b.imported}.collision`, `${p.b.imported} vira ${to} na 2.0, mas ${to} já existe neste arquivo: renomeie um dos dois e migre à mão.`);
          changed = true;
        }
      }
    }

    for (const p of planned) {
      const { b, rule, ctxs } = p;
      if (b.keep && !rule.to) continue; // a follower left with its family
      if (rule.to && b.keep) {
        for (const c of ctxs) for (const m of c.manual) this.reportManual(c.tag.getStart(), m.rule, m.message);
        continue;
      }
      if (rule.to) this.renameBinding(b, rule.to);

      // A usage left for a person keeps its import where it was (a deep import does not move to the 2.0 file).
      if (ctxs.some((c) => c.manual.length)) b.keep = true;
      let converted = 0;
      for (const c of ctxs) {
        if (c.manual.length) {
          for (const m of c.manual) this.reportManual(c.tag.getStart(), m.rule, m.message);
          continue;
        }
        const resolved = this.resolveNeeds(c);
        if (!resolved) continue;
        const current = c.tag.getTagNameNode().getText();
        const finalName = resolved.convertedTag ?? (rule.to && !b.aliased ? (b.localTo ?? current) : current);
        if (c.convertTo) converted++;
        if (!c.dirty && !rule.to) continue;
        // The tag rename of a renamed binding comes from renameBinding (every reference); here only the rest.
        this.edits.push(...c.edits(this.code, finalName, rule.to && !b.aliased ? finalName : current));
        if (c.dirty || rule.to) {
          const what = [rule.to ? `${b.imported} → ${rule.to}` : c.convertTo ? `${b.imported} → ${c.convertTo}` : b.imported, ...c.changes];
          this.reportAuto(c.tag.getStart(), rule.to ? `${b.imported}→${rule.to}` : b.imported, what.join('; '));
        }
      }
      // Every usage converted to another export, and nothing else refers to it: the import goes.
      if (converted && converted === this.refsOf(b).length - this.closingRefs(b)) b.remove = true;
    }

    // The Table's cells, when the Table itself was not in this file.
    const tableReported = this.manual.some((m) => m.rule === 'Table');
    if (!tableReported) {
      const cell = this.bindings.find((b) => COMPONENTS[b.imported]?.silent && b.imp.kind !== 'other');
      if (cell) this.reportManual(cell.spec.getStart(), 'Table', COMPONENTS.Table.manual!);
    }

    // Value exports with no replacement.
    for (const b of this.bindings) {
      const msg = EXPORTS_MANUAL[b.imported];
      if (!msg || b.imp.kind === 'other') continue;
      b.keep = true;
      const refs = this.refsOf(b);
      if (refs.length) for (const r of refs) this.reportManual(r.getStart(), b.imported, msg);
      else this.reportManual(b.spec.getStart(), b.imported, msg);
    }
  }

  private closingRefs(b: Binding): number {
    return this.refsOf(b).filter((id) => Node.isJsxClosingElement(id.getParent())).length;
  }

  /** Resolve the imports a usage needs; a clash makes it manual (undefined). */
  private resolveNeeds(c: ElementCtx): { convertedTag?: string } | undefined {
    const names = new Set(c.needs);
    if (c.convertTo) names.add(c.convertTo);
    const locals = new Map<string, string>();
    for (const n of names) {
      const local = this.canUse(n);
      // The generated JSX writes the export's own name (<Button>), so an aliased import is a clash too.
      if (!local || local !== n) {
        this.reportManual(c.tag.getStart(), `${c.component}.collision`, `${c.component}: a migração precisa importar ${n} do DS, mas ${n} já existe neste arquivo. Migre à mão.`);
        return undefined;
      }
      locals.set(n, local);
    }
    for (const ext of c.externalNeeds) {
      const existing = this.sf
        .getImportDeclarations()
        .find((d) => d.getModuleSpecifierValue() === ext.module)
        ?.getNamedImports()
        .some((s) => s.getName() === ext.name && !s.getAliasNode());
      if (!existing && this.declared.has(ext.name)) {
        this.reportManual(c.tag.getStart(), `${c.component}.collision`, `${c.component}: o ícone ${ext.name} (lucide-react) conflita com um nome deste arquivo. Migre à mão.`);
        return undefined;
      }
    }
    for (const n of names) if (!this.dsLocal(n) && !this.bindings.some((x) => !x.typeOnly && x.imported === n)) this.toAdd.add(n);
    for (const ext of c.externalNeeds) {
      if (!this.externalToAdd.some((e) => e.module === ext.module && e.name === ext.name)) this.externalToAdd.push(ext);
    }
    return { convertedTag: c.convertTo ? locals.get(c.convertTo) : undefined };
  }

  private renameBinding(b: Binding, to: string) {
    b.to = to;
    this.reportAuto(b.spec.getStart(), `${b.imported}→${to}`, `import ${b.imported} → ${to}`);
    const same = this.bindings.find((x) => x !== b && !x.typeOnly && x.imported === to && x.imp.kind !== 'other' && !COMPONENTS[to]?.to);
    if (same) {
      // The file already imports the 2.0 name: drop this specifier and point the references there.
      b.remove = true;
      if (!b.aliased) {
        b.localTo = same.local;
        for (const id of this.refsOf(b)) this.renameRef(id, same.local);
      }
      return;
    }
    if (!b.aliased) {
      b.localTo = to;
      for (const id of this.refsOf(b)) this.renameRef(id, to);
    }
  }

  private renameRef(id: Identifier, to: string) {
    const p = id.getParent();
    if (Node.isShorthandPropertyAssignment(p)) {
      this.edits.push({ start: id.getStart(), end: id.getEnd(), text: `${id.getText()}: ${to}` });
    } else if (Node.isExportSpecifier(p) && !p.getAliasNode()) {
      this.edits.push({ start: id.getStart(), end: id.getEnd(), text: `${to} as ${id.getText()}` });
    } else {
      this.edits.push({ start: id.getStart(), end: id.getEnd(), text: to });
    }
  }

  private processElement(tag: Tag, b: Binding, rule: ComponentRule): ElementCtx {
    const c = new ElementCtx(tag, b.imported);
    const hasRules = !!(rule.props || rule.transforms || rule.require);
    if (c.hasSpread && hasRules) {
      c.addManual(`${b.imported}.spread`, `${b.imported} com {...props}: confira as props antigas dentro do objeto e migre à mão.`);
      return c;
    }
    for (const [prop, message] of Object.entries(rule.require ?? {})) {
      if (!c.has(prop)) c.addManual(`${b.imported}.${prop}`, message);
    }
    for (const [prop, pr] of Object.entries(rule.props ?? {})) this.applyProp(c, prop, pr);
    for (const t of rule.transforms ?? []) TRANSFORMS[t](c);
    return c;
  }

  private applyProp(c: ElementCtx, prop: string, pr: PropRule) {
    const id = `${c.component}.${prop}`;
    const v = c.value(prop);
    const to = pr.to ?? prop;
    if (!v) {
      if (pr.absent) {
        c.add(stringAttr(to, pr.absent));
        c.note(`${to}="${pr.absent}" (o padrão antigo era outro)`);
      }
      return;
    }
    if (pr.drop) {
      c.remove(prop);
      c.note(`${prop} removido`);
      return;
    }
    if (pr.dropIf !== undefined) {
      if (matchesLiteral(v, pr.dropIf)) {
        c.remove(prop);
        c.note(`${prop} removido (era o padrão)`);
      } else c.addManual(id, pr.manual ?? `${prop} saiu na 2.0.`);
      return;
    }
    if (pr.values) {
      const lit = literal(v);
      if (lit === undefined) {
        c.addManual(id, `${c.component}: ${prop} dinâmico ({${v.kind === 'expr' ? v.text : '…'}}) — mapeie os valores à mão (${describeValues(pr.values)}).`);
        return;
      }
      if (!(lit in pr.values)) {
        c.addManual(id, pr.manual ?? `${c.component}: ${prop}="${lit}" não tem equivalente na 2.0.`);
        return;
      }
      const mapped = pr.values[lit];
      if (mapped === null) {
        c.remove(prop);
        c.note(`${prop}="${lit}" removido (é o padrão da 2.0)`);
      } else {
        c.replace(prop, stringAttr(to, mapped));
        if (to !== prop || mapped !== lit) c.note(`${prop}="${lit}" → ${to}="${mapped}"`);
      }
      return;
    }
    if (pr.to) {
      c.rename(prop, pr.to);
      c.note(`${prop} → ${pr.to}`);
      return;
    }
    if (pr.manual) c.addManual(id, pr.manual);
  }

  // ── toast ───────────────────────────────────────────────────────────────────────────────────────

  private migrateToast() {
    for (const b of this.bindings) {
      if (b.imported !== 'toast' || b.typeOnly || b.imp.kind === 'other') continue;
      let migrated = 0;
      let manual = 0;
      for (const id of this.refsOf(b)) {
        const p = id.getParent();
        if (Node.isCallExpression(p) && p.getExpression() === id) {
          const r = this.rewriteToast(p, undefined);
          if (r === true) migrated++;
          else if (r === false) manual++;
        } else if (Node.isPropertyAccessExpression(p) && p.getExpression() === id) {
          const call = p.getParent();
          if (!Node.isCallExpression(call) || call.getExpression() !== p) continue;
          const method = p.getName();
          if (method === 'dismiss') continue;
          if (TOAST_MANUAL[method]) {
            this.reportManual(call.getStart(), `toast.${method}`, TOAST_MANUAL[method]);
            manual++;
            continue;
          }
          if (method in TOAST_TONES) {
            const r = this.rewriteToast(call, method);
            if (r === true) migrated++;
            else if (r === false) manual++;
          }
        }
      }
      // Nothing migrated here and something left for a person: the import stays where it was.
      if (manual && !migrated) b.keep = true;
    }
  }

  /** true: rewritten; false: left for a person (reported); undefined: nothing to do. */
  private rewriteToast(call: Node, method: string | undefined): boolean | undefined {
    if (!Node.isCallExpression(call)) return undefined;
    const args = call.getArguments();
    if (!args.length) return undefined;
    // Already the 2.0 call: toast({ title, … }).
    if (!method && args.length === 1 && Node.isObjectLiteralExpression(args[0])) return undefined;
    const q = this.quote;
    const props: string[] = [`title: ${args[0].getText()}`];
    let tone = method ? TOAST_TONES[method] : null;
    const opts = args[1];
    const rest: string[] = [];
    if (opts) {
      if (!Node.isObjectLiteralExpression(opts)) {
        this.reportManual(call.getStart(), 'toast.options', TOAST_MANUAL.options);
        return false;
      }
      for (const prop of opts.getProperties()) {
        if (Node.isPropertyAssignment(prop) || Node.isShorthandPropertyAssignment(prop)) {
          const name = prop.getName();
          if (name === 'variant') {
            const init = Node.isPropertyAssignment(prop) ? prop.getInitializer() : undefined;
            const lit = init && (Node.isStringLiteral(init) || Node.isNoSubstitutionTemplateLiteral(init)) ? init.getLiteralValue() : undefined;
            if (lit === 'loading') {
              this.reportManual(call.getStart(), 'toast.loading', TOAST_MANUAL.loading);
              return false;
            }
            if (lit === undefined || !(lit in TOAST_TONES)) {
              this.reportManual(call.getStart(), 'toast.variant', 'toast com variant dinâmico: troque por tone (success, danger, warning, info, neutral) à mão.');
              return false;
            }
            tone = TOAST_TONES[lit];
            continue;
          }
          rest.push(prop.getText());
        } else {
          this.reportManual(call.getStart(), 'toast.options', TOAST_MANUAL.options);
          return false;
        }
      }
    }
    if (tone) props.push(`tone: ${q}${tone}${q}`);
    props.push(...rest);
    const callee = call.getExpression();
    const name = Node.isPropertyAccessExpression(callee) ? callee.getExpression().getText() : callee.getText();
    this.edits.push({ start: call.getStart(), end: call.getEnd(), text: `${name}({ ${props.join(', ')} })` });
    this.reportAuto(call.getStart(), 'toast', `${method ? `toast.${method}` : 'toast'}(mensagem, opções) → toast({ title${tone ? ', tone' : ''} … })`);
    return true;
  }

  // ── types and leftovers ─────────────────────────────────────────────────────────────────────────

  private migrateTypesAndExports() {
    for (const b of this.bindings) {
      if (b.imp.kind === 'other') continue;
      const t = TYPES[b.imported];
      if (!t || COMPONENTS[b.imported]) continue;
      if (t.manual) {
        b.keep = true;
        this.reportManual(b.spec.getStart(), `type:${b.imported}`, t.manual);
        continue;
      }
      if (t.follows) {
        const owner = this.bindings.find((x) => x.imported === t.follows && x.imp.kind !== 'other');
        if (owner?.keep) {
          b.keep = true;
          continue;
        }
      }
      if (t.to) {
        this.renameBinding(b, t.to);
      }
    }
  }

  // ── import emission ─────────────────────────────────────────────────────────────────────────────

  /** The module a binding ends up in. */
  private targetModule(b: Binding): string {
    const imp = b.imp;
    const moved = MOVED_EXPORTS[b.to ?? b.imported];
    if (moved && !b.keep) return moved;
    if (imp.kind !== 'deep' || !imp.file) return imp.module;
    if (b.keep) return imp.module;
    const name = b.to ?? b.imported;
    const renamedFile = FILE_RENAMES[imp.file];
    const file = FILE_OF_EXPORT[name] ?? (renamedFile === null ? imp.file : (renamedFile ?? imp.file));
    return `${DS_PACKAGE}/components/${file}`;
  }

  private specText(b: Binding): string {
    const name = b.to ?? b.imported;
    const typePrefix = b.spec.isTypeOnly() ? 'type ' : '';
    const local = b.aliased ? b.local : (b.localTo ?? b.local);
    return local === name ? `${typePrefix}${name}` : `${typePrefix}${name} as ${local}`;
  }

  private emitImports() {
    const { quote: q } = this;
    let lastDsImport: ImportDeclaration | undefined;
    let barrel: DsImport | undefined;

    for (const imp of this.imports) {
      lastDsImport = imp.decl;
      const decl = imp.decl;
      const specLiteral = decl.getModuleSpecifier();
      if (imp.kind === 'barrel' && !imp.typeOnly && !barrel) barrel = imp;

      if (imp.kind === 'other' || decl.getNamespaceImport() || decl.getDefaultImport()) {
        if (imp.module !== decl.getModuleSpecifierValue()) {
          this.edits.push({ start: specLiteral.getStart(), end: specLiteral.getEnd(), text: `${imp.quote}${imp.module}${imp.quote}` });
          this.reportAuto(decl.getStart(), 'package', `${decl.getModuleSpecifierValue()} → ${imp.module}`);
        }
        continue;
      }

      const mine = this.bindings.filter((b) => b.imp === imp);
      const groups = new Map<string, Binding[]>();
      for (const b of mine) {
        if (b.remove) continue;
        const m = this.targetModule(b);
        groups.set(m, [...(groups.get(m) ?? []), b]);
      }
      const extra = imp === barrel ? [...this.toAdd] : [];
      if (imp === barrel) this.toAdd.clear();

      const modules = [...groups.keys()];
      const main = modules.includes(imp.module) ? imp.module : modules[0];
      const kept = main ? groups.get(main)! : [];
      if (!kept.length && !extra.length) {
        // Every specifier left (or moved): drop the declaration, with its line.
        const start = decl.getStart();
        let end = decl.getEnd();
        if (this.code[end] === '\r') end++;
        if (this.code[end] === '\n') end++;
        this.edits.push({ start, end, text: '' });
      } else {
        // Fine-grained edits keep the consumer's formatting (one per line, several per line, trailing comma).
        const specs = decl.getNamedImports();
        const stays = specs.map((s) => kept.some((b) => b.spec === s));
        for (let i = 0; i < specs.length; i++) {
          if (stays[i]) continue;
          let j = i;
          while (j + 1 < specs.length && !stays[j + 1]) j++;
          // A run of leaving specifiers: up to the next one that stays, or back from the previous one at the end.
          if (j + 1 < specs.length) this.edits.push({ start: specs[i].getStart(), end: specs[j + 1].getStart(), text: '' });
          else if (i > 0) this.edits.push({ start: specs[i - 1].getEnd(), end: specs[j].getEnd(), text: '' });
          i = j;
        }
        for (const b of kept) {
          const text = this.specText(b);
          if (text !== b.spec.getText()) this.edits.push({ start: b.spec.getStart(), end: b.spec.getEnd(), text });
        }
        if (extra.length) {
          const lastKept = [...specs].reverse().find((s, k) => stays[specs.length - 1 - k]);
          if (lastKept) this.edits.push({ start: lastKept.getEnd(), end: lastKept.getEnd(), text: `, ${extra.join(', ')}` });
          else {
            const named = decl.getImportClause()?.getNamedBindings();
            if (named) this.edits.push({ start: named.getStart(), end: named.getEnd(), text: `{ ${extra.join(', ')} }` });
          }
        }
        if (main && main !== decl.getModuleSpecifierValue()) {
          this.edits.push({ start: specLiteral.getStart(), end: specLiteral.getEnd(), text: `${imp.quote}${main}${imp.quote}` });
        }
      }
      if (main && main !== decl.getModuleSpecifierValue()) {
        this.reportAuto(decl.getStart(), 'import', `${decl.getModuleSpecifierValue()} → ${main}`);
      }

      // Specifiers that moved to another file get their own declaration, right after this one.
      const added: string[] = [];
      for (const m of modules) {
        if (m === main) continue;
        const items = groups.get(m)!.map((b) => this.specText(b));
        added.push(`import ${imp.typeOnly ? 'type ' : ''}{ ${items.join(', ')} } from ${imp.quote}${m}${imp.quote}${imp.semicolon ? ';' : ''}`);
        this.reportAuto(decl.getStart(), 'import', `${items.join(', ')} → ${m}`);
      }
      if (added.length) this.edits.push({ start: decl.getEnd(), end: decl.getEnd(), text: '\n' + added.join('\n') });
    }

    // DS exports the migration needs and no barrel import could take.
    if (this.toAdd.size && lastDsImport) {
      const deep = this.imports.some((i) => i.kind === 'deep');
      const semi = lastDsImport.getText().trimEnd().endsWith(';') ? ';' : '';
      const lines = deep
        ? [...this.toAdd].map((n) => `import { ${n} } from ${q}${DS_PACKAGE}/components/${FILE_OF_EXPORT[n] ?? n.toLowerCase()}${q}${semi}`)
        : [`import { ${[...this.toAdd].join(', ')} } from ${q}${DS_PACKAGE}/components${q}${semi}`];
      this.edits.push({ start: lastDsImport.getEnd(), end: lastDsImport.getEnd(), text: '\n' + lines.join('\n') });
    }

    // lucide-react icons (EmptyState → Empty).
    const byModule = new Map<string, string[]>();
    for (const e of this.externalToAdd) byModule.set(e.module, [...(byModule.get(e.module) ?? []), e.name]);
    for (const [module, names] of byModule) {
      const decl = this.sf.getImportDeclarations().find((d) => d.getModuleSpecifierValue() === module && !d.isTypeOnly() && !d.getNamespaceImport());
      const have = new Set(decl?.getNamedImports().map((s) => s.getName()) ?? []);
      const missing = names.filter((n) => !have.has(n));
      if (!missing.length) continue;
      if (decl && decl.getNamedImports().length) {
        const last = decl.getNamedImports().at(-1)!;
        this.edits.push({ start: last.getEnd(), end: last.getEnd(), text: `, ${missing.join(', ')}` });
      } else if (lastDsImport) {
        const semi = lastDsImport.getText().trimEnd().endsWith(';') ? ';' : '';
        this.edits.push({ start: lastDsImport.getEnd(), end: lastDsImport.getEnd(), text: `\nimport { ${missing.join(', ')} } from ${q}${module}${q}${semi}` });
      }
    }
  }

  // ── TODO comments ───────────────────────────────────────────────────────────────────────────────

  private emitTodos() {
    const done = new Set<string>();
    for (const m of this.manual) {
      const lineStart = this.code.lastIndexOf('\n', m.pos - 1) + 1;
      const indent = /^[ \t]*/.exec(this.code.slice(lineStart))![0];
      const message = m.message.replace(/\*\//g, '* /').replace(/\s+/g, ' ');
      const key = `${lineStart}:${message}`;
      if (done.has(key)) continue;
      done.add(key);
      // Idempotent: a second --apply does not stack the same comment.
      const prevEnd = lineStart - 1;
      const prevStart = this.code.lastIndexOf('\n', prevEnd - 1) + 1;
      if (prevEnd > 0 && this.code.slice(prevStart, prevEnd).includes(`TODO(ds-2.0): ${message}`)) continue;
      const body = `TODO(ds-2.0): ${message}`;
      const ctx = this.commentContext(lineStart + indent.length);
      const text = ctx === 'jsx-child' ? `{/* ${body} */}` : ctx === 'jsx-attr' ? `/* ${body} */` : `// ${body}`;
      this.edits.push({ start: lineStart, end: lineStart, text: `${indent}${text}\n` });
    }
  }

  /** What kind of place a line starts in, to pick a comment that is valid there. */
  private commentContext(pos: number): 'jsx-child' | 'jsx-attr' | 'js' {
    let node: Node | undefined = this.sf.getDescendantAtPos(pos);
    if (!node) return 'js';
    while (node.getParent() && node.getParent()!.getStart() === pos && !Node.isSourceFile(node.getParent()!)) node = node.getParent()!;
    const parent = node.getParent();
    const inChildren = (n: Node | undefined) => !!n && (Node.isJsxElement(n) || Node.isJsxFragment(n));
    if (Node.isJsxClosingElement(node) || Node.isJsxClosingFragment(node)) return 'jsx-child';
    if ((Node.isJsxElement(node) || Node.isJsxSelfClosingElement(node) || Node.isJsxFragment(node) || Node.isJsxText(node) || Node.isJsxExpression(node)) && inChildren(parent)) {
      return 'jsx-child';
    }
    if (Node.isJsxAttribute(node) || Node.isJsxSpreadAttribute(node) || (parent && parent.getKind() === SyntaxKind.JsxAttributes)) return 'jsx-attr';
    if (Node.isJsxText(node)) return 'jsx-child';
    return 'js';
  }

}

function describeValues(values: Record<string, string | null>): string {
  return Object.entries(values)
    .map(([k, v]) => `${k}→${v ?? '(padrão)'}`)
    .join(', ');
}

function hasAnyAttr(tag: Tag, names: string[]): boolean {
  return tag.getAttributes().some((a) => Node.isJsxAttribute(a) && names.includes(a.getNameNode().getText()));
}

function isDeclarationName(node: Identifier, parent: Node): boolean {
  if (
    Node.isVariableDeclaration(parent) ||
    Node.isFunctionDeclaration(parent) ||
    Node.isClassDeclaration(parent) ||
    Node.isParameterDeclaration(parent) ||
    Node.isInterfaceDeclaration(parent) ||
    Node.isTypeAliasDeclaration(parent) ||
    Node.isEnumDeclaration(parent) ||
    Node.isTypeParameterDeclaration(parent)
  ) {
    return parent.getNameNode() === node;
  }
  if (Node.isBindingElement(parent)) return parent.getNameNode() === node;
  return false;
}

function isReference(node: Identifier, parent: Node): boolean {
  if (Node.isPropertyAccessExpression(parent) && parent.getNameNode() === node) return false;
  if (Node.isQualifiedName(parent) && parent.getRight() === node) return false;
  if (Node.isPropertyAssignment(parent) && parent.getNameNode() === node) return false;
  if (Node.isPropertySignature(parent) || Node.isPropertyDeclaration(parent) || Node.isMethodDeclaration(parent) || Node.isMethodSignature(parent)) {
    return parent.getNameNode() !== node;
  }
  if (Node.isEnumMember(parent) || Node.isJsxAttribute(parent)) return false;
  if (Node.isBindingElement(parent) && parent.getPropertyNameNode() === node) return false;
  if (Node.isExportSpecifier(parent) && parent.getAliasNode() === node) return false;
  if (Node.isLabeledStatement(parent) || Node.isBreakStatement(parent) || Node.isContinueStatement(parent)) return false;
  return true;
}

// ── transforms ─────────────────────────────────────────────────────────────────────────────────────

type Transform = (c: ElementCtx) => void;

/** Button and IconButton: the old variant × color grid → the 2.0 tone × variant. */
function buttonGrid(c: ElementCtx, defaults: { variant: string; color: string }) {
  const variant = c.value('variant');
  const color = c.value('color');
  let oldVariant = defaults.variant;
  let oldColor = defaults.color;
  if (variant) {
    const lit = literal(variant);
    if (lit === undefined) return c.addManual(`${c.component}.variant`, `${c.component}: variant dinâmico — mapeie filled→fill, outline, ghost e a cor para tone à mão.`);
    if (BUTTON_MANUAL[lit]) return c.addManual(`${c.component}.variant=${lit}`, BUTTON_MANUAL[lit]);
    if (!BUTTON_VARIANTS[lit]) return c.addManual(`${c.component}.variant`, `${c.component}: variant="${lit}" não existe na 2.0.`);
    oldVariant = lit;
  }
  if (color) {
    const lit = literal(color);
    if (lit === undefined) return c.addManual(`${c.component}.color`, `${c.component}: color dinâmico — mapeie primary→action, secondary→neutral, danger→danger em tone à mão.`);
    if (!BUTTON_TONES[lit]) return c.addManual(`${c.component}.color`, `${c.component}: color="${lit}" não tem tone equivalente.`);
    oldColor = lit;
  }
  const tone = BUTTON_TONES[oldColor];
  const v = BUTTON_VARIANTS[oldVariant];
  const toneAttr = tone !== 'action' ? `tone="${tone}"` : '';
  const variantAttr = v !== 'fill' ? `variant="${v}"` : '';
  const parts = [toneAttr, variantAttr].filter(Boolean).join(' ');
  if (variant && color) {
    // Each one stays where it was written.
    if (toneAttr) c.replace('color', toneAttr);
    else c.remove('color');
    if (variantAttr) c.replace('variant', variantAttr);
    else c.remove('variant');
    c.note(`variant/color → ${parts || 'padrão (tone action, variant fill)'}`);
  } else if (variant || color) {
    const host = variant ? 'variant' : 'color';
    if (parts) c.replace(host, parts);
    else c.remove(host);
    c.note(`variant/color → ${parts || 'padrão (tone action, variant fill)'}`);
  } else if (parts) {
    c.add(parts);
    c.note(`${parts} explícito (o padrão antigo era ${defaults.variant}/${defaults.color})`);
  }
}

const TRANSFORMS: Record<string, Transform> = {
  button(c) {
    buttonGrid(c, { variant: 'filled', color: 'primary' });
    if (c.has('iconLeft')) {
      if (c.has('iconRight') || c.has('icon')) {
        return c.addManual('Button.iconLeft', 'Button com iconLeft e iconRight: o Button 2.0 tem um ícone só (`icon` + iconPosition start/end). Escolha um dos dois.');
      }
      c.replace('iconLeft', `icon${initializerText(c.attrs.get('iconLeft')!)} iconPosition="start"`);
      c.note('iconLeft → icon + iconPosition="start"');
    }
    const full = c.value('fullWidth');
    if (!full) return;
    if (full.kind === 'bool' && !full.value) {
      c.remove('fullWidth');
      return;
    }
    if (!isTrue(full)) return c.addManual('Button.fullWidth', 'fullWidth dinâmico saiu: aplique w-full no className quando precisar.');
    const cls = c.value('className');
    if (!cls) c.add('className="w-full"');
    else if (cls.kind === 'string') c.replace('className', stringAttr('className', `${cls.value} w-full`.trim()));
    else return c.addManual('Button.fullWidth', 'fullWidth saiu: acrescente w-full ao className (que aqui é dinâmico).');
    c.remove('fullWidth');
    c.note('fullWidth → className w-full');
  },

  iconButton(c) {
    const label = c.attrs.get('aria-label');
    if (!label) return c.addManual('IconButton.label', 'IconButton 2.0 exige `label` (o nome lido pelo leitor de tela); o aria-label não foi achado aqui.');
    buttonGrid(c, { variant: 'ghost', color: 'neutral' });
    c.rename('aria-label', 'label');
    c.note('aria-label → label');
  },

  alert(c) {
    const kids = c.children();
    if (kids.length) {
      if (c.has('description')) return c.addManual('Alert.children', 'Alert com children e description: o Alert 2.0 não tem children; junte o texto em `description`.');
      let desc: string;
      if (kids.length === 1 && Node.isJsxText(kids[0])) {
        const text = kids[0].getText().replace(/\s+/g, ' ').trim();
        desc = stringAttr('description', text);
      } else if (kids.length === 1 && Node.isJsxExpression(kids[0]) && kids[0].getExpression()) {
        desc = `description={${kids[0].getExpression()!.getText()}}`;
      } else {
        const el = c.element as JsxElement;
        const text = el.getText().slice(el.getOpeningElement().getEnd() - el.getStart(), el.getClosingElement().getStart() - el.getStart()).trim();
        desc = `description={<>${text}</>}`;
      }
      c.add(desc);
      c.dropChildren = true;
      c.note('children → description');
    }
    const action = c.value('action');
    if (action) {
      const btn = actionButton(action, c, { tone: 'neutral', variant: 'ghost' });
      if (!btn) return c.addManual('Alert.action', 'O `action` do Alert 2.0 é um elemento: troque { label, onClick } por <Button tone="neutral" variant="ghost" onClick>…</Button>.');
      c.replace('action', `action={${btn}}`);
      c.note('action { label, onClick } → <Button>');
    }
    const hide = c.value('hideIcon');
    if (hide) {
      if (isTrue(hide)) c.replace('hideIcon', 'showIcon={false}');
      else if (hide.kind === 'bool') c.remove('hideIcon');
      else if (hide.kind === 'expr') c.replace('hideIcon', `showIcon={!(${hide.text})}`);
      c.note('hideIcon → showIcon');
    }
  },

  badge(c) {
    const variant = c.value('variant');
    const lit = variant ? literal(variant) : 'default';
    if (lit === undefined) return c.addManual('Badge.variant', 'Badge com variant dinâmico: na 2.0 rótulo é Badge (tone/variant) e estado colorido é Status (tone). Mapeie à mão.');
    if (lit === 'dot') return c.addManual('Badge.dot', 'Badge variant="dot" saiu: use Avatar com showBadge, um Status, ou um indicador próprio.');
    const size = c.value('size');
    if (lit === 'count') {
      const count = c.attrs.get('count');
      if (!count) return c.addManual('Badge.count', 'Badge variant="count" sem `count`: o contador 2.0 é <Badge value={n} />.');
      const max = c.value('max');
      if (max && !(max.kind === 'number' && max.value === 99)) return c.addManual('Badge.max', 'Badge 2.0 corta em 99+ sempre: `max` saiu.');
      c.rename('count', 'value');
      c.remove('variant');
      c.remove('max');
      c.remove('size');
      c.remove('dotColor');
      c.note('variant="count" count → value');
      return;
    }
    const target = BADGE_VARIANTS[lit];
    if (!target) return c.addManual('Badge.variant', `Badge variant="${lit}" não tem equivalente na 2.0.`);
    const attrs = Object.entries(target.attrs).map(([k, v]) => `${k}="${v}"`);
    if (target.component === 'Status') {
      if (!c.children().length) return c.addManual('Badge.status', 'Esta Badge vira Status, que exige o texto do estado como children.');
      if (size && literal(size) === 'sm') attrs.push('size="sm"');
      else if (size && literal(size) !== 'md') return c.addManual('Badge.size', 'Badge com size dinâmico: o Status tem size default ou sm.');
      c.convertTo = 'Status';
    }
    if (variant) {
      if (attrs.length) c.replace('variant', attrs.join(' '));
      else c.remove('variant');
    } else if (attrs.length) c.add(attrs.join(' '));
    c.remove('size');
    c.remove('count');
    c.remove('max');
    c.remove('dotColor');
    c.note(`variant="${lit}" → ${target.component}${attrs.length ? ' ' + attrs.join(' ') : ''}`);
  },

  labelToChildren(c) {
    const v = c.value('label');
    if (!v) return;
    if (c.children().length) return c.addManual(`${c.component}.label`, `${c.component} com label e children: na 2.0 o texto é só children.`);
    const child = childFromValue(v);
    if (child === undefined) return c.addManual(`${c.component}.label`, `${c.component}: label sem valor — o texto vira children.`);
    c.remove('label');
    c.childrenText = child;
    c.note('label → children');
  },

  checkboxIndeterminate(c) {
    const ind = c.value('indeterminate');
    if (!ind) return;
    if (ind.kind === 'bool' && !ind.value) {
      c.remove('indeterminate');
      return;
    }
    const checked = c.value('checked');
    if (isTrue(ind)) {
      c.remove('indeterminate');
      if (checked) c.replace('checked', 'checked="indeterminate"');
      else c.add('checked="indeterminate"');
    } else if (ind.kind === 'expr' && checked) {
      const chk = checked.kind === 'expr' ? checked.text : checked.kind === 'bool' ? String(checked.value) : 'true';
      c.remove('indeterminate');
      c.replace('checked', `checked={${ind.text} ? 'indeterminate' : ${chk}}`);
    } else {
      return c.addManual('Checkbox.indeterminate', 'indeterminate virou checked="indeterminate": combine com o checked à mão.');
    }
    c.note('indeterminate → checked="indeterminate"');
  },

  passwordInput(c) {
    const type = c.value('type');
    const reveal = c.value('passwordReveal');
    if (reveal && reveal.kind === 'bool' && !reveal.value) {
      c.remove('passwordReveal');
      c.note('passwordReveal={false} removido');
      return;
    }
    if (reveal && reveal.kind === 'expr') return c.addManual('Input.passwordReveal', 'passwordReveal dinâmico: na 2.0 o olho é o componente PasswordInput; escolha Input ou PasswordInput.');
    if (!type || literal(type) !== 'password') {
      if (reveal) {
        c.remove('passwordReveal');
        c.note('passwordReveal removido');
      }
      return;
    }
    const clash = ['iconLeft', 'iconRight', 'prefix', 'suffix', 'clearable', 'onClear', 'leadingIcon', 'trailingIcon'].filter((p) => c.has(p));
    if (clash.length) return c.addManual('Input.password', `Input type="password" vira PasswordInput, que não aceita ${clash.join(', ')}: migre à mão.`);
    c.remove('type');
    c.remove('passwordReveal');
    c.convertTo = 'PasswordInput';
    c.note('type="password" → PasswordInput (o olho de revelar era o padrão)');
  },

  stepProgress(c) {
    const v = c.value('current');
    if (!v) return c.addManual('StepProgress.current', 'StepProgress 2.0 exige `step` (base 1).');
    if (v.kind === 'number') c.replace('current', `step={${v.value + 1}}`);
    else if (v.kind === 'expr') {
      const n = v.node;
      // `x - 1` (a 1-based number made 0-based for the old API) goes back to `x`.
      if (Node.isBinaryExpression(n) && n.getOperatorToken().getKind() === SyntaxKind.MinusToken && Node.isNumericLiteral(n.getRight()) && Number(n.getRight().getText()) === 1) {
        c.replace('current', `step={${n.getLeft().getText()}}`);
      } else {
        const simple = SIMPLE_OPERAND.has(n.getKind());
        c.replace('current', `step={${simple ? v.text : `(${v.text})`} + 1}`);
      }
    } else return c.addManual('StepProgress.current', 'StepProgress: current virou step (base 1, era base 0).');
    c.note('current (base 0) → step (base 1)');
  },

  onCloseToOnOpenChange(c) {
    const a = c.attrs.get('onClose');
    if (!a) return;
    const v = attrValue(a);
    if (v.kind !== 'expr') return c.addManual(`${c.component}.onClose`, 'onClose virou onOpenChange(open).');
    const node = v.node;
    let handler: string;
    if (Node.isArrowFunction(node) && node.getParameters().length === 0) handler = v.text;
    else if (Node.isIdentifier(node) || Node.isPropertyAccessExpression(node)) handler = `(isOpen) => { if (!isOpen) ${v.text}(); }`;
    else handler = `(isOpen) => { if (!isOpen) (${v.text})(); }`;
    c.replace('onClose', `onOpenChange={${handler}}`);
    c.note('onClose → onOpenChange');
  },

  renderPropChildren(c) {
    const kids = c.children();
    if (kids.length === 1 && Node.isJsxExpression(kids[0])) {
      const e = kids[0].getExpression();
      if (e && (Node.isArrowFunction(e) || Node.isFunctionExpression(e))) {
        c.addManual(
          `${c.component}.renderProp`,
          c.component === 'Popover'
            ? 'Popover: children como função ({ close }) saiu — feche com <PopoverClose> (ou controle `open`).'
            : 'Menu: children como função ({ close }) saiu — os itens do DropdownMenu fecham sozinhos ao escolher (onSelect).',
        );
      }
    }
  },

  placement(c) {
    const v = c.value('placement');
    if (!v) return;
    const lit = literal(v);
    if (lit === undefined) return c.addManual(`${c.component}.placement`, `${c.component}: placement dinâmico virou side + align.`);
    const [side, align = 'center'] = lit.split('-');
    const parts = [side !== 'bottom' ? `side="${side}"` : '', align !== 'start' ? `align="${align}"` : ''].filter(Boolean);
    if (parts.length) c.replace('placement', parts.join(' '));
    else c.remove('placement');
    c.note(`placement="${lit}" → side/align`);
  },

  creatable(c) {
    if (c.has('onCreate') && !c.has('creatable')) {
      c.add('creatable');
      c.note('onCreate pede creatable');
    }
  },

  filterChipHref(c) {
    const href = c.attrs.get('href');
    if (!href) return;
    if (c.childrenText === undefined) return c.addManual('FilterChip.href', 'FilterChip com href: o link entra por asChild (<FilterChip asChild><a href>…</a></FilterChip>).');
    c.remove('href');
    c.add('asChild');
    c.childrenText = `<a href${initializerText(href)}>${c.childrenText}</a>`;
    c.note('href → asChild com <a> (sem next/link: troque por Link se a navegação for do Next)');
  },

  tooltipChild(c) {
    const kids = c.children();
    const only = kids.length === 1 ? kids[0] : undefined;
    const tagName = only && (Node.isJsxElement(only) ? only.getOpeningElement().getTagNameNode().getText() : Node.isJsxSelfClosingElement(only) ? only.getTagNameNode().getText() : undefined);
    if (!tagName) return c.addManual('Tooltip.child', 'O Tooltip 2.0 precisa de um único elemento focável como filho (IconButton, <button>, <a>).');
    const childTag = Node.isJsxElement(only!) ? only.getOpeningElement() : (only as JsxSelfClosingElement);
    const hasTabIndex = childTag.getAttributes().some((a) => Node.isJsxAttribute(a) && a.getNameNode().getText() === 'tabIndex');
    if (/^[a-z]/.test(tagName) && !FOCUSABLE_TAGS.has(tagName) && !hasTabIndex) {
      return c.addManual('Tooltip.child', `O Tooltip 2.0 põe o aria-describedby no filho, que precisa receber foco: <${tagName}> não recebe. Use um <button> ou IconButton.`);
    }
  },

  emptyState(c) {
    const icon = c.value('icon');
    if (icon) {
      const lit = literal(icon);
      const lucide = lit !== undefined ? EMPTY_STATE_ICONS[lit] : undefined;
      if (!lucide) return c.addManual('EmptyState.icon', 'EmptyState: o icon (chave do ICON_MAP) virou um elemento: icon={<Package />} do lucide-react.');
      c.replace('icon', `icon={<${lucide} />}`);
      c.externalNeeds.push({ module: 'lucide-react', name: lucide });
      c.note(`icon="${lit}" → <${lucide} /> (lucide-react)`);
    }
    const cta = c.value('cta');
    if (cta) {
      const btn = actionButton(cta, c, {});
      if (!btn) return c.addManual('EmptyState.cta', 'Empty recebe a ação como elemento: troque cta { label, href, onClick } por action={<Button>…</Button>}.');
      c.replace('cta', `action={${btn}}`);
      c.note('cta → action <Button>');
    }
  },

  noChildren(c) {
    if (c.children().length) c.addManual(`${c.component}.children`, `${c.component}: children não têm lugar no componente 2.0 — leve o conteúdo para fora ou para as props.`);
  },

  notice(c) {
    const sev = c.value('severity');
    const lit = sev ? literal(sev) : undefined;
    if (!lit || !NOTICE_TONES[lit]) return c.addManual('Notice', 'Notice saiu do pacote (#33): troque por <Alert tone> à mão (info, success, warning; critical→danger com announce="alert"). A severidade aqui é dinâmica.');
    const dismiss = c.value('dismissible');
    if (dismiss && !(dismiss.kind === 'bool' && !dismiss.value)) {
      return c.addManual('Notice.dismissible', 'Notice dispensável (lembrado no localStorage) não tem equivalente no Alert: guarde a dispensa você mesmo e use onClose.');
    }
    const cta = c.value('cta');
    let action: string | undefined;
    if (cta) {
      const linkAs = c.value('linkAs');
      const linkTag = linkAs ? (linkAs.kind === 'expr' && Node.isIdentifier(linkAs.node) ? linkAs.text : undefined) : 'a';
      if (!linkTag) return c.addManual('Notice.linkAs', 'Notice com linkAs que não é um identificador: monte o action do Alert à mão.');
      action = actionButton(cta, c, { tone: 'neutral', variant: 'ghost' }, linkTag);
      if (!action) return c.addManual('Notice.cta', 'Notice com cta que não é objeto literal: o Alert recebe action={<Button>…</Button>}.');
    }
    const announce = lit === 'critical' ? 'alert' : 'status';
    c.replace('severity', `tone="${NOTICE_TONES[lit]}" announce="${announce}"`);
    if (action) c.replace('cta', `action={${action}}`);
    for (const p of ['dismissible', 'id', 'dismissLabel', 'intent', 'linkAs']) c.remove(p);
    c.convertTo = 'Alert';
    c.note('Notice (saiu do pacote) → Alert');
  },

  search(c) {
    if (c.has('onSearch')) {
      return c.addManual(
        'Search.onSearch',
        'Search saiu (#33): vira <Input type="search" leadingIcon={<SearchIcon />} clearable>, mas o onSearch (com debounce de 250ms e Enter) não existe no Input: faça o debounce no app (no onChange) e o Enter num onKeyDown.',
      );
    }
    const width = c.value('width');
    if (width && !matchesLiteral(width, 'full')) {
      return c.addManual('Search.width', 'Search width="hug" saiu: o Input 2.0 ocupa a largura do container; limite a largura num wrapper.');
    }
    if (c.has('type') || c.has('leadingIcon')) {
      return c.addManual('Search.collision', 'Search com type ou leadingIcon próprios: troque por <Input type="search" leadingIcon clearable> à mão.');
    }
    c.remove('size');
    c.remove('width');
    const parts = ['type="search"', 'leadingIcon={<SearchIcon />}'];
    if (!c.has('clearable')) parts.push('clearable');
    c.add(parts.join(' '));
    c.externalNeeds.push({ module: 'lucide-react', name: 'SearchIcon' });
    c.convertTo = 'Input';
    c.note('Search (saiu) → Input type="search" leadingIcon clearable; size/width removidos');
  },

  label(c) {
    const htmlFor = c.value('htmlFor');
    const field = htmlFor?.kind === 'string' ? `do campo com id="${htmlFor.value}"` : htmlFor ? `do campo de id={${htmlFor.kind === 'expr' ? htmlFor.text : '…'}}` : 'do campo que este rótulo descreve';
    const steps = [`passe o texto na prop \`label\` ${field} (Input, Select, Textarea, Combobox… já desenham o rótulo) e apague este <Label>`];
    if (c.has('required')) steps.push('`required` vai para o campo');
    if (c.has('optional')) steps.push('`optional` vira o texto "(opcional)" no fim do label');
    if (c.has('tooltip')) steps.push('o `tooltip` vira o `hint` do campo');
    steps.push('se o controle não é do DS, use um <label htmlFor> comum');
    c.addManual('Label', `Label saiu (#33): ${steps.join('; ')}.`);
  },

  themed(c) {
    const asChild = c.value('asChild');
    const where = asChild && isTrue(asChild) ? 'no className do filho (era o asChild)' : 'num <div> (ou no elemento que o Themed embrulhava)';
    c.addManual(
      'Themed',
      `Themed saiu (#33): ponha as classes ds-scope${c.has('dark') ? ' e dark (quando escuro)' : ''} ${where}, mais a theme-<nome> se o CSS de tema congelado no app usa esse seletor.`,
    );
  },

  skeleton(c) {
    const v = c.value('variant');
    if (!v) return;
    const lit = literal(v);
    const target = lit !== undefined ? SKELETON_VARIANTS[lit] : undefined;
    if (!target) return c.addManual('Skeleton.variant', 'Skeleton: variant virou shape (line, circle, rect) com width/height.');
    const parts: string[] = [];
    if (target.shape) parts.push(`shape="${target.shape}"`);
    if (target.width && !c.has('width')) parts.push(`width={${target.width}}`);
    if (target.height && !c.has('height')) parts.push(`height={${target.height}}`);
    if (parts.length) c.replace('variant', parts.join(' '));
    else c.remove('variant');
    c.note(`variant="${lit}" → ${parts.join(' ') || 'shape line (padrão)'}`);
  },

  textareaRows(c) {
    if (!c.has('minRows')) return;
    if (c.has('rows')) c.remove('minRows');
    else c.rename('minRows', 'rows');
    c.note('minRows → rows');
  },

  chatBubble(c) {
    const v = c.value('variant');
    if (!v) return;
    const lit = literal(v);
    if (lit === 'bot') c.remove('variant');
    else if (lit === 'user') c.replace('variant', 'align="end" variant="fill"');
    else return c.addManual('ChatBubble.variant', 'ChatBubble: variant bot/user virou align start/end (e variant fill para quem escreve).');
    c.note(`variant="${lit}" → align`);
  },
};

/**
 * `{ label, onClick }` / `{ label, href }` (an object literal) → a `<Button>` element. Undefined when it is not a
 * literal we can read. Asks for the Button import.
 */
function actionButton(v: AttrValue, c: ElementCtx, attrs: Record<string, string>, linkTag = 'a'): string | undefined {
  if (v.kind !== 'expr' || !Node.isObjectLiteralExpression(v.node)) return undefined;
  const fields = new Map<string, string>();
  for (const p of v.node.getProperties()) {
    if (Node.isPropertyAssignment(p)) {
      const init = p.getInitializer();
      if (!init) return undefined;
      fields.set(p.getName(), init.getText());
      if (p.getName() === 'href' && Node.isStringLiteral(init) && !init.getLiteralValue().includes('"')) fields.set('href', `"${init.getLiteralValue()}"`);
      if (p.getName() === 'label' && (Node.isStringLiteral(init) || Node.isNoSubstitutionTemplateLiteral(init))) fields.set('label', jsxTextFor(init.getLiteralValue()));
      else if (p.getName() === 'label') fields.set('label', `{${init.getText()}}`);
    } else if (Node.isShorthandPropertyAssignment(p)) {
      fields.set(p.getName(), p.getName() === 'label' ? `{${p.getName()}}` : p.getName());
    } else return undefined;
  }
  const label = fields.get('label');
  if (!label || [...fields.keys()].some((k) => !['label', 'href', 'onClick'].includes(k))) return undefined;
  c.needs.add('Button');
  const extra = Object.entries(attrs).map(([k, val]) => ` ${k}="${val}"`).join('');
  // `Button` is resolved to its local name when the usage is committed; the DS import keeps the name.
  if (fields.has('href')) {
    const href = fields.get('href')!;
    const hrefAttr = href.startsWith('"') ? `href=${href}` : `href={${href}}`;
    return `<Button asChild${extra}><${linkTag} ${hrefAttr}>${label}</${linkTag}></Button>`;
  }
  if (fields.has('onClick')) return `<Button${extra} onClick={${fields.get('onClick')}}>${label}</Button>`;
  return undefined;
}
