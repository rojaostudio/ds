// Types for the `rojao detect` anti-pattern detector (issue #74).
// Theme-aware: rules read the real token scales from tokens/index.ts via RuleContext.

export type Severity = 'error' | 'warning';
export type Target = 'tsx' | 'css';

/** A unit of code to scan: a className string (tsx) or a CSS declaration (css). */
export interface StyleItem {
  kind: 'class' | 'css-decl';
  value: string; // tsx: full className string; css: "prop: value"
  raw: string;
  file: string;
  line: number;
}

/** A single reported problem. */
export interface Finding {
  ruleId: string;
  severity: Severity;
  file: string;
  line: number;
  message: string;
  value: string;
  suggestion?: string;
}

/** What a rule returns per match — file/line/ruleId are filled by the runner. */
export interface RuleHit {
  message: string;
  value: string;
  suggestion?: string;
  severity?: Severity; // overrides the rule's default when present
}

/** Sources of truth derived from tokens/index.ts + base.css, passed to every rule. */
export interface RuleContext {
  hexToToken: Map<string, string>; // '#0d0d0d' -> 'neutral-900'
  knownHexes: Set<string>;
  paletteNames: Set<string>; // neutral, red, ... cobalt, clay
  radiusScale: number[]; // px, e.g. [0,4,8,12,16,9999]
  spaceScale: number[]; // px
  semanticColorUtilities: Set<string>; // brand-primary, fg-primary, danger, ...
  brand: string | null;
}

export interface Rule {
  id: string;
  severity: Severity;
  appliesTo: Target[];
  scan(value: string, ctx: RuleContext): RuleHit[];
}

export interface DetectConfig {
  include: string[];
  ignoreFiles: string[];
  ignoreRules: string[];
  ignoreValues: string[];
  brand: string | null;
  failOn: Severity; // 'error' (default) blocks only on errors; 'warning' blocks on any finding
}
