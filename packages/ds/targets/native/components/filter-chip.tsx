import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './text';
import { useTheme } from './theme';

// Native target do FilterChip web — toggle de filtro (pill).
// active = preenchido brand-primary; inativo = surface + borda default.
type FilterChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
};

export function FilterChip({ label, active, onPress, disabled = false }: FilterChipProps) {
  const t = useTheme();

  const bg = active ? t['--brand-primary'] : t['--surface-default'];
  const fg = active ? t['--brand-on-primary'] : t['--text-primary'];
  const border = active ? t['--brand-primary'] : t['--border-default'];

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active, disabled: !!disabled }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: bg,
          borderColor: border,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text variant="caption" style={[styles.label, { color: fg }]}>
        {label}
      </Text>
    </Pressable>
  );
}

// FilterChipGroup — barra de filtro controlada. Seleção única.
type FilterChipItem<T extends string> = { label: string; value: T };

type FilterChipGroupProps<T extends string> = {
  items: FilterChipItem<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
};

export function FilterChipGroup<T extends string>({
  items,
  value,
  onChange,
  disabled = false,
}: FilterChipGroupProps<T>) {
  return (
    <View style={styles.group}>
      {items.map((item) => (
        <FilterChip
          key={item.value}
          label={item.label}
          active={item.value === value}
          onPress={() => onChange(item.value)}
          disabled={disabled}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '500',
  },
  group: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
