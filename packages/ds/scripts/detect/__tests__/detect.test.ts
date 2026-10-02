import { describe, it, expect } from 'vitest';
import { runDetect, collectWaivers, isBlocking, type FileInput } from '../run';
import { buildContext } from '../tokens-source';
import { DEFAULT_CONFIG } from '../config';
import type { DetectConfig } from '../types';

const ctx = buildContext(process.cwd(), null);
const cfg = (over: Partial<DetectConfig> = {}): DetectConfig => ({ ...DEFAULT_CONFIG, ...over });

function tsx(content: string): FileInput[] {
  return [{ path: 'components/fixture.tsx', content }];
}
function ids(content: string, config = cfg()) {
  return runDetect(tsx(content), ctx, config).map((f) => f.ruleId);
}

describe('theme-aware rules', () => {
  it('hardcoded-color matches a primitive and suggests the token', () => {
    const f = runDetect(tsx(`const c = 'bg-[#0d0d0d] p-4';`), ctx, cfg());
    const hit = f.find((x) => x.ruleId === 'hardcoded-color');
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe('error');
    expect(hit!.suggestion).toContain('neutral-900');
  });

  it('hardcoded-color outside the palette is a warning', () => {
    const f = runDetect(tsx(`const c = 'text-[#abc123]';`), ctx, cfg());
    const hit = f.find((x) => x.ruleId === 'hardcoded-color');
    expect(hit?.severity).toBe('warning');
  });

  it('raw-primitive-color flags bg-red-500', () => {
    expect(ids(`const c = 'bg-red-500';`)).toContain('raw-primitive-color');
  });

  it('radius-hardcoded flags rounded-md and rounded-[10px]', () => {
    expect(ids(`const c = 'rounded-md';`)).toContain('radius-hardcoded');
    expect(ids(`const c = 'rounded-[10px]';`)).toContain('radius-hardcoded');
  });

  it('spacing-off-scale flags p-[13px] but not on-scale p-[16px]', () => {
    expect(ids(`const c = 'p-[13px]';`)).toContain('spacing-off-scale');
    expect(ids(`const c = 'p-[16px]';`)).not.toContain('spacing-off-scale');
  });
});

describe('ai-slop rules', () => {
  it('gradient-text (error)', () => {
    const f = runDetect(tsx(`const c = 'bg-clip-text text-transparent bg-linear-to-r';`), ctx, cfg());
    const hit = f.find((x) => x.ruleId === 'gradient-text');
    expect(hit?.severity).toBe('error');
  });
  it('glassmorphism, side-stripe, bounce, over-rounding, dark-glow', () => {
    expect(ids(`const c = 'backdrop-blur-md bg-white/30';`)).toContain('glassmorphism');
    expect(ids(`const c = 'border-l-4 border-brand-primary';`)).toContain('side-stripe-border');
    expect(ids(`const c = 'animate-bounce';`)).toContain('bounce-easing');
    expect(ids(`const c = 'rounded-3xl';`)).toContain('over-rounding');
    expect(ids(`const c = 'shadow-[0_0_40px_#000000]';`)).toContain('dark-glow');
  });
});

describe('clean code produces no findings', () => {
  it('button-like classes are clean', () => {
    const clean = `
      const v = {
        primary: 'bg-brand-primary text-brand-on-primary hover:bg-brand-hover',
        tonal: 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20',
        outline: 'ring-1 ring-inset ring-brand-primary bg-transparent text-brand-primary',
      };
      const size = 'box-border h-control-sm px-3 text-caption gap-1.5';
      const radius = 'rounded-(--radius-control)';
      const focus = 'focus-visible:ring-2 focus-visible:ring-stroke-focus';
    `;
    const f = runDetect(tsx(clean), ctx, cfg());
    expect(f).toHaveLength(0);
    expect(isBlocking(f, cfg())).toBe(false);
  });
});

describe('waivers and config', () => {
  it('inline waiver suppresses only the named rule', () => {
    const content = [
      `// rojao-detect-disable raw-primitive-color`,
      `const c = 'bg-red-500 rounded-md';`,
    ].join('\n');
    const found = ids(content);
    expect(found).not.toContain('raw-primitive-color');
    expect(found).toContain('radius-hardcoded');
  });

  it('bare waiver suppresses everything on the next line', () => {
    const content = [`/* rojao-detect-disable */`, `const c = 'bg-red-500 rounded-md';`].join('\n');
    expect(ids(content)).toHaveLength(0);
  });

  it('ignoreRules and ignoreValues drop findings', () => {
    expect(ids(`const c = 'bg-red-500';`, cfg({ ignoreRules: ['raw-primitive-color'] }))).toHaveLength(0);
    expect(ids(`const c = 'bg-red-500';`, cfg({ ignoreValues: ['bg-red-500'] }))).toHaveLength(0);
  });

  it('collectWaivers parses rule ids and bare form', () => {
    const w = collectWaivers([`// rojao-detect-disable a b`, `x`, `// rojao-detect-disable`].join('\n'));
    expect([...w.get(1)!]).toEqual(['a', 'b']);
    expect(w.get(3)!.has('*')).toBe(true);
  });
});

describe('exit signaling', () => {
  it('error blocks, warning-only does not (default failOn=error)', () => {
    const errFindings = runDetect(tsx(`const c = 'bg-[#0d0d0d]';`), ctx, cfg());
    expect(isBlocking(errFindings, cfg())).toBe(true);
    const warnFindings = runDetect(tsx(`const c = 'rounded-md';`), ctx, cfg());
    expect(isBlocking(warnFindings, cfg())).toBe(false);
    expect(isBlocking(warnFindings, cfg({ failOn: 'warning' }))).toBe(true);
  });
});

describe('css rules', () => {
  it('css-hardcoded-color flags raw hex in a color prop', () => {
    const f = runDetect([{ path: 'x.css', content: `.a { color: #0d0d0d; }` }], ctx, cfg());
    expect(f.map((x) => x.ruleId)).toContain('css-hardcoded-color');
  });
});
