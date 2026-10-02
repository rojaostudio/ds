import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, type TextInputProps, View } from 'react-native';
import { X } from 'lucide-react-native';

import { Text } from './text';
import { useTheme } from './theme';

// error aceita string (mensagem, uso standalone) OU boolean (estado injetado pelo
// FormField, que renderiza a mensagem). Assim o Input pluga no keystone sem duplicar.
type Props = TextInputProps & {
  label?: string;
  error?: string | boolean;
  /** Conteúdo dentro do campo, à esquerda (ícone ou texto, ex.: "R$"). */
  prefix?: ReactNode;
  /** Conteúdo dentro do campo, à direita (ícone ou texto). */
  suffix?: ReactNode;
  /** Mostra botão X que limpa o valor (via onChangeText('')) quando há texto. */
  clearable?: boolean;
};

// Tipos dos eventos derivados do próprio prop (resistente a mudanças de versão do RN).
type FocusArg = Parameters<NonNullable<TextInputProps['onFocus']>>[0];
type BlurArg = Parameters<NonNullable<TextInputProps['onBlur']>>[0];

export function Input({
  label,
  error,
  prefix,
  suffix,
  clearable,
  style,
  onFocus,
  onBlur,
  onChangeText,
  accessibilityLabel,
  ...rest
}: Props) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error
    ? t['--danger']
    : focused
      ? t['--border-focus']
      : t['--border-default'];

  function handleFocus(e: FocusArg) {
    setFocused(true);
    onFocus?.(e);
  }
  function handleBlur(e: BlurArg) {
    setFocused(false);
    onBlur?.(e);
  }

  const hasValue = typeof rest.value === 'string' ? rest.value.length > 0 : false;
  const showClear = !!clearable && hasValue && rest.editable !== false;

  return (
    <View style={{ gap: 6 }}>
      {label ? <Text variant="label">{label}</Text> : null}
      <View
        style={[
          styles.field,
          { borderColor, backgroundColor: t['--surface-default'] },
        ]}
      >
        {prefix ? <View style={styles.affix}>{renderAffix(prefix, t)}</View> : null}
        <TextInput
          placeholderTextColor={t['--text-placeholder']}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityState={{ disabled: rest.editable === false }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChangeText={onChangeText}
          style={[styles.input, { color: t['--text-primary'] }, style]}
          {...rest}
        />
        {showClear ? (
          <Pressable
            onPress={() => onChangeText?.('')}
            accessibilityRole="button"
            accessibilityLabel="Clear"
            hitSlop={8}
            style={styles.affix}
          >
            <X size={16} color={t['--text-muted']} />
          </Pressable>
        ) : null}
        {suffix ? <View style={styles.affix}>{renderAffix(suffix, t)}</View> : null}
      </View>
      {typeof error === 'string' && error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

// Affix string → Text tematizado; ReactNode (ícone) → renderiza direto.
function renderAffix(node: ReactNode, t: ReturnType<typeof useTheme>): ReactNode {
  if (typeof node === 'string') {
    return (
      <Text variant="body" style={{ color: t['--text-muted'] }}>
        {node}
      </Text>
    );
  }
  return node;
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 8,
  },
  input: { flex: 1, height: 46, fontSize: 16, padding: 0 },
  affix: { alignItems: 'center', justifyContent: 'center' },
});
