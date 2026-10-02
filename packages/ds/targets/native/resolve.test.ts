import { describe, expect, it } from 'vitest';

import { flattenPrimitives, resolveValue } from './resolve';

const prims = flattenPrimitives({
  white: '#ffffff',
  red: { 500: '#f44336' },
  zinc: { 100: '#f4f4f5', 700: '#3f3f46' },
  whiteAlpha: { 100: '#FFFFFF1A' },
});

describe('resolve — alvo native', () => {
  it('achata primitives (nested + escalar)', () => {
    expect(prims['red-500']).toBe('#f44336');
    expect(prims.white).toBe('#ffffff');
    expect(prims['zinc-700']).toBe('#3f3f46');
  });

  it('var(--color-X) resolve pra hex', () => {
    expect(resolveValue('var(--color-red-500)', prims)).toBe('#f44336');
    expect(resolveValue('var(--color-white)', prims)).toBe('#ffffff');
  });

  it('color-mix sobre transparent vira rgba com alpha = pct/100', () => {
    expect(resolveValue('color-mix(in srgb, var(--color-red-500) 8%, transparent)', prims)).toBe(
      'rgba(244, 67, 54, 0.08)',
    );
    expect(resolveValue('color-mix(in srgb, var(--color-zinc-100) 22%, transparent)', prims)).toBe(
      'rgba(244, 244, 245, 0.22)',
    );
  });

  it('hex de 8 dígitos (alpha embutido) vira rgba', () => {
    expect(resolveValue('var(--color-whiteAlpha-100)', prims)).toBe('rgba(255, 255, 255, 0.102)');
  });

  it('rgba() literal passa direto', () => {
    expect(resolveValue('rgba(255, 255, 255, 0.1)', prims)).toBe('rgba(255, 255, 255, 0.1)');
  });

  it('primitiva inexistente lança (falha barulhenta no build)', () => {
    expect(() => resolveValue('var(--color-nope-500)', prims)).toThrow();
  });
});
