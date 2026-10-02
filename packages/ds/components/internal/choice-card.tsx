'use client';
// The ChoiceCard and its group, shared with the deprecated wrappers (SelectableCard, OptionTile, ChoicePreviewCard).
// The public ChoiceCard is always a radio; `control="checkbox"` exists only for OptionTileGrid's multiple choice.
// Not exported from the package. Styles: choice-card.css.
import { createContext, useContext, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { CheckIcon, ImageIcon } from './icons';

/** row: the line with the radio; tile: a grid cell, icon on top; preview: an image on top. */
export type ChoiceCardLayout = 'row' | 'tile' | 'preview';

interface GroupContext {
  name: string;
  value: string | undefined;
  select: (value: string) => void;
  disabled?: boolean;
  layout?: ChoiceCardLayout;
}

const Group = createContext<GroupContext | null>(null);

export interface ChoiceCardProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children' | 'checked' | 'onSelect'> {
  /** The option (Figma: `label`). It is the radio's accessible name. */
  children: ReactNode;
  /** What choosing it means (Figma: `hasDescription` + `description`). */
  description?: ReactNode;
  /** An inline SVG in a 36 square (Figma: `hasIcon` + `icon`). Decorative. Not drawn in `preview`. */
  icon?: ReactNode;
  /** Chosen (Figma: `selected`). Inside a ChoiceCardGroup the group decides; alone, pass it with `onSelect`. */
  selected?: boolean;
  /** Called when the person chooses this card (click, Space, or an arrow key from a sibling with the same name). */
  onSelect?: () => void;
  /** The value inside a ChoiceCardGroup. */
  value?: string;
  /**
   * Figma: `layout`. row (the default): the line with the radio. tile: a grid cell, the icon on top and a check in
   * the corner when chosen. preview: an image on top with the check in its corner. Inside a ChoiceCardGroup the
   * group's layout is the default.
   */
  layout?: ChoiceCardLayout;
  /** The picture on top in `preview` (a mockup, a swatch, an <img>). Decorative; without it, a placeholder icon. */
  preview?: ReactNode;
}

export function ChoiceCardControl({
  control,
  children,
  description,
  icon,
  selected,
  onSelect,
  value,
  disabled,
  className,
  onChange,
  name,
  layout,
  preview,
  ...rest
}: ChoiceCardProps & { control: 'radio' | 'checkbox' }) {
  const group = useContext(Group);
  const descriptionId = useId();
  const checked = group && value !== undefined && control === 'radio' ? group.value === value : !!selected;
  const isDisabled = disabled || group?.disabled;
  const kind = layout ?? group?.layout ?? 'row';
  const check = checked && (
    <span className="rds-choice-card__check" aria-hidden="true">
      <CheckIcon />
    </span>
  );
  return (
    <label
      className={[
        'rds-choice-card',
        `rds-choice-card--${kind}`,
        checked && 'rds-choice-card--selected',
        isDisabled && 'rds-choice-card--disabled',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <input
        {...rest}
        type={control}
        className="rds-choice-card__input"
        name={group?.name ?? name}
        value={value}
        checked={checked}
        disabled={isDisabled}
        aria-describedby={description ? descriptionId : undefined}
        onChange={(event) => {
          onChange?.(event);
          if (group && value !== undefined) group.select(value);
          onSelect?.();
        }}
      />
      {kind === 'preview' ? (
        <span className="rds-choice-card__preview" aria-hidden="true">
          {preview ?? (
            <span className="rds-choice-card__placeholder">
              <ImageIcon />
            </span>
          )}
          {check}
        </span>
      ) : (
        icon && (
          <span className="rds-choice-card__icon" aria-hidden="true">
            {icon}
          </span>
        )
      )}
      <span className="rds-choice-card__text">
        <span className="rds-choice-card__label">{children}</span>
        {description && (
          <span id={descriptionId} className="rds-choice-card__description">
            {description}
          </span>
        )}
      </span>
      {kind === 'row' && <span className="rds-choice-card__radio" aria-hidden="true" />}
      {kind === 'tile' && check}
    </label>
  );
}

export interface ChoiceCardGroupProps {
  /** What is being chosen. Required: it names the group (a visible <legend>). */
  legend: ReactNode;
  /** The ChoiceCards, each with a `value`. */
  children: ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** The form field name. By default a generated one. */
  name?: string;
  disabled?: boolean;
  /**
   * The cards' layout. row stacks them; tile and preview lay them in a grid (cells of at least 160 and 240) and are
   * every card's default.
   */
  layout?: ChoiceCardLayout;
  className?: string;
}

/** A set of ChoiceCards where one is chosen at a time: a <fieldset> of native radios with a legend. */
export function ChoiceCardGroup({ legend, children, value, defaultValue, onValueChange, name, disabled, layout = 'row', className }: ChoiceCardGroupProps) {
  const generated = useId();
  const [own, setOwn] = useState(defaultValue);
  const current = value ?? own;
  return (
    <Group.Provider
      value={{
        name: name ?? generated,
        value: current,
        disabled,
        layout,
        select: (next) => {
          setOwn(next);
          onValueChange?.(next);
        },
      }}
    >
      <fieldset className={['rds-choice-card-group', `rds-choice-card-group--${layout}`, className].filter(Boolean).join(' ')}>
        <legend className="rds-choice-card-group__legend">{legend}</legend>
        {children}
      </fieldset>
    </Group.Provider>
  );
}
