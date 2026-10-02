import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// The CLI end to end, on a throwaway consumer: dry run writes nothing, --apply writes the code, the version and
// the TODOs, and the missing 2.0 stylesheet is only reported.
const require = createRequire(import.meta.url);
const TSX = require.resolve('tsx/cli');
const CLI = join(__dirname, '..', '..', 'migrate-consumer.ts');

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
const run = (...args: string[]) => execFileSync(process.execPath, [TSX, CLI, root, ...args], { encoding: 'utf8' });

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'ds-migrate-'));
  mkdirSync(join(root, 'app'));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'consumer', dependencies: { '@rojaostudio/ds': '^1.0.2' } }, null, 2));
  writeFileSync(join(root, 'app', 'globals.css'), '@import "tailwindcss";\n@import "@rojaostudio/ds/styles/base.css";\n');
  writeFileSync(join(root, 'app', 'page.tsx'), PAGE);
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe('migrate-consumer', () => {
  it('dry run: reports and writes nothing', () => {
    const out = run('--report', join(root, 'report.json'));
    expect(out).toContain('dry-run — nada foi escrito');
    expect(out).toContain('@import "@rojaostudio/ds/styles/rds.css";');
    expect(out).toContain('app/page.tsx:6');
    expect(readFileSync(join(root, 'app', 'page.tsx'), 'utf8')).toBe(PAGE);

    const report = JSON.parse(readFileSync(join(root, 'report.json'), 'utf8'));
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

  it('a project already on 2.0 has nothing to migrate', () => {
    expect(run()).toContain('já está em ^2.0.0');
  }, 60_000);
});
