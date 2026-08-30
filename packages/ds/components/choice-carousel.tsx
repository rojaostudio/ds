'use client';

import { useRef, useState, useEffect, useCallback, type ReactNode, type KeyboardEvent } from 'react';

export interface ChoiceCarouselProps<T> {
  options: T[];
  getKey: (option: T) => string;
  renderCard: (option: T, isSelected: boolean) => ReactNode;
  value: T | T[] | null;
  onChange: (value: T | T[]) => void;
  multiple?: boolean;
  ariaLabel: string;
  isDisabled?: (option: T) => boolean;
}

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

  const valueArray: T[] = multiple ? (value as T[] | null) ?? [] : [];
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
    const gap = 12;
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
    <div className="relative w-full">
      <button
        type="button"
        aria-label="Anterior"
        onClick={() => scrollByAmount(-1)}
        disabled={!canScrollLeft}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-9 h-9 rounded-full items-center justify-center transition-opacity disabled:opacity-0 disabled:pointer-events-none"
        style={{
          background: 'var(--choice-carousel-chevron-bg)',
          border: `1px solid var(--choice-carousel-chevron-border)`,
          color: 'var(--choice-carousel-chevron-text)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M10 4l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div
        ref={trackRef}
        role={multiple ? 'group' : 'radiogroup'}
        aria-label={ariaLabel}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="flex overflow-x-auto scroll-smooth focus:outline-none"
        style={{
          gap: 'var(--choice-carousel-gap)',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          paddingBlock: 4,
        }}
      >
        {options.map((option) => {
          const selected = isSelected(option);
          const disabled = isDisabled?.(option) ?? false;
          return (
            <div
              key={getKey(option)}
              role={multiple ? 'checkbox' : 'radio'}
              aria-checked={selected}
              aria-disabled={disabled}
              tabIndex={disabled ? -1 : 0}
              onClick={() => handleSelect(option)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(option);
                }
              }}
              className="shrink-0"
              style={{
                width: 'var(--choice-carousel-card-width-mobile)',
                scrollSnapAlign: 'start',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              {renderCard(option, selected)}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="Próximo"
        onClick={() => scrollByAmount(1)}
        disabled={!canScrollRight}
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-9 h-9 rounded-full items-center justify-center transition-opacity disabled:opacity-0 disabled:pointer-events-none"
        style={{
          background: 'var(--choice-carousel-chevron-bg)',
          border: `1px solid var(--choice-carousel-chevron-border)`,
          color: 'var(--choice-carousel-chevron-text)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
