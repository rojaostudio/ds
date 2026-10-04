/**
 * run.ts — the `rojao-ds-codemod` command: migrates a consumer of `@rojaostudio/ds` from `0.x` or `1.x` straight to
 * `2.0`, or a `2.0.0-next` one to the single prop vocabulary. `main()` is the whole command; ./cli.ts only calls it.
 * Run: npx @rojaostudio/ds-codemod <consumer-path> [--apply] [--from 1.x|next] [--force] [--verbose] [--report <file.json>]
 * (inside this repo: pnpm migrate:consumer <consumer-path> …; `npx rojao-ds migrate` forwards here too)
 *
 * Without `--apply` it is a dry run: it prints the plan and writes nothing in the project.
 *
 * ## The migrations it chains
 *
 * 1. 0.x → 1.x: the brand theme leaves the package. The 1.0.0 took the brand themes out of the public package
 *    (#101): of the 13 consumers, 12 imported `@rojaostudio/ds/styles/themes/<name>.css` and only `rojao.css`
 *    survived. The way out is NOT to regenerate the theme from the recipe. The generated CSS is already in each
 *    project's `node_modules`, inside the `0.x` package it has installed (`styles/themes/` ships the eight themes,
 *    with the contrast calibration of #91/#109). Migrating is freezing that file in the consumer's repository —
 *    the #101 decision ("static CSS committed in their repo"), run project by project. That step has a deadline:
 *    it needs the old `node_modules` (looked for from the project up, for a hoisted monorepo). If it was cleaned,
 *    the script refuses to apply instead of writing an approximate theme and claiming it migrated.
 *
 * 2. 1.x → 2.0: the components follow the Figma [RDS] (waves 1 to 4, #14 to #17). The codemod in ./codemod.ts
 *    rewrites imports, renamed components and mechanical props, and reports, file:line, what needs a person.
 *    With `--apply` it also writes a `TODO(ds-2.0): …` comment above each of those. The rules are data in ./map.ts.
 *
 * 3. 2.0.0-next → the single prop vocabulary (03/10/2026). A project already on `2.x` (or run with `--from next`)
 *    only gets the code step, with the vocabulary rules of ./map.ts. No package.json, theme or CSS step.
 *
 * ## Which one: `--from`, or the package.json of the folder
 *
 * The 1.x rules are not idempotent over 2.0 code (the 1.x Avatar `size="md"` is the 2.0 `lg`), so the codemod never
 * guesses where the project comes from. The version comes from the package.json of the folder; when it does not say
 * (no package.json, no DS dependency, `workspace:*`, `latest`…), `--from` is required. In the 1.x mode a file that
 * already imports a name only 2.0 has is skipped whole. And package.json is the LAST file written: a run that stops
 * half way leaves the version on 1.x, and the next run resumes in the 1.x mode over the files still on 1.x.
 *
 * ## Safety
 *
 * `--apply` refuses a folder outside git or with a dirty working tree (the review of the diff is the safety net)
 * unless `--force`. Nothing is written through a symbolic link or outside the folder, every write is atomic, and an
 * existing `ds-theme.css` is never overwritten. It does not run `install` and does not build: it writes the files,
 * prints the commands and exits — whoever migrates reviews the diff before installing.
 *
 * ## Exit codes
 *
 * 0 done (or a dry run with nothing in the way) · 1 failure (bad arguments, an error on some file, `--apply`
 * refused) · 2 dry run with blockers (an `--apply` would be refused).
 */
import { existsSync, lstatSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { mentionsDs, transformSource } from './codemod';
import type { Finding } from './codemod';
import { cleanNextConfig, cleanNpmrc } from './config-files';
import { DS_NAMES, dsDependency, findUp, fromForVersion, gitState, packageManager } from './environment';
import type { From } from './environment';
import { removeProjectFile, scanTree, unsafeTarget, writeAtomic, writeProjectFile } from './fs-safe';
import { RDS_CSS } from './map';

const TARGET_VERSION = '^2.0.0';

export const DEFAULT_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts'];

export const USAGE = [
  'uso: npx @rojaostudio/ds-codemod <pasta-do-projeto> [--apply] [--from 1.x|next] [--force] [--verbose] [--report <arquivo.json>] [--extensions <lista>]',
  '',
  '  sem --apply          dry-run: mostra o plano e os casos manuais (arquivo:linha), não escreve nada no projeto',
  '  --apply              escreve as mudanças e um TODO(ds-2.0) acima de cada caso manual',
  '  --from 1.x|next      de onde o projeto vem: 1.x (0.x/1.x → 2.0) ou next (2.0.0-next → vocabulário de props).',
  '                       Obrigatório quando o package.json da pasta não declara a versão do DS',
  '  --force              aplica mesmo fora do git ou com a working tree suja',
  '  --verbose            lista também cada transformação automática',
  '  --report <json>      grava o relatório completo em JSON',
  `  --extensions <lista> extensões do código, separadas por vírgula (padrão: ${DEFAULT_EXTENSIONS.join(',')})`,
  '  --from-next          o mesmo que --from next (mantido por compatibilidade)',
  '',
  'saída: 0 ok · 1 falha (argumento, erro em arquivo, --apply recusado) · 2 dry-run com bloqueio',
].join('\n');

export interface Io {
  out: (line: string) => void;
  err: (line: string) => void;
  env: NodeJS.ProcessEnv;
}

const defaultIo: Io = { out: (l) => console.log(l), err: (l) => console.error(l), env: process.env };

/** A planned write. Each one is idempotent on purpose: an interrupted migration resumes by running it again. */
type Step = { title: string; detail: string; write: () => void };

type FileResult = { file: string; auto: Finding[]; manual: Finding[]; notices: Finding[]; output?: string };

function parseExtensions(list: string): string[] {
  const exts = list
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
    .map((e) => (e.startsWith('.') ? e : `.${e}`));
  const bad = exts.filter((e) => !/^\.[a-z0-9]+$/i.test(e) || e === '.css');
  if (!exts.length || bad.length) throw new Error(`--extensions inválido: ${list}`);
  return exts;
}

export function main(argv: string[], io: Io = defaultIo): number {
  // ── arguments ───────────────────────────────────────────────────────────────────────────────────────
  let values: Record<string, string | boolean | undefined>;
  let positionals: string[];
  try {
    ({ values, positionals } = parseArgs({
      args: argv,
      strict: true,
      allowPositionals: true,
      options: {
        apply: { type: 'boolean' },
        force: { type: 'boolean' },
        verbose: { type: 'boolean' },
        report: { type: 'string' },
        from: { type: 'string' },
        'from-next': { type: 'boolean' },
        extensions: { type: 'string' },
        help: { type: 'boolean', short: 'h' },
      },
    }));
  } catch (err) {
    io.err(`${(err as Error).message}\n\n${USAGE}`);
    return 1;
  }
  if (values.help) {
    io.out(USAGE);
    return 0;
  }
  if (positionals.length !== 1) {
    io.err(positionals.length ? `uma pasta por vez (recebi ${positionals.length})\n\n${USAGE}` : USAGE);
    return 1;
  }

  const apply = !!values.apply;
  const force = !!values.force;
  const verbose = !!values.verbose;
  const reportPath = values.report as string | undefined;

  let fromFlag: From | undefined;
  if (values.from !== undefined) {
    if (values.from !== '1.x' && values.from !== 'next') {
      io.err(`--from aceita 1.x ou next (recebi ${values.from})`);
      return 1;
    }
    fromFlag = values.from;
  }
  if (values['from-next']) {
    if (fromFlag === '1.x') {
      io.err('--from-next e --from 1.x juntos: escolha um');
      return 1;
    }
    fromFlag = 'next';
  }

  let extensions = DEFAULT_EXTENSIONS;
  if (values.extensions !== undefined) {
    try {
      extensions = parseExtensions(values.extensions as string);
    } catch (err) {
      io.err((err as Error).message);
      return 1;
    }
  }

  const root = positionals[0].replace(/\\/g, '/').replace(/(.)\/$/, '$1');
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    io.err(`não achei a pasta ${root}`);
    return 1;
  }

  const warnings: string[] = [];
  /** What stops `--apply` (shown in the dry run too). */
  const blockers: string[] = [];
  /** Files the codemod failed on: listed, and the exit code is 1. */
  const errors: string[] = [];
  const steps: Step[] = [];
  /** Written last, after everything else: see "Which one" above. */
  let packageStep: Step | undefined;

  // ── package.json: the DS version, and the mode ──────────────────────────────────────────────────────
  const pkgPath = join(root, 'package.json');
  let currentVersion: string | undefined;
  let dep: { name: string; version: string } | undefined;
  let detected: From | undefined;
  let undetectedWhy: string;

  if (existsSync(pkgPath)) {
    let pkg: unknown;
    try {
      pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    } catch (err) {
      io.err(`package.json inválido em ${root}: ${(err as Error).message}`);
      return 1;
    }
    dep = dsDependency(pkg);
    if (dep) {
      currentVersion = dep.version;
      detected = fromForVersion(dep.version);
      undetectedWhy = `o package.json declara ${dep.name} "${dep.version}", que não diz a versão`;
    } else {
      undetectedWhy = 'o package.json desta pasta não declara @rojaostudio/ds (num monorepo, rode em cada app)';
    }
  } else {
    undetectedWhy = 'esta pasta não tem package.json';
  }

  const from = fromFlag ?? detected;
  if (!from) {
    io.err(
      `não sei de que versão este projeto vem: ${undetectedWhy}.\n` +
        'Diga com --from:\n' +
        '  --from 1.x    projeto no @rojaostudio/ds 0.x ou 1.x (migra para a 2.0)\n' +
        '  --from next   projeto já na 2.0.0-next (só o vocabulário de props)',
    );
    return 1;
  }
  if (fromFlag && detected && fromFlag !== detected) {
    warnings.push(`o package.json diz ${dep!.name} "${dep!.version}" (modo ${detected}), mas --from ${fromFlag} foi pedido: vale o --from`);
  }
  const fromNext = from === 'next';

  if (dep && !fromNext) {
    const why = unsafeTarget(root, 'package.json');
    if (why) {
      blockers.push(why);
    } else {
      packageStep = {
        title: 'package.json (por último)',
        detail: `"${dep.name}": "${dep.version}" → "@rojaostudio/ds": "${TARGET_VERSION}"`,
        write: () =>
          writeProjectFile(
            root,
            'package.json',
            readFileSync(pkgPath, 'utf8').replace(/"(?:@rojaostudio\/ds|@rojao\/ds)"(\s*):(\s*)"[^"]*"/g, `"@rojaostudio/ds"$1:$2"${TARGET_VERSION}"`),
          ),
      };
    }
  } else if (!dep && !fromNext) {
    warnings.push('o package.json desta pasta não declara @rojaostudio/ds — só o código será migrado (num monorepo, rode também em cada app)');
  }

  if (fromNext) {
    warnings.push(
      `modo vocabulário (2.0.0-next → vocabulário único de props): só o código é migrado. Atualize @rojaostudio/ds para a versão com o vocabulário${currentVersion ? ` (hoje ${currentVersion})` : ''} — os nomes antigos que o pacote ainda aceita são deprecated.`,
    );
  }

  // ── git: the safety net ─────────────────────────────────────────────────────────────────────────────
  // Migrating over uncommitted changes mixes two diffs and gets in the way of exactly the review this script wants
  // to happen; outside git there is nothing to undo with. `--force` is the explicit "I know".
  const git = gitState(root, io.env);
  if (git.kind === 'dirty') {
    const msg = `working tree suja em ${root} (${git.lines.length} arquivo(s)) — o diff da migração se misturaria ao que já está lá`;
    if (force) warnings.push(`${msg}; seguindo por causa do --force`);
    else blockers.push(`${msg}. Faça commit ou stash antes, ou rode com --force`);
  } else if (git.kind === 'none') {
    const msg = `${root} não está num repositório git (${git.reason}) — sem rede de segurança para desfazer`;
    if (force) warnings.push(`${msg}; seguindo por causa do --force`);
    else blockers.push(`${msg}. Rode dentro de um repositório git, ou com --force`);
  }

  // ── one walk of the tree ────────────────────────────────────────────────────────────────────────────
  const scan = scanTree(root, extensions);
  if (scan.links.length) {
    warnings.push(`${scan.links.length} link(s) simbólico(s) ignorado(s), nem lidos nem escritos: ${scan.links.slice(0, 5).join(', ')}${scan.links.length > 5 ? '…' : ''}`);
  }

  // ── the CSS that imports the DS ─────────────────────────────────────────────────────────────────────
  // `app/globals.css` in most, `src/app/globals.css` in some. Searching is more honest than guessing: if there is
  // more than one, the theme is left for a person to decide.
  const cssCandidates = fromNext ? [] : scan.css.filter((f) => /@rojao(?:studio)?\/ds\/styles/.test(f.text)).map((f) => f.rel);
  const cssRel = cssCandidates.length === 1 ? cssCandidates[0] : undefined;
  let theme: string | undefined;

  if (cssCandidates.length > 1) {
    warnings.push(`mais de um .css importa o DS (${cssCandidates.join(', ')}) — confira o tema e o @source à mão, o script não escolhe por você`);
  } else if (!cssRel && !fromNext) {
    warnings.push('nenhum .css importa @rojaostudio/ds/styles — a parte de tema não se aplica aqui');
  }

  const usesComponents = scan.code.some((f) => /from ["']@rojao(?:studio)?\/ds\/components/.test(f.text));

  if (cssRel) {
    const cssText = scan.css.find((f) => f.rel === cssRel)!.text;
    const cssBlocked = unsafeTarget(root, cssRel);
    if (cssBlocked) blockers.push(cssBlocked);

    // ── the theme (0.x → 1.x) ──
    const themeImport = /@(rojao(?:studio)?)\/ds\/styles\/themes\/([a-z0-9-]+)\.css/i.exec(cssText);
    theme = themeImport?.[2];
    if (!themeImport || !theme) {
      warnings.push(`${cssRel} não importa tema nomeado — nada a congelar`);
    } else if (theme === 'rojao') {
      // `rojao.css` is the one theme that stayed public: nothing to freeze.
      warnings.push('usa o tema `rojao`, que segue no pacote público — o import continua válido');
    } else {
      const importedPkg = `@${themeImport[1]}/ds`;
      const pkgs = [importedPkg, ...DS_NAMES.filter((n) => n !== importedPkg)];
      let source: string | undefined;
      for (const p of pkgs) source ??= findUp(root, join('node_modules', p, 'styles', 'themes', `${theme}.css`));
      const destRel = join(dirname(cssRel), 'ds-theme.css').replace(/\\/g, '/');
      const destBlocked = unsafeTarget(root, destRel, true);
      if (!source) {
        blockers.push(
          `o tema \`${theme}\` não está em nenhum node_modules de ${root} para cima — o pacote 0.x já foi limpo daqui. Reinstale a versão antiga ` +
            'antes de migrar (as 0.x seguem congeladas no GitHub Packages, #103), ou copie o CSS de outro projeto que ainda tenha o pacote: todos trazem os oito temas.',
        );
      } else if (destBlocked?.endsWith(' já existe')) {
        blockers.push(
          `${destBlocked} e não é sobrescrito: se é o tema congelado de uma execução anterior, troque à mão o import ` +
            `de ${importedPkg}/styles/themes/${theme}.css por ./ds-theme.css em ${cssRel}; senão, renomeie o arquivo e rode de novo`,
        );
      } else if (destBlocked) {
        blockers.push(destBlocked);
      } else {
        const themeSource = source;
        steps.push({
          title: 'tema congelado no repositório',
          detail: `${relative(root, themeSource).replace(/\\/g, '/')} → ${destRel}`,
          write: () => writeProjectFile(root, destRel, readFileSync(themeSource, 'utf8'), true),
        });
        steps.push({
          title: `${cssRel}: import do tema`,
          detail: `${importedPkg}/styles/themes/${theme}.css → ./ds-theme.css`,
          write: () => {
            const current = readFileSync(join(root, cssRel), 'utf8');
            const out = current.replace(
              new RegExp(`(@import\\s+["'])@${themeImport[1]}/ds/styles/themes/${theme}\\.css(["'])`),
              `$1./ds-theme.css$2`,
            );
            writeProjectFile(root, cssRel, out);
          },
        });
      }
    }

    // ── the Tailwind @source ──
    // The package ships compiled ESM since 1.0.0, so the classes live in the `.js` of `dist/` — and Tailwind v4
    // does not scan `node_modules` by itself. Without this line, a DS component renders unstyled and the build
    // passes green. The path goes to the package as installed: in a hoisted monorepo it is above the app.
    const hasSource = /@source\s+["'][^"']*@rojaostudio\/ds/.test(cssText);
    if (usesComponents && !hasSource) {
      const cssDir = join(root, dirname(cssRel));
      const installed = findUp(root, join('node_modules', '@rojaostudio', 'ds'));
      const pkgDir = installed
        ? relative(cssDir, installed).replace(/\\/g, '/')
        : `${'../'.repeat(cssRel.split('/').length - 1)}node_modules/@rojaostudio/ds`;
      const line = `@source "${pkgDir}/dist/components/**/*.js";`;
      steps.push({
        title: `${cssRel}: @source do Tailwind`,
        detail: line,
        write: () => {
          const current = readFileSync(join(root, cssRel), 'utf8');
          if (current.includes(line)) return;
          const eol = current.includes('\r\n') ? '\r\n' : '\n';
          const comment =
            `${eol}/* O pacote publica ESM compilado desde a 1.0.0: as classes estão nos .js de dist/.${eol}` +
            `   O Tailwind v4 não varre node_modules sozinho — sem isto, componente do DS renderiza${eol}` +
            `   sem estilo e o build passa verde. */${eol}`;
          // After the last @import: an `@source` before an `@import` is ignored by Tailwind.
          const last = [...current.matchAll(/^@import .*$/gm)].pop();
          const cut = last ? last.index! + last[0].replace(/\r$/, '').length : 0;
          writeProjectFile(root, cssRel, current.slice(0, cut) + comment + line + eol + current.slice(cut));
        },
      });
    } else if (usesComponents && hasSource) {
      warnings.push(`${cssRel} já tem @source do DS — confira se aponta para node_modules e não para o monorepo`);
    }
  }

  // ── the 2.0 stylesheet: reported, never written ─────────────────────────────────────────────────────
  const importsRds = fromNext || scan.css.some((f) => f.text.includes(RDS_CSS));
  if (!importsRds) {
    warnings.push(
      `nenhum CSS importa ${RDS_CSS} — os componentes 2.0 ficam sem estilo. Acrescente em ${cssRel ?? 'o CSS global do app'}:\n` +
        `        @import "${RDS_CSS}";`,
    );
  }

  // ── .npmrc ──────────────────────────────────────────────────────────────────────────────────────────
  // The scope is public on npmjs since 1.0.0 (#102). Only the DS lines go; in a monorepo the .npmrc is at the root.
  const npmrcPath = join(root, '.npmrc');
  if (!fromNext && existsSync(npmrcPath)) {
    const change = cleanNpmrc(readFileSync(npmrcPath, 'utf8'));
    if (change) {
      const why = unsafeTarget(root, '.npmrc');
      if (why) {
        blockers.push(why);
      } else {
        steps.push({
          title: '.npmrc',
          detail: change.output
            ? `remove ${change.removed.map((l) => l.trim().replace(/(_authToken\s*=).*/, '$1…')).join(' · ')}`
            : 'remove o arquivo (só tinha o registry do DS)',
          write: () => (change.output ? writeProjectFile(root, '.npmrc', change.output) : removeProjectFile(root, '.npmrc')),
        });
        if (change.tokenKeptFor.length) {
          warnings.push(
            `.npmrc: o token do GitHub Packages fica, porque ainda há escopo apontando para lá (${change.tokenKeptFor.join(', ')}) — confira se ele ainda precisa`,
          );
        }
      }
    }
  }

  // ── transpilePackages ───────────────────────────────────────────────────────────────────────────────
  // It existed because `exports` pointed at `.ts`/`.tsx`. With the pre-build of #100 it is not needed: keeping it
  // does not break, but every cold build pays again for what publishing already paid.
  for (const name of fromNext ? [] : ['next.config.ts', 'next.config.mts', 'next.config.js', 'next.config.mjs', 'next.config.cjs']) {
    const p = join(root, name);
    if (!existsSync(p) || lstatSync(p).isDirectory()) continue;
    let change;
    try {
      change = cleanNextConfig(readFileSync(p, 'utf8'), name);
    } catch (err) {
      errors.push(`${name}: não consegui ler (${(err as Error).message}) — deixado como está`);
      continue;
    }
    if (change.kind === 'manual') {
      warnings.push(`${name}: ${change.reason} (o pacote já vem compilado)`);
    } else if (change.kind === 'changed') {
      const why = unsafeTarget(root, name);
      if (why) {
        blockers.push(why);
        continue;
      }
      const output = change.output;
      steps.push({
        title: name,
        detail: change.removedKey
          ? 'remove transpilePackages (só tinha o DS; o pacote já vem compilado)'
          : `tira ${change.removed.join(', ')} de transpilePackages (o pacote já vem compilado)`,
        write: () => writeProjectFile(root, name, output),
      });
    }
  }

  // ── the code: components and props ──────────────────────────────────────────────────────────────────
  const results: FileResult[] = [];
  const skipped: { file: string; names: string[] }[] = [];
  const sourceFiles = scan.code.filter((f) => mentionsDs(f.text));

  for (const { rel, text } of sourceFiles) {
    try {
      const r = transformSource(text, rel, { annotate: apply, from });
      if (r.skipped) {
        skipped.push({ file: rel, names: r.skipped });
        continue;
      }
      if (r.auto.length || r.manual.length || r.notices.length) {
        if (r.changed) {
          const why = unsafeTarget(root, rel);
          if (why) {
            errors.push(`${rel}: ${why} — deixado como está`);
            continue;
          }
        }
        results.push({ file: rel, auto: r.auto, manual: r.manual, notices: r.notices, output: r.changed ? r.output : undefined });
      }
    } catch (err) {
      errors.push(`${rel}: erro interno ao migrar (${(err as Error).message}) — deixado como está`);
    }
  }

  if (skipped.length) {
    const shown = verbose ? skipped : skipped.slice(0, 5);
    warnings.push(
      `${skipped.length} arquivo(s) já importam nomes que só existem na 2.0 e foram pulados no modo 1.x (as regras da 1.x não rodam duas vezes): ` +
        'migre à mão o que faltar neles, ou rode com --from next para o vocabulário.\n        ' +
        shown.map((s) => `${s.file} (${s.names.slice(0, 3).join(', ')}${s.names.length > 3 ? '…' : ''})`).join('\n        ') +
        (skipped.length > shown.length ? `\n        … e mais ${skipped.length - shown.length} (--verbose lista todos)` : ''),
    );
  }

  // ── output ──────────────────────────────────────────────────────────────────────────────────────────
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

  const allSteps = packageStep ? [...steps, packageStep] : steps;
  const target = fromNext ? 'vocabulário único de props (2.0.0-next)' : TARGET_VERSION;
  io.out(`\n${basename(resolve(root))} — ${currentVersion ?? 'versão não declarada'} → ${target}  ·  modo ${from}${theme ? `  ·  tema \`${theme}\`` : ''}\n`);

  for (const s of allSteps) io.out(`  ${apply ? '✓' : '·'} ${s.title}\n      ${s.detail}`);

  io.out(
    `\n  código: ${sourceFiles.length} arquivo(s) importam o DS · ${autoCount} transformação(ões) automática(s) em ${filesChanged} arquivo(s) · ` +
      `${manualCount} caso(s) manual(is) em ${filesWithManual} arquivo(s)` +
      (skipped.length ? ` · ${skipped.length} pulado(s) (já na 2.0)` : '') +
      (noticeCount ? ` · ${noticeCount} aviso(s) sem transformação (deprecated, IconButton sem Tooltip)` : ''),
  );

  if (verbose) {
    for (const r of results.filter((x) => x.auto.length)) {
      io.out(`\n    ${r.file}`);
      for (const a of r.auto) io.out(`      ${a.line}: ${a.message}`);
    }
  }

  if (manualCount) {
    io.out(`\n  manual (o codemod deixou como está${apply ? ' e escreveu um TODO(ds-2.0) acima' : ''}):`);
    for (const r of results.filter((x) => x.manual.length)) {
      for (const m of r.manual) io.out(`    ${r.file}:${m.line}  ${m.message}`);
    }
    io.out('\n  casos manuais mais comuns:');
    for (const [rule, e] of topManual.slice(0, 10)) io.out(`    ${String(e.count).padStart(4)} × ${rule} — ${e.message}`);
  }

  if (warnings.length) {
    io.out('\n  avisos:');
    for (const w of warnings) io.out(`    ! ${w}`);
  }
  if (blockers.length) {
    io.out('\n  bloqueios (impedem o --apply):');
    for (const b of blockers) io.out(`    ✗ ${b}`);
  }

  const writeReport = (writeErrors: string[]) => {
    if (!reportPath) return;
    const report = {
      project: basename(resolve(root)),
      from: currentVersion ?? null,
      mode: from,
      to: target,
      applied: apply && !blockers.length,
      steps: allSteps.map(({ title, detail }) => ({ title, detail })),
      warnings,
      blockers,
      errors: [...errors, ...writeErrors],
      summary: {
        filesWithDs: sourceFiles.length,
        filesChanged,
        auto: autoCount,
        manual: manualCount,
        filesWithManual,
        notices: noticeCount,
        skipped: skipped.length,
        errors: errors.length + writeErrors.length,
      },
      topManual: topManual.map(([rule, e]) => ({ rule, count: e.count, message: e.message })),
      notices: notices.map(([rule, e]) => ({ rule, count: e.at.length, message: e.message, at: e.at })),
      skipped,
      files: results.map(({ file, auto, manual, notices }) => ({ file, auto, manual, notices })),
    };
    try {
      writeAtomic(resolve(reportPath), JSON.stringify(report, null, 2) + '\n');
    } catch (err) {
      writeErrors.push(`relatório ${reportPath}: ${(err as Error).message}`);
    }
  };

  const printErrors = (list: string[]) => {
    if (!list.length) return;
    io.err(`\n  erros (${list.length}):`);
    for (const e of list) io.err(`    ✗ ${e}`);
  };

  if (!apply) {
    const reportErrors: string[] = [];
    writeReport(reportErrors);
    const all = [...errors, ...reportErrors];
    printErrors(all);
    const where = reportPath && !reportErrors.length ? `nada foi escrito no projeto; relatório em ${reportPath}` : 'nada foi escrito';
    io.out(`\ndry-run — ${where}. Rode de novo com --apply para aplicar.\n`);
    if (blockers.length) return 2;
    return all.length ? 1 : 0;
  }

  if (blockers.length) {
    writeReport([]);
    printErrors(errors);
    io.err('\nnada foi escrito: resolva os bloqueios acima e rode de novo.\n');
    return 1;
  }

  // ── writing: the code first, then the configuration, package.json last ─────────────────────────────
  const writeErrors: string[] = [];
  for (const r of results) {
    if (r.output === undefined) continue;
    try {
      writeProjectFile(root, r.file, r.output);
    } catch (err) {
      writeErrors.push(`${r.file}: ${(err as Error).message}`);
    }
  }
  for (const s of steps) {
    try {
      s.write();
    } catch (err) {
      writeErrors.push(`${s.title}: ${(err as Error).message}`);
    }
  }
  if (packageStep) {
    if (errors.length || writeErrors.length) {
      writeErrors.push(
        'package.json não foi atualizado porque algum arquivo falhou: corrija e rode de novo (o modo 1.x retoma de onde parou), ou atualize a versão à mão',
      );
    } else {
      try {
        packageStep.write();
      } catch (err) {
        writeErrors.push(`package.json: ${(err as Error).message}`);
      }
    }
  }

  writeReport(writeErrors);
  if (reportPath) io.out(`\n  relatório: ${reportPath}`);
  const failures = [...errors, ...writeErrors];
  printErrors(failures);

  const manager = packageManager(root, io.env);
  io.out(
    `\n${failures.length ? 'aplicado com falhas' : 'aplicado'}. Agora, em ${root}:\n` +
      `  1. ${manager} install\n` +
      `  2. procure TODO(ds-2.0) e resolva os casos manuais\n` +
      `  3. ${manager} run build      # o typecheck mostra o que a 2.0 mudou e o codemod não viu\n` +
      `  4. abra as páginas e confira o estilo — build verde não prova CSS gerado\n` +
      `  5. git diff\n`,
  );
  return failures.length ? 1 : 0;
}
