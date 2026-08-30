'use client';

import { useId, useMemo, useState, type InputHTMLAttributes } from 'react';
import { usePhoneInput, defaultCountries, parseCountry, FlagImage, type CountryIso2 } from 'react-international-phone';
import { Combobox } from './combobox';

export interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'defaultValue' | 'size'> {
  label?:        string;
  helper?:       string;
  error?:        string;
  required?:     boolean;
  optional?:     boolean;
  value?:        string;
  defaultValue?: string;
  onChange?:     (value: string) => void;
}

function normalizeToE164(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+')) return raw;
  if (digits.length >= 12) return `+${digits}`;
  return `+55${digits}`;
}

/**
 * PhoneInput — telefone internacional com seletor de país BUSCÁVEL.
 *
 * Seletor de país = Combobox do DS (busca por nome/código + bandeira), em vez do
 * dropdown nativo do react-international-phone (que não tem busca e estourava a tela).
 * A mecânica de máscara/parse/E.164 vem do hook `usePhoneInput` da lib.
 * Submete E.164 via input hidden (prop `name`); onChange entrega E.164.
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

  // Lista de países como opções do Combobox: bandeira (icon) + nome (label, buscável) + +código.
  const countryOptions = useMemo(
    () => defaultCountries.map((c) => {
      const p = parseCountry(c);
      return {
        value: p.iso2,
        label: p.name,
        description: `+${p.dialCode}`,
        icon: <FlagImage iso2={p.iso2} size="18px" />,
      };
    }),
    [],
  );

  const errorBorder = error
    ? 'border-danger focus-within:border-danger focus-within:ring-2 focus-within:ring-danger/20'
    : 'border-stroke-control focus-within:border-stroke-focus focus-within:ring-2 focus-within:ring-stroke-focus/20';

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="inline-flex items-center gap-1 text-label font-medium text-fg-primary">
          <span>{label}</span>
          {required && <span className="text-danger" aria-label="obrigatório">*</span>}
          {optional && !required && <span className="text-fg-muted font-normal">(opcional)</span>}
        </label>
      )}
      <div className="flex items-stretch gap-2">
        <div className="shrink-0">
          <Combobox
            width="hug"
            options={countryOptions}
            value={country.iso2}
            onChange={(iso2) => { if (iso2) setCountry(iso2 as CountryIso2); }}
            placeholder="País"
            aria-label="País"
            dropdownMinWidth={272}
            // Trigger compacto: só a bandeira (+ chevron do Combobox). O nome do país
            // fica na lista/busca do dropdown, não ocupando espaço no campo fechado.
            triggerContent={(sel) => (
              <span className="inline-flex items-center [&_svg]:size-4 [&_img]:rounded-(--radius-sm)">
                {sel?.icon ?? <span className="text-fg-placeholder">País</span>}
              </span>
            )}
          />
        </div>
        <div className={['flex-1 min-w-0 flex items-center rounded-(--radius-control) border bg-surface-default h-10 transition-colors', errorBorder].join(' ')}>
          {/* Prefixo do país — informativo, não editável */}
          <span className="pl-3 pr-1.5 text-label text-fg-muted select-none shrink-0" aria-hidden>
            +{country.dialCode}
          </span>
          <input
            id={inputId}
            ref={inputRef}
            type="tel"
            value={inputValue}
            onChange={handlePhoneValueChange}
            placeholder={placeholder}
            aria-invalid={error ? true : undefined}
            className="flex-1 min-w-0 bg-transparent pr-3 h-full text-label text-fg-primary placeholder:text-fg-placeholder outline-none"
          />
        </div>
      </div>
      {name && <input type="hidden" name={name} value={displayValue} />}
      {(error || helper) && (
        <p className={['text-caption', error ? 'text-danger-text' : 'text-fg-muted'].join(' ')}>
          {error ?? helper}
        </p>
      )}
    </div>
  );
}
