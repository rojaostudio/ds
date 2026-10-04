import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// The CLI end to end (the bin through tsx), on a throwaway consumer in git: dry run writes nothing, --apply writes the
// code, the version and the TODOs, and the missing 2.0 stylesheet is only reported. Each --apply runs on a committed
// tree, as the codemod asks.
const require = createRequire(import.meta.url);
const TSX = require.resolve('tsx/cli');
const CLI = join(__dirname, '..', 'cli.ts');

const PAGE = `import { Modal, Select, Dropzone } from '@rojaostudio/ds/components';

export function Page({ open, close }: { open: boolean; close: () => void }) {
  return (
    <Modal open={open} onClose={close} title="Plano">
      <Select options={[{ value: 'm', label: 'Mensal' }]} />
      <Dropzone onFiles={() => {}} />
    </Modal>
  );
}
`;

let root: string;
let outside: string;
const run = (...args: string[]) => execFileSync(process.execPath, [TSX, CLI, root, ...args], { encoding: 'utf8' });
const git = (...args: string[]) =>
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', '-C', root, ...args], { stdio: 'pipe' });
const commit = () => {
  git('add', '-A');
  git('commit', '-q', '-m', 'x', '--allow-empty');
};

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'ds-migrate-'));
  outside = mkdtempSync(join(tmpdir(), 'ds-migrate-report-'));
  mkdirSync(join(root, 'app'));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'consumer', dependencies: { '@rojaostudio/ds': '^1.0.2' } }, null, 2));
  writeFileSync(join(root, 'app', 'globals.css'), '@import "tailwindcss";\n@import "@rojaostudio/ds/styles/base.css";\n');
  writeFileSync(join(root, 'app', 'page.tsx'), PAGE);
  git('init', '-q');
  commit();
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
  rmSync(outside, { recursive: true, force: true });
});

describe('migrate-consumer', () => {
  it('dry run: reports and writes nothing', () => {
    const out = run('--report', join(outside, 'report.json'));
    expect(out).toContain('dry-run — nada foi escrito no projeto; relatório em');
    expect(out).toContain('@import "@rojaostudio/ds/styles/rds.css";');
    expect(out).toContain('app/page.tsx:6');
    expect(readFileSync(join(root, 'app', 'page.tsx'), 'utf8')).toBe(PAGE);

    const report = JSON.parse(readFileSync(join(outside, 'report.json'), 'utf8'));
    expect(report.summary).toMatchObject({ filesWithDs: 1, filesChanged: 1, manual: 1 });
    expect(report.summary.auto).toBeGreaterThan(0);
    expect(report.topManual[0].rule).toBe('Select');
    // A deprecated wrapper is a warning, not a manual case.
    expect(report.summary.notices).toBe(1);
    expect(report.notices[0]).toMatchObject({ rule: 'deprecated:Dropzone', at: ['app/page.tsx:7'] });
    expect(out).toContain('Dropzone é deprecated');
  }, 60_000);

  it('--apply: writes the code, the version and a TODO; never the global CSS', () => {
    run('--apply');
    const page = readFileSync(join(root, 'app', 'page.tsx'), 'utf8');
    expect(page).toContain("import { Dialog, Select, Dropzone } from '@rojaostudio/ds/components';");
    expect(page).toContain('<Dropzone onFiles={() => {}} />');
    expect(page).not.toContain('TODO(ds-2.0): Dropzone');
    expect(page).toContain('<Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) close(); }} title="Plano">');
    expect(page).toContain('{/* TODO(ds-2.0): Select virou Radix');
    expect(readFileSync(join(root, 'package.json'), 'utf8')).toContain('"@rojaostudio/ds": "^2.0.0"');
    expect(readFileSync(join(root, 'app', 'globals.css'), 'utf8')).not.toContain('rds.css');
  }, 60_000);

  it('a project already on 2.0 only gets the vocabulary step (nothing left to change here)', () => {
    commit();
    const out = run();
    expect(out).toContain('vocabulário único de props');
    expect(out).toContain('0 transformação(ões) automática(s)');
    // No package.json step: the version is the project's call in the vocabulary mode.
    expect(out).not.toContain('→ "@rojaostudio/ds"');
  }, 60_000);

  it('2.0.0-next → the vocabulary: --apply rewrites the props and leaves package.json alone', () => {
    const pkg = JSON.stringify({ name: 'consumer', dependencies: { '@rojaostudio/ds': '2.0.0-next.16' } }, null, 2);
    writeFileSync(join(root, 'package.json'), pkg);
    writeFileSync(
      join(root, 'app', 'next.tsx'),
      [
        "import { Card, CardContent, Spinner } from '@rojaostudio/ds/components';",
        '',
        'export const N = () => (',
        '  <Card surface="tint">',
        '    <CardContent>',
        '      <Spinner size="default" />',
        '    </CardContent>',
        '  </Card>',
        ');',
        '',
      ].join('\n'),
    );
    commit();
    run('--apply');
    const next = readFileSync(join(root, 'app', 'next.tsx'), 'utf8');
    expect(next).toContain('<Card variant="soft">');
    expect(next).toContain('<Spinner size="md" />');
    expect(readFileSync(join(root, 'package.json'), 'utf8')).toBe(pkg);
  }, 60_000);
});
