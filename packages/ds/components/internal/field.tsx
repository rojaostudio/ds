// The parts shared by the text fields (Input, PasswordInput, Textarea, Select): label, box, hint and
// error. Not exported from the package: each field is its own component, as in Figma. Styles: field.css.
import { createContext, useContext, useId, type ButtonHTMLAttributes, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';

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
  /**
   * What went wrong and how to fix it, never just "campo inválido". Turns the error state on. Inside a FieldGroup the
   * field draws only its border (Figma: `showErrorMessage` off): the group says the message.
   */
  errorMessage?: ReactNode;
  /** Shows the asterisk and sets the native required (read as "obrigatório"). */
  required?: boolean;
}

/**
 * What a FieldGroup (ds#147) hands to the fields inside it: its error, which a field takes unless it passes its own
 * `error`, and the ids of its hint and message, which every field points to. Inside a group a field shows no message.
 */
export interface FieldGroupContextValue {
  invalid: boolean;
  hintId?: string;
  errorId?: string;
}

export const FieldGroupContext = createContext<FieldGroupContextValue | null>(null);

/** The ids a field's control points to, and whether it is in error. */
export function useFieldIds(id: string | undefined, hint: ReactNode, error: boolean | undefined, errorMessage: ReactNode) {
  const generated = useId();
  const group = useContext(FieldGroupContext);
  const controlId = id ?? generated;
  const invalid = Boolean((error ?? group?.invalid) || hasContent(errorMessage));
  // In a group the message is the group's, under the whole set: the field keeps only its red border.
  const errorId = !group && invalid && hasContent(errorMessage) ? `${controlId}-error` : undefined;
  const hintId = hasContent(hint) && !errorId ? `${controlId}-hint` : undefined;
  const describedBy = [hintId, errorId, group?.hintId, invalid ? group?.errorId : undefined].filter(Boolean).join(' ');
  return { controlId, hintId, errorId, invalid, describedBy: describedBy || undefined };
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
  /** The top label stays in the page and keeps naming the control, but is not shown (a dense row). */
  labelHidden?: boolean;
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
  /**
   * An action on the label's line, on the right ("Esqueci a senha", a Button ghost sm). It comes after the box in the DOM, so
   * the Tab order is the field, then the action; with the label floating it sits under the box, on the right.
   */
  labelAction?: ReactNode;
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
  labelHidden,
  hint,
  errorMessage,
  invalid,
  required,
  disabled,
  children,
  boxClassName,
  afterBox,
  labelAction,
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
        labelAction && !floating && 'rds-field--label-action',
        disabled && 'rds-field--disabled',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      {labelled && !floating && (
        <label htmlFor={controlId} className={labelHidden ? 'rds-field__label rds-visually-hidden' : 'rds-field__label'}>
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
      {labelAction && <div className="rds-field__label-action">{labelAction}</div>}
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
  className,
  ...rest
}: { label: string; icon: ReactNode } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  return (
    <button type="button" aria-label={label} {...rest} className={['rds-field__action', className].filter(Boolean).join(' ')}>
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
