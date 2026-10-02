import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { Pagination, pageItems } from './pagination';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

describe.each(MODES)('Pagination (%s)', (mode) => {
  it('buttons with a summary, and links, pass axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16 }}>
        <Pagination page={5} totalPages={17} onChange={() => {}} summary="81–100 de 340" />
        <Pagination page={1} totalPages={3} href={(p) => `#/pedidos?pagina=${p}`} aria-label="Paginação dos pedidos" />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Pagination behaviour', () => {
  it('first, last, the open page and one on each side; the rest becomes "…"', () => {
    expect(pageItems(5, 17)).toEqual([1, 'ellipsis-start', 4, 5, 6, 'ellipsis-end', 17]);
    expect(pageItems(1, 4)).toEqual([1, 2, 3, 4]);
    expect(pageItems(3, 10)).toEqual([1, 2, 3, 4, 'ellipsis-end', 10]);
  });

  it('a named nav; the open page has aria-current and every control a name', async () => {
    const onChange = vi.fn();
    const el = await render(<Pagination page={5} totalPages={17} onChange={onChange} summary="81–100 de 340" />);
    const nav = el.querySelector('nav')!;
    expect(nav.getAttribute('aria-label')).toBe('Paginação');
    const current = nav.querySelectorAll('[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0]!.getAttribute('aria-label')).toBe('Página 5');
    const labels = [...nav.querySelectorAll('button')].map((b) => b.getAttribute('aria-label'));
    expect(labels).toEqual(['Página anterior', 'Página 1', 'Página 4', 'Página 5', 'Página 6', 'Página 17', 'Próxima página']);
    expect(nav.querySelector('.rds-pagination__item--ellipsis')!.getAttribute('aria-hidden')).toBe('true');
    expect(nav.querySelector('.rds-pagination__summary')!.textContent).toBe('81–100 de 340');
    await act(async () => nav.querySelector<HTMLButtonElement>('[aria-label="Página 6"]')!.click());
    expect(onChange).toHaveBeenLastCalledWith(6);
    await act(async () => nav.querySelector<HTMLButtonElement>('[aria-label="Próxima página"]')!.click());
    expect(onChange).toHaveBeenLastCalledWith(6);
  });

  it('previous is disabled on the first page and next on the last', async () => {
    const onChange = vi.fn();
    const el = await render(<Pagination page={1} totalPages={1} hideOnSinglePage={false} onChange={onChange} />);
    const prev = el.querySelector<HTMLButtonElement>('[aria-label="Página anterior"]')!;
    const next = el.querySelector<HTMLButtonElement>('[aria-label="Próxima página"]')!;
    expect(prev.disabled).toBe(true);
    expect(next.disabled).toBe(true);
    await act(async () => prev.click());
    expect(onChange).not.toHaveBeenCalled();
  });

  it('with href, the pages are links; the open one has aria-current', async () => {
    const el = await render(<Pagination page={2} totalPages={3} href={(p) => `#p${p}`} />);
    const links = [...el.querySelectorAll('a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['#p1', '#p1', '#p2', '#p3', '#p3']);
    expect(el.querySelector('a[aria-current="page"]')!.getAttribute('aria-label')).toBe('Página 2');
  });

  it('a single page renders nothing by default', async () => {
    const el = await render(<Pagination page={1} totalPages={1} onChange={() => {}} />);
    expect(el.querySelector('nav')).toBeNull();
  });
});
