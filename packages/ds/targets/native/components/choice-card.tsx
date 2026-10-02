import { Pressable, View } from 'react-native';

import { Text } from './text';
import { useTheme } from './theme';

// Cartão de escolha (radio) — método de pagamento, opções, etc. Toque ≥56dp.
type Props = {
  label: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
};

export function ChoiceCard({ label, description, selected, onSelect }: Props) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={{
        minHeight: 56,
        borderRadius: 12,
        borderWidth: 1.5,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        borderColor: selected ? t['--brand-primary'] : t['--border-default'],
        backgroundColor: selected ? t['--surface-raised'] : t['--surface-default'],
      }}
    >
      <View style={{ flex: 1 }}>
        <Text variant="label">{label}</Text>
        {description ? (
          <Text variant="caption" color="muted">
            {description}
          </Text>
        ) : null}
      </View>
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          alignItems: 'center',
          justifyContent: 'center',
          borderColor: selected ? t['--brand-primary'] : t['--border-strong'],
        }}
      >
        {selected ? (
          <View
            style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t['--brand-primary'] }}
          />
        ) : null}
      </View>
    </Pressable>
  );
}
