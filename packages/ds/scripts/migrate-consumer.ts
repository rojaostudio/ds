/**
 * migrate-consumer.ts — migrates a consumer of `@rojaostudio/ds` from `0.x` or `1.x` straight to `2.0`.
 * Run: pnpm migrate:consumer <consumer-path> [--apply] [--verbose] [--report <file.json>]
 *
 * Without `--apply` it is a dry run: it prints the plan and writes nothing.
 *
 * ## The two migrations it chains
 *
 * 1. 0.x → 1.x: the brand theme leaves the package. The 1.0.0 took the brand themes out of the public package
 *    (#101): of the 13 consumers, 12 imported `@rojaostudio/ds/styles/themes/<name>.css` and only `rojao.css`
 *    survived. The way out is NOT to regenerate the theme from the recipe. The generated CSS is already in each
 *    project's `node_modules`, inside the `0.x` package it has installed (`styles/themes/` ships the eight themes,
 *    with the contrast calibration of #91/#109). Migrating is freezing that file in the consumer's repository —
 *    the #101 decision ("static CSS committed in their repo"), run project by project. That step has a deadline:
 *    it needs the old `node_modules`. If it was cleaned, the script refuses to apply (the 0.x versions stay frozen
 *    on GitHub Packages, #103) instead of writing an approximate theme and claiming it migrated.
 *
 * 2. 1.x → 2.0: the components follow the Figma [RDS] (waves 1 to 4, #14 to #17). The codemod in ./migrate
 *    rewrites imports, renamed components and mechanical props, and reports, file:line, what needs a person
 *    (structural changes such as Select `options[]` → `<SelectItem>`). With `--apply` it also writes a
 *    `TODO(ds-2.0): …` comment above each of those. The rules are data in ./migrate/map.ts. It also lists, as
 *    warnings, what compiles on 2.0 but should move on: the deprecated wrappers still in the package (Dropzone,
 *    SettingRow…) and the IconButtons that should go with a Tooltip (#29). Those are never written.
 *
 * ## What it does NOT do
 *
 * It does not run `install` and does not build. It writes the files, prints the commands and exits — whoever
 * migrates reviews the diff before installing. It does not edit the global CSS to add the 2.0 stylesheet either:
 * it reports the missing `@import` line, because where it goes (before or after the theme, inside which layer)
 * is the project's call.
 */
import { existsSync, readFileSync, writeFileSync, copyFileSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
import { mentionsDs, transformSource } from './migrate/codemod';
import type { Finding } from './migrate/codemod';
import { RDS_CSS } from './migrate/map';

const TARGET_VERSION = '^2.0.0';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const verbose = args.includes('--verbose');
const reportIdx = args.indexOf('--report');
const reportPath = reportIdx >= 0 ? args[reportIdx + 1] : undefined;
const targetArg = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--report');

if (!targetArg) {
  console.error('uso: pnpm migrate:consumer <caminho-do-consumidor> [--apply] [--verbose] [--report <arquivo.json>]');
  process.exit(1);
}

const root = targetArg.replace(/\\/g, '/').replace(/\/$/, '');
if (!existsSync(root)) {
  console.error(`não achei ${root}`);
  process.exit(1);
}

/**
 * A file-system walk, not `git grep`.
 *
 * `git grep` looks like the obvious choice — fast, already honours `.gitignore`. But it only sees TRACKED files, and
 * in `reels-web` the `app/globals.css` was never committed. The script answered "no .css imports the DS" and would
 * have skipped the whole theme migration, silently. A silent false negative is worse than an error: you see the
 * error. Hence walking the folder, skipping build output and dot folders (`.claude/worktrees` holds copies).
 */
const IGNORED = new Set(['node_modules', '.next', '.git', 'dist', 'build', '.turbo', 'out', 'coverage']);

function walk(extensions: string[], accept: (text: string, rel: string) => boolean): string[] {
  const found: string[] = [];
  const visit = (dir: string, prefix: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (IGNORED.has(entry.name) || entry.name.startsWith('.')) continue;
        visit(join(dir, entry.name), prefix ? `${prefix}/${entry.name}` : entry.name);
      } else if (extensions.some((e) => entry.name.endsWith(e)) && !entry.name.endsWith('.d.ts')) {
        const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (accept(readFileSync(join(dir, entry.name), 'utf8'), rel)) found.push(rel);
      }
    }
  };
  visit(root, '');
  return found;
}

/** Planned steps. Each one is idempotent on purpose: an interrupted migration resumes by running it again. */
type Step = { title: string; detail: string; write: () => void };
const steps: Step[] = [];
const warnings: string[] = [];
/** What stops `--apply` (shown in the dry run too). */
const blockers: string[] = [];

// ── dirty working tree: warn, do not stop ─────────────────────────────────────────────────────────────
// Stopping would be arrogant (the consumer may have legitimate work in progress), but migrating over uncommitted
// changes mixes two diffs and gets in the way of exactly the review this script wants to happen.
try {
  const dirty = execFileSync('git', ['-C', root, 'status', '--porcelain'], { encoding: 'utf8' }).trim();
  if (dirty) warnings.push(`working tree suja em ${root} — o diff da migração vai se misturar ao que já está lá`);
} catch {
  warnings.push(`${root} não parece um repositório git — sem rede de segurança para desfazer`);
}

// ── package.json: the DS version ──────────────────────────────────────────────────────────────────────
const pkgPath = join(root, 'package.json');
let currentVersion: string | undefined;

if (existsSync(pkgPath)) {
  const pkgText = readFileSync(pkgPath, 'utf8');
  const dep = /"(@rojaostudio\/ds|@rojao\/ds)":\s*"([^"]+)"/.exec(pkgText);
  if (!dep) {
    warnings.push('package.json não declara @rojaostudio/ds — só o código será migrado (num monorepo, rode também em cada app)');
  } else {
    const [, name, version] = dep;
    currentVersion = version;
    if (/^[\^~]?2\./.test(version)) {
      console.log(`${basename(root)} já está em ${version} — nada a migrar.`);
      process.exit(0);
    }
    steps.push({
      title: 'package.json',
      detail: `"${name}": "${version}" → "@rojaostudio/ds": "${TARGET_VERSION}"`,
      write: () =>
        writeFileSync(
          pkgPath,
          readFileSync(pkgPath, 'utf8').replace(/"(?:@rojaostudio\/ds|@rojao\/ds)":\s*"[^"]+"/, `"@rojaostudio/ds": "${TARGET_VERSION}"`),
          'utf8',
        ),
    });
  }
} else {
  warnings.push('sem package.json aqui — só o código será migrado');
}

// ── the CSS that imports the DS ───────────────────────────────────────────────────────────────────────
// `app/globals.css` in most, `src/app/globals.css` in some. Searching is more honest than guessing: if there is
// more than one, the theme is left for a person to decide.
const cssCandidates = walk(['.css'], (text) => /@rojao(?:studio)?\/ds\/styles/.test(text));
const cssRel = cssCandidates.length === 1 ? cssCandidates[0] : undefined;
let theme: string | undefined;

if (cssCandidates.length > 1) {
  warnings.push(`mais de um .css importa o DS (${cssCandidates.join(', ')}) — confira o tema e o @source à mão, o script não escolhe por você`);
} else if (!cssRel) {
  warnings.push('nenhum .css importa @rojaostudio/ds/styles — a parte de tema não se aplica aqui');
}

if (cssRel) {
  const cssPath = join(root, cssRel);
  const cssText = readFileSync(cssPath, 'utf8');

  // ── the theme (0.x → 1.x) ──
  theme = /@rojaostudio\/ds\/styles\/themes\/([a-z0-9-]+)\.css/i.exec(cssText)?.[1];
  if (!theme) {
    warnings.push(`${cssRel} não importa tema nomeado — nada a congelar`);
  } else if (theme === 'rojao') {
    // `rojao.css` is the one theme that stayed public: nothing to freeze.
    warnings.push('usa o tema `rojao`, que segue no pacote público — o import continua válido');
  } else {
    const source = join(root, 'node_modules/@rojaostudio/ds/styles/themes', `${theme}.css`);
    if (!existsSync(source)) {
      blockers.push(
        `o tema \`${theme}\` não está em ${root}/node_modules — o pacote 0.x já foi limpo daqui. Reinstale a versão antiga ` +
          'antes de migrar (as 0.x seguem congeladas no GitHub Packages, #103), ou copie o CSS de outro projeto que ainda tenha o pacote: todos trazem os oito temas.',
      );
    } else {
      const destRel = join(dirname(cssRel), 'ds-theme.css').replace(/\\/g, '/');
      steps.push({
        title: 'tema congelado no repositório',
        detail: `node_modules/.../themes/${theme}.css → ${destRel}`,
        write: () => copyFileSync(source, join(root, destRel)),
      });
      steps.push({
        title: `${cssRel}: import do tema`,
        detail: `@rojaostudio/ds/styles/themes/${theme}.css → ./ds-theme.css`,
        write: () => {
          const out = readFileSync(cssPath, 'utf8').replace(
            new RegExp(`(@import\\s+["'])@rojaostudio/ds/styles/themes/${theme}\\.css(["'])`),
            `$1./ds-theme.css$2`,
          );
          writeFileSync(cssPath, out, 'utf8');
        },
      });
    }
  }

  // ── the Tailwind @source ──
  // What ds-www taught us: the package ships compiled ESM since 1.0.0, so the classes live in the `.js` of `dist/` —
  // and Tailwind v4 does not scan `node_modules` by itself. Without this line, whoever renders a DS component gets
  // unstyled markup, and the build passes green. Only for projects that import components.
  const usesComponents = walk(['.ts', '.tsx'], (text) => /from ["']@rojao(?:studio)?\/ds\/components/.test(text)).length > 0;
  const hasSource = /@source\s+["'][^"']*@rojaostudio\/ds/.test(cssText);
  if (usesComponents && !hasSource) {
    const prefix = '../'.repeat(cssRel.split('/').length - 1);
    const line = `@source "${prefix}node_modules/@rojaostudio/ds/dist/components/**/*.js";`;
    steps.push({
      title: `${cssRel}: @source do Tailwind`,
      detail: line,
      write: () => {
        const current = readFileSync(cssPath, 'utf8');
        const comment =
          '\n/* O pacote publica ESM compilado desde a 1.0.0: as classes estão nos .js de dist/.\n' +
          '   O Tailwind v4 não varre node_modules sozinho — sem isto, componente do DS renderiza\n' +
          '   sem estilo e o build passa verde. */\n';
        // After the last @import: an `@source` before an `@import` is ignored by Tailwind.
        const last = [...current.matchAll(/^@import .*$/gm)].pop();
        const cut = last ? last.index! + last[0].length : 0;
        writeFileSync(cssPath, current.slice(0, cut) + comment + line + '\n' + current.slice(cut), 'utf8');
      },
    });
  } else if (usesComponents && hasSource) {
    warnings.push(`${cssRel} já tem @source do DS — confira se aponta para node_modules e não para o monorepo`);
  }
}

// ── the 2.0 stylesheet: reported, never written ───────────────────────────────────────────────────────
// Every 2.0 component reads its `rds-*` classes from styles/rds.css. Without it the components render unstyled.
const importsRds = walk(['.css'], (text) => text.includes(RDS_CSS)).length > 0;
if (!importsRds) {
  warnings.push(
    `nenhum CSS importa ${RDS_CSS} — os componentes 2.0 ficam sem estilo. Acrescente em ${cssRel ?? 'o CSS global do app'}:\n` +
      `        @import "${RDS_CSS}";`,
  );
}

// ── .npmrc ────────────────────────────────────────────────────────────────────────────────────────────
// The scope is public on npmjs since 1.0.0 (#102): no alternative registry, no token. In a monorepo consumer the
// .npmrc lives at the root, hence the warning instead of a step.
const npmrcPath = join(root, '.npmrc');
if (existsSync(npmrcPath)) {
  const npmrc = readFileSync(npmrcPath, 'utf8');
  if (npmrc.includes('npm.pkg.github.com')) {
    const clean = npmrc
      .split('\n')
      .filter((l) => !/npm\.pkg\.github\.com|@rojaostudio:registry/.test(l))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    steps.push({
      title: '.npmrc',
      detail: clean ? 'remove registry e token do GitHub Packages' : 'remove o arquivo (só tinha isso)',
      write: () => writeFileSync(npmrcPath, clean ? clean + '\n' : '', 'utf8'),
    });
  }
}

// ── transpilePackages ─────────────────────────────────────────────────────────────────────────────────
// It existed because `exports` pointed at `.ts`/`.tsx`. With the pre-build of #100 it is not needed: keeping it
// does not break, but every cold build pays again for what publishing already paid.
for (const name of ['next.config.ts', 'next.config.js', 'next.config.mjs']) {
  const p = join(root, name);
  if (!existsSync(p)) continue;
  const text = readFileSync(p, 'utf8');
  if (!/transpilePackages/.test(text)) break;
  const withoutDs = text.replace(/^\s*transpilePackages:\s*\[[^\]]*\],?\s*$\n?/m, '');
  steps.push({
    title: name,
    detail: 'remove transpilePackages (o pacote já vem compilado)',
    write: () => writeFileSync(p, withoutDs, 'utf8'),
  });
  break;
}

// ── the code: components and props (1.x → 2.0) ───────────────────────────────────────────────────────
type FileResult = { file: string; auto: Finding[]; manual: Finding[]; notices: Finding[]; output?: string };
const results: FileResult[] = [];
const sourceFiles = walk(['.ts', '.tsx'], (text) => mentionsDs(text));

for (const rel of sourceFiles) {
  const code = readFileSync(join(root, rel), 'utf8');
  try {
    const r = transformSource(code, rel, { annotate: apply });
    if (r.auto.length || r.manual.length || r.notices.length) {
      results.push({ file: rel, auto: r.auto, manual: r.manual, notices: r.notices, output: r.changed ? r.output : undefined });
    }
  } catch (err) {
    warnings.push(`erro interno ao migrar ${rel} (${(err as Error).message}) — arquivo deixado como está`);
  }
}

// ── output ────────────────────────────────────────────────────────────────────────────────────────────
const autoCount = results.reduce((n, r) => n + r.auto.length, 0);
const manualCount = results.reduce((n, r) => n + r.manual.length, 0);
const filesWithManual = results.filter((r) => r.manual.length).length;
const filesChanged = results.filter((r) => r.output !== undefined).length;

const byRule = new Map<string, { count: number; message: string }>();
for (const r of results) {
  for (const m of r.manual) {
    const e = byRule.get(m.rule) ?? { count: 0, message: m.message };
    e.count++;
    byRule.set(m.rule, e);
  }
}
const topManual = [...byRule.entries()].sort((a, b) => b[1].count - a[1].count);

// Notices (deprecated wrappers, IconButton without a Tooltip): one warning per rule, with where.
const byNotice = new Map<string, { message: string; at: string[] }>();
for (const r of results) {
  for (const n of r.notices) {
    const e = byNotice.get(n.rule) ?? { message: n.message, at: [] };
    e.at.push(`${r.file}:${n.line}`);
    byNotice.set(n.rule, e);
  }
}
const notices = [...byNotice.entries()].sort((a, b) => b[1].at.length - a[1].at.length);
const noticeCount = notices.reduce((n, [, e]) => n + e.at.length, 0);
for (const [, e] of notices) {
  const files = new Set(e.at.map((a) => a.slice(0, a.lastIndexOf(':')))).size;
  const shown = verbose ? e.at : e.at.slice(0, 5);
  const more = e.at.length > shown.length ? `\n        … e mais ${e.at.length - shown.length} (--verbose lista todos)` : '';
  warnings.push(`${e.at.length}× em ${files} arquivo(s): ${e.message}\n        ${shown.join('\n        ')}${more}`);
}

console.log(`\n${basename(root)} — ${currentVersion ?? 'versão não declarada'} → ${TARGET_VERSION}${theme ? `  ·  tema \`${theme}\`` : ''}\n`);

for (const s of steps) console.log(`  ${apply ? '✓' : '·'} ${s.title}\n      ${s.detail}`);

console.log(
  `\n  código: ${sourceFiles.length} arquivo(s) importam o DS · ${autoCount} transformação(ões) automática(s) em ${filesChanged} arquivo(s) · ` +
    `${manualCount} caso(s) manual(is) em ${filesWithManual} arquivo(s)` +
    (noticeCount ? ` · ${noticeCount} aviso(s) sem transformação (deprecated, IconButton sem Tooltip)` : ''),
);

if (verbose) {
  for (const r of results.filter((x) => x.auto.length)) {
    console.log(`\n    ${r.file}`);
    for (const a of r.auto) console.log(`      ${a.line}: ${a.message}`);
  }
}

if (manualCount) {
  console.log(`\n  manual (o codemod deixou como está${apply ? ' e escreveu um TODO(ds-2.0) acima' : ''}):`);
  for (const r of results.filter((x) => x.manual.length)) {
    for (const m of r.manual) console.log(`    ${r.file}:${m.line}  ${m.message}`);
  }
  console.log('\n  casos manuais mais comuns:');
  for (const [rule, e] of topManual.slice(0, 10)) console.log(`    ${String(e.count).padStart(4)} × ${rule} — ${e.message}`);
}

if (warnings.length) {
  console.log('\n  avisos:');
  for (const w of warnings) console.log(`    ! ${w}`);
}
if (blockers.length) {
  console.log('\n  bloqueios (impedem o --apply):');
  for (const b of blockers) console.log(`    ✗ ${b}`);
}

if (reportPath) {
  const report = {
    project: basename(root),
    from: currentVersion ?? null,
    to: TARGET_VERSION,
    steps: steps.map(({ title, detail }) => ({ title, detail })),
    warnings,
    blockers,
    summary: { filesWithDs: sourceFiles.length, filesChanged, auto: autoCount, manual: manualCount, filesWithManual, notices: noticeCount },
    topManual: topManual.map(([rule, e]) => ({ rule, count: e.count, message: e.message })),
    notices: notices.map(([rule, e]) => ({ rule, count: e.at.length, message: e.message, at: e.at })),
    files: results.map(({ file, auto, manual, notices }) => ({ file, auto, manual, notices })),
  };
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(`\n  relatório: ${reportPath}`);
}

if (!apply) {
  console.log('\ndry-run — nada foi escrito. Rode de novo com --apply para aplicar.\n');
  process.exit(0);
}

if (blockers.length) {
  console.error('\nnada foi escrito: resolva os bloqueios acima e rode de novo.\n');
  process.exit(1);
}

for (const s of steps) s.write();
for (const r of results) if (r.output !== undefined) writeFileSync(join(root, r.file), r.output, 'utf8');

const manager = existsSync(join(root, 'pnpm-lock.yaml')) ? 'pnpm' : 'npm';
console.log(
  `\naplicado. Agora, em ${root}:\n` +
    `  1. ${manager} install\n` +
    `  2. procure TODO(ds-2.0) e resolva os casos manuais\n` +
    `  3. ${manager} run build      # o typecheck mostra o que a 2.0 mudou e o codemod não viu\n` +
    `  4. abra as páginas e confira o estilo — build verde não prova CSS gerado\n` +
    `  5. git diff\n`,
);
