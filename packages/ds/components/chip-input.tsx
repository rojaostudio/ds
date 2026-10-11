'use client';

import { useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { Chip } from './chip';
import { announce } from './internal/announce';
import { FieldShell, useFieldIds, warnIfUnlabelled, type FieldTextProps } from './internal/field';
import { PlusIcon } from './internal/icons';
import { OptionContent } from './internal/option-content';
import { useListbox } from './internal/use-listbox';
import { useReorder } from './internal/use-reorder';
import { Tooltip } from './tooltip';

export interface ChipInputProps extends Omit<FieldTextProps, 'labelPosition'> {
  /** Controlled: the values, one Chip each (Figma: `filled` is `value.length > 0`). */
  value?: string[];
  /** Uncontrolled: the values at first. */
  defaultValue?: string[];
  /** Called with the new list when a value is added or removed. */
  onChange?: (value: string[]) => void;
  /** What shows in the empty field (Figma: `text`). Say how to add: "Digite e aperte Enter". */
  placeholder?: string;
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
  /**
   * The arrangement (Figma: `layout`). `field` (default): a box where one types, Enter or a comma makes a Chip.
   * `list`: no box, the Chips wrap 8 apart and a "+ <addLabel>" of a chip's size closes the row; pressing it turns
   * it into a field of the same size (Enter adds and keeps the focus for the next one, Escape or leaving it empty
   * closes). For the options of a product variation, a short ordered set edited in place. No suggestions in list.
   */
  layout?: 'field' | 'list';
  /** The "+" button's text in `list` (Figma: the exposed `add`'s `label`). By default "Adicionar". */
  addLabel?: string;
  /**
   * Drag a Chip to move it (mouse and pen at once, touch after a still press) or, focused, Space picks it up, the
   * arrows move it, Space drops and Escape cancels; each position is announced. onChange gets the new order.
   */
  reorderable?: boolean;
  /** Clicking a free Chip's name (or Enter, or F2, on the focused Chip) edits it in place: Enter saves, Escape cancels. */
  editable?: boolean;
  /**
   * Per value: `locked` takes the × and the editing away (a value in use elsewhere), `count` shows after the name in
   * secondary text ("Branco · 2"), `tooltip` says what it means ("Usada em 2 produtos") and makes the Chip focusable.
   */
  getChipProps?: (value: string) => { locked?: boolean; count?: ReactNode; tooltip?: string };
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
  layout = 'field',
  addLabel = 'Adicionar',
  reorderable,
  editable,
  getChipProps,
  name,
  disabled,
  id,
  className,
  style,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: ChipInputProps) {
  warnIfUnlabelled('ChipInput', label, ariaLabel, ariaLabelledBy);
  const { controlId, hintId, errorId, invalid, describedBy } = useFieldIds(id, hint, error, errorMessage);
  const [own, setOwn] = useState<string[]>(defaultValue);
  const values = value ?? own;
  const input = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const list = layout === 'list';
  /** list: the "+" became the field. */
  const [adding, setAdding] = useState(false);
  /** The value whose name is being edited, and the draft. */
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState(false);
  const addButton = useRef<HTMLButtonElement>(null);
  const chipRefs = useRef(new Map<string, HTMLElement>());
  const full = max !== undefined && values.length >= max;

  const typed = text.trim();
  const offered = (suggestions ?? []).filter((s) => !values.includes(s) && normalize(s).includes(normalize(typed)));
  const exact = [...(suggestions ?? []), ...values].some((s) => normalize(s) === normalize(typed));
  const rows: Row[] = offered.map((s) => ({ value: s, label: s }));
  if (suggestions && typed && !exact) rows.push({ value: CREATE, label: createLabel(typed), create: typed });
  const showList = !list && open && !disabled && suggestions !== undefined && rows.length > 0;

  function commit(next: string[]) {
    if (value === undefined) setOwn(next);
    onChange?.(next);
  }

  const reorder = useReorder({
    items: values,
    enabled: Boolean(reorderable) && !disabled && editing === null,
    onCommit: commit,
  });

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
    if (next.length === 0) requestAnimationFrame(() => (list ? addButton.current : input.current)?.focus());
  }

  function startEdit(item: string) {
    if (!editable || disabled || getChipProps?.(item).locked) return;
    setEditing(item);
    setDraft(item);
    setDraftError(false);
  }

  /**
   * Saves the edited name. Empty or unchanged just closes; a repeated name (or one onCreate refuses) keeps the field
   * open on Enter and is dropped on leaving it.
   */
  async function saveEdit(leaving: boolean) {
    const item = editing;
    if (item === null) return;
    let next = draft.trim();
    let refused = false;
    if (next && next !== item && onCreate) {
      const made = await onCreate(next);
      if (made === null) refused = true;
      else if (typeof made === 'string') next = made;
    }
    const repeated = next !== item && values.some((v) => v !== item && normalize(v) === normalize(next));
    if (next && (refused || repeated)) {
      if (leaving) {
        cancelEdit(false);
        return;
      }
      setDraftError(true);
      announce(repeated ? `${next} já existe` : `${next} não pode ser usado`);
      return;
    }
    setEditing(null);
    if (next && next !== item) {
      commit(values.map((v) => (v === item ? next : v)));
      announce(`${item} renomeado para ${next}`);
    }
    const target = next || item;
    if (!leaving) requestAnimationFrame(() => chipRefs.current.get(target)?.focus());
  }

  function cancelEdit(refocus = true) {
    const item = editing;
    setEditing(null);
    if (item && refocus) requestAnimationFrame(() => chipRefs.current.get(item)?.focus());
  }

  function chipKeyDown(event: KeyboardEvent<HTMLElement>, item: string, locked: boolean) {
    if (reorder.onKeyDown(event, item)) return;
    if (event.target !== event.currentTarget || disabled) return;
    if ((event.key === 'Enter' || event.key === 'F2') && editable && !locked) {
      event.preventDefault();
      startEdit(item);
    } else if ((event.key === 'Delete' || event.key === 'Backspace') && !locked) {
      event.preventDefault();
      const index = values.indexOf(item);
      const neighbour = values[index + 1] ?? values[index - 1];
      commit(values.filter((v) => v !== item));
      announce(`${item} removido`);
      requestAnimationFrame(() => (neighbour ? chipRefs.current.get(neighbour) : list ? addButton.current : input.current)?.focus());
    }
  }

  function addKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!typed) {
        closeAdd();
        return;
      }
      if (busy) return;
      void create(text);
      setText('');
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeAdd();
    }
  }

  function closeAdd() {
    setAdding(false);
    setText('');
    requestAnimationFrame(() => addButton.current?.focus());
  }

  const listName = typeof label === 'string' ? `Sugestões para ${label}` : 'Sugestões';

  return (
    <FieldShell
      kind="rds-chip-input"
      controlId={controlId}
      hintId={hintId}
      errorId={errorId}
      label={label}
      hint={hint}
      errorMessage={errorMessage}
      invalid={invalid}
      required={required}
      disabled={disabled}
      boxClassName={list ? 'rds-chip-input__box rds-chip-input__box--list' : 'rds-chip-input__box'}
      className={className}
      style={style}
    >
      {(values.length > 0 || list) && (
        <ul
          ref={reorder.listRef}
          className={['rds-chip-input__chips', reorder.held && 'rds-chip-input__chips--moving'].filter(Boolean).join(' ')}
          role="list"
          aria-label={list && typeof label === 'string' ? `${label}: ${values.length}` : `Valores: ${values.length}`}
        >
          {reorder.order.map((item) => {
            const meta = getChipProps?.(item) ?? {};
            const locked = Boolean(meta.locked);
            if (editing === item) {
              return (
                <li key={item} data-reorder-item={item}>
                  <span className="rds-chip rds-chip--editing">
                    <input
                      className="rds-chip__input"
                      aria-label={`Editar ${item}`}
                      aria-invalid={draftError || undefined}
                      autoFocus
                      enterKeyHint="done"
                      size={Math.max(draft.length, 2)}
                      value={draft}
                      onChange={(event) => {
                        setDraft(event.target.value);
                        setDraftError(false);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          void saveEdit(false);
                        } else if (event.key === 'Escape') {
                          event.preventDefault();
                          cancelEdit();
                        }
                      }}
                      onBlur={() => void saveEdit(true)}
                    />
                  </span>
                </li>
              );
            }
            const movable = Boolean(reorderable) && !disabled;
            const renamable = Boolean(editable) && !locked && !disabled;
            const focusable = !disabled && (movable || renamable || Boolean(meta.tooltip));
            const chip = (
              <Chip
                ref={(node: HTMLSpanElement | null) => {
                  if (node) chipRefs.current.set(item, node);
                  else chipRefs.current.delete(item);
                }}
                disabled={disabled}
                count={meta.count}
                onRemove={locked ? undefined : () => remove(item)}
                removeLabel={removeLabel?.(item)}
                tabIndex={focusable ? 0 : undefined}
                aria-roledescription={movable ? 'item reordenável' : undefined}
                className={
                  [
                    movable && 'rds-chip--reorderable',
                    renamable && 'rds-chip--editable',
                    reorder.held === item && 'rds-chip--dragging',
                  ]
                    .filter(Boolean)
                    .join(' ') || undefined
                }
                onPointerDown={(event) => reorder.onPointerDown(event, item)}
                onKeyDown={(event) => chipKeyDown(event, item, locked)}
                onClick={(event) => {
                  if (reorder.dragged.current) return;
                  if ((event.target as HTMLElement).closest('.rds-chip__label')) startEdit(item);
                }}
              >
                {item}
              </Chip>
            );
            return (
              <li key={item} data-reorder-item={item}>
                {meta.tooltip ? <Tooltip text={meta.tooltip}>{chip}</Tooltip> : chip}
              </li>
            );
          })}
          {list && !full && !disabled && (
            <li className="rds-chip-input__add-item">
              {adding ? (
                <span className="rds-chip rds-chip-input__add rds-chip-input__add--editing">
                  <input
                    ref={input}
                    id={controlId}
                    className="rds-chip__input"
                    type="text"
                    autoComplete="off"
                    autoFocus
                    enterKeyHint="done"
                    size={Math.max(text.length, addLabel.length, 4)}
                    placeholder={placeholder ?? addLabel}
                    aria-label={ariaLabel}
                    aria-labelledby={ariaLabelledBy}
                    aria-invalid={invalid || undefined}
                    aria-describedby={describedBy}
                    aria-busy={busy || undefined}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    onKeyDown={addKeyDown}
                    onBlur={() => {
                      if (typed) void create(text);
                      setText('');
                      setAdding(false);
                    }}
                  />
                </span>
              ) : (
                <button ref={addButton} type="button" className="rds-chip rds-chip-input__add" onClick={() => setAdding(true)}>
                  <span className="rds-chip__icon" aria-hidden="true">
                    <PlusIcon />
                  </span>
                  <span className="rds-chip__label">{addLabel}</span>
                </button>
              )}
            </li>
          )}
        </ul>
      )}
      {!list && (
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
      )}
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
