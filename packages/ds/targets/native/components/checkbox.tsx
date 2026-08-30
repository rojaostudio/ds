import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './text';
import { useTheme } from './theme';

// Native target do Checkbox web. Quadrado com borda; checked = fundo brand-primary
// + ícone Check on-primary; indeterminate = traço. Estado ativo NUNCA usa
// --brand-secondary (em light é branco/invisível). Disabled via opacity 0.5.
type Props = {
  label?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  indeterminate?: boolean;
};

export function Checkbox({ label, checked, onChange, disabled, indeterminate }: Props) {
  const t = useTheme();
  const active = checked || indeterminate;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: indeterminate ? 'mixed' : checked, disabled: !!disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      hitSlop={8}
      onPress={() => onChange(!checked)}
      style={[styles.row, { opacity: disabled ? 0.5 : 1 }]}
    >
      <View
        style={[
          styles.box,
          {
            borderColor: active ? t['--brand-primary'] : t['--border-strong'],
            backgroundColor: active ? t['--brand-primary'] : 'transparent',
          },
        ]}
      >
        {indeterminate ? (
          <View style={[styles.dash, { backgroundColor: t['--brand-on-primary'] }]} />
        ) : checked ? (
          <Check size={14} color={t['--brand-on-primary']} strokeWidth={3} />
        ) : null}
      </View>
      {label ? (
        <Text variant="body" style={{ color: t['--text-primary'] }}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dash: {
    width: 10,
    height: 2,
    borderRadius: 1,
  },
});
