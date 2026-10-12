'use client';
// The ChoiceCard (always a radio) and its group, behind choice-card.tsx. Not exported from the package.
// Styles: choice-card.css.
import { createContext, useContext, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Media } from '../media';
import { hasContent } from './field';
import { CheckIcon, ImageIcon } from './icons';

/** row: the line with the radio; tile: a grid cell, icon on top; preview: an image on top. */
export type ChoiceCardLayout = 'row' | 'tile' | 'preview';

interface GroupContext {
  name: string;
  value: string | undefined;
  select: (value: string) => void;
  disabled?: boolean;
  layout?: ChoiceCardLayout;
  required?: boolean;
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
}: ChoiceCardProps) {
  const group = useContext(Group);
  const descriptionId = useId();
  const checked = group && value !== undefined ? group.value === value : !!selected;
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
        type="radio"
        className="rds-choice-card__input"
        name={group?.name ?? name}
        value={value}
        checked={checked}
        disabled={isDisabled}
        required={rest.required ?? group?.required}
        aria-describedby={description ? descriptionId : undefined}
        onChange={(event) => {
          onChange?.(event);
          if (group && value !== undefined) group.select(value);
          onSelect?.();
        }}
      />
      {kind === 'preview' ? (
        <span className="rds-choice-card__preview" aria-hidden="true">
          <Media decorative ratio="16:9" className="rds-choice-card__media" fallback={<ImageIcon />}>
            {preview}
          </Media>
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
  /** Shows the asterisk after the legend and says "required" to a screen reader. */
  required?: boolean;
  /** The group is in error (Figma: `error`): the unchosen cards take the error border. `errorMessage` turns it on too. */
  error?: boolean;
  /** What is missing ("Escolha a forma de pagamento"), under the group, tied by aria-describedby. */
  errorMessage?: ReactNode;
  className?: string;
}

/** A set of ChoiceCards where one is chosen at a time: a <fieldset> of native radios with a legend. */
export function ChoiceCardGroup({ legend, children, value, defaultValue, onValueChange, name, disabled, layout = 'row', required, error, errorMessage, className }: ChoiceCardGroupProps) {
  const generated = useId();
  const invalid = Boolean(error || hasContent(errorMessage));
  const errorId = invalid && hasContent(errorMessage) ? `${generated}-error` : undefined;
  const [own, setOwn] = useState(defaultValue);
  const current = value ?? own;
  return (
    <Group.Provider
      value={{
        name: name ?? generated,
        value: current,
        disabled,
        layout,
        required,
        select: (next) => {
          setOwn(next);
          onValueChange?.(next);
        },
      }}
    >
      <fieldset
        aria-invalid={invalid || undefined}
        aria-describedby={errorId}
        className={['rds-choice-card-group', `rds-choice-card-group--${layout}`, invalid && 'rds-choice-card-group--error', className]
          .filter(Boolean)
          .join(' ')}
      >
        <legend className="rds-choice-card-group__legend">
          {legend}
          {required && (
            <span className="rds-choice-card-group__required" aria-hidden="true">
              {' *'}
            </span>
          )}
        </legend>
        {children}
        {errorId && (
          <span id={errorId} className="rds-choice-card-group__error-message">
            {errorMessage}
          </span>
        )}
      </fieldset>
    </Group.Provider>
  );
}
