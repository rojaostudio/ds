import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { findUp, fromForVersion, gitState, packageManager } from '../environment';
import { scanTree, writeProjectFile } from '../fs-safe';
import { main } from '../run';

// The command in process: arguments, the mode, the safety checks, the order of the writes and the exit codes.

const temps: string[] = [];
afterEach(() => {
  for (const t of temps.splice(0)) {
    try {
      chmodSync(t, 0o755);
    } catch {
      /* already gone */
    }
    rmSync(t, { recursive: true, force: true });
  }
});

function tmp(): string {
  const dir = mkdtempSync(join(tmpdir(), 'ds-run-'));
  temps.push(dir);
  return dir;
}

function put(root: string, files: Record<string, string>) {
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(join(root, rel, '..'), { recursive: true });
    writeFileSync(join(root, rel), text);
  }
}

const git = (root: string, ...args: string[]) =>
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', '-C', root, ...args], { stdio: 'pipe' });

function commitAll(root: string) {
  if (!existsSync(join(root, '.git'))) git(root, 'init', '-q');
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', 'x', '--allow-empty');
}

function run(argv: string[], env: NodeJS.ProcessEnv = {}) {
  const out: string[] = [];
  const err: string[] = [];
  const code = main(argv, { out: (l) => out.push(l), err: (l) => err.push(l), env: { ...process.env, npm_config_user_agent: '', ...env } });
  return { code, out: out.join('\n'), err: err.join('\n') };
}

const PKG_1X = JSON.stringify({ name: 'c', dependencies: { '@rojaostudio/ds': '^1.0.2' } }, null, 2);
const PAGE_1X = "import { Modal } from '@rojaostudio/ds/components';\n\nexport const P = () => <Modal title=\"x\" onClose={() => {}} />;\n";

function consumer(files: Record<string, string> = {}): string {
  const root = tmp();
  put(root, { 'package.json': PKG_1X, 'app/page.tsx': PAGE_1X, ...files });
  commitAll(root);
  return root;
}

describe('arguments', () => {
  it('rejects an unknown option (strict) with exit 1', () => {
    const r = run([tmp(), '--aply']);
    expect(r.code).toBe(1);
    expect(r.err).toContain("Unknown option '--aply'");
  });

  it('rejects a --from that is not 1.x or next', () => {
    expect(run([tmp(), '--from', '3']).code).toBe(1);
  });

  it('--help exits 0 with the usage', () => {
    const r = run(['--help']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('--from 1.x|next');
  });

  it('a missing folder is exit 1', () => {
    expect(run([join(tmp(), 'nope')]).code).toBe(1);
  });
});

describe('the mode: --from or package.json, never a guess', () => {
  it('a folder without package.json requires --from', () => {
    const root = tmp();
    put(root, { 'page.tsx': PAGE_1X });
    const r = run([root]);
    expect(r.code).toBe(1);
    expect(r.err).toContain('esta pasta não tem package.json');
    expect(r.err).toContain('--from 1.x');
  });

  it('a package.json without the DS, or with workspace:*, requires --from', () => {
    const root = tmp();
    put(root, { 'package.json': '{"name":"x"}' });
    expect(run([root]).err).toContain('não declara @rojaostudio/ds');
    put(root, { 'package.json': '{"dependencies":{"@rojaostudio/ds":"workspace:*"}}' });
    expect(run([root]).err).toContain('"workspace:*", que não diz a versão');
  });

  it('with --from the code is migrated', () => {
    const root = tmp();
    put(root, { 'page.tsx': PAGE_1X });
    commitAll(root);
    const r = run([root, '--from', '1.x', '--apply']);
    expect(r.code).toBe(0);
    expect(readFileSync(join(root, 'page.tsx'), 'utf8')).toContain('<Dialog');
  });

  it('reads the version range', () => {
    expect(fromForVersion('^1.0.2')).toBe('1.x');
    expect(fromForVersion('0.9.1')).toBe('1.x');
    expect(fromForVersion('~2.0.0-next.16')).toBe('next');
    expect(fromForVersion('>=2')).toBe('next');
    for (const v of ['workspace:*', 'latest', 'next', 'github:rojaostudio/ds', '3.0.0']) expect(fromForVersion(v)).toBeUndefined();
  });
});

describe('git: --apply needs a clean working tree', () => {
  it('outside git: dry run exits 2 (blocker), --apply exits 1 and writes nothing, --force applies', () => {
    const root = tmp();
    put(root, { 'package.json': PKG_1X, 'app/page.tsx': PAGE_1X });
    const dry = run([root]);
    expect(dry.code).toBe(2);
    expect(dry.out).toContain('não está num repositório git');

    const refused = run([root, '--apply']);
    expect(refused.code).toBe(1);
    expect(readFileSync(join(root, 'app/page.tsx'), 'utf8')).toBe(PAGE_1X);

    const forced = run([root, '--apply', '--force']);
    expect(forced.code).toBe(0);
    expect(readFileSync(join(root, 'app/page.tsx'), 'utf8')).toContain('<Dialog');
  });

  it('a dirty tree is refused without --force', () => {
    const root = consumer();
    put(root, { 'app/wip.ts': 'export const wip = 1;\n' });
    const r = run([root, '--apply']);
    expect(r.code).toBe(1);
    expect(r.out).toContain('working tree suja');
    expect(readFileSync(join(root, 'app/page.tsx'), 'utf8')).toBe(PAGE_1X);
  });

  it('runs git with fsmonitor off: a hostile core.fsmonitor is never executed', () => {
    const root = consumer();
    const marker = join(root, '..', `fsmonitor-ran-${Date.now()}`);
    temps.push(marker);
    git(root, 'config', 'core.fsmonitor', `node -e "require('fs').writeFileSync('${marker.replace(/\\/g, '/')}', '')"`);
    expect(gitState(root).kind).toBe('clean');
    expect(existsSync(marker)).toBe(false);
  });
});

describe('writing', () => {
  it('a clean run: code, then package.json, exit 0; a second run in the same folder changes nothing', () => {
    const root = consumer();
    const r = run([root, '--apply']);
    expect(r.code).toBe(0);
    expect(readFileSync(join(root, 'package.json'), 'utf8')).toContain('"@rojaostudio/ds": "^2.0.0"');
    const page = readFileSync(join(root, 'app/page.tsx'), 'utf8');
    commitAll(root);
    expect(run([root, '--apply']).code).toBe(0);
    expect(readFileSync(join(root, 'app/page.tsx'), 'utf8')).toBe(page);
  });

  it('an interrupted run resumes: a file already on 2.0 is skipped in the 1.x mode', () => {
    const root = consumer({ 'app/done.tsx': "import { Dialog, Avatar } from '@rojaostudio/ds/components';\n\nexport const D = () => <Dialog><Avatar name=\"A\" /></Dialog>;\n" });
    const r = run([root, '--apply']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('1 pulado(s) (já na 2.0)');
    expect(r.out).toContain('app/done.tsx (Dialog)');
    expect(readFileSync(join(root, 'app/done.tsx'), 'utf8')).not.toContain('size=');
  });

  it.skipIf(typeof process.getuid === 'function' && process.getuid() === 0)(
    'a code file that cannot be written is an error (exit 1), and package.json is not touched',
    () => {
      const root = consumer();
      // A write that fails: a read-only folder on POSIX, a read-only file on Windows.
      const target = process.platform === 'win32' ? join(root, 'app/page.tsx') : join(root, 'app');
      chmodSync(target, process.platform === 'win32' ? 0o444 : 0o555);
      try {
        const r = run([root, '--apply']);
        expect(r.code).toBe(1);
        expect(r.err).toContain('erros (2)');
        expect(r.err).toContain('package.json não foi atualizado');
        expect(readFileSync(join(root, 'package.json'), 'utf8')).toBe(PKG_1X);
      } finally {
        chmodSync(target, process.platform === 'win32' ? 0o644 : 0o755);
      }
    },
  );

  it('keeps a CRLF file CRLF, TODOs included', () => {
    const select = "import { Select } from '@rojaostudio/ds/components';\r\n\r\nexport const S = () => (\r\n  <div>\r\n    <Select options={[]} />\r\n  </div>\r\n);\r\n";
    const root = consumer({ 'app/select.tsx': select });
    expect(run([root, '--apply']).code).toBe(0);
    const out = readFileSync(join(root, 'app/select.tsx'), 'utf8');
    expect(out).toContain('TODO(ds-2.0)');
    expect(out.replace(/\r\n/g, '')).not.toContain('\n');
  });

  it('migrates every default extension and honours --extensions', () => {
    const root = consumer({ 'app/a.jsx': PAGE_1X, 'app/b.mjs': PAGE_1X, 'app/c.d.ts': PAGE_1X });
    const dry = run([root, '--report', join(tmp(), 'r.json')]);
    expect(dry.out).toContain('código: 3 arquivo(s) importam o DS');
    const only = run([root, '--extensions', 'jsx']);
    expect(only.out).toContain('código: 1 arquivo(s) importam o DS');
    expect(run([root, '--extensions', '']).code).toBe(1);
  });
});

describe('dry run', () => {
  it('with --report says nothing was written in the project, and where the report is', () => {
    const root = consumer();
    const report = join(tmp(), 'report.json');
    const r = run([root, '--report', report]);
    expect(r.code).toBe(0);
    expect(r.out).toContain(`dry-run — nada foi escrito no projeto; relatório em ${report}`);
    expect(JSON.parse(readFileSync(report, 'utf8'))).toMatchObject({ mode: '1.x', applied: false, summary: { errors: 0 } });
  });
});

describe('the theme', () => {
  const css = '@import "tailwindcss";\n@import "@rojaostudio/ds/styles/themes/acme.css";\n';

  it('is found in a node_modules above the project (hoisted monorepo), and @source points at it', () => {
    const mono = tmp();
    put(mono, { 'node_modules/@rojaostudio/ds/styles/themes/acme.css': ':root { --x: 1; }\n', 'pnpm-lock.yaml': '' });
    mkdirSync(join(mono, 'node_modules/@rojaostudio/ds/dist'), { recursive: true });
    const app = join(mono, 'apps', 'web');
    put(app, { 'package.json': PKG_1X, 'app/page.tsx': PAGE_1X, 'app/globals.css': css });
    commitAll(app);
    const r = run([app, '--apply']);
    expect(r.code).toBe(0);
    expect(readFileSync(join(app, 'app/ds-theme.css'), 'utf8')).toBe(':root { --x: 1; }\n');
    const globals = readFileSync(join(app, 'app/globals.css'), 'utf8');
    expect(globals).toContain('@import "./ds-theme.css";');
    expect(globals).toContain('@source "../../../node_modules/@rojaostudio/ds/dist/components/**/*.js";');
    expect(r.out).toContain('1. pnpm install');
  });

  it('an existing ds-theme.css is a blocker and is never overwritten', () => {
    const root = consumer({
      'node_modules/@rojaostudio/ds/styles/themes/acme.css': ':root{}\n',
      'app/globals.css': css,
      'app/ds-theme.css': '/* mine */\n',
    });
    const dry = run([root]);
    expect(dry.code).toBe(2);
    expect(dry.out).toContain('app/ds-theme.css já existe e não é sobrescrito');
    expect(run([root, '--apply']).code).toBe(1);
    expect(readFileSync(join(root, 'app/ds-theme.css'), 'utf8')).toBe('/* mine */\n');
    expect(readFileSync(join(root, 'app/page.tsx'), 'utf8')).toBe(PAGE_1X);
  });
});

describe('configuration of others', () => {
  it('.npmrc and next.config lose only the DS', () => {
    const root = consumer({
      '.npmrc': '@rojaostudio:registry=https://npm.pkg.github.com\n@acme:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=${T}\n',
      'next.config.mjs': "export default {\n  transpilePackages: ['@rojaostudio/ds', 'acme-ui'],\n};\n",
    });
    const r = run([root, '--apply']);
    expect(r.code).toBe(0);
    expect(readFileSync(join(root, '.npmrc'), 'utf8')).toBe('@acme:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=${T}\n');
    expect(r.out).toContain('o token do GitHub Packages fica');
    expect(readFileSync(join(root, 'next.config.mjs'), 'utf8')).toBe("export default {\n  transpilePackages: ['acme-ui'],\n};\n");
  });

  it('an .npmrc with only the DS registry is removed; a transpilePackages from a variable is manual', () => {
    const root = consumer({
      '.npmrc': '@rojaostudio:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=${T}\n',
      'next.config.js': "const pkgs = ['@rojaostudio/ds'];\nmodule.exports = { transpilePackages: pkgs };\n",
    });
    const r = run([root, '--apply']);
    expect(r.code).toBe(0);
    expect(existsSync(join(root, '.npmrc'))).toBe(false);
    expect(r.out).toContain('next.config.js: `transpilePackages` não é uma lista literal');
    expect(readFileSync(join(root, 'next.config.js'), 'utf8')).toContain('transpilePackages: pkgs');
  });
});

describe('links and the root', () => {
  function link(target: string, path: string, type: 'file' | 'junction'): boolean {
    try {
      symlinkSync(target, path, type);
      return true;
    } catch {
      return false; // no privilege to create links here (Windows without developer mode)
    }
  }

  it('the walk does not follow a linked folder, and a linked file is neither read nor written', () => {
    const outside = tmp();
    put(outside, { 'page.tsx': PAGE_1X });
    const root = consumer();
    const dirLinked = link(outside, join(root, 'linked'), 'junction');
    const fileLinked = link(join(outside, 'page.tsx'), join(root, 'app', 'linked.tsx'), 'file');
    if (!dirLinked && !fileLinked) return;
    const scan = scanTree(root, ['.tsx']);
    expect(scan.code.map((f) => f.rel)).toEqual(['app/page.tsx']);
    commitAll(root);
    run([root, '--apply']);
    expect(readFileSync(join(outside, 'page.tsx'), 'utf8')).toBe(PAGE_1X);
  });

  it('refuses to write outside the root or through a link', () => {
    const root = tmp();
    expect(() => writeProjectFile(root, '../escape.txt', 'x')).toThrow(/fora de/);
    const outside = tmp();
    put(outside, { 'real.txt': 'real' });
    if (link(join(outside, 'real.txt'), join(root, 'via-link.txt'), 'file')) {
      expect(() => writeProjectFile(root, 'via-link.txt', 'x')).toThrow(/link simbólico/);
      expect(readFileSync(join(outside, 'real.txt'), 'utf8')).toBe('real');
    }
  });
});

describe('environment', () => {
  it('package manager: the nearest lockfile up, then npm_config_user_agent, then npm', () => {
    const mono = tmp();
    put(mono, { 'yarn.lock': '', 'apps/web/package.json': '{}' });
    expect(packageManager(join(mono, 'apps/web'), {})).toBe('yarn');
    const bare = tmp();
    expect(packageManager(bare, { npm_config_user_agent: 'pnpm/10.32.1 npm/? node/v20' })).toBe('pnpm');
    expect(packageManager(bare, {})).toBe('npm');
  });

  it('findUp climbs to the file-system root', () => {
    const top = tmp();
    put(top, { 'marker.txt': '', 'a/b/c/x.txt': '' });
    expect(findUp(join(top, 'a/b/c'), 'marker.txt')).toBe(join(top, 'marker.txt'));
  });
});
