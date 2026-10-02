'use client';

import { Children, useRef, useState, type HTMLAttributes, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { IconButton } from './icon-button';
import { Tooltip } from './tooltip';
import { ChevronLeftIcon, ChevronRightIcon } from './internal/icons';

export interface CarouselProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** What the sequence is ("Depoimentos"). Required: it names the carousel. */
  'aria-label': string;
  /** The slides, one child each (Figma: the `slide` slot). Up to 5: beyond that, a list or a grid shows better. */
  children: ReactNode;
  /** The previous and next arrows (Figma: `showControls`). On a phone, where the person swipes, you can turn them off. */
  showControls?: boolean;
  /** The position dots (Figma: `showDots`). */
  showDots?: boolean;
  /** The slide shown at first (0-based). */
  defaultIndex?: number;
  /** Controlled slide index. */
  index?: number;
  onIndexChange?: (index: number) => void;
}

/**
 * Carousel — Figma [RDS] Content/Carousel. A short sequence of the same kind of thing, one slide at a time. It never
 * moves on its own. The viewport is a polite live region, so the new slide ("2 de 5") is announced. Keyboard: the
 * left and right arrows change slides while the focus is inside. On touch, swipe. Styles: carousel.css.
 */
export function Carousel({
  showControls = true,
  showDots = true,
  defaultIndex = 0,
  index,
  onIndexChange,
  className,
  children,
  onKeyDown,
  ...rest
}: CarouselProps) {
  const slides = Children.toArray(children);
  const count = slides.length;
  const [own, setOwn] = useState(defaultIndex);
  const current = Math.min(Math.max(index ?? own, 0), Math.max(count - 1, 0));
  const start = useRef<number | null>(null);

  const go = (next: number) => {
    const clamped = Math.min(Math.max(next, 0), count - 1);
    if (clamped === current) return;
    setOwn(clamped);
    onIndexChange?.(clamped);
  };

  const handleKey = (event: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if ((event.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(current - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(current + 1);
    }
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') start.current = event.clientX;
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (start.current === null) return;
    const delta = event.clientX - start.current;
    start.current = null;
    if (Math.abs(delta) > 40) go(current + (delta < 0 ? 1 : -1));
  };

  return (
    <section
      aria-roledescription="carrossel"
      {...rest}
      onKeyDown={handleKey}
      className={['rds-carousel', className].filter(Boolean).join(' ')}
    >
      <div className="rds-carousel__stage">
        {showControls && (
          <Tooltip text="Slide anterior">
            <IconButton
              icon={<ChevronLeftIcon />}
              label="Slide anterior"
              tone="neutral"
              variant="outline"
              disabled={current === 0}
              onClick={() => go(current - 1)}
            />
          </Tooltip>
        )}
        <div className="rds-carousel__viewport" aria-live="polite" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
          {slides.map((slide, i) => (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} de ${count}`}
              hidden={i !== current}
              className="rds-carousel__slide"
            >
              {slide}
            </div>
          ))}
        </div>
        {showControls && (
          <Tooltip text="Próximo slide">
            <IconButton
              icon={<ChevronRightIcon />}
              label="Próximo slide"
              tone="neutral"
              variant="outline"
              disabled={current === count - 1}
              onClick={() => go(current + 1)}
            />
          </Tooltip>
        )}
      </div>
      {showDots && count > 1 && (
        <div className="rds-carousel__dots">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              className="rds-carousel__dot"
              aria-label={`Ir para o slide ${i + 1}`}
              aria-current={i === current ? 'true' : undefined}
              onClick={() => go(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/** Text for an empty slide, as in Figma ("Slide 1 de 5"): a placeholder while the content is not there. */
export function CarouselPlaceholder({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={['rds-carousel__placeholder', className].filter(Boolean).join(' ')} />;
}
