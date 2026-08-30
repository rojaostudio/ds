import { Pressable, View } from 'react-native';

import { Text } from './text';
import { useTheme } from './theme';

// Promovido do PDV pro DS. Átomo de quantidade (+/−). hitSlop garante alvo ≥48dp.
export function Stepper({
  value,
  onChange,
  min = 0,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const t = useTheme();
  const btn = {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: t['--border-default'],
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Pressable onPress={() => onChange(Math.max(min, value - 1))} hitSlop={8} style={btn}>
        <Text variant="label">−</Text>
      </Pressable>
      <Text variant="label" style={{ minWidth: 24, textAlign: 'center' }}>
        {value}
      </Text>
      <Pressable
        onPress={() => onChange(max != null ? Math.min(max, value + 1) : value + 1)}
        hitSlop={8}
        style={btn}
      >
        <Text variant="label">+</Text>
      </Pressable>
    </View>
  );
}
