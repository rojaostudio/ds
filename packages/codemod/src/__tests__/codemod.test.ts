import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { transformSource } from '../codemod';
import { COMPONENTS, MOVED_EXPORTS, TYPES } from '../map';

const FIXTURES = join(__dirname, '..', '__fixtures__');
const read = (name: string) => readFileSync(join(FIXTURES, name), 'utf8');

// ── auto: every rename and prop rule has an input → output fixture ─────────────────────────────────

const autoFixtures = readdirSync(FIXTURES)
  .filter((f) => f.endsWith('.input.tsx') && !/^(manual|already|annotate|deprecated)/.test(f))
  .map((f) => f.replace('.input.tsx', ''));

describe('codemod: mechanical rules (fixtures)', () => {
  it('has the fixtures', () => {
    expect(autoFixtures.length).toBeGreaterThanOrEqual(21);
  });

  it.each(autoFixtures)('%s', (name) => {
    const r = transformSource(read(`${name}.input.tsx`), `${name}.tsx`);
    expect(r.output).toBe(read(`${name}.output.tsx`));
    expect(r.manual).toEqual([]);
    expect(r.auto.length).toBeGreaterThan(0);
  });
});

describe('codemod: Drawer ↔ Sheet in the same file', () => {
  const r = transformSource(read('drawer-sheet.input.tsx'), 'drawer-sheet.tsx');

  it('renames both in one pass, without crossing them', () => {
    expect(r.output).toContain("import { Sheet, Drawer, Button } from '@rojaostudio/ds/components';");
    expect(r.output).toContain("import type { SheetProps, DrawerProps } from '@rojaostudio/ds/components';");
    // The 1.x side panel (with `side`) is the Sheet; the 1.x BottomSheet is the Drawer.
    expect(r.output).toMatch(/<Sheet open=\{open\}.*title="Filtros".*side=\{side\}>/);
    expect(r.output).toContain('</Sheet>');
    expect(r.output).toMatch(/<Drawer open=\{open\} onOpenChange=\{\(\) => close\(\)\} title="Ações">/);
    expect(r.output).not.toContain('BottomSheet');
    expect(r.output.match(/<Sheet\b/g)).toHaveLength(1);
    expect(r.output.match(/<Drawer\b/g)).toHaveLength(1);
  });

  it('leaves a 2.0 Drawer alone (it is not migrated twice)', () => {
    const again = transformSource(r.output, 'drawer-sheet.tsx');
    expect(again.output).toBe(r.output);
  });
});

describe('codemod: every renamed export in the map', () => {
  const renamed = Object.entries(COMPONENTS).filter(([, rule]) => rule.to);

  it.each(renamed)('%s → its 2.0 name', (old, rule) => {
    const required = Object.keys(rule.require ?? {})
      .map((p) => ` ${p}="x"`)
      .join('');
    const src = `import { ${old} } from '@rojaostudio/ds/components';\n\nexport const A = () => <${old}${required} />;\n`;
    const r = transformSource(src, 'a.tsx');
    expect(r.manual).toEqual([]);
    // Out of the barrel (optional peers): the renamed export lands on its own entry point.
    const entry = MOVED_EXPORTS[rule.to!] ?? '@rojaostudio/ds/components';
    expect(r.output).toContain(`import { ${rule.to} } from '${entry}';`);
    expect(r.output).toContain(`<${rule.to}${required}`);
  });

  it.each(Object.entries(TYPES).filter(([, t]) => t.to))('type %s → its 2.0 name', (old, t) => {
    const src = `import type { ${old} } from '@rojaostudio/ds/components';\n\nexport type A = ${old};\n`;
    const r = transformSource(src, 'a.ts');
    const entry = MOVED_EXPORTS[t.to!] ?? '@rojaostudio/ds/components';
    expect(r.output).toBe(`import type { ${t.to} } from '${entry}';\n\nexport type A = ${t.to};\n`);
  });
});

// ── manual: left as they are, and reported ─────────────────────────────────────────────────────────

const MANUAL: Record<string, string[]> = {
  'manual-select': ['Select', 'RadioGroup.options'],
  'manual-render-props': ['Menu.renderProp', 'Popover.renderProp'],
  'manual-toast': ['toast.promise', 'toast.loading', 'toast.options', 'type:ToastOptions'],
  'manual-button-variants': [
    'buttonVariants',
    'type:ButtonVariant',
    'Button.variant=tonal',
    'Button.variant=link',
    'Button.variant',
    'Button.iconLeft',
    'Button.spread',
  ],
  'manual-table': ['Table'],
  'manual-card': ['Card.variant', 'Card.interactive', 'CardTitle'],
  'manual-misc': [
    'PageTabs',
    'DatePicker',
    'ContextMenu',
    'ToggleGroup.options',
    'Badge.dot',
    'Modal.headerAction',
    'Tooltip.child',
    'EmptyState.children',
  ],
  'manual-collision': ['Toggle.collision'],
  'manual-figma-alignment': [
    'SelectableCard.as',
    'SelectableCard.href',
    'SelectableCard.ribbon',
    'ChoicePreviewCard.locked',
    'ChoicePreviewCard.badge',
    'type:ImageUploadAspect',
  ],
  'manual-wave6': [
    'Label',
    'Themed',
    'themeClass',
    'Search.onSearch',
    'Search.width',
    'PaywallContent',
    'PaywallState',
    'PaywallModal',
    'PaywallBanner',
    'BlockerCard',
    'CopilotHint',
  ],
};

describe('codemod: non-mechanical cases stay as they are and are reported', () => {
  it.each(Object.entries(MANUAL))('%s', (name, rules) => {
    const src = read(`${name}.input.tsx`);
    const r = transformSource(src, `${name}.tsx`);
    expect(r.output).toBe(src);
    expect([...new Set(r.manual.map((m) => m.rule))].sort()).toEqual([...rules].sort());
    for (const m of r.manual) {
      expect(m.line).toBeGreaterThan(0);
      expect(m.message.length).toBeGreaterThan(10);
    }
  });

  it('a renamed component with one manual usage keeps every usage on the old name', () => {
    const r = transformSource(read('manual-misc.input.tsx'), 'manual-misc.tsx');
    // The second Modal alone would be mechanical, but the file must not mix Modal and Dialog.
    expect(r.output).toContain('title="Sem nada especial"');
    expect(r.output).not.toContain('Dialog');
  });

  it('reports the line of each manual usage', () => {
    const r = transformSource(read('manual-select.input.tsx'), 'manual-select.tsx');
    expect(r.manual.map((m) => m.line)).toEqual([12, 13]);
  });

  it('Label: the guidance names the field and what becomes of required, optional and tooltip', () => {
    const r = transformSource(read('manual-wave6.input.tsx'), 'manual-wave6.tsx');
    const [email, bio] = r.manual.filter((m) => m.rule === 'Label');
    expect(email.message).toContain('id="email"');
    expect(email.message).toContain('`required` vai para o campo');
    expect(email.message).toContain('`hint`');
    expect(bio.message).toContain('"(opcional)"');
    expect(r.manual.find((m) => m.rule === 'Themed')!.message).toContain('ds-scope e dark');
    expect(r.manual.find((m) => m.rule === 'PaywallBanner')!.message).toContain('recrie no app');
  });

  it('Button with iconLeft and iconRight at once stays manual', () => {
    const r = transformSource(read('manual-button-variants.input.tsx'), 'manual-button-variants.tsx');
    expect(r.manual.find((m) => m.rule === 'Button.iconLeft')!.message).toContain('um ícone só');
  });

  it('code already on the 2.0 API is left alone', () => {
    const src = read('already-2.0.input.tsx');
    const r = transformSource(src, 'already-2.0.tsx');
    expect(r.output).toBe(src);
    expect(r.manual).toEqual([]);
    expect(r.auto).toEqual([]);
  });
});

// ── notices: deprecated wrappers and IconButton without a Tooltip ───────────────────────────────────

describe('codemod: notices (reported, never written)', () => {
  const src = read('deprecated.input.tsx');
  const r = transformSource(src, 'deprecated.tsx', { annotate: true });

  it('leaves the code as it is, with no manual case and no TODO', () => {
    expect(r.output).toBe(src);
    expect(r.manual).toEqual([]);
  });

  it('lists each deprecated wrapper and the IconButton outside a Tooltip', () => {
    expect(r.notices.map((n) => `${n.line} ${n.rule}`)).toEqual([
      '7 deprecated:PageShell.Header',
      '9 deprecated:SectionHeader',
      '10 deprecated:Dropzone',
      '11 IconButton.tooltip',
    ]);
    expect(r.notices.find((n) => n.rule === 'deprecated:Dropzone')!.message).toContain('FileInput variant="dropzone"');
  });
});

// ── --apply: TODO comments ─────────────────────────────────────────────────────────────────────────

describe('codemod: TODO(ds-2.0) comments with --apply', () => {
  const r = transformSource(read('annotate.input.tsx'), 'annotate.tsx', { annotate: true });

  it('writes a comment valid for each place (JS line, JSX child, inside parentheses)', () => {
    expect(r.output).toBe(read('annotate.output.tsx'));
    expect(r.output).toContain('  // TODO(ds-2.0): toast.promise saiu');
    expect(r.output).toContain('      {/* TODO(ds-2.0): Select virou Radix');
    expect(r.output).toContain('        // TODO(ds-2.0): variant="tonal" saiu');
  });

  it('does not stack the same comment on a second run', () => {
    const again = transformSource(r.output, 'annotate.tsx', { annotate: true });
    expect(again.output).toBe(r.output);
  });

  it('writes nothing in a dry run', () => {
    const dry = transformSource(read('annotate.input.tsx'), 'annotate.tsx');
    expect(dry.output).not.toContain('TODO(ds-2.0)');
  });
});

describe('codemod: robustness', () => {
  it('ignores files that do not import the DS', () => {
    const src = "import { Button } from './button';\n\nexport const A = () => <Button variant=\"tonal\" />;\n";
    expect(transformSource(src, 'a.tsx')).toEqual({ output: src, changed: false, auto: [], manual: [], notices: [] });
  });

  it('keeps a byte-order mark and its positions', () => {
    const src = "﻿import { toast } from '@rojaostudio/ds/components';\n\ntoast.error('x');\n";
    const r = transformSource(src, 'a.ts');
    expect(r.output).toBe("﻿import { toast } from '@rojaostudio/ds/components';\n\ntoast({ title: 'x', tone: 'danger' });\n");
  });

  it('keeps the formatting of a multi-line import', () => {
    const src =
      "import {\n  Button, EmptyState,\n  Toggle,\n} from '@rojaostudio/ds/components';\n\n" +
      'export const A = () => (\n  <>\n    <Button />\n    <EmptyState title="x" />\n    <Toggle />\n  </>\n);\n';
    const r = transformSource(src, 'a.tsx');
    expect(r.output.startsWith("import {\n  Button, Empty,\n  Switch,\n} from '@rojaostudio/ds/components';")).toBe(true);
  });

  it('follows an aliased import without renaming the local name', () => {
    const src = "import { Modal as M } from '@rojaostudio/ds/components';\n\nexport const A = () => <M title=\"x\" onClose={() => {}} />;\n";
    const r = transformSource(src, 'a.tsx');
    expect(r.output).toBe("import { Dialog as M } from '@rojaostudio/ds/components';\n\nexport const A = () => <M title=\"x\" onOpenChange={() => {}} />;\n");
  });
});
