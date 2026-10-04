import { afterEach, describe, expect, it } from 'vitest';
import { emitRdsCss, generateRdsTheme, type BrandDef } from '@rojaostudio/ds-core/generate';
import { Spinner, type SpinnerSize } from './spinner';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const SIZES: SpinnerSize[] = ['sm', 'md', 'lg'];
const Band = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: 'var(--colors-primary-default)', padding: 16, display: 'flex', gap: 16 }}>{children}</div>
);

describe.each(MODES)('Spinner (%s)', (mode) => {
  it('every size and tone, with and without label, passes axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          {SIZES.map((size) => <Spinner key={size} size={size} />)}
          {SIZES.map((size) => <Spinner key={`${size}-l`} size={size} showLabel label="Carregando pedidos…" />)}
        </div>
        <Band>
          {SIZES.map((size) => <Spinner key={size} size={size} tone="inverse" />)}
          <Spinner tone="inverse" showLabel label="Enviando…" />
        </Band>
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Spinner behaviour', () => {
  it('is a status named by its label, shown or not', async () => {
    const el = await render(
      <div>
        <Spinner label="Carregando pedidos…" />
        <Spinner label="Enviando…" showLabel />
      </div>,
    );
    const [hidden, shown] = el.querySelectorAll<HTMLElement>('[role="status"]');
    expect(hidden.getAttribute('aria-label')).toBe('Carregando pedidos…');
    expect(shown.getAttribute('aria-label')).toBeNull();
    expect(shown.textContent).toBe('Enviando…');
  });

  it('measures 16, 24 and 32', async () => {
    const el = await render(<div style={{ display: 'flex' }}>{SIZES.map((s) => <Spinner key={s} size={s} />)}</div>);
    expect([...el.querySelectorAll('svg')].map((s) => s.getBoundingClientRect().width)).toEqual([16, 24, 32]);
  });
});


/** WCAG relative luminance of a computed rgb()/rgba() colour. */
function luminance(c: string) {
  const [r, g, b] = c.match(/[\d.]+/g)!.slice(0, 3).map((v) => {
    const s = Number(v) / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

describe('Spinner tokens', () => {
  it('reads its component tokens: spinner/indicator is colors/primary/dark; inverse indicator and label are text/on/primary', async () => {
    const el = await render(
      <div>
        <Spinner />
        <Band>
          <Spinner tone="inverse" showLabel label="Enviando…" />
        </Band>
      </div>,
    );
    const root = getComputedStyle(document.documentElement);
    const probe = (name: string) => {
      const span = document.createElement('span');
      span.style.color = root.getPropertyValue(name);
      el.appendChild(span);
      const c = getComputedStyle(span).color;
      span.remove();
      return c;
    };
    const [neutral, inverse] = el.querySelectorAll<HTMLElement>('.rds-spinner');
    expect(getComputedStyle(neutral.querySelector('.rds-spinner__indicator')!).stroke).toBe(probe('--colors-primary-dark'));
    expect(getComputedStyle(inverse.querySelector('.rds-spinner__indicator')!).stroke).toBe(probe('--text-on-primary'));
    expect(getComputedStyle(inverse.querySelector('.rds-spinner__label')!).color).toBe(probe('--text-on-primary'));
  });
});

describe('Spinner in a light brand (cyan #00aeef from generateRdsTheme)', () => {
  let brandStyle: HTMLStyleElement | null = null;
  afterEach(() => {
    brandStyle?.remove();
    brandStyle = null;
  });

  // Measured (colors/primary/dark from the cyan): light #00273a on #fff 15.5:1, dark #ddf2ff on #18181b 15.4:1; inverse
  // (text/on/primary) on the cyan band 8.3:1.
  it('the arc passes 3:1 against the surface it sits on (surface/card), light and dark; inverse against the band', async () => {
    const theme = generateRdsTheme({ name: 'ciano', brand: { primary: '#00aeef' }, fonts: { body: 'inter' } } as BrandDef);
    brandStyle = document.createElement('style');
    brandStyle.textContent = emitRdsCss(theme);
    document.head.appendChild(brandStyle);
    const measured: Record<string, number> = {};
    for (const mode of MODES) {
      const el = await render(
        <div>
          <div className="card" style={{ background: 'var(--surface-card)', padding: 16 }}>
            <Spinner size="lg" />
          </div>
          <Band>
            <Spinner size="lg" tone="inverse" />
          </Band>
        </div>,
        mode,
      );
      const primary = getComputedStyle(document.documentElement).getPropertyValue('--colors-primary-default').trim();
      const table = mode === 'dark' ? theme.dark : theme.light;
      // The brand is in force (not the house primary).
      if (table['--colors-primary-default']) expect(primary.toLowerCase()).toBe(table['--colors-primary-default'].toLowerCase());
      const [neutral, inverse] = el.querySelectorAll<HTMLElement>('.rds-spinner');
      const arc = getComputedStyle(neutral.querySelector('.rds-spinner__indicator')!).stroke;
      const card = getComputedStyle(el.querySelector<HTMLElement>('.card')!).backgroundColor;
      const inverseArc = getComputedStyle(inverse.querySelector('.rds-spinner__indicator')!).stroke;
      const band = getComputedStyle(inverse.parentElement!).backgroundColor;
      measured[`${mode} arc/card`] = contrast(arc, card);
      measured[`${mode} inverse arc/band`] = contrast(inverseArc, band);
      cleanup();
    }
    for (const [pair, ratio] of Object.entries(measured)) expect(ratio, `${pair} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
      });
});
