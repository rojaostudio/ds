// The parts shared by the text fields (Input, PasswordInput, Textarea, Select): label, box, hint and
// error. Not exported from the package: each field is its own component, as in Figma. Styles: field.css.
import { useId, type ButtonHTMLAttributes, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';

export type FieldLabelPosition = 'top' | 'floating';

export interface FieldTextProps {
  /**
   * The label (Figma: `showLabel` + `label`), always tied to the control. Without it the field has no
   * visible name: pass aria-label (a search in a header).
   */
  label?: ReactNode;
  /** top (default): the label above the box. floating: inside the box, shrinking on focus or with a value. */
  labelPosition?: FieldLabelPosition;
  /** A line under the box (Figma: `showHint` + `hint`), tied by aria-describedby. Gives way to the error message. */
  hint?: ReactNode;
  /** The error state (Figma: `error`): red border and aria-invalid. Passing `errorMessage` turns it on too. */
  error?: boolean;
  /** What went wrong and how to fix it, never just "campo inválido". Turns the error state on. */
  errorMessage?: ReactNode;
  /** Shows the asterisk and sets the native required (read as "obrigatório"). */
  required?: boolean;
}

/** The ids a field's control points to, and whether it is in error. */
export function useFieldIds(id: string | undefined, hint: ReactNode, error: boolean | undefined, errorMessage: ReactNode) {
  const generated = useId();
  const controlId = id ?? generated;
  const invalid = Boolean(error || hasContent(errorMessage));
  const errorId = invalid && hasContent(errorMessage) ? `${controlId}-error` : undefined;
  const hintId = hasContent(hint) && !errorId ? `${controlId}-hint` : undefined;
  return { controlId, hintId, errorId, invalid, describedBy: [hintId, errorId].filter(Boolean).join(' ') || undefined };
}

export const hasContent = (node: ReactNode) => node !== undefined && node !== null && node !== false && node !== '';

/** A field without a visible label needs a name, or a screen reader only says "edit text". */
export function warnIfUnlabelled(component: string, label: ReactNode, ariaLabel: unknown, ariaLabelledBy: unknown) {
  if (!hasContent(label) && !ariaLabel && !ariaLabelledBy) {
    console.warn(`[@rojaostudio/ds] ${component} without label needs aria-label.`);
  }
}

export interface FieldShellProps {
  /** The component class (rds-input, rds-textarea, rds-select). */
  kind: string;
  controlId: string;
  hintId?: string;
  errorId?: string;
  label?: ReactNode;
  labelPosition?: FieldLabelPosition;
  hint?: ReactNode;
  errorMessage?: ReactNode;
  invalid: boolean;
  required?: boolean;
  disabled?: boolean;
  /** The box contents, in order: leading parts, the control, trailing parts. */
  children: ReactNode;
  /** Extra class on the box (for example when it ends on an action). */
  boxClassName?: string;
  /** What goes between the box and the hint or error (the NumberInput's named steps). */
  afterBox?: ReactNode;
  /** Event handlers on the box (the FileInput's drag and drop). */
  boxProps?: Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'role' | 'children'>;
  className?: string;
  style?: CSSProperties;
}

function LabelText({ label, required }: { label: ReactNode; required?: boolean }) {
  return (
    <>
      {label}
      {required && (
        <span className="rds-field__required" aria-hidden="true">
          {' *'}
        </span>
      )}
    </>
  );
}

export function FieldShell({
  kind,
  controlId,
  hintId,
  errorId,
  label,
  labelPosition = 'top',
  hint,
  errorMessage,
  invalid,
  required,
  disabled,
  children,
  boxClassName,
  afterBox,
  boxProps,
  className,
  style,
}: FieldShellProps) {
  const labelled = hasContent(label);
  // Floating needs a label to float; without one the field is a plain box.
  const floating = labelPosition === 'floating' && labelled;
  return (
    <div
      className={[
        'rds-field',
        kind,
        floating && 'rds-field--floating',
        invalid && 'rds-field--error',
        disabled && 'rds-field--disabled',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      {labelled && !floating && (
        <label htmlFor={controlId} className="rds-field__label">
          <LabelText label={label} required={required} />
        </label>
      )}
      {/* Disabled, the box is an inactive group: its lighter prefix, suffix and icons are exempt from text
          contrast (WCAG 1.4.3), like the disabled control itself. */}
      <div
        {...boxProps}
        className={['rds-field__box', boxClassName].filter(Boolean).join(' ')}
        role={disabled ? 'group' : undefined}
        aria-disabled={disabled || undefined}
      >
        {floating && (
          <label htmlFor={controlId} className="rds-field__float-label">
            <LabelText label={label} required={required} />
          </label>
        )}
        {children}
      </div>
      {afterBox}
      {errorId ? (
        <span id={errorId} className="rds-field__support rds-field__error-message">
          {errorMessage}
        </span>
      ) : (
        hintId && (
          <span id={hintId} className="rds-field__support rds-field__hint">
            {hint}
          </span>
        )
      )}
    </div>
  );
}

/** The 32 × 32 button inside a field (Figma: .action): clear, show password. Always named. */
export function FieldAction({
  label,
  icon,
  ...rest
}: { label: string; icon: ReactNode } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  return (
    <button type="button" aria-label={label} {...rest} className="rds-field__action">
      <span className="rds-field__action-icon" aria-hidden="true">
        {icon}
      </span>
    </button>
  );
}

/** Clears a field the way typing would: React's onChange fires, controlled or not. */
export function clearNativeValue(element: HTMLInputElement | HTMLTextAreaElement | null) {
  if (!element) return;
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(element, '');
  element.dispatchEvent(new Event('input', { bubbles: true }));
}
