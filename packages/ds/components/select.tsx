'use client';

import type { CSSProperties, ReactNode } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { FieldShell, useFieldIds, warnIfUnlabelled, type FieldTextProps } from './internal/field';
import { CheckIcon, ChevronDownIcon } from './internal/icons';

export interface SelectProps extends FieldTextProps {
  /** The SelectItems (Figma: the Listbox slot `options`), in a clear order: alphabetical, or the most used first. */
  children: ReactNode;
  /** Controlled: the chosen item's value (Figma: `value`). */
  value?: string;
  /** Uncontrolled: the item chosen at first. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** What shows before a choice. It never counts as an answer. */
  placeholder?: string;
  /** An icon on the left (Figma: `showLeadingIcon` + `leadingIcon`). Decorative. */
  leadingIcon?: ReactNode;
  /** The form field name: a hidden native select carries the value inside a form. */
  name?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  style?: CSSProperties;
  /** The name when there is no visible label. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

/**
 * Select — Figma [RDS] Forms/Select. One choice in a closed list of 5 to 15 items: a button (role combobox)
 * that opens the Listbox in a popover (Radix Select). Enter, Space or the arrows open it; the arrows move,
 * typing jumps to an item, Enter chooses, Escape closes. Up to 4 options, show them all (RadioGroup).
 * Styles: select.css, internal/field.css and internal/listbox.css.
 */
export function Select({
  label,
  labelPosition,
  hint,
  error,
  errorMessage,
  required,
  children,
  value,
  defaultValue,
  onValueChange,
  placeholder = 'Selecione',
  leadingIcon,
  name,
  disabled,
  id,
  className,
  style,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: SelectProps) {
  warnIfUnlabelled('Select', label, ariaLabel, ariaLabelledBy);
  const { controlId, hintId, errorId, invalid, describedBy } = useFieldIds(id, hint, error, errorMessage);
  return (
    <SelectPrimitive.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      name={name}
      required={required}
      disabled={disabled}
    >
      <FieldShell
        kind="rds-select"
        controlId={controlId}
        hintId={hintId}
        errorId={errorId}
        label={label}
        labelPosition={labelPosition}
        hint={hint}
        errorMessage={errorMessage}
        invalid={invalid}
        required={required}
        disabled={disabled}
        className={className}
        style={style}
      >
        <SelectPrimitive.Trigger
          id={controlId}
          className="rds-field__control rds-select__trigger"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
        >
          {leadingIcon && (
            <span className="rds-field__icon" aria-hidden="true">
              {leadingIcon}
            </span>
          )}
          <span className="rds-select__value">
            <SelectPrimitive.Value placeholder={placeholder} />
          </span>
          <SelectPrimitive.Icon className="rds-field__icon rds-select__chevron">
            <ChevronDownIcon />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
      </FieldShell>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content position="popper" sideOffset={4} className="rds-listbox rds-select__content">
          <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export interface SelectItemProps {
  /** The value sent with the form. */
  value: string;
  /** The option text. */
  children: ReactNode;
  /** An icon before the text. Decorative. */
  icon?: ReactNode;
  /** Cannot be chosen now. An option that never applies should leave the list instead. */
  disabled?: boolean;
  /** The text typing jumps by, when the children are not plain text. */
  textValue?: string;
}

/** One option of the Select (Figma: .listbox/option). The chosen one gets the tint and the check. */
export function SelectItem({ value, children, icon, disabled, textValue }: SelectItemProps) {
  return (
    <SelectPrimitive.Item value={value} disabled={disabled} textValue={textValue} className="rds-listbox__option">
      {icon && (
        <span className="rds-listbox__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <SelectPrimitive.ItemText>
        <span className="rds-listbox__text">{children}</span>
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="rds-listbox__check">
        <CheckIcon />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}
