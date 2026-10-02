'use client';

import { useId, useMemo, useState, type InputHTMLAttributes } from 'react';
import { usePhoneInput, defaultCountries, parseCountry, FlagImage, type CountryIso2 } from 'react-international-phone';
import { Combobox } from './combobox';
import { Input } from './input';

export interface PhoneInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'defaultValue' | 'size' | 'prefix' | 'type'> {
  /** The number's label (the Input's). Without it, pass aria-label. */
  label?: string;
  /** A line under the field (the Input's hint). */
  helper?: string;
  /** What is wrong with the number (the Input's error message). */
  error?: string;
  required?: boolean;
  /** Says "(opcional)" after the label. */
  optional?: boolean;
  /** The number in E.164 (+5511987654321). */
  value?: string;
  defaultValue?: string;
  /** Called with the number in E.164; empty when only the dial code is left. */
  onChange?: (value: string) => void;
}

function normalizeToE164(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+')) return raw;
  if (digits.length >= 12) return `+${digits}`;
  return `+55${digits}`;
}

/**
 * PhoneInput — a composition of the Combobox (the country, searchable by name or code) and the Input (Figma [RDS]
 * Forms/Input, the number, with the dial code as its prefix). The mask, the parsing and E.164 come from
 * `react-international-phone` (an optional peer, needed only here). Submits E.164 through a hidden input named
 * `name`; onChange gets E.164 too. Styles: phone-input.css.
 */
export function PhoneInput({
  label,
  helper,
  error,
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
  ...rest
}: PhoneInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(() => normalizeToE164(defaultValue));
  const displayValue = controlled ? value! : internalValue;

  const { inputValue, country, setCountry, handlePhoneValueChange, inputRef } = usePhoneInput({
    defaultCountry: 'br',
    value: displayValue,
    countries: defaultCountries,
    // DDI nunca é editável pelo campo: o input mostra só o número nacional e o
    // código do país vira prefixo estático — troca de país SÓ pelo seletor.
    // data.phone JÁ vem em E.164 completo (a flag afeta apenas o display);
    // recompor aqui duplicaria o DDI e criaria feedback loop.
    disableDialCodeAndPrefix: true,
    onChange: (data) => {
      // Só o DDI = campo vazio de verdade
      const v = data.phone === `+${data.country.dialCode}` ? '' : data.phone;
      if (!controlled) setInternalValue(v);
      onChange?.(v);
    },
  });

  // Lista de países como opções do Combobox: bandeira (icon) + nome e +código (label, buscável).
  const countryOptions = useMemo(
    () => defaultCountries.map((c) => {
      const p = parseCountry(c);
      return {
        value: p.iso2,
        label: `${p.name} +${p.dialCode}`,
        icon: <FlagImage iso2={p.iso2} size="18px" />,
      };
    }),
    [],
  );

  const labelText = label && optional && !required ? `${label} (opcional)` : label;

  return (
    <div className={['rds-phone-input', labelText && 'rds-phone-input--labelled', className].filter(Boolean).join(' ')}>
      {/* The Combobox is the [RDS] field with a typed filter: the chosen country's flag is its leading icon; the
          list shows flag, name and code, and typing filters by either. */}
      <Combobox
        className="rds-phone-input__country"
        aria-label="País"
        options={countryOptions}
        value={country.iso2}
        onValueChange={(iso2) => {
          if (iso2) setCountry(iso2 as CountryIso2);
        }}
        leadingIcon={<FlagImage iso2={country.iso2} size="18px" />}
        placeholder="País"
        emptyMessage="Nenhum país com esse nome."
        disabled={disabled}
      />
      {/* The dial code is the Input's prefix: it changes only through the country. */}
      <Input
        {...rest}
        className="rds-phone-input__number"
        id={inputId}
        ref={inputRef}
        label={labelText}
        prefix={`+${country.dialCode}`}
        type="tel"
        autoComplete="tel-national"
        value={inputValue}
        onChange={handlePhoneValueChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        hint={helper}
        errorMessage={error}
      />
      {name && <input type="hidden" name={name} value={displayValue} />}
    </div>
  );
}
