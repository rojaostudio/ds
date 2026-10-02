import { afterEach, describe, expect, it } from 'vitest';
import { Stat, type StatTone } from './stat';
import { Delta } from './delta';
import { Sparkline } from './sparkline';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const TONES: StatTone[] = ['default', 'positive', 'negative', 'warning', 'muted'];

const stat = (tone: StatTone, framed?: boolean) => (
  <Stat
    key={`${tone}-${framed}`}
    tone={tone}
    framed={framed}
    label="Pedidos no mês"
    value="1.284"
    caption="vs. 1.142 em agosto"
    delta={
      <Delta direction="up" tone="success">
        24%
      </Delta>
    }
    sparkline={<Sparkline data={[3, 5, 4, 7, 6, 9]} />}
  />
);

/** The computed colour of a custom property, through a probe element. */
function resolved(name: string) {
  const probe = document.createElement('span');
  probe.style.color = `var(${name})`;
  document.body.appendChild(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

describe.each(MODES)('Stat (%s)', (mode) => {
  it('every tone, framed and not, with delta, caption and sparkline, passes axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 240px)', gap: 8 }}>
        {TONES.flatMap((tone) => [stat(tone, true), stat(tone, false)])}
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Stat behaviour', () => {
  it('reads label, value, the change and the caption in order; the sparkline is hidden', async () => {
    const el = await render(stat('default'));
    const root = el.querySelector('.rds-stat')!;
    expect(root.querySelector('.rds-stat__pair')!.textContent).toBe('Pedidos no mês1.284Subiu 24%vs. 1.142 em agosto');
    expect(root.querySelector('.rds-sparkline')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('framed by default: 16 inside and a border in radius/container; framed=false is 12 16 with none', async () => {
    const el = await render(
      <div style={{ width: 240 }}>
        <Stat label="Receita" value="R$ 12.450" />
        <Stat label="Receita" value="R$ 12.450" framed={false} />
      </div>,
    );
    const [framed, cell] = [...el.querySelectorAll<HTMLElement>('.rds-stat')].map((n) => getComputedStyle(n));
    expect(framed.paddingTop).toBe('15px');
    expect(framed.borderTopWidth).toBe('1px');
    expect(framed.borderTopLeftRadius).toBe('12px');
    expect(cell.paddingTop).toBe('12px');
    expect(cell.paddingLeft).toBe('16px');
    expect(cell.borderTopStyle).toBe('none');
  });

  it('the tone paints the value with its token; no caption, no line', async () => {
    const el = await render(
      <div>
        <Stat label="Entrou" value="R$ 10" tone="positive" />
        <Stat label="Faltou" value="2" tone="negative" />
      </div>,
    );
    const [pos, neg] = [...el.querySelectorAll('.rds-stat__value')].map((n) => getComputedStyle(n).color);
    expect(pos).toBe(resolved('--stat-value-positive'));
    expect(neg).toBe(resolved('--stat-value-negative'));
    expect(pos).not.toBe(neg);
    expect(el.querySelector('.rds-stat__caption')).toBeNull();
  });
});
