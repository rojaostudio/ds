import { afterEach, describe, expect, it } from 'vitest';
import { Bubble, type BubbleAlign, type BubbleVariant } from './bubble';
import { TypingIndicator } from './typing-indicator';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const VARIANTS: BubbleVariant[] = ['fill', 'muted', 'tinted', 'outline', 'ghost', 'error'];
const ALIGNS: BubbleAlign[] = ['start', 'end'];

describe.each(MODES)('Bubble (%s)', (mode) => {
  it('every variant × align, with reactions, passes axe', async () => {
    const el = await render(
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 600 }}>
        {VARIANTS.flatMap((variant) =>
          ALIGNS.map((align) => (
            <Bubble key={`${variant}-${align}`} variant={variant} align={align} reactions={2}>
              Achei 3 mesas de jantar em madeira maciça. Quer que eu filtre por preço?
            </Bubble>
          )),
        )}
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('typing, start and end, passes axe', async () => {
    const el = await render(
      <div style={{ width: 600 }}>
        <Bubble variant="typing" />
        <Bubble variant="typing" align="end" />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Bubble behaviour', () => {
  it('grows up to 480 and wraps; end goes to the right with the small corner bottom right', async () => {
    const long = 'Uma resposta comprida que precisa quebrar a linha porque passa da largura máxima da bolha. '.repeat(3);
    const el = await render(
      <div style={{ width: 800 }}>
        <Bubble>{long}</Bubble>
        <Bubble align="end" variant="fill">
          Oi
        </Bubble>
      </div>,
    );
    const [start, end] = el.querySelectorAll<HTMLElement>('.rds-bubble');
    expect(start.getBoundingClientRect().width).toBe(480);
    const box = el.firstElementChild!.getBoundingClientRect();
    expect(end.getBoundingClientRect().right).toBe(box.right);
    const s = getComputedStyle(start);
    expect(s.borderBottomLeftRadius).toBe('4px');
    expect(s.borderBottomRightRadius).toBe('12px');
    expect(getComputedStyle(end).borderBottomRightRadius).toBe('4px');
  });

  it('the reactions pill says the count in words; 0 or none hides it', async () => {
    const el = await render(
      <div>
        <Bubble reactions={1}>Oi</Bubble>
        <Bubble reactions={0}>Oi</Bubble>
        <Bubble>Oi</Bubble>
      </div>,
    );
    const pills = el.querySelectorAll('.rds-bubble__reactions');
    expect(pills).toHaveLength(1);
    expect(pills[0].querySelector('.rds-visually-hidden')!.textContent).toBe('1 reação');
    expect(pills[0].querySelector('[aria-hidden="true"]')!.textContent).toBe('1');
  });

  it('ghost has no box', async () => {
    const el = await render(<Bubble variant="ghost">Resposta longa do assistente.</Bubble>);
    const s = getComputedStyle(el.querySelector('.rds-bubble')!);
    expect(s.paddingTop).toBe('0px');
    expect(s.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });
});

describe('Bubble typing', () => {
  it('is a status announced as "digitando…", the three dots hidden; children replace the announcement', async () => {
    const el = await render(
      <div>
        <Bubble variant="typing" />
        <Bubble variant="typing">Ana está digitando…</Bubble>
      </div>,
    );
    const [plain, named] = el.querySelectorAll<HTMLElement>('.rds-bubble--typing');
    expect(plain.getAttribute('role')).toBe('status');
    expect(plain.textContent).toBe('digitando…');
    expect(plain.querySelector('.rds-bubble__dots')!.getAttribute('aria-hidden')).toBe('true');
    expect(plain.querySelectorAll('.rds-bubble__dots > span')).toHaveLength(3);
    expect(named.textContent).toBe('Ana está digitando…');
  });

  it('58 × 48: three 6 dots 4 apart in 12 16; they pulse every 1400 ms, 200 ms after each other', async () => {
    const el = await render(<Bubble variant="typing" />);
    const bubble = el.querySelector<HTMLElement>('.rds-bubble')!;
    const box = bubble.getBoundingClientRect();
    expect([box.width, box.height]).toEqual([58, 48]);
    const dots = [...bubble.querySelectorAll<HTMLElement>('.rds-bubble__dots > span')].map((d) => getComputedStyle(d));
    expect(dots[0].width).toBe('6px');
    expect(dots.map((d) => d.animationDuration)).toEqual(['1.4s', '1.4s', '1.4s']);
    expect(dots.map((d) => d.animationDelay)).toEqual(['0s', '0.2s', '0.4s']);
    expect(dots[0].animationIterationCount).toBe('infinite');
  });

  it('stands still under prefers-reduced-motion, at 1 · 0.6 · 0.3', async () => {
    const reduced = [...document.styleSheets]
      .flatMap((sheet) => {
        try {
          return [...sheet.cssRules];
        } catch {
          return [];
        }
      })
      .flatMap(function flat(rule): CSSRule[] {
        return 'cssRules' in rule ? [rule, ...[...(rule as CSSGroupingRule).cssRules].flatMap(flat)] : [rule];
      })
      .filter((rule): rule is CSSMediaRule => rule instanceof CSSMediaRule && rule.conditionText.includes('prefers-reduced-motion'))
      .map((rule) => rule.cssText)
      .join(' ');
    expect(reduced).toMatch(/\.rds-bubble__dots > span \{ animation: [^;]*none[^;]*; \}/);
    expect(reduced).toMatch(/\.rds-bubble__dots > span:nth-child\(2\) \{ opacity: 0\.6; \}/);
  });

  it('the deprecated TypingIndicator is the typing Bubble, its label the announcement', async () => {
    const el = await render(<TypingIndicator />);
    const bubble = el.querySelector('.rds-bubble--typing')!;
    expect(bubble.getAttribute('role')).toBe('status');
    expect(bubble.textContent).toBe('Digitando');
  });
});
