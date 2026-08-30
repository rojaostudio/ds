'use client';

import { useState, useRef, useId, useMemo, type ChangeEvent, type ReactNode } from 'react';

/**
 * CurrencyInput — input com máscara right-to-left (estilo Nubank/Stripe).
 *
 * Cada dígito que o usuário digita vira um centavo. Backspace remove o último
 * dígito. Submete via hidden input em SUBUNITS (integer) — ex: 9900 = R$ 99,00.
 *
 * A máscara é dirigida por `onChange` (não por `onKeyDown`): a fonte da verdade é o
 * VALOR do input — extrai só os dígitos de `e.target.value` e reparseia como subunits.
 * Motivo: um input `readOnly` + `keydown`/preventDefault funcionava no desktop (teclado
 * físico dispara keydown), mas no MOBILE o teclado virtual NÃO abre num input readOnly —
 * o campo ficava morto no celular. Dirigir por onChange abre o teclado e funciona nos dois.
 *
 * Uso simples (passa ISO 4217 e o componente resolve tudo):
 *   <CurrencyInput name="price" currency="BRL" />
 *   <CurrencyInput name="price" currency="USD" />
 *   <CurrencyInput name="price" currency="JPY" />
 *
 * Uso avançado (controle total sobre symbol/decimals/locale):
 *   <CurrencyInput name="amount" symbol="₿" decimals={8} locale="en-US" maxDigits={16} />
 */

// Locale preferido por moeda — usado quando `currency` é passada sem `locale`.
// Fallback final = 'en' (Intl resolve symbol via ISO 4217).
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
  /** Label renderada acima do controle (mesmo padrão do Input do DS). */
  label?:                ReactNode;
  /** Nome do hidden input pra submission (server actions, forms). */
  name:                  string;
  /** ISO 4217 — 'BRL', 'USD', 'JPY', etc. Quando passada, resolve symbol/decimals/locale automaticamente. */
  currency?:             string;
  /** Símbolo da moeda exibido à esquerda (R$, $, €, ₿). Obrigatório se `currency` não for passada. */
  symbol?:               string;
  /** Casas decimais. BRL/USD = 2, JPY = 0, BTC = 8. Obrigatório se `currency` não for passada. */
  decimals?:             number;
  /** Locale pra formatação. Default depende de `currency` (BRL→pt-BR etc) ou 'en'. */
  locale?:               string;
  /** Valor inicial em SUBUNITS (integer). Ex: 9900 = R$99,00. */
  defaultValueSubunits?: number | null;
  placeholder?:          string;
  disabled?:             boolean;
  /** Callback com valor atual em subunits a cada mudança. */
  onChange?:             (subunits: number) => void;
  /** Máximo de dígitos. default = 10 → R$ 99.999.999,99. */
  maxDigits?:            number;
  /** Mostrar "0,00" em vez do placeholder quando valor é zero. default = false. */
  showZero?:             boolean;
  size?:                 'sm' | 'md' | 'lg';
  className?:            string;
}

const SIZE_INPUT = {
  sm: 'h-control-sm text-caption pl-7  pr-3',
  md: 'h-control-md text-label pl-9  pr-3',
  lg: 'h-control-lg text-body pl-10 pr-3',
} as const;

const SIZE_SYMBOL = {
  sm: 'left-2.5 text-caption',
  md: 'left-3   text-label',
  lg: 'left-3.5 text-body',
} as const;

function formatSubunits(subunits: number, decimals: number, locale: string): string {
  const divisor = Math.pow(10, decimals);
  const decimal = subunits / divisor;
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(decimal);
}

export function CurrencyInput({
  label,
  name,
  currency,
  symbol: symbolProp,
  decimals: decimalsProp,
  locale: localeProp,
  defaultValueSubunits,
  placeholder,
  disabled,
  onChange,
  maxDigits = 10,
  showZero = false,
  size = 'md',
  className = '',
}: CurrencyInputProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [subunits, setSubunits] = useState<number>(defaultValueSubunits ?? 0);

  const { symbol, decimals, locale } = useMemo(() => {
    if (currency) {
      const resolved = resolveCurrency(currency, localeProp);
      return {
        symbol: symbolProp ?? resolved.symbol,
        decimals: decimalsProp ?? resolved.decimals,
        locale: resolved.locale,
      };
    }
    return {
      symbol: symbolProp ?? '$',
      decimals: decimalsProp ?? 2,
      locale: localeProp ?? 'en-US',
    };
  }, [currency, symbolProp, decimalsProp, localeProp]);

  function update(next: number) {
    setSubunits(next);
    onChange?.(next);
  }

  // Máscara right-to-left dirigida pelo VALOR: extrai os dígitos do que está no input e
  // reparseia como subunits. Cobre digitar (append), backspace/delete (remove dígito), colar
  // ("R$ 50,00" → 5000) e selecionar-tudo-e-redigitar — tudo via o value, sem interceptar tecla.
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    if (disabled) return;
    const digits = e.target.value.replace(/\D/g, '').slice(0, maxDigits); // trava no maxDigits
    update(digits === '' ? 0 : parseInt(digits, 10));
  }

  const isEmpty = subunits === 0 && !showZero;
  const displayValue = isEmpty ? '' : formatSubunits(subunits, decimals, locale);
  const placeholderText = placeholder ?? formatSubunits(0, decimals, locale);

  // Sem label, className segue no elemento de hoje (retrocompatível); com label,
  // o className (largura etc.) migra pro wrapper externo e o controle fica full-width.
  const control = (
    <div className={['relative flex items-center', label ? '' : className].join(' ')}>
      <span
        className={[
          'absolute select-none pointer-events-none',
          SIZE_SYMBOL[size],
          disabled ? 'text-fg-disabled' : 'text-fg-muted',
        ].join(' ')}
      >
        {symbol}
      </span>

      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        value={displayValue}
        placeholder={placeholderText}
        onChange={handleChange}
        disabled={disabled}
        className={[
          'w-full rounded-(--radius-control) border border-stroke-control bg-surface-default',
          'placeholder:text-fg-placeholder',
          'focus:outline-none focus:border-stroke-focus focus:ring-2 focus:ring-stroke-focus/20',
          'transition-colors',
          SIZE_INPUT[size],
          disabled
            ? 'bg-surface-raised text-fg-disabled cursor-not-allowed'
            : 'text-fg-primary cursor-text',
        ].join(' ')}
      />

      {/* Hidden input submete subunits ao server */}
      <input type="hidden" name={name} value={subunits} />
    </div>
  );

  if (!label) return control;

  return (
    <div className={['flex flex-col gap-1.5', className].join(' ')}>
      <label htmlFor={id} className="text-label font-medium text-fg-primary">{label}</label>
      {control}
    </div>
  );
}
