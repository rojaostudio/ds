import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { userEvent } from 'vitest/browser';
import { Carousel, CarouselPlaceholder } from './carousel';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const slides = [1, 2, 3].map((n) => <CarouselPlaceholder key={n}>{`Slide ${n} de 3`}</CarouselPlaceholder>);

describe.each(MODES)('Carousel (%s)', (mode) => {
  it('with controls and dots, at the start and in the middle, passes axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, maxWidth: 560 }}>
        <Carousel aria-label="Depoimentos">{slides}</Carousel>
        <Carousel aria-label="Produtos em destaque" defaultIndex={1}>
          {slides}
        </Carousel>
        <Carousel aria-label="Sem controles" showControls={false} showDots={false}>
          {slides}
        </Carousel>
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Carousel behaviour', () => {
  it('the arrows and the dots change the slide, and the live region announces it', async () => {
    const onIndexChange = vi.fn();
    const el = await render(
      <Carousel aria-label="Depoimentos" onIndexChange={onIndexChange}>
        {slides}
      </Carousel>,
    );
    const carousel = el.querySelector('section')!;
    expect(carousel.getAttribute('aria-roledescription')).toBe('carrossel');
    expect(carousel.getAttribute('aria-label')).toBe('Depoimentos');
    const viewport = el.querySelector('.rds-carousel__viewport')!;
    expect(viewport.getAttribute('aria-live')).toBe('polite');
    const visible = () => [...el.querySelectorAll<HTMLElement>('[aria-roledescription="slide"]')].filter((s) => !s.hidden);

    expect(visible().map((s) => s.getAttribute('aria-label'))).toEqual(['1 de 3']);
    const previous = el.querySelector<HTMLButtonElement>('[aria-label="Slide anterior"]')!;
    const next = el.querySelector<HTMLButtonElement>('[aria-label="Próximo slide"]')!;
    expect(previous.getAttribute('aria-disabled')).toBe('true');

    await act(async () => next.click());
    expect(visible().map((s) => s.getAttribute('aria-label'))).toEqual(['2 de 3']);
    expect(visible()[0].textContent).toBe('Slide 2 de 3');
    expect(onIndexChange).toHaveBeenLastCalledWith(1);

    const dots = el.querySelectorAll<HTMLButtonElement>('.rds-carousel__dot');
    expect(dots[1].getAttribute('aria-current')).toBe('true');
    await act(async () => dots[2].click());
    expect(visible().map((s) => s.getAttribute('aria-label'))).toEqual(['3 de 3']);
    expect(next.getAttribute('aria-disabled')).toBe('true');
    expect(dots[2].getAttribute('aria-label')).toBe('Ir para o slide 3');
  });

  it('the left and right arrows change slides while the focus is inside', async () => {
    const el = await render(<Carousel aria-label="Depoimentos">{slides}</Carousel>);
    const dot = el.querySelector<HTMLButtonElement>('.rds-carousel__dot')!;
    dot.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(el.querySelectorAll<HTMLElement>('.rds-carousel__dot')[1].getAttribute('aria-current')).toBe('true');
    await userEvent.keyboard('{ArrowLeft}');
    expect(el.querySelectorAll<HTMLElement>('.rds-carousel__dot')[0].getAttribute('aria-current')).toBe('true');
  });

  it('each dot is a 24 × 24 target', async () => {
    const el = await render(<Carousel aria-label="Depoimentos">{slides}</Carousel>);
    const box = el.querySelector('.rds-carousel__dot')!.getBoundingClientRect();
    expect([box.width, box.height]).toEqual([24, 24]);
  });
});
