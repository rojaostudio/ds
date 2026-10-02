'use client';

import { useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { Chip } from './chip';
import { announce } from './internal/announce';
import { FieldShell, useFieldIds, warnIfUnlabelled, type FieldTextProps } from './internal/field';
import { ChevronDownIcon, PlusIcon } from './internal/icons';
import { OptionContent } from './internal/option-content';
import { toggleValue, useListbox } from './internal/use-listbox';

export interface ComboboxOption {
  /** The value sent with the form. */
  value: string;
  /** The text shown and filtered by typing. */
  label: string;
  /** An icon before the text. Decorative. */
  icon?: ReactNode;
  /** Cannot be chosen now: skipped by the arrows. */
  disabled?: boolean;
}

interface ComboboxBaseProps extends FieldTextProps {
  /** The whole list. The field filters it as the person types, ignoring case and accents. */
  options: (ComboboxOption | string)[];
  /** Shown when nothing matches (Figma: menu=empty). Say what was not found ("Nenhum público com esse nome."). */
  emptyMessage?: string;
  /** Tells the result count to screen readers, in the subject's words. By default "N resultados". */
  resultsMessage?: (count: number) => string;
  /**
   * Offers to create what was typed when nothing matches it exactly (Figma: menu=create and empty-create): an
   * option `Cadastrar "<texto>"` after a divider, reached by the arrows like any other. With no match it is the only
   * option and is already active, so Enter creates. On by default when `onCreate` is given.
   */
  creatable?: boolean;
  /** Called with the typed text when the person creates it; return the new option (or its value). */
  onCreate?: (text: string) => ComboboxOption | string | void;
  /** The create option's text. By default `Cadastrar "<texto>"`. */
  createLabel?: (text: string) => string;
  /** What shows in the empty field. */
  placeholder?: string;
  /** An icon on the left, as in the Input (Figma: `showLeadingIcon` + `leadingIcon`). Decorative. */
  leadingIcon?: ReactNode;
  /** The form field name: hidden inputs carry the chosen values. */
  name?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  style?: CSSProperties;
  /** The name when there is no visible label. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export interface ComboboxSingleProps extends ComboboxBaseProps {
  multiple?: false;
  /** Controlled: the chosen option's value ('' for none). */
  value?: string;
  /** Uncontrolled: the option chosen at first. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export interface ComboboxMultipleProps extends ComboboxBaseProps {
  /**
   * Many values: the chosen ones show as Chips in the field, choosing toggles, the list stays open, and
   * Backspace on an empty field removes the last one.
   */
  multiple: true;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

export type ComboboxProps = ComboboxSingleProps | ComboboxMultipleProps;

type Row = ComboboxOption & { create?: string };

const CREATE = '\u0000create';
const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/**
 * Combobox — Figma [RDS] Forms/Combobox. A field that filters a long list while the person types: audiences,
 * cities, companies. It is the Input with the Listbox under it (ARIA combobox): the focus stays in the field,
 * the arrows move the active option, Enter chooses, Escape closes (and, closed, gives back the chosen text).
 * For 5 to 15 fixed options, the Select. Styles: combobox.css, internal/field.css and internal/listbox.css.
 */
export function Combobox(props: ComboboxProps) {
  const {
    label,
    labelPosition,
    hint,
    error,
    errorMessage,
    required,
    options: rawOptions,
    emptyMessage = 'Nenhum resultado',
    resultsMessage = (count: number) => `${count} ${count === 1 ? 'resultado' : 'resultados'}`,
    onCreate,
    creatable = onCreate !== undefined,
    createLabel = (text: string) => `Cadastrar "${text}"`,
    placeholder,
    leadingIcon,
    name,
    disabled,
    id,
    className,
    style,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
  } = props;
  const multiple = props.multiple === true;
  warnIfUnlabelled('Combobox', label, ariaLabel, ariaLabelledBy);
  const { controlId, hintId, errorId, invalid, describedBy } = useFieldIds(id, hint, error, errorMessage);

  const [created, setCreated] = useState<ComboboxOption[]>([]);
  const options = useMemo(
    () => [...rawOptions.map((o) => (typeof o === 'string' ? { value: o, label: o } : o)), ...created],
    [rawOptions, created],
  );
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;

  const [ownSingle, setOwnSingle] = useState(multiple ? '' : ((props.defaultValue as string | undefined) ?? ''));
  const [ownMany, setOwnMany] = useState<string[]>(multiple ? ((props.defaultValue as string[] | undefined) ?? []) : []);
  const chosen: string[] = multiple
    ? ((props.value as string[] | undefined) ?? ownMany)
    : [((props.value as string | undefined) ?? ownSingle)].filter(Boolean);
  const chosenLabel = !multiple && chosen[0] ? labelOf(chosen[0]) : '';

  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  // Single: while typing, the field shows the query; otherwise the chosen label.
  const [typing, setTyping] = useState(false);
  const [open, setOpen] = useState(false);

  /** The options that match a query, then the create option when nothing matches the text exactly. */
  function listFor(text: string, filtering: boolean) {
    const matches: Row[] = filtering ? options.filter((o) => normalize(o.label).includes(normalize(text))) : options;
    const typed = text.trim();
    const exact = options.some((o) => normalize(o.label) === normalize(typed));
    const rows: Row[] =
      creatable && filtering && typed && !exact ? [...matches, { value: CREATE, label: createLabel(typed), create: typed }] : matches;
    return { matches, rows };
  }
  /** Figma menu=empty-create: the create option alone is already under the cursor, so Enter creates. */
  const onlyCreate = (rows: Row[]) => rows.length === 1 && rows[0].create !== undefined;

  const filtering = multiple ? query !== '' : typing && query !== '';
  const { matches, rows } = listFor(query, filtering);
  const showList = open && rows.length > 0;
  const empty = open && rows.length === 0;

  function commitSingle(next: string) {
    if (props.value === undefined) setOwnSingle(next);
    (props as ComboboxSingleProps).onValueChange?.(next);
  }

  function commitMany(next: string[]) {
    if (props.value === undefined) setOwnMany(next);
    (props as ComboboxMultipleProps).onValueChange?.(next);
  }

  function create(text: string): ComboboxOption {
    const made = onCreate?.(text);
    const option: ComboboxOption =
      typeof made === 'string' ? { value: made, label: text } : (made ?? { value: text, label: text });
    if (!options.some((o) => o.value === option.value)) setCreated((all) => [...all, option]);
    return option;
  }

  const { setActive, isSelected, onKeyDown: listKeyDown, controlProps, listProps, optionProps } = useListbox({
    items: rows,
    showing: showList,
    selected: chosen,
    multiple,
    onOpen: () => setOpen(true),
    onChoose: (row) => {
      if (multiple) {
        if (row.create) {
          const option = create(row.create);
          commitMany([...chosen, option.value]);
          announce(`${option.label} adicionado`);
        } else {
          const adding = !chosen.includes(row.value);
          commitMany(toggleValue(chosen, row.value));
          announce(`${row.label} ${adding ? 'adicionado' : 'removido'}`);
        }
        // Without a query the list stays the same: the active option stays, for the next arrow.
        if (query !== '') {
          setQuery('');
          setActive(-1);
        }
      } else {
        commitSingle(row.create ? create(row.create).value : row.value);
        setTyping(false);
        setOpen(false);
        setActive(-1);
      }
    },
  });

  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (listKeyDown(event)) return;
    if (event.key === 'Escape') {
      if (open) {
        event.preventDefault();
        setOpen(false);
        setActive(-1);
      } else if (!multiple) {
        setTyping(false);
      }
    } else if (multiple && event.key === 'Backspace' && query === '' && chosen.length) {
      const last = chosen[chosen.length - 1];
      commitMany(chosen.slice(0, -1));
      announce(`${labelOf(last)} removido`);
    }
  }

  function remove(v: string) {
    const next = chosen.filter((x) => x !== v);
    commitMany(next);
    // The Chip moves focus to the next ×; with none left, back to the field.
    if (next.length === 0) requestAnimationFrame(() => input.current?.focus());
  }

  const listName = typeof label === 'string' ? label : ariaLabel;

  return (
    <FieldShell
      kind="rds-combobox"
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
      boxClassName={multiple ? 'rds-combobox__box--multiple' : undefined}
      className={className}
      style={style}
    >
      {leadingIcon && (
        <span className="rds-field__icon" aria-hidden="true">
          {leadingIcon}
        </span>
      )}
      {multiple && chosen.length > 0 && (
        <ul className="rds-combobox__chips" aria-label={`Escolhidos: ${chosen.length}`}>
          {chosen.map((v) => (
            <li key={v}>
              <Chip disabled={disabled} onRemove={() => remove(v)}>
                {labelOf(v)}
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
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        {...controlProps}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        disabled={disabled}
        // Floating reads :placeholder-shown to know the field is empty; the real placeholder would sit under the label.
        placeholder={multiple && chosen.length ? undefined : labelPosition === 'floating' && label ? ' ' : placeholder}
        value={multiple ? query : typing ? query : chosenLabel}
        onChange={(event) => {
          const text = event.target.value;
          setQuery(text);
          setTyping(true);
          setOpen(true);
          setActive(onlyCreate(listFor(text, text !== '').rows) ? 0 : -1);
          // Single: emptying the field takes the choice away.
          if (!multiple && text === '' && chosen.length) commitSingle('');
        }}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={keyDown}
        onBlur={() => {
          setOpen(false);
          setTyping(false);
          setQuery('');
          setActive(-1);
        }}
      />
      <span
        className={['rds-field__icon', 'rds-combobox__chevron', open && 'rds-combobox__chevron--open'].filter(Boolean).join(' ')}
        aria-hidden="true"
        onMouseDown={(event) => {
          // The chevron opens the list like the field does, keeping the focus in the field.
          event.preventDefault();
          if (disabled) return;
          input.current?.focus();
          setOpen((current) => !current);
        }}
      >
        <ChevronDownIcon />
      </span>
      {name &&
        (chosen.length ? chosen : multiple ? [] : ['']).map((v) => <input key={v} type="hidden" name={name} value={v} />)}
      {showList && (
        <ul {...listProps} aria-label={listName} className="rds-listbox rds-combobox__list">
          {rows.map((row, index) => (
            <li
              key={row.value}
              {...optionProps(row, index)}
              className={row.create ? 'rds-listbox__option rds-combobox__create' : 'rds-listbox__option'}
            >
              <OptionContent icon={row.create ? <PlusIcon /> : row.icon} selected={!row.create && isSelected(row.value)}>
                {row.label}
              </OptionContent>
            </li>
          ))}
        </ul>
      )}
      {empty && (
        <div className="rds-listbox rds-combobox__list rds-combobox__empty" aria-hidden="true">
          {emptyMessage}
        </div>
      )}
      <span className="rds-visually-hidden" aria-live="polite">
        {open && filtering ? (matches.length ? resultsMessage(matches.length) : emptyMessage) : ''}
      </span>
    </FieldShell>
  );
}
