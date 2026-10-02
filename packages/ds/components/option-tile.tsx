'use client';

import type { ComponentType, KeyboardEvent, ReactNode } from 'react';
import { ChoiceCardControl, ChoiceCardGroup } from './internal/choice-card';

/** @deprecated Use ChoiceCardProps. */
export interface OptionTileProps {
  selected: boolean;
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  /** true: a checkbox (several chosen); false: a radio (one at a time). */
  multiple?: boolean;
  tabIndex?: number;
  /** Ignored: the native radio handles the keyboard. */
  onKeyDown?: (e: KeyboardEvent<HTMLButtonElement>) => void;
  /** Ignored: the control is an <input>, not a <button>. */
  buttonRef?: (el: HTMLButtonElement | null) => void;
  /** Takes the whole line of the grid. */
  fullSpan?: boolean;
  className?: string;
}

/**
 * @deprecated Use ChoiceCard with layout="tile" (Figma [RDS] Content/ChoiceCard). A thin wrapper over it: `label` is
 * the children, `onClick` is `onSelect`. A native radio (a checkbox with `multiple`), no longer a button.
 */
export function OptionTile({ selected, label, onClick, icon, disabled, multiple = false, tabIndex, fullSpan, className }: OptionTileProps) {
  return (
    <ChoiceCardControl
      control={multiple ? 'checkbox' : 'radio'}
      layout="tile"
      selected={selected}
      onSelect={onClick}
      icon={icon}
      disabled={disabled}
      tabIndex={tabIndex}
      className={className}
      style={fullSpan ? { gridColumn: '1 / -1' } : undefined}
    >
      {label}
    </ChoiceCardControl>
  );
}

/** @deprecated Use ChoiceCardGroup's items. */
export interface OptionTileItem<T extends string = string> {
  value: T;
  label: string;
  /** An icon component (lucide or your own); absent, the tile is text only. */
  icon?: ComponentType;
  fullSpan?: boolean;
}

interface OptionTileGridBase<T extends string = string> {
  label?: ReactNode;
  options: OptionTileItem<T>[];
  /** Ignored: the grid fits as many 160 cells as the width allows. */
  columns?: 2 | 3;
  className?: string;
  'aria-label'?: string;
}
type OptionTileGridSingle<T extends string = string> = OptionTileGridBase<T> & {
  multiple?: false;
  value: T | null;
  onChange: (value: T) => void;
};
type OptionTileGridMulti<T extends string = string> = OptionTileGridBase<T> & {
  multiple: true;
  value: T[];
  onChange: (value: T[]) => void;
};
/** @deprecated Use ChoiceCardGroupProps. */
export type OptionTileGridProps<T extends string = string> = OptionTileGridSingle<T> | OptionTileGridMulti<T>;

/**
 * @deprecated Use ChoiceCardGroup with layout="tile". A thin wrapper over it: `label` (or `aria-label`) is the legend.
 * With `multiple` the tiles are checkboxes, each toggling its value in the list.
 */
export function OptionTileGrid<T extends string = string>(props: OptionTileGridProps<T>) {
  const { label, options, className } = props;
  const legend = label ?? props['aria-label'] ?? '';
  const tile = (opt: OptionTileItem<T>) => {
    const Icon = opt.icon;
    return {
      key: opt.value,
      value: opt.value,
      icon: Icon ? <Icon /> : undefined,
      style: opt.fullSpan ? { gridColumn: '1 / -1' } : undefined,
      children: opt.label,
    };
  };
  if (props.multiple) {
    const { value, onChange } = props;
    return (
      <ChoiceCardGroup legend={legend} layout="tile" className={className}>
        {options.map((opt) => {
          const { key, ...rest } = tile(opt);
          return (
            <ChoiceCardControl
              key={key}
              {...rest}
              value={undefined}
              control="checkbox"
              selected={value.includes(opt.value)}
              onSelect={() => onChange(value.includes(opt.value) ? value.filter((v) => v !== opt.value) : [...value, opt.value])}
            />
          );
        })}
      </ChoiceCardGroup>
    );
  }
  const { value, onChange } = props;
  return (
    <ChoiceCardGroup legend={legend} layout="tile" value={value ?? ''} onValueChange={(next) => onChange(next as T)} className={className}>
      {options.map((opt) => {
        const { key, ...rest } = tile(opt);
        return <ChoiceCardControl key={key} {...rest} control="radio" />;
      })}
    </ChoiceCardGroup>
  );
}
