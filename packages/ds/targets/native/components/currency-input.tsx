import { useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { Text } from './text';
import { useTheme } from './theme';

// Native target do CurrencyInput web. Valor SEMPRE em centavos/subunits (number).
// Padrão acumulador: o usuário digita dígitos, cada um vira subunit (125 → R$ 1,25).
type Props = Omit<TextInputProps, 'value' | 'onChangeText' | 'keyboardType'> & {
  value: number;
  onChangeValueCents: (cents: number) => void;
  label?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
  error?: boolean;
  /** Símbolo da moeda à esquerda. default = 'R$'. */
  currency?: string;
  /** Casas decimais. default = 2 (BRL/USD). JPY = 0, BTC = 8. */
  decimals?: number;
  /** Separador decimal. default = ','. */
  decimalSeparator?: string;
  /** Separador de milhar. default = '.'. */
  thousandSeparator?: string;
};

// Formatação parametrizável. Default BR: ponto como milhar, vírgula como decimal.
// Ex.: 123456789 subunits, decimals=2 → "1.234.567,89".
function formatAmount(
  subunits: number,
  decimals: number,
  decimalSeparator: string,
  thousandSeparator: string,
): string {
  const divisor = Math.pow(10, decimals);
  const fixed = (subunits / divisor).toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
  return decimals > 0 ? `${grouped}${decimalSeparator}${decPart}` : grouped;
}

export function CurrencyInput({
  value,
  onChangeValueCents,
  label,
  accessibilityLabel,
  disabled,
  error,
  currency = 'R$',
  decimals = 2,
  decimalSeparator = ',',
  thousandSeparator = '.',
  style,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  const display = formatAmount(value, decimals, decimalSeparator, thousandSeparator);
  const borderColor = error
    ? t['--danger']
    : focused
      ? t['--border-focus']
      : t['--border-default'];

  function handle(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 12);
    onChangeValueCents(digits ? parseInt(digits, 10) : 0);
  }

  return (
    <View
      style={[
        styles.wrap,
        {
          borderColor,
          backgroundColor: disabled ? t['--surface-raised'] : t['--surface-default'],
          opacity: disabled ? 0.5 : 1,
        },
        style as object,
      ]}
    >
      <Text variant="body" color="muted" style={{ marginRight: 6 }}>
        {currency}
      </Text>
      <TextInput
        value={display}
        onChangeText={handle}
        keyboardType="number-pad"
        editable={!disabled}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: !!disabled }}
        selectTextOnFocus
        placeholderTextColor={t['--text-placeholder']}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[styles.input, { color: disabled ? t['--text-disabled'] : t['--text-primary'] }]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: { flex: 1, fontSize: 16, padding: 0 },
});
