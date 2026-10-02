import { afterEach, describe, expect, it } from 'vitest';
import { StarRating, type StarRatingSize } from './star-rating';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const SIZES: StarRatingSize[] = ['sm', 'default', 'lg'];

describe.each(MODES)('StarRating (%s)', (mode) => {
  it('every size, every half value, with and without label, passes axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 8 }}>
        {SIZES.flatMap((size) =>
          [0, 0.5, 2.5, 3.5, 5].map((value) => (
            <StarRating key={`${size}-${value}`} size={size} value={value} label={`${value} (128 avaliações)`} />
          )),
        )}
        <StarRating value={4} />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('StarRating behaviour', () => {
  it('announces the value, rounded to the half, as one image', async () => {
    const el = await render(
      <div>
        <StarRating value={3.4} label="3,4 (128 avaliações)" />
        <StarRating value={4.8} />
      </div>,
    );
    const images = el.querySelectorAll('[role="img"]');
    expect(images[0].getAttribute('aria-label')).toBe('Nota 3,5 de 5');
    expect(images[1].getAttribute('aria-label')).toBe('Nota 5 de 5');
    expect(el.querySelectorAll('.rds-rating__star--full')).toHaveLength(3 + 5);
    expect(el.querySelectorAll('.rds-rating__star--half')).toHaveLength(1);
  });

  it('the stars measure 16, 20 and 24', async () => {
    const el = await render(<div>{SIZES.map((s) => <StarRating key={s} size={s} value={3} />)}</div>);
    const sizes = [...el.querySelectorAll('.rds-rating')].map((r) => r.querySelector('.rds-rating__star')!.getBoundingClientRect().width);
    expect(sizes).toEqual([16, 20, 24]);
  });
});
