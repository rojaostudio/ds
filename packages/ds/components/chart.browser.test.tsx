import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Chart, type ChartType } from './chart';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';

afterEach(cleanup);

const dates = ['27 ago', '31 ago', '4 set', '8 set', '12 set'];
const percent = (v: number) => `${v}%`;
// Intl writes "2,8 mil" with a no-break space; \s matches it, so read every space as a plain one.
const text = (s: string | null) => (s ?? '').replace(/\s/g, ' ');

// The tooltip's title and values are chart/tooltip/title → text/heading: flare on the rojao light theme (2.9:1), a
// violation of the Figma itself. Kept out of the light run and pinned with it.fails below.
const KNOWN_LIGHT_TOOLTIP = (mode: string) => (mode === 'light' ? ['.rds-chart__tooltip-title', '.rds-chart__tooltip-value'] : []);

const line = (
  <Chart
    label="Volume e entrega nos últimos 30 dias"
    labels={dates}
    series={[
      { name: 'Volume', data: [1200, 1800, 1500, 2600, 2800] },
      { name: 'Entrega', data: [30, 41, 38, 45, 52], axis: 'right' },
    ]}
    formatRight={percent}
  />
);

const charts: Record<ChartType, ReactElement> = {
  line,
  bar: (
    <Chart
      type="bar"
      label="Produtos mais vendidos no mês"
      labels={['Banner', 'Cartão de visita', 'Adesivo', 'Placa ACM', 'Filipeta']}
      series={[{ name: 'Receita', data: [12480, 5720, 3910, 2760, 1740] }]}
    />
  ),
  column: (
    <Chart
      type="column"
      label="Pedidos por etapa"
      labels={['Fila', 'Arte', 'Impressão', 'Acabamento', 'Pronto']}
      series={[{ name: 'Pedidos', data: [5, 9, 12, 7, 3] }]}
    />
  ),
};

describe.each(MODES)('Chart (%s)', (mode) => {
  it.each(Object.keys(charts) as ChartType[])('type %s passes axe', async (type) => {
    const el = await render(<div style={{ width: 640 }}>{charts[type]}</div>, mode);
    expect(await axeViolations(el)).toEqual([]);
  });

  it('bar with links and the visible table pass axe', async () => {
    const el = await render(
      <div style={{ width: 640 }}>
        <Chart
          type="bar"
          label="Pedidos por etapa"
          labels={['Em análise', 'Em produção', 'Pronto']}
          series={[{ name: 'Pedidos', data: [12, 31, 7] }]}
          hrefs={['#/analise', '#/producao', '#/pronto']}
          showTable
        />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('the tooltip and the visible data table pass axe', async () => {
    const el = await render(
      <div style={{ width: 640 }}>
        <Chart label="Volume nos últimos 30 dias" labels={dates} series={[{ name: 'Volume', data: [1, 2, 3, 4, 5] }]} showTable />
      </div>,
      mode,
    );
    el.querySelector<HTMLElement>('[role="slider"]')!.focus();
    await userEvent.keyboard('{ArrowRight}');
    await settle();
    expect(el.querySelector('[role="tooltip"]')).not.toBeNull();
    expect(await axeViolations(el, KNOWN_LIGHT_TOOLTIP(mode))).toEqual([]);
  });
});

describe('Chart behaviour', () => {
  it.fails('the tooltip (chart/tooltip/title → text/heading) passes axe on the rojao light theme', async () => {
    const el = await render(
      <div style={{ width: 640 }}>
        <Chart label="Volume" labels={dates} series={[{ name: 'Volume', data: [1, 2, 3, 4, 5] }]} />
      </div>,
      'light',
    );
    el.querySelector<HTMLElement>('[role="slider"]')!.focus();
    await settle();
    expect(await axeViolations(el)).toEqual([]);
  });

  it('is a figure named by its label, with a data table as the accessible alternative', async () => {
    const el = await render(<div style={{ width: 640 }}>{line}</div>);
    const figure = el.querySelector('figure')!;
    expect(figure.getAttribute('aria-label')).toBe('Volume e entrega nos últimos 30 dias');
    const table = figure.querySelector('table')!;
    expect(table.parentElement!.className).toBe('rds-visually-hidden');
    expect(table.querySelector('caption')!.textContent).toBe('Volume e entrega nos últimos 30 dias');
    const headers = [...table.querySelectorAll('thead th')].map((th) => th.textContent);
    expect(headers).toEqual(['Data', 'Volume (esquerda)', 'Entrega (direita)']);
    const lastRow = [...table.querySelectorAll('tbody tr')].at(-1)!;
    expect(lastRow.querySelector('th')!.textContent).toBe('12 set');
    expect([...lastRow.querySelectorAll('td')].map((td) => text(td.textContent))).toEqual(['2,8 mil', '52%']);
    // The drawing is hidden: the table carries the data.
    expect(figure.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('the plot is a slider: the arrows move from point to point and each one is read with its values', async () => {
    const el = await render(<div style={{ width: 640 }}>{line}</div>);
    const plot = el.querySelector<HTMLElement>('[role="slider"]')!;
    plot.focus();
    expect(text(plot.getAttribute('aria-valuetext'))).toBe('27 ago: Volume 1,2 mil, Entrega 30%');
    await userEvent.keyboard('{ArrowRight}');
    expect(plot.getAttribute('aria-valuenow')).toBe('1');
    expect(text(plot.getAttribute('aria-valuetext'))).toBe('31 ago: Volume 1,8 mil, Entrega 41%');
    await userEvent.keyboard('{End}');
    expect(text(plot.getAttribute('aria-valuetext'))).toBe('12 set: Volume 2,8 mil, Entrega 52%');
    const tooltip = document.getElementById(plot.getAttribute('aria-describedby')!)!;
    expect(tooltip.getAttribute('role')).toBe('tooltip');
    expect(tooltip.textContent).toContain('12 set');
  });

  it('showRightAxis off reads every series on the left; showLegend and showTooltip turn their parts off', async () => {
    const el = await render(
      <div style={{ width: 640 }}>
        <Chart
          label="Volume"
          labels={dates}
          series={[
            { name: 'Volume', data: [1, 2, 3, 4, 5] },
            { name: 'Entrega', data: [5, 4, 3, 2, 1], axis: 'right' },
          ]}
          showRightAxis={false}
          showLegend={false}
          showTooltip={false}
        />
      </div>,
    );
    expect(el.querySelector('.rds-chart__axis--right')).toBeNull();
    expect(el.querySelector('.rds-chart__legend')).toBeNull();
    el.querySelector<HTMLElement>('[role="slider"]')!.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(el.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('showAllDates off keeps the first, middle and last label', async () => {
    const el = await render(
      <div style={{ width: 320 }}>
        <Chart label="Volume" labels={dates} series={[{ name: 'Volume', data: [1, 2, 3, 4, 5] }]} showAllDates={false} />
      </div>,
    );
    expect([...el.querySelectorAll('.rds-chart__label')].map((l) => l.textContent)).toEqual(['27 ago', '4 set', '12 set']);
  });

  it('bar draws one bar per row, each in its palette colour, with the value beside it', async () => {
    const el = await render(<div style={{ width: 640 }}>{charts.bar}</div>);
    const bars = [...el.querySelectorAll<HTMLElement>('.rds-chart__bar')];
    expect(bars).toHaveLength(5);
    expect(bars[0].style.width).toBe('100%');
    const colours = new Set(bars.map((b) => getComputedStyle(b).backgroundColor));
    expect(colours.size).toBe(5);
    expect(text(el.querySelector('.rds-chart__bar-value')!.textContent)).toBe('12,5 mil');
  });
});

describe('Chart inside a scrolling container', () => {
  // The hidden alternative table must stay inside the chart: before, a <table> ignored the visually-hidden clip,
  // anchored to the page and stretched the page's scroll (seen with 30 dates in a dashboard).
  it('does not make the page scroll', async () => {
    const many = Array.from({ length: 60 }, (_, i) => `${i + 1} set`);
    await render(
      <div style={{ height: 200, overflow: 'auto' }}>
        <Chart label="Pedidos por dia" type="line" labels={many} series={[{ name: 'Pedidos', data: many.map((_, i) => i) }]} />
      </div>,
    );
    const page = document.scrollingElement!;
    expect(page.scrollHeight).toBeLessThanOrEqual(page.clientHeight + 1);
  });
});

describe('Chart dates', () => {
  const days = Array.from({ length: 30 }, (_, i) => `${i + 1} set`);
  const labelsOf = (el: HTMLElement) => [...el.querySelectorAll('.rds-chart__label')].map((l) => l.textContent);

  it('edges is the default: the first, middle and last label', async () => {
    const el = await render(<Chart label="Volume" labels={dates} series={[{ name: 'Volume', data: [1, 2, 3, 4, 5] }]} />);
    expect(labelsOf(el)).toEqual(['27 ago', '4 set', '12 set']);
  });

  it('dates="all" shows every label', async () => {
    const el = await render(<Chart label="Volume" labels={dates} series={[{ name: 'Volume', data: [1, 2, 3, 4, 5] }]} dates="all" />);
    expect(labelsOf(el)).toEqual(dates);
  });

  it('dateEvery={4}: one label every 4 points and a tick on every point', async () => {
    const el = await render(
      <div style={{ width: 640 }}>
        <Chart label="Pedidos por dia" type="column" labels={days} series={[{ name: 'Pedidos', data: days.map((_, i) => i) }]} dateEvery={4} />
      </div>,
    );
    expect(labelsOf(el)).toEqual(['1 set', '5 set', '9 set', '13 set', '17 set', '21 set', '25 set', '29 set']);
    expect(el.querySelectorAll('.rds-chart__tick')).toHaveLength(30);
  });
});

describe('Chart with destinations', () => {
  const stages = ['Em análise', 'Em produção', 'Pronto'];
  const pedidos = [{ name: 'Pedidos', data: [12, 31, 7] }];

  it('bar with hrefs: each bar is a link named "<label>: <value>", reached by Tab', async () => {
    const el = await render(
      <div style={{ width: 640 }}>
        <Chart type="bar" label="Pedidos por etapa" labels={stages} series={pedidos} hrefs={['#/a', '#/b', '#/c']} />
      </div>,
    );
    const links = [...el.querySelectorAll<HTMLAnchorElement>('a.rds-chart__bar-row')];
    expect(links.map((a) => a.getAttribute('aria-label'))).toEqual(['Em análise: 12', 'Em produção: 31', 'Pronto: 7']);
    expect(links[1].getAttribute('href')).toBe('#/b');
    await userEvent.tab();
    expect(document.activeElement).toBe(links[0]);
    // The hidden alternative table stays plain: no second set of tab stops.
    expect(el.querySelector('.rds-visually-hidden a, .rds-visually-hidden button')).toBeNull();
  });

  it('bar with onSelect: each bar is a button that reports its index', async () => {
    const onSelect = vi.fn();
    const el = await render(<Chart type="bar" label="Pedidos por etapa" labels={stages} series={pedidos} onSelect={onSelect} />);
    el.querySelectorAll<HTMLButtonElement>('button.rds-chart__bar-row')[2].click();
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it('column with onSelect: Enter on the plot chooses the point under the keyboard', async () => {
    const onSelect = vi.fn();
    const el = await render(
      <div style={{ width: 640 }}>
        <Chart type="column" label="Pedidos por etapa" labels={stages} series={pedidos} onSelect={onSelect} />
      </div>,
    );
    el.querySelector<HTMLElement>('[role="slider"]')!.focus();
    await userEvent.keyboard('{ArrowRight}{Enter}');
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('without a destination nothing is interactive', async () => {
    const el = await render(<Chart type="bar" label="Pedidos por etapa" labels={stages} series={pedidos} />);
    expect(el.querySelector('a, button')).toBeNull();
    expect(el.querySelector('.rds-chart__bars')!.getAttribute('aria-hidden')).toBe('true');
  });
});
