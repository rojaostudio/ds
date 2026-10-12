import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { Pagination } from './pagination';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// ds#138: Pagination below 1024.

describe('Pagination compact', () => {
  it('390: the summary on its own line, "5 de 26" between the arrows at the ends, no numbers, 44 targets', async () => {
    await page.viewport(390, 800);
    const el = await render(<Pagination page={5} totalPages={26} onChange={() => {}} summary="51 a 100 de 1.284 eventos" />);
    const nav = el.querySelector<HTMLElement>('.rds-pagination')!.getBoundingClientRect();
    const summary = el.querySelector<HTMLElement>('.rds-pagination__summary')!.getBoundingClientRect();
    const pages = el.querySelector<HTMLElement>('.rds-pagination__pages')!.getBoundingClientRect();
    expect(pages.top).toBeGreaterThanOrEqual(summary.bottom);
    expect(summary.height).toBeLessThanOrEqual(24);
    const shownNums = Array.from(el.querySelectorAll<HTMLElement>('.rds-pagination__num')).filter((n) => n.offsetParent !== null);
    expect(shownNums).toHaveLength(0);
    const compact = el.querySelector<HTMLElement>('.rds-pagination__compact')!;
    expect(compact.textContent).toBe('Página 5 de 26');
    const [prev, next] = [el.querySelector<HTMLElement>('[aria-label="Página anterior"]')!, el.querySelector<HTMLElement>('[aria-label="Próxima página"]')!].map((b) => b.getBoundingClientRect());
    expect(Math.round(prev.left)).toBe(Math.round(nav.left));
    expect(Math.round(next.right)).toBe(Math.round(nav.right));
    expect([prev.width, prev.height]).toEqual([44, 44]);
  });

  it('1280: the numbers as before, no compact label', async () => {
    await page.viewport(1280, 800);
    const el = await render(<Pagination page={5} totalPages={26} onChange={() => {}} summary="51 a 100 de 1.284 eventos" />);
    expect(el.querySelector<HTMLElement>('.rds-pagination__compact')!.offsetParent).toBeNull();
    expect(Array.from(el.querySelectorAll<HTMLElement>('.rds-pagination__num')).filter((n) => n.offsetParent !== null).length).toBeGreaterThan(3);
  });

  it.each(MODES)('passes axe at 390 (%s)', async (mode) => {
    await page.viewport(390, 800);
    const el = await render(<Pagination page={5} totalPages={26} onChange={() => {}} summary="51 a 100 de 1.284 eventos" />, mode);
    expect(await axeViolations(el)).toEqual([]);
  });
});
