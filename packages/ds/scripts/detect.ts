/**
 * rojao detect — theme-aware anti-pattern detector (issue #74).
 * Scans components (default) for hardcoded colors, off-scale radius/spacing, and "AI slop"
 * tells, comparing against the real token scales in tokens/index.ts.
 *
 *   pnpm detect                 # scan default include, human output
 *   pnpm detect --json          # machine output for CI
 *   pnpm detect --brand rojao   # resolve brand palette for the active theme
 *   pnpm detect --include gen   # override include dir(s)
 *
 * Exit code: 1 if any blocking finding (errors by default; all findings when failOn=warning).
 */
import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadConfig } from './detect/config';
import { collectFiles } from './detect/collect';
import { buildContext } from './detect/tokens-source';
import { runDetect, isBlocking, type FileInput } from './detect/run';
import { reportConsole, reportJson } from './detect/report';

const { values } = parseArgs({
  options: {
    json: { type: 'boolean', default: false },
    brand: { type: 'string' },
    include: { type: 'string', multiple: true },
    config: { type: 'string' },
    'fail-on': { type: 'string' },
  },
});

const root = process.cwd();
const config = loadConfig(root, values.config);
if (values.brand) config.brand = values.brand;
if (values.include?.length) config.include = values.include;
if (values['fail-on'] === 'warning' || values['fail-on'] === 'error') config.failOn = values['fail-on'];

const ctx = buildContext(root, config.brand);
const paths = collectFiles(root, config);
const files: FileInput[] = paths.map((p) => ({ path: p, content: readFileSync(resolve(root, p), 'utf8') }));
const findings = runDetect(files, ctx, config);

if (values.json) console.log(reportJson(findings, files.length));
else reportConsole(findings, files.length);

process.exit(isBlocking(findings, config) ? 1 : 0);
