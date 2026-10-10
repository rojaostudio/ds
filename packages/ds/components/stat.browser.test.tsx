import { afterEach, describe, expect, it, vi } from 'vitest';
import { Stat, type StatTone } from './stat';
import { Delta } from './delta';
import { Sparkline } from './sparkline';
import { MODES, axeViolations, cleanup, render, setMedia } from './__tests__/render';

afterEach(cleanup);

const TONES: (StatTone | 'muted')[] = ['neutral', 'success', 'danger', 'warning', 'muted'];

const stat = (tone: StatTone | 'muted', framed?: boolean) => (
  <Stat
    key={`${tone}-${framed}`}
    tone={tone === 'muted' ? 'neutral' : tone}
    muted={tone === 'muted'}
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
    const el = await render(stat('neutral'));
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
        <Stat label="Entrou" value="R$ 10" tone="success" />
        <Stat label="Faltou" value="2" tone="danger" />
      </div>,
    );
    const [pos, neg] = [...el.querySelectorAll('.rds-stat__value')].map((n) => getComputedStyle(n).color);
    expect(pos).toBe(resolved('--stat-value-positive'));
    expect(neg).toBe(resolved('--stat-value-negative'));
    expect(pos).not.toBe(neg);
    expect(el.querySelector('.rds-stat__caption')).toBeNull();
  });
});

describe('Stat vocabulary', () => {
  it('muted greys the number; success, danger and neutral paint it', async () => {
    const el = await render(
      <div>
        <Stat label="Zero" value="0" muted />
        <Stat label="Entrou" value="R$ 10" tone="success" />
        <Stat label="Faltou" value="2" tone="danger" />
        <Stat label="Pedidos" value="3" />
      </div>,
    );
    const [zero, pos, neg, plain] = [...el.querySelectorAll('.rds-stat__value')].map((n) => getComputedStyle(n).color);
    expect(zero).toBe(resolved('--stat-value-muted'));
    expect(pos).toBe(resolved('--stat-value-positive'));
    expect(neg).toBe(resolved('--stat-value-negative'));
    expect(plain).toBe(resolved('--stat-value-default'));
  });
});

// inverse: the brand's dark fill (stat/inverse/*), the Delta inside in delta/inverse. Measured in light, dark and
// print (Chromium in the print media type), each text at least 4.5:1 on the fill.
const rgba = (c: string) => {
  const m = c.match(/rgba?\(([^)]+)\)/)!;
  const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return [r, g, b, a] as const;
};
const lum = ([r, g, b]: readonly number[]) => {
  const ch = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
};
const contrast = (fg: string, bg: string) => {
  const [r, g, b, a] = rgba(fg);
  const back = rgba(bg);
  const front = [r * a + back[0] * (1 - a), g * a + back[1] * (1 - a), b * a + back[2] * (1 - a)];
  const [x, y] = [lum(front), lum(back)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

describe.each(['light', 'dark', 'print'] as const)('Stat inverse (%s)', (mode) => {
  afterEach(() => setMedia(null));

  it('passes axe; fill surface/inverse, value text/on-inverse, label and caption text/on-inverse-subtle, the Delta inverse, all AA', async () => {
    if (mode === 'print') await setMedia('print');
    const el = await render(
      <div style={{ width: 280 }}>
        <Stat
          inverse
          label="Saldo do mês"
          value="R$ 48.320"
          caption="vs. R$ 41.200 em setembro"
          delta={
            <Delta direction="down" tone="danger">
              3%
            </Delta>
          }
        />
      </div>,
      mode === 'dark' ? 'dark' : 'light',
    );
    expect(await axeViolations(el)).toEqual([]);
    const root = el.querySelector<HTMLElement>('.rds-stat')!;
    const s = getComputedStyle(root);
    const color = (sel: string) => getComputedStyle(root.querySelector<HTMLElement>(sel)!).color;
    expect(s.backgroundColor).toBe(resolved('--surface-inverse'));
    expect(s.borderTopColor).toBe('rgba(0, 0, 0, 0)');
    expect(color('.rds-stat__value')).toBe(resolved('--text-on-inverse'));
    expect(color('.rds-stat__label')).toBe(resolved('--text-on-inverse-subtle'));
    expect(color('.rds-stat__caption')).toBe(resolved('--text-on-inverse-subtle'));
    // A danger Delta still reads: inside the inverse Stat it takes delta/inverse by itself.
    expect(color('.rds-delta')).toBe(resolved('--text-on-inverse'));
    for (const sel of ['.rds-stat__value', '.rds-stat__label', '.rds-stat__caption', '.rds-delta'])
      expect(contrast(color(sel), s.backgroundColor), sel).toBeGreaterThanOrEqual(4.5);
    if (mode === 'print') expect(s.backgroundColor).not.toBe('rgb(255, 255, 255)');
  });
});

describe('Stat inverse rules', () => {
  it('Delta tone="inverse" paints arrow and value in delta/inverse', async () => {
    const el = await render(
      <div style={{ background: 'var(--surface-inverse)', padding: 8 }}>
        <Delta tone="inverse">24%</Delta>
      </div>,
    );
    expect(getComputedStyle(el.querySelector('.rds-delta')!).color).toBe(resolved('--delta-inverse'));
    expect(await axeViolations(el)).toEqual([]);
  });

  it('is ignored, with a warning, unframed, with another tone or muted', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const el = await render(
      <div>
        <Stat inverse framed={false} label="A" value="1" />
        <Stat inverse tone="success" label="B" value="2" />
        <Stat inverse muted label="C" value="0" />
      </div>,
    );
    expect(el.querySelector('.rds-stat--inverse')).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
