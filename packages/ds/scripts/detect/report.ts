// Human (console) and machine (JSON) reporters. Console style mirrors validate-themes.ts.
import type { Finding } from './types';

function summary(findings: Finding[]) {
  const errors = findings.filter((f) => f.severity === 'error').length;
  return { errors, warnings: findings.length - errors, total: findings.length };
}

export function reportConsole(findings: Finding[], fileCount: number): void {
  if (!findings.length) {
    console.log(`\n✅ rojao detect — 0 findings em ${fileCount} arquivos`);
    return;
  }
  const byFile = new Map<string, Finding[]>();
  for (const f of findings) {
    const arr = byFile.get(f.file) ?? [];
    arr.push(f);
    byFile.set(f.file, arr);
  }
  for (const [file, fs] of [...byFile.entries()].sort()) {
    console.log(`\n${file}`);
    for (const f of fs.sort((a, b) => a.line - b.line)) {
      const icon = f.severity === 'error' ? '❌' : '⚠️';
      const sug = f.suggestion ? ` → ${f.suggestion}` : '';
      console.log(`  ${icon} L${f.line}  [${f.ruleId}] ${f.message}${sug}  (${f.value})`);
    }
  }
  const s = summary(findings);
  console.log(`\n═══ ${s.errors} erro(s), ${s.warnings} aviso(s) em ${fileCount} arquivos ═══`);
}

export function reportJson(findings: Finding[], fileCount: number): string {
  return JSON.stringify({ findings, summary: { ...summary(findings), files: fileCount } }, null, 2);
}
