import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { X } from 'lucide-react-native';

import { Text } from './text';
import { useTheme } from './theme';

// Native target do Chip web — pill interativo.
//   <Chip label="Ação" onPress={fn} />                       — assist padrão
//   <Chip label="Discreta" subtle onPress={fn} />            — assist sutil
//   <Chip label="tag" onRemove={fn} />                       — input (botão X)
//   <Chip label="tag ativa" selected onRemove={fn} />        — input selecionado
type Props = {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  onRemove?: () => void;
  /** Leading slot — ícone (lucide-react-native) ou qualquer nó. */
  leadingIcon?: ReactNode;
  /** Sem borda, fundo discreto (surface-raised). */
  subtle?: boolean;
  disabled?: boolean;
};

export function Chip({
  label,
  onPress,
  selected = false,
  onRemove,
  leadingIcon,
  subtle = false,
  disabled = false,
}: Props) {
  const t = useTheme();

  const bg = selected
    ? t['--brand-primary']
    : subtle
      ? t['--surface-raised']
      : t['--surface-default'];
  const fg = selected ? t['--brand-on-primary'] : t['--text-primary'];
  const border = selected
    ? t['--brand-primary']
    : subtle
      ? 'transparent'
      : t['--border-default'];

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled || !onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled: !!disabled }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: bg,
          borderColor: border,
          opacity: disabled ? 0.5 : pressed && onPress ? 0.85 : 1,
        },
      ]}
    >
      {leadingIcon != null && <View style={styles.leading}>{leadingIcon}</View>}
      <Text variant="caption" style={[styles.label, { color: fg }]}>
        {label}
      </Text>
      {onRemove && (
        <Pressable
          onPress={disabled ? undefined : onRemove}
          disabled={disabled}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Remove"
          style={styles.remove}
        >
          <X size={14} color={fg} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  leading: {
    marginLeft: -2,
  },
  label: {
    fontWeight: '500',
  },
  remove: {
    marginRight: -4,
    marginLeft: 2,
  },
});
