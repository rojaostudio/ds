import { afterEach, describe, expect, it } from 'vitest';
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

describe('Spinner vocabulary', () => {
  it('the deprecated size="default" and tone="default" are md and neutral', async () => {
    const el = await render(<Spinner size="default" tone="default" />);
    const cls = el.querySelector('.rds-spinner')!.className;
    expect(cls).toContain('rds-spinner--md');
    expect(cls).toContain('rds-spinner--neutral');
    expect(el.querySelector<HTMLElement>('.rds-spinner__ring')!.getBoundingClientRect().width).toBe(24);
  });
});
