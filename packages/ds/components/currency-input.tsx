'use client';

import { useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import { Input } from './input';

// The locale each currency formats in when `currency` comes without `locale`. Fallback: 'en' (Intl resolves the
// symbol from ISO 4217).
const CURRENCY_LOCALE: Record<string, string> = {
  BRL: 'pt-BR', USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB',
  JPY: 'ja-JP', CNY: 'zh-CN', KRW: 'ko-KR', INR: 'en-IN',
  MXN: 'es-MX', COP: 'es-CO', ARS: 'es-AR', CLP: 'es-CL',
  PEN: 'es-PE', UYU: 'es-UY', CAD: 'en-CA', AUD: 'en-AU',
  CHF: 'de-CH', SGD: 'en-SG', HKD: 'zh-HK', TWD: 'zh-TW',
};

function resolveCurrency(currency: string, explicitLocale?: string): { symbol: string; decimals: number; locale: string } {
  const locale = explicitLocale ?? CURRENCY_LOCALE[currency] ?? 'en';
  try {
    const fmt = new Intl.NumberFormat(locale, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' });
    const decimals = fmt.resolvedOptions().maximumFractionDigits ?? 2;
    const symbol = fmt.formatToParts(0).find((p) => p.type === 'currency')?.value ?? currency;
    return { symbol, decimals, locale };
  } catch {
    return { symbol: currency, decimals: 2, locale };
  }
}

export interface CurrencyInputProps {
  /** The field's label (the Input's). Without it, pass aria-label. */
  label?: ReactNode;
  'aria-label'?: string;
  /** The name of the hidden input that submits the value, in subunits (an integer: 9900 is R$ 99,00). */
  name: string;
  /** ISO 4217 ('BRL', 'USD', 'JPY'): resolves the symbol, the decimals and the locale. */
  currency?: string;
  /** The symbol before the value (R$, $, €, ₿), the Input's prefix. Needed without `currency`. */
  symbol?: string;
  /** Decimal places: BRL and USD 2, JPY 0, BTC 8. Needed without `currency`. */
  decimals?: number;
  /** The locale the value is formatted in. Default: the currency's (BRL → pt-BR), or 'en-US'. */
  locale?: string;
  /** The starting value in subunits. */
  defaultValueSubunits?: number | null;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  /** A line under the field (the Input's hint). */
  hint?: ReactNode;
  /** What is wrong with the value (the Input's error). */
  errorMessage?: ReactNode;
  /** Called with the value in subunits on every change. */
  onChange?: (subunits: number) => void;
  /** The most digits it takes. Default 10 (R$ 99.999.999,99). */
  maxDigits?: number;
  /** Shows 0,00 instead of the placeholder when the value is zero. */
  showZero?: boolean;
  id?: string;
  className?: string;
}

function formatSubunits(subunits: number, decimals: number, locale: string): string {
  const divisor = Math.pow(10, decimals);
  const decimal = subunits / divisor;
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(decimal);
}

/**
 * CurrencyInput — a composition of the Input (Figma [RDS] Forms/Input) with the currency symbol as its prefix and a
 * right-to-left mask: each digit typed becomes a cent, Backspace takes the last one off, pasting "R$ 50,00" gives
 * 5000. The mask follows the input's value (onChange), not the keys, so the phone's keyboard opens and works. The
 * value goes with the form in subunits, through a hidden input named `name`.
 */
export function CurrencyInput({
  label,
  'aria-label': ariaLabel,
  name,
  currency,
  symbol: symbolProp,
  decimals: decimalsProp,
  locale: localeProp,
  defaultValueSubunits,
  placeholder,
  disabled,
  required,
  hint,
  errorMessage,
  onChange,
  maxDigits = 10,
  showZero = false,
  id,
  className,
}: CurrencyInputProps) {
  const [subunits, setSubunits] = useState<number>(defaultValueSubunits ?? 0);

  const { symbol, decimals, locale } = useMemo(() => {
    if (currency) {
      const resolved = resolveCurrency(currency, localeProp);
      return { symbol: symbolProp ?? resolved.symbol, decimals: decimalsProp ?? resolved.decimals, locale: resolved.locale };
    }
    return { symbol: symbolProp ?? '$', decimals: decimalsProp ?? 2, locale: localeProp ?? 'en-US' };
  }, [currency, symbolProp, decimalsProp, localeProp]);

  // The digits of whatever is in the field, read as subunits: typing, deleting, pasting and retyping all go
  // through the value, with no key intercepted.
  function change(event: ChangeEvent<HTMLInputElement>) {
    if (disabled) return;
    const digits = event.target.value.replace(/\D/g, '').slice(0, maxDigits);
    const next = digits === '' ? 0 : parseInt(digits, 10);
    setSubunits(next);
    onChange?.(next);
  }

  const empty = subunits === 0 && !showZero;
  return (
    <>
      <Input
        id={id}
        label={label}
        aria-label={ariaLabel}
        prefix={symbol}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={empty ? '' : formatSubunits(subunits, decimals, locale)}
        placeholder={placeholder ?? formatSubunits(0, decimals, locale)}
        onChange={change}
        disabled={disabled}
        required={required}
        hint={hint}
        errorMessage={errorMessage}
        className={['rds-currency-input', className].filter(Boolean).join(' ')}
      />
      <input type="hidden" name={name} value={subunits} />
    </>
  );
}
