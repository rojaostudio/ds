import { afterEach, describe, expect, it } from 'vitest';
import { CardsSkeleton, PageSkeleton } from './page-skeleton';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

describe.each(MODES)('PageSkeleton (%s)', (mode) => {
  it('PageSkeleton and CardsSkeleton pass axe', async () => {
    const el = await render(
      <div>
        <PageSkeleton rows={3} />
        <CardsSkeleton count={4} padded={false} />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('PageSkeleton behaviour', () => {
  it('is a busy status that says Carregando… and hides the shapes', async () => {
    const el = await render(<PageSkeleton rows={4} />);
    const region = el.querySelector('[role="status"]')!;
    expect(region.getAttribute('aria-busy')).toBe('true');
    expect(region.textContent).toBe('Carregando…');
    for (const s of region.querySelectorAll('.rds-skeleton')) expect(s.getAttribute('aria-hidden')).toBe('true');
  });

  it('draws the table in a Card: a header row and `rows` rows', async () => {
    const el = await render(<PageSkeleton rows={4} padded={false} />);
    const table = el.querySelector('.rds-card')!;
    expect(table.querySelectorAll('.rds-page-skeleton__row')).toHaveLength(5);
    expect(getComputedStyle(el.querySelector('.rds-page-skeleton')!).paddingTop).toBe('0px');
  });

  it('CardsSkeleton draws `count` cards and two charts', async () => {
    const el = await render(<CardsSkeleton count={3} />);
    expect(el.querySelectorAll('.rds-page-skeleton__grid--stats .rds-card')).toHaveLength(3);
    expect(el.querySelectorAll('.rds-page-skeleton__grid--charts .rds-card')).toHaveLength(2);
    expect(getComputedStyle(el.querySelector('.rds-page-skeleton')!).paddingTop).toBe('24px');
  });

  it('the Cards keep their shadow (elevation/raised, as in the Figma)', async () => {
    const el = await render(
      <div>
        <PageSkeleton rows={1} />
        <CardsSkeleton count={1} />
      </div>,
    );
    const cards = [...el.querySelectorAll('.rds-card')];
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) expect(getComputedStyle(card).boxShadow).not.toBe('none');
  });
});
