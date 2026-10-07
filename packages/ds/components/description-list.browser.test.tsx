import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { DescriptionItem, DescriptionList, type DescriptionListDensity, type DescriptionListLayout } from './description-list';
import { Status } from './status';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(async () => {
  cleanup();
  await page.viewport(1280, 800);
});

function Example({
  layout,
  density,
  columns,
}: {
  layout?: DescriptionListLayout;
  density?: DescriptionListDensity;
  columns?: 1 | 'auto';
}) {
  return (
    <div style={{ width: 640 }}>
      <DescriptionList layout={layout} density={density} columns={columns}>
        <DescriptionItem label="Cliente">Gráfica Central</DescriptionItem>
        <DescriptionItem label="Entrega">12/10/2026</DescriptionItem>
        <DescriptionItem label="Situação">
          <Status tone="info">Em produção</Status>
        </DescriptionItem>
        <DescriptionItem label="Quantidade">1.000</DescriptionItem>
      </DescriptionList>
    </div>
  );
}

describe.each(MODES)('DescriptionList (%s)', (mode) => {
  it.each(['stacked', 'inline'] as const)('%s, md and sm, list and grid, pass axe', async (layout) => {
    const el = await render(
      <>
        <Example layout={layout} />
        <Example layout={layout} density="sm" />
        <Example layout={layout} columns="auto" />
      </>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('DescriptionList behaviour', () => {
  it('is a <dl>; each pair a <div> with its <dt> and <dd>; a value can be a component', async () => {
    const el = await render(<Example />);
    const dl = el.querySelector('dl')!;
    const pairs = [...dl.children];
    expect(pairs.map((p) => p.tagName)).toEqual(['DIV', 'DIV', 'DIV', 'DIV']);
    expect([...pairs[0].children].map((c) => c.tagName)).toEqual(['DT', 'DD']);
    expect(pairs[0].textContent).toBe('ClienteGráfica Central');
    expect(pairs[2].querySelector('dd .rds-status')).not.toBeNull();
  });

  it('stacked: the label above the value, 4 apart (2 in sm)', async () => {
    for (const [density, gap] of [['md', 4], ['sm', 2]] as const) {
      const el = await render(<Example density={density} />);
      const [dt, dd] = [...el.querySelectorAll<HTMLElement>('dl > div:first-child > *')];
      expect(Math.round(dd.getBoundingClientRect().top - dt.getBoundingClientRect().bottom)).toBe(gap);
      expect(Math.round(dd.getBoundingClientRect().left)).toBe(Math.round(dt.getBoundingClientRect().left));
      cleanup();
    }
  });

  it('inline on a wide screen: the label column is 160 (104 in sm) and the values line up', async () => {
    for (const [density, width, gap] of [['md', 160, 16], ['sm', 104, 8]] as const) {
      const el = await render(<Example layout="inline" density={density} />);
      const pairs = [...el.querySelectorAll<HTMLElement>('dl > div')];
      const dt = pairs[0].querySelector('dt')!.getBoundingClientRect();
      const dds = pairs.map((p) => Math.round(p.querySelector('dd')!.getBoundingClientRect().left));
      expect(Math.round(dt.width)).toBe(width);
      expect(dds[0] - Math.round(dt.left)).toBe(width + gap);
      expect(new Set(dds).size).toBe(1);
      cleanup();
    }
  });

  it('inline turns stacked on a compact screen', async () => {
    await page.viewport(390, 800);
    const el = await render(<Example layout="inline" />);
    const [dt, dd] = [...el.querySelectorAll<HTMLElement>('dl > div:first-child > *')];
    expect(dd.getBoundingClientRect().top).toBeGreaterThanOrEqual(dt.getBoundingClientRect().bottom);
    expect(Math.round(dd.getBoundingClientRect().left)).toBe(Math.round(dt.getBoundingClientRect().left));
  });

  it('the grid: two columns in 640, one in 300', async () => {
    let el = await render(<Example columns="auto" />);
    let lefts = new Set([...el.querySelectorAll<HTMLElement>('dl > div')].map((p) => Math.round(p.getBoundingClientRect().left)));
    expect(lefts.size).toBe(2);
    cleanup();
    el = await render(
      <div style={{ width: 300 }}>
        <DescriptionList columns="auto">
          <DescriptionItem label="A">1</DescriptionItem>
          <DescriptionItem label="B">2</DescriptionItem>
        </DescriptionList>
      </div>,
    );
    lefts = new Set([...el.querySelectorAll<HTMLElement>('dl > div')].map((p) => Math.round(p.getBoundingClientRect().left)));
    expect(lefts.size).toBe(1);
  });

  it('sm is 12/16 for the printed sheet; the label is medium in the muted colour', async () => {
    const el = await render(<Example density="sm" />);
    const dt = getComputedStyle(el.querySelector('dt')!);
    const dd = getComputedStyle(el.querySelector('dd')!);
    expect([dt.fontSize, dt.lineHeight, dt.fontWeight]).toEqual(['12px', '16px', '500']);
    expect(dt.color).not.toBe(dd.color);
    expect(dd.marginLeft).toBe('0px');
  });
});
