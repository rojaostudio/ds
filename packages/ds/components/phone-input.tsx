'use client';

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { usePhoneInput, defaultCountries, parseCountry, type CountryIso2 } from 'react-international-phone';
import { Flag } from './internal/flags';
import { Drawer } from './drawer';
import { FieldShell, hasContent, useFieldIds, warnIfUnlabelled } from './internal/field';
import { CheckIcon, ChevronDownIcon, SearchIcon } from './internal/icons';
import { useCompact } from './internal/use-compact';
import { useListbox } from './internal/use-listbox';

export interface PhoneInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'defaultValue' | 'size' | 'prefix' | 'type'> {
  /** The field's label (Figma: `label`), above the whole field. Without it, pass aria-label. */
  label?: string;
  /** A line under the field (Figma: `showHint` + `hint`), as on every other field. */
  hint?: ReactNode;
  /** @deprecated Use `hint` (the name every other field uses). Kept so 2.x code keeps working. */
  helper?: string;
  /**
   * The error state (Figma: `error`): the whole field's border turns red. Pass `errorMessage` with it. A string here
   * is the 2.x API (the message itself): still accepted, deprecated.
   */
  error?: boolean | string;
  /** What is wrong with the number (Figma: `errorMessage`): "Falta o DDD.", "Número incompleto. Confira os dígitos.". */
  errorMessage?: ReactNode;
  /** md 44 (default) or sm 32, as the Input (Figma: `size`). */
  size?: 'md' | 'sm';
  required?: boolean;
  /** Says "(opcional)" after the label. */
  optional?: boolean;
  /** The number in E.164 (+5511987654321). */
  value?: string;
  defaultValue?: string;
  /** Called with the number in E.164; empty when only the dial code is left. */
  onChange?: (value: string) => void;
  /** The country the field starts on (ISO 3166-1 alpha-2, lowercase). Brazil by default. */
  defaultCountry?: CountryIso2;
  /** Pinned at the top of the list, under "Sugeridos" (Figma). Brazil, Portugal and the United States by default. */
  preferredCountries?: CountryIso2[];
  /** Only these countries in the list. All of them by default. */
  countries?: CountryIso2[];
  /** The country button's name for screen readers. By default "País", or "País do <label>". */
  countryLabel?: string;
  /** Draws a country's flag. By default the package's own (SVG inline, no request leaves the page). */
  renderFlag?: (iso2: CountryIso2) => ReactNode;
}

interface CountryItem {
  value: CountryIso2;
  name: string;
  dialCode: string;
  search: string;
}

const PREFERRED: CountryIso2[] = ['br', 'pt', 'us'];
let warnedLegacy = false;
const regionNames = typeof Intl !== 'undefined' && 'DisplayNames' in Intl ? new Intl.DisplayNames(['pt-BR'], { type: 'region' }) : null;
const fold = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function countryList(only?: CountryIso2[]): CountryItem[] {
  return defaultCountries
    .map((c) => parseCountry(c))
    .filter((p) => !only || only.includes(p.iso2))
    .map((p) => {
      const name = regionNames?.of(p.iso2.toUpperCase()) ?? p.name;
      return { value: p.iso2, name, dialCode: p.dialCode, search: fold(`${name} ${p.name} ${p.iso2} +${p.dialCode} ${p.dialCode}`) };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

/**
 * A pasted number, cleaned: "+351 912…" or "00351…" switch the country (the longest dial code that matches);
 * a national number loses its trunk 0 ("011 9…" is "11 9…") and, when the country's dial code was typed without
 * the +, that too ("5511…" in Brazil). Exported for the tests.
 */
export function normalizePastedPhone(raw: string, current: { iso2: CountryIso2; dialCode: string }, list: CountryItem[]) {
  const text = raw.trim();
  const digits = text.replace(/\D/g, '');
  if (!digits) return null;
  if (text.startsWith('+') || text.startsWith('00')) {
    const international = text.startsWith('00') ? digits.slice(2) : digits;
    const match = [...list]
      .filter((c) => international.startsWith(c.dialCode))
      .sort((a, b) => b.dialCode.length - a.dialCode.length || (a.value === current.iso2 ? -1 : b.value === current.iso2 ? 1 : 0))[0];
    if (!match) return null;
    return { iso2: match.value, e164: `+${international}` };
  }
  let national = digits.replace(/^0+/, '');
  if (national.startsWith(current.dialCode) && national.length > current.dialCode.length + 9) national = national.slice(current.dialCode.length);
  return { iso2: current.iso2, e164: `+${current.dialCode}${national}` };
}

/** 2.x kept a +55 in front of anything without a +, and kept the trunk 0 ("011…" became +55011…). */
function normalizeToE164(raw: string): string {
  if (!raw) return '';
  if (raw.startsWith('+')) return raw;
  const digits = raw.replace(/\D/g, '').replace(/^0+/, '');
  if (digits.length >= 12 && digits.startsWith('55')) return `+${digits}`;
  return `+55${digits}`;
}

/**
 * PhoneInput — Figma [RDS] Forms/PhoneInput. A phone number with its country, in one field: on the left the country
 * button (flag, dial code, chevron), a hairline, and the number, masked for the country. The dial code shows once,
 * on the button. Label, hint and error belong to the whole field; the error paints its whole border.
 * The button opens the country list (a popover; a Drawer below 1024): a search fixed on top, "Sugeridos"
 * (`preferredCountries`) and "Todos os países"; typing filters by name or code and drops the groups. Picking a
 * country closes it and moves the focus to the number. Pasting "+55 11 9…", "5511…" or "011 9…" leaves the national
 * number; pasting another country's code switches the country. The value is E.164, also in a hidden input named
 * `name`. The mask comes from `react-international-phone` (an optional peer, needed only here). Styles: phone-input.css.
 */
export function PhoneInput({
  label,
  hint,
  helper,
  error,
  errorMessage,
  size = 'md',
  required,
  optional,
  value,
  defaultValue = '',
  placeholder,
  name,
  onChange,
  id,
  disabled,
  className,
  defaultCountry = 'br',
  preferredCountries = PREFERRED,
  countries,
  countryLabel,
  renderFlag,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...rest
}: PhoneInputProps) {
  warnIfUnlabelled('PhoneInput', label, ariaLabel, ariaLabelledBy);
  if (process.env.NODE_ENV !== 'production' && !warnedLegacy && (helper !== undefined || typeof error === 'string')) {
    warnedLegacy = true;
    console.warn('[@rojaostudio/ds] PhoneInput: `helper` and a string `error` are deprecated; use `hint`, and `error` + `errorMessage`.');
  }
  const message = errorMessage ?? (typeof error === 'string' ? error : undefined);
  const { controlId, hintId, errorId, invalid, describedBy } = useFieldIds(id, hint ?? helper, Boolean(error) || hasContent(message), message);
  const compact = useCompact();
  const list = useMemo(() => countryList(countries), [countries]);
  const flag = (iso2: CountryIso2) => renderFlag?.(iso2) ?? <Flag key={iso2} iso2={iso2} />;

  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(() => normalizeToE164(defaultValue));
  const displayValue = controlled ? value! : internalValue;
  const emit = (next: string) => {
    if (!controlled) setInternalValue(next);
    onChange?.(next);
  };

  const { inputValue, country, setCountry, handlePhoneValueChange, inputRef } = usePhoneInput({
    defaultCountry,
    value: displayValue,
    countries: defaultCountries,
    // The dial code is never typed in the field: it shows on the country button and changes only through it.
    disableDialCodeAndPrefix: true,
    onChange: (data) => emit(data.phone === `+${data.country.dialCode}` ? '' : data.phone),
  });

  // ── the country list ─────────────────────────────────────────────────────────────────────────────────────
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [panelWidth, setPanelWidth] = useState<number>();
  const [alignOffset, setAlignOffset] = useState(0);
  const groupId = useId();
  // A pick sends the focus to the number; the popover must not hand it back to the button on closing.
  const picked = useRef(false);

  const filtered = useMemo(() => {
    const q = fold(query.trim()).replace(/^\+/, '');
    return q ? list.filter((c) => c.search.includes(q)) : null;
  }, [list, query]);
  const preferred = useMemo(
    () => preferredCountries.map((iso) => list.find((c) => c.value === iso)).filter((c): c is CountryItem => Boolean(c)),
    [list, preferredCountries],
  );
  // One flat list for the keyboard: the suggested ones, then all of them (or just the matches while searching).
  const items = filtered ?? [...preferred, ...list];

  const pick = (iso2: CountryIso2) => {
    setCountry(iso2);
    picked.current = true;
    setOpen(false);
    // The next step is typing the number.
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const listbox = useListbox<CountryItem & { key: string }>({
    items: items.map((c, i) => ({ ...c, key: `${i}-${c.value}` })),
    showing: open,
    selected: [country.iso2],
    onOpen: () => setOpen(true),
    onChoose: (item) => pick(item.value),
  });

  const openChange = (next: boolean) => {
    if (next) {
      setQuery('');
      const box = triggerRef.current?.closest('.rds-field__box') as HTMLElement | null;
      if (box && triggerRef.current) {
        setPanelWidth(box.offsetWidth);
        setAlignOffset(box.getBoundingClientRect().left - triggerRef.current.getBoundingClientRect().left);
      }
      // The chosen country starts active, scrolled into view.
      const start = preferred.findIndex((c) => c.value === country.iso2);
      listbox.setActive(start >= 0 ? start : preferred.length + list.findIndex((c) => c.value === country.iso2));
    }
    setOpen(next);
  };

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      searchRef.current?.focus();
      if (listbox.active >= 0) document.getElementById(`${listbox.listId}-${listbox.active}`)?.scrollIntoView({ block: 'nearest' });
    });
    return () => cancelAnimationFrame(frame);
    // Only on opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSearchKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (listbox.onKeyDown(event)) return;
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      listbox.setActive(event.key === 'Home' ? 0 : items.length - 1);
    }
  };

  const current = list.find((c) => c.value === country.iso2);
  const countryName = current?.name ?? country.name;
  const buttonName = `${countryLabel ?? (label ? `País do ${label}` : 'País')}: ${countryName}, +${country.dialCode}`;

  const option = (c: CountryItem, index: number) => {
    const props = listbox.optionProps({ ...c, key: `${index}-${c.value}` }, index);
    return (
      <li key={`${index}-${c.value}`} {...props} aria-label={`${c.name}, +${c.dialCode}`} className="rds-menu__item rds-phone-input__option">
        <span className="rds-phone-input__flag" aria-hidden="true">
          {flag(c.value)}
        </span>
        <span className="rds-phone-input__name">{c.name}</span>
        <span className="rds-phone-input__dial">+{c.dialCode}</span>
        <span className="rds-phone-input__check" aria-hidden="true">
          {props['aria-selected'] && <CheckIcon />}
        </span>
      </li>
    );
  };

  const panel = (
    <div className="rds-phone-input__panel">
      <div className="rds-command__search">
        <span className="rds-command__icon" aria-hidden="true">
          <SearchIcon />
        </span>
        <input
          ref={searchRef}
          className="rds-command__input"
          role="combobox"
          aria-label="Buscar país"
          aria-autocomplete="list"
          {...listbox.controlProps}
          value={query}
          placeholder="Buscar país"
          onChange={(event) => {
            setQuery(event.target.value);
            listbox.setActive(0);
          }}
          onKeyDown={onSearchKey}
        />
      </div>
      <ul {...listbox.listProps} aria-label="Países" className="rds-command__results rds-phone-input__results">
        {filtered ? (
          filtered.map((c, i) => option(c, i))
        ) : (
          <>
            <li role="presentation" className="rds-command__group">
              <p id={`${groupId}-pref`} className="rds-command__group-label">
                Sugeridos
              </p>
              <ul role="group" aria-labelledby={`${groupId}-pref`} className="rds-phone-input__group">
                {preferred.map((c, i) => option(c, i))}
              </ul>
            </li>
            <li role="presentation" className="rds-command__group">
              <p id={`${groupId}-all`} className="rds-command__group-label">
                Todos os países
              </p>
              <ul role="group" aria-labelledby={`${groupId}-all`} className="rds-phone-input__group">
                {list.map((c, i) => option(c, preferred.length + i))}
              </ul>
            </li>
          </>
        )}
      </ul>
      {filtered && filtered.length === 0 && <p className="rds-command__empty">Nenhum país com esse nome.</p>}
      <p role="status" className="rds-visually-hidden">
        {filtered ? `${filtered.length} ${filtered.length === 1 ? 'país' : 'países'}` : ''}
      </p>
    </div>
  );

  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      className="rds-phone-input__country"
      aria-label={buttonName}
      aria-haspopup="dialog"
      aria-expanded={open}
      disabled={disabled}
      onClick={compact ? () => openChange(true) : undefined}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          openChange(true);
        }
      }}
    >
      <span className="rds-phone-input__flag" aria-hidden="true">
        {flag(country.iso2)}
      </span>
      <span className="rds-phone-input__trigger-dial" aria-hidden="true">
        +{country.dialCode}
      </span>
      <span className="rds-phone-input__chevron" aria-hidden="true">
        <ChevronDownIcon />
      </span>
    </button>
  );

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = normalizePastedPhone(event.clipboardData.getData('text'), { iso2: country.iso2, dialCode: country.dialCode }, list);
    if (!pasted) return;
    event.preventDefault();
    if (pasted.iso2 !== country.iso2) setCountry(pasted.iso2);
    emit(pasted.e164);
  };

  const labelText = label && optional && !required ? `${label} (opcional)` : label;

  return (
    <FieldShell
      kind="rds-input rds-phone-input"
      controlId={controlId}
      hintId={hintId}
      errorId={errorId}
      label={labelText}
      hint={hint ?? helper}
      errorMessage={message}
      invalid={invalid}
      required={required}
      disabled={disabled}
      className={[size === 'sm' && 'rds-field--sm', className].filter(Boolean).join(' ') || undefined}
    >
      {compact ? (
        <>
          {trigger}
          <Drawer
            open={open}
            onOpenChange={openChange}
            title="País"
            returnFocus={() => {
              if (!picked.current) return null;
              picked.current = false;
              return inputRef.current;
            }}
          >
            {panel}
          </Drawer>
        </>
      ) : (
        <PopoverPrimitive.Root open={open} onOpenChange={openChange}>
          <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
              aria-label="Escolher país"
              align="start"
              alignOffset={alignOffset}
              sideOffset={4 + 1}
              collisionPadding={16}
              className="rds-phone-input__popover"
              style={panelWidth ? { width: panelWidth } : undefined}
              onOpenAutoFocus={(event) => event.preventDefault()}
              onCloseAutoFocus={(event) => {
                if (!picked.current) return;
                picked.current = false;
                event.preventDefault();
                inputRef.current?.focus();
              }}
            >
              {panel}
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      )}
      <span className="rds-phone-input__divider" aria-hidden="true" />
      <input
        {...rest}
        ref={inputRef}
        id={controlId}
        className="rds-field__control rds-phone-input__number"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={inputValue}
        onChange={handlePhoneValueChange}
        onPaste={onPaste}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
      />
      {name && <input type="hidden" name={name} value={displayValue} />}
    </FieldShell>
  );
}
