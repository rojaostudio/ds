// Core detector: pure function over file contents → findings. Testable without touching disk.
import type { DetectConfig, Finding, RuleContext, Target } from './types';
import { RULES } from './rules/index';
import { extractTsxItems } from './parse-tsx';
import { extractCssItems } from './parse-css';

export interface FileInput {
  path: string;
  content: string;
}

/** Parse inline waivers: `rojao-detect-disable [rule ...]` → Map<line, Set<ruleId|'*'>>. */
export function collectWaivers(content: string): Map<number, Set<string>> {
  const map = new Map<number, Set<string>>();
  const lines = content.split(/\r?\n/);
  const TOKEN = 'rojao-detect-disable';
  for (let i = 0; i < lines.length; i++) {
    const idx = lines[i].indexOf(TOKEN);
    if (idx < 0) continue;
    const rest = lines[i].slice(idx + TOKEN.length).replace(/\*\/|-->|[{}]/g, ' ');
    const ids = rest.split(/[\s,]+/).filter((w) => /^[a-z][a-z-]*$/.test(w));
    map.set(i + 1, ids.length ? new Set(ids) : new Set(['*']));
  }
  return map;
}

export function runDetect(files: FileInput[], ctx: RuleContext, config: DetectConfig): Finding[] {
  const findings: Finding[] = [];
  const activeRules = RULES.filter((r) => !config.ignoreRules.includes(r.id));

  for (const f of files) {
    const target: Target = f.path.endsWith('.css') ? 'css' : 'tsx';
    const items = target === 'css' ? extractCssItems(f.content, f.path) : extractTsxItems(f.content, f.path);
    const waivers = collectWaivers(f.content);

    for (const item of items) {
      const waived = new Set<string>([
        ...(waivers.get(item.line) ?? []),
        ...(waivers.get(item.line - 1) ?? []),
      ]);
      for (const rule of activeRules) {
        if (!rule.appliesTo.includes(target)) continue;
        if (waived.has('*') || waived.has(rule.id)) continue;
        for (const hit of rule.scan(item.value, ctx)) {
          if (config.ignoreValues.some((v) => hit.value.includes(v))) continue;
          findings.push({
            ruleId: rule.id,
            severity: hit.severity ?? rule.severity,
            file: f.path,
            line: item.line,
            message: hit.message,
            value: hit.value,
            suggestion: hit.suggestion,
          });
        }
      }
    }
  }
  return findings;
}

export function isBlocking(findings: Finding[], config: DetectConfig): boolean {
  return findings.some((f) => (config.failOn === 'warning' ? true : f.severity === 'error'));
}
