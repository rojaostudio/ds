'use client';

import { useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { Chip } from './chip';
import { announce } from './internal/announce';
import { FieldShell, useFieldIds, warnIfUnlabelled, type FieldTextProps } from './internal/field';
import { PlusIcon } from './internal/icons';
import { OptionContent } from './internal/option-content';
import { useListbox } from './internal/use-listbox';

export interface ChipInputProps extends Omit<FieldTextProps, 'labelPosition'> {
  /** Controlled: the values, one Chip each (Figma: `filled` is `value.length > 0`). */
  value?: string[];
  /** Uncontrolled: the values at first. */
  defaultValue?: string[];
  /** Called with the new list when a value is added or removed. */
  onChange?: (value: string[]) => void;
  /** What shows in the empty field (Figma: `text`). Say how to add: "Digite e aperte Enter". */
  placeholder?: string;
  /** @deprecated Use `hint`. */
  helper?: ReactNode;
  /**
   * Values to offer while typing: the list under the field filters them by the text (ignoring case and accents),
   * the arrows move in it and Enter takes the active one.
   */
  suggestions?: string[];
  /**
   * Called with the typed text before it becomes a Chip. Return the value to add (trimmed, normalised), or null to
   * refuse it; nothing (undefined) adds the text as typed. May be async. With suggestions, the list offers
   * `Criar "<texto>"` when nothing matches exactly.
   */
  onCreate?: (text: string) => string | null | void | Promise<string | null | void>;
  /** The create option's text. By default `Criar "<texto>"`. */
  createLabel?: (text: string) => string;
  /** The most values: past it the text does not become a Chip. Say it in the hint and show the errorMessage. */
  max?: number;
  /** The ×'s name for each Chip. By default "Remover <valor>". */
  removeLabel?: (value: string) => string;
  /** The form field name: one hidden input per value. */
  name?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  style?: CSSProperties;
  /** The name when there is no visible label. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

type Row = { value: string; label: string; create?: string };

const CREATE = '\u0000create';
const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/**
 * ChipInput — Figma [RDS] Forms/ChipInput. A field that turns what is typed into Chips: Enter or a comma makes the
 * text a Chip, Backspace on the empty field takes the last one, and each Chip's × removes it. For several short,
 * free values: tags, guests' e-mails, keywords. Choosing from a closed list is the Combobox (multiple) or the
 * CheckboxGroup. Label, hint, error and required as in the Input. Styles: chip-input.css, internal/field.css,
 * internal/listbox.css and chip.css.
 */
export function ChipInput({
  label,
  hint,
  helper,
  error,
  errorMessage,
  required,
  value,
  defaultValue = [],
  onChange,
  placeholder,
  suggestions,
  onCreate,
  createLabel = (text: string) => `Criar "${text}"`,
  max,
  removeLabel,
  name,
  disabled,
  id,
  className,
  style,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: ChipInputProps) {
  warnIfUnlabelled('ChipInput', label, ariaLabel, ariaLabelledBy);
  const shownHint = hint ?? helper;
  const { controlId, hintId, errorId, invalid, describedBy } = useFieldIds(id, shownHint, error, errorMessage);
  const [own, setOwn] = useState<string[]>(defaultValue);
  const values = value ?? own;
  const input = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const typed = text.trim();
  const offered = (suggestions ?? []).filter((s) => !values.includes(s) && normalize(s).includes(normalize(typed)));
  const exact = [...(suggestions ?? []), ...values].some((s) => normalize(s) === normalize(typed));
  const rows: Row[] = offered.map((s) => ({ value: s, label: s }));
  if (suggestions && typed && !exact) rows.push({ value: CREATE, label: createLabel(typed), create: typed });
  const showList = open && !disabled && suggestions !== undefined && rows.length > 0;

  function commit(next: string[]) {
    if (value === undefined) setOwn(next);
    onChange?.(next);
  }

  /** Adds values (from the typed text or a suggestion), skipping repeats and stopping at `max`. */
  function add(list: string[]) {
    let next = values;
    for (const item of list) {
      if (!item || next.includes(item)) continue;
      if (max !== undefined && next.length >= max) break;
      next = [...next, item];
      announce(`${item} adicionado`);
    }
    if (next !== values) commit(next);
  }

  async function create(raw: string) {
    const parts = raw
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    if (!parts.length) return;
    if (!onCreate) {
      add(parts);
      return;
    }
    setBusy(true);
    try {
      const made = await Promise.all(parts.map(async (part) => {
        const result = await onCreate(part);
        return result === undefined ? part : result;
      }));
      add(made.filter((m): m is string => typeof m === 'string'));
    } finally {
      setBusy(false);
    }
  }

  const { setActive, onKeyDown: listKeyDown, controlProps, listProps, optionProps } = useListbox({
    items: rows,
    showing: showList,
    selected: [],
    onOpen: () => setOpen(true),
    onChoose: (row) => {
      if (row.create) void create(row.create);
      else add([row.value]);
      setText('');
      setActive(-1);
    },
  });

  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (suggestions && listKeyDown(event)) return;
    if (event.key === 'Enter' || event.key === ',') {
      // Enter on an empty field submits the form, as in any field.
      if (!typed) {
        if (event.key === ',') event.preventDefault();
        return;
      }
      event.preventDefault();
      if (busy) return;
      void create(text);
      setText('');
      setActive(-1);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
      setActive(-1);
    } else if (event.key === 'Backspace' && text === '' && values.length) {
      const last = values[values.length - 1];
      commit(values.slice(0, -1));
      announce(`${last} removido`);
    }
  }

  function remove(item: string) {
    const next = values.filter((v) => v !== item);
    commit(next);
    // The Chip moves the focus to the next ×; with none left, back to the field.
    if (next.length === 0) requestAnimationFrame(() => input.current?.focus());
  }

  const listName = typeof label === 'string' ? `Sugestões para ${label}` : 'Sugestões';

  return (
    <FieldShell
      kind="rds-chip-input"
      controlId={controlId}
      hintId={hintId}
      errorId={errorId}
      label={label}
      hint={shownHint}
      errorMessage={errorMessage}
      invalid={invalid}
      required={required}
      disabled={disabled}
      boxClassName="rds-chip-input__box"
      className={className}
      style={style}
    >
      {values.length > 0 && (
        <ul className="rds-chip-input__chips" role="list" aria-label={`Valores: ${values.length}`}>
          {values.map((item) => (
            <li key={item}>
              <Chip disabled={disabled} onRemove={() => remove(item)} removeLabel={removeLabel?.(item)}>
                {item}
              </Chip>
            </li>
          ))}
        </ul>
      )}
      <input
        ref={input}
        id={controlId}
        className="rds-field__control"
        type="text"
        autoComplete="off"
        enterKeyHint="enter"
        {...(suggestions ? { role: 'combobox', 'aria-autocomplete': 'list' as const, ...controlProps } : {})}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        aria-busy={busy || undefined}
        disabled={disabled}
        placeholder={values.length ? undefined : placeholder}
        value={text}
        onChange={(event) => {
          const next = event.target.value;
          // A pasted "a, b, c" becomes Chips up to the last comma; the rest stays typed.
          const cut = next.lastIndexOf(',');
          if (cut >= 0) {
            void create(next.slice(0, cut));
            setText(next.slice(cut + 1).trimStart());
          } else {
            setText(next);
          }
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={keyDown}
        onBlur={() => {
          setOpen(false);
          setActive(-1);
        }}
      />
      {name && values.map((item) => <input key={item} type="hidden" name={name} value={item} />)}
      {showList && (
        <ul {...listProps} aria-label={listName} className="rds-listbox rds-chip-input__list">
          {rows.map((row, index) => (
            <li key={row.value} {...optionProps(row, index)} className="rds-listbox__option">
              <OptionContent icon={row.create ? <PlusIcon /> : undefined} selected={false}>
                {row.label}
              </OptionContent>
            </li>
          ))}
        </ul>
      )}
    </FieldShell>
  );
}
