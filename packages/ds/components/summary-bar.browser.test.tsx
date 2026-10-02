import { afterEach, describe, expect, it } from 'vitest';
import { SummaryBar } from './summary-bar';
import { Stat } from './stat';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const stats = [
  <Stat key="a" label="Valor em estoque" value="R$ 48.320" />,
  <Stat key="b" label="Receita do mês" value="R$ 12.450" tone="positive" />,
  <Stat key="c" label="Estoque baixo" value="7" tone="warning" />,
];

describe.each(MODES)('SummaryBar (%s)', (mode) => {
  it('row and grid pass axe', async () => {
    const el = await render(
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 720 }}>
          <SummaryBar>
            {stats}
            <Stat label="Sem estoque" value="2" tone="negative" />
          </SummaryBar>
        </div>
        <div style={{ width: 360 }}>
          <SummaryBar layout="grid">{stats}</SummaryBar>
        </div>
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('SummaryBar behaviour', () => {
  it('a list; inside it a Stat is a cell (no border) on summary-bar/background', async () => {
    const el = await render(<SummaryBar>{stats}</SummaryBar>);
    const list = el.querySelector('ul.rds-summary-bar')!;
    expect(list.querySelectorAll(':scope > li')).toHaveLength(3);
    const cell = list.querySelector<HTMLElement>('.rds-stat')!;
    expect(cell.className).not.toContain('rds-stat--framed');
    expect(getComputedStyle(cell).borderTopStyle).toBe('none');
  });

  it('row: the cells share the width, 1px apart, on one line', async () => {
    const el = await render(
      <div style={{ width: 722 }}>
        <SummaryBar>{stats}</SummaryBar>
      </div>,
    );
    const cells = [...el.querySelectorAll<HTMLElement>('.rds-summary-bar__cell')].map((c) => c.getBoundingClientRect());
    expect(cells[1].width).toBeCloseTo(cells[0].width, 0);
    expect(cells[2].width).toBeCloseTo(cells[0].width, 0);
    expect(Math.round(cells[1].left - cells[0].right)).toBe(1);
    expect(cells[0].top).toBe(cells[2].top);
  });

  it('grid: two columns, the last cell takes the whole line when the count is odd', async () => {
    const el = await render(
      <div style={{ width: 362 }}>
        <SummaryBar layout="grid">{stats}</SummaryBar>
      </div>,
    );
    const [a, b, c] = [...el.querySelectorAll<HTMLElement>('.rds-summary-bar__cell')].map((n) => n.getBoundingClientRect());
    expect(a.top).toBe(b.top);
    expect(c.top).toBeGreaterThan(a.bottom);
    expect(c.width).toBe(360);
  });

  it('the deprecated items still render as Stats', async () => {
    const el = await render(<SummaryBar items={[{ label: 'Pedidos', value: '12', tone: 'warning' }]} />);
    expect(el.querySelector('.rds-stat--warning .rds-stat__value')!.textContent).toBe('12');
  });
});
