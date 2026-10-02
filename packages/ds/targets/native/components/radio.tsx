import { Children, isValidElement, cloneElement, type ReactElement, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './text';
import { useTheme } from './theme';

// Native target do Radio web. Círculo com borda; selecionado = dot brand-primary.
// Estado ativo NUNCA usa --brand-secondary (em light é branco/invisível).
// Disabled via opacity 0.5. RadioGroup controla a seleção e injeta selected/onSelect.
type RadioProps = {
  label?: string;
  value: string;
  selected?: boolean;
  onSelect?: (value: string) => void;
  disabled?: boolean;
};

export function Radio({ label, value, selected = false, onSelect, disabled }: RadioProps) {
  const t = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled: !!disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      hitSlop={8}
      onPress={() => onSelect?.(value)}
      style={[styles.row, { opacity: disabled ? 0.5 : 1 }]}
    >
      <View
        style={[
          styles.ring,
          { borderColor: selected ? t['--brand-primary'] : t['--border-strong'] },
        ]}
      >
        {selected ? (
          <View style={[styles.dot, { backgroundColor: t['--brand-primary'] }]} />
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

// ── RadioGroup ──────────────────────────────────────────────────────────────
// Controla o estado: injeta selected/onSelect em cada <Radio> filho via value.
type RadioGroupProps = {
  value: string | null;
  onChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
};

export function RadioGroup({ value, onChange, children, disabled }: RadioGroupProps) {
  return (
    <View accessibilityRole="radiogroup" style={styles.group}>
      {Children.map(children, (child) => {
        if (!isValidElement(child)) return child;
        const el = child as ReactElement<RadioProps>;
        return cloneElement(el, {
          selected: el.props.value === value,
          onSelect: onChange,
          disabled: el.props.disabled ?? disabled,
        });
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
  },
  ring: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
