'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { FieldShell, useFieldIds, warnIfUnlabelled, type FieldTextProps } from './internal/field';

export interface ColorInputProps extends Omit<FieldTextProps, 'labelPosition'> {
  /** Controlled: the colour, #RRGGBB (Figma: `value`). */
  value?: string;
  /** Uncontrolled: the colour at first. */
  defaultValue?: string;
  /** Called only with a valid #RRGGBB, in capitals: typed and confirmed, or chosen in the palette. */
  onChange?: (hex: string) => void;
  /**
   * The colours the swatch's popover offers (#RRGGBB): the caller decides, usually the brand's. Without a palette the
   * swatch opens the system's colour picker instead.
   */
  palette?: string[];
  /** The palette's title. */
  paletteTitle?: string;
  /** The line under the palette. */
  paletteCaption?: string;
  /** The swatch's accessible name: it opens the palette (or the system's picker). */
  pickLabel?: string;
  /** The form field name: carries the hex. */
  name?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  style?: CSSProperties;
  /** The name when there is no visible label. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

const HEX = /^#[0-9a-f]{6}$/i;
/** "2563eb", "#2563eb" → "#2563EB"; anything else → null. */
export function normalizeHex(text: string): string | null {
  const raw = text.trim();
  const hex = raw.startsWith('#') ? raw : `#${raw}`;
  return HEX.test(hex) ? hex.toUpperCase() : null;
}

/**
 * ColorInput — Figma [RDS] Forms/ColorInput. One colour, chosen or typed: the swatch shows it and the hex beside it
 * is editable (#RRGGBB, with or without #). The swatch opens a popover with the palette the caller passes (Figma:
 * open=true); without one, the system's colour picker. Enter or leaving the field confirms the hex; an invalid hex
 * goes back to the last valid one. The swatch's colour is the person's data, not a token: it is the one inline
 * style the DS allows (style.backgroundColor of the swatch and of each palette colour). Choosing among a few fixed
 * colours without a hex is the ToggleGroup or the ChoiceCard. Styles: color-input.css and internal/field.css.
 */
export function ColorInput({
  label,
  hint,
  error,
  errorMessage,
  required,
  value,
  defaultValue = '#000000',
  onChange,
  palette,
  paletteTitle = 'Cores da marca',
  paletteCaption = 'Ou digite o hex no campo.',
  pickLabel = 'Escolher cor',
  name,
  disabled,
  id,
  className,
  style,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: ColorInputProps) {
  warnIfUnlabelled('ColorInput', label, ariaLabel, ariaLabelledBy);
  const { controlId, hintId, errorId, invalid, describedBy } = useFieldIds(id, hint, error, errorMessage);
  const [own, setOwn] = useState(() => normalizeHex(defaultValue) ?? '#000000');
  const color = normalizeHex(value ?? own) ?? own;
  const [draft, setDraft] = useState(color);
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  // A new colour from outside (the palette, a reset) replaces the text.
  useEffect(() => setDraft(color), [color]);

  function commit(next: string) {
    if (value === undefined) setOwn(next);
    setDraft(next);
    if (next !== color) onChange?.(next);
  }

  function confirm() {
    const hex = normalizeHex(draft);
    if (hex) commit(hex);
    else setDraft(color);
  }

  // Data, not a token: the person's colour (see the component's comment).
  const swatchColor = { backgroundColor: color };
  const choices = (palette ?? []).map((c) => normalizeHex(c)).filter((c): c is string => c !== null);

  const swatch = choices.length ? (
    <PopoverPrimitive.Root open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
      <PopoverPrimitive.Trigger asChild disabled={disabled}>
        <button type="button" className="rds-color-input__swatch" style={swatchColor} aria-label={`${pickLabel}: ${color}`} />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={8}
          collisionPadding={16}
          aria-label={paletteTitle}
          className="rds-popover rds-color-input__popover"
        >
          <p className="rds-color-input__palette-title">{paletteTitle}</p>
          <div className="rds-color-input__palette" role="group" aria-label={paletteTitle}>
            {choices.map((c) => (
              <button
                key={c}
                type="button"
                className="rds-color-input__choice"
                // Data, not a token: each colour of the palette the caller passed.
                style={{ backgroundColor: c }}
                aria-label={c}
                aria-pressed={c === color}
                onClick={() => {
                  commit(c);
                  setOpen(false);
                }}
              />
            ))}
          </div>
          <p className="rds-color-input__palette-caption">{paletteCaption}</p>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  ) : (
    // No palette: the native picker lies invisible over the swatch, with its keyboard and dialog for free.
    <span className="rds-color-input__swatch" style={swatchColor}>
      <input
        type="color"
        className="rds-color-input__native"
        value={color.toLowerCase()}
        disabled={disabled}
        aria-label={pickLabel}
        onChange={(event) => commit(event.target.value.toUpperCase())}
      />
    </span>
  );

  return (
    <FieldShell
      kind="rds-color-input"
      controlId={controlId}
      hintId={hintId}
      errorId={errorId}
      label={label}
      hint={hint}
      errorMessage={errorMessage}
      invalid={invalid}
      required={required}
      disabled={disabled}
      className={className}
      style={style}
    >
      {swatch}
      <input
        ref={input}
        id={controlId}
        className="rds-field__control rds-color-input__hex"
        type="text"
        maxLength={7}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="characters"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        required={required}
        disabled={disabled}
        name={name}
        placeholder="#RRGGBB"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={confirm}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            confirm();
          }
        }}
      />
    </FieldShell>
  );
}
