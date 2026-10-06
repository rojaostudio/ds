import { afterEach, describe, expect, it } from 'vitest';
import { Badge } from './badge';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// Over the brand colour: the theme's brand mode (.ds-plate) with tone=neutral (the inverse tone is gone).
const Plate = ({ children }: { children: React.ReactNode }) => (
  <div className="ds-plate" style={{ background: 'var(--surface-page)', padding: 16, display: 'flex', gap: 8 }}>{children}</div>
);

// The [RDS] accent/highlight badge: text/heading on colors/accent/highlight. In dark it failed (3.7:1) on the orange
// highlight the generator drew; the Figma table puts it on navy/700 and it passes in both modes.

describe.each(MODES)('Badge (%s)', (mode) => {
  it('every tone × variant, label and number, passes axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Badge>Nova</Badge>
          <Badge variant="soft">Grátis</Badge>
          <Badge tone="action">Nova</Badge>
          <Badge tone="action" variant="soft">Grátis</Badge>
          <Badge tone="accent">Destaque</Badge>
          <Badge tone="accent" variant="soft">Destaque</Badge>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Badge value={3} />
          <Badge variant="soft" value={12} />
          <Badge tone="action" value={120} />
          <Badge tone="action" variant="soft" value={5} />
          <Badge tone="accent" value={8} />
          <Badge tone="accent" variant="soft" value={8} />
        </div>
        <Plate>
          <Badge>Nova</Badge>
          <Badge value={4} />
          <Badge variant="soft">Nova</Badge>
        </Plate>
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Badge behaviour', () => {
  it('accent soft passes axe in light (text/heading, navy, on the accent highlight)', async () => {
    const el = await render(<Badge tone="accent" variant="soft">Destaque</Badge>, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('accent soft passes axe in dark (the Figma highlight is navy/700)', async () => {
    const el = await render(<Badge tone="accent" variant="soft">Destaque</Badge>, 'dark');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('the number shows 99+ above 99 and is a 32 circle', async () => {
    const el = await render(
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Badge value={120} />
        <Badge value={3} />
      </div>,
    );
    const [big, small] = el.querySelectorAll<HTMLElement>('.rds-badge');
    expect(big.textContent).toBe('99+');
    expect(small.getBoundingClientRect().width).toBe(32);
    expect(small.getBoundingClientRect().height).toBe(32);
  });
});

describe('Badge vocabulary', () => {
  it('the deprecated variant="highlight" is the accent soft', async () => {
    const el = await render(<Badge tone="accent" variant="highlight">Destaque</Badge>, 'light');
    expect(el.querySelector('.rds-badge')!.className).toContain('rds-badge--accent-soft');
  });
});
