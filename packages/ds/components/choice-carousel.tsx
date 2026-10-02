'use client';

import { useRef, useState, useEffect, useCallback, useMemo, type ReactNode, type KeyboardEvent } from 'react';
import { IconButton } from './icon-button';
import { ChevronLeftIcon, ChevronRightIcon } from './internal/icons';
import { Tooltip } from './tooltip';

export interface ChoiceCarouselProps<T> {
  options: T[];
  /** A stable key per option. */
  getKey: (option: T) => string;
  /** Draws an option. Static content: the carousel item is the radio (or checkbox), so no button inside. */
  renderCard: (option: T, isSelected: boolean) => ReactNode;
  value: T | T[] | null;
  onChange: (value: T | T[]) => void;
  /** Several at once (checkboxes) instead of one (radios). */
  multiple?: boolean;
  /** The group's name for screen readers. */
  ariaLabel: string;
  isDisabled?: (option: T) => boolean;
}

/**
 * ChoiceCarousel — a horizontal, scroll-snapped row of options to pick one (radiogroup) or several (group of
 * checkboxes); the options are drawn by `renderCard`. On a wide screen two outline IconButtons (with their Tooltips)
 * scroll it by one option; the arrow keys do the same on the row. Styles: choice-carousel.css.
 */

export function ChoiceCarousel<T>({
  options,
  getKey,
  renderCard,
  value,
  onChange,
  multiple = false,
  ariaLabel,
  isDisabled,
}: ChoiceCarouselProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const valueArray = useMemo<T[]>(() => (multiple ? ((value as T[] | null) ?? []) : []), [multiple, value]);
  const valueSingle: T | null = multiple ? null : (value as T | null);

  const isSelected = useCallback(
    (option: T): boolean => {
      if (multiple) return valueArray.some((v) => getKey(v) === getKey(option));
      return valueSingle != null && getKey(valueSingle) === getKey(option);
    },
    [multiple, valueArray, valueSingle, getKey],
  );

  const handleSelect = useCallback(
    (option: T) => {
      if (isDisabled?.(option)) return;
      if (multiple) {
        const exists = valueArray.some((v) => getKey(v) === getKey(option));
        const next = exists
          ? valueArray.filter((v) => getKey(v) !== getKey(option))
          : [...valueArray, option];
        onChange(next);
      } else {
        onChange(option);
      }
    },
    [multiple, valueArray, onChange, getKey, isDisabled],
  );

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, options.length]);

  const scrollByAmount = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild?.getBoundingClientRect().width ?? 160;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    el.scrollBy({ left: dir * (cardWidth + gap), behavior: 'smooth' });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollByAmount(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollByAmount(-1);
    }
  };

  return (
    <div className="rds-choice-carousel">
      <Tooltip text="Anterior">
        <IconButton
          className="rds-choice-carousel__arrow rds-choice-carousel__arrow--prev"
          icon={<ChevronLeftIcon />}
          label="Anterior"
          variant="outline"
          tone="neutral"
          onClick={() => scrollByAmount(-1)}
          disabled={!canScrollLeft}
          // Pointer only: on the keyboard the arrow keys scroll the row.
          tabIndex={-1}
        />
      </Tooltip>

      <div
        ref={trackRef}
        role={multiple ? 'group' : 'radiogroup'}
        aria-label={ariaLabel}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="rds-choice-carousel__track"
      >
        {options.map((option) => {
          const selected = isSelected(option);
          const disabled = isDisabled?.(option) ?? false;
          return (
            <div
              key={getKey(option)}
              role={multiple ? 'checkbox' : 'radio'}
              aria-checked={selected}
              aria-disabled={disabled || undefined}
              tabIndex={disabled ? -1 : 0}
              onClick={() => handleSelect(option)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(option);
                }
              }}
              className="rds-choice-carousel__option"
            >
              {renderCard(option, selected)}
            </div>
          );
        })}
      </div>

      <Tooltip text="Próximo">
        <IconButton
          className="rds-choice-carousel__arrow rds-choice-carousel__arrow--next"
          icon={<ChevronRightIcon />}
          label="Próximo"
          variant="outline"
          tone="neutral"
          onClick={() => scrollByAmount(1)}
          disabled={!canScrollRight}
          tabIndex={-1}
        />
      </Tooltip>
    </div>
  );
}
