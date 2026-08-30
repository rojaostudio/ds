import { Pressable, Switch as RNSwitch, View } from 'react-native';

import { Text } from './text';
import { useTheme } from './theme';

// Native target do Toggle web. Wrapper do Switch RN com cores do tema.
export function Switch({
  value,
  onValueChange,
  disabled,
  accessibilityLabel,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const t = useTheme();
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      trackColor={{ false: t['--border-strong'], true: t['--brand-primary'] }}
      thumbColor={t['--surface-default']}
    />
  );
}

// Abas dentro de uma tela. Absorve o MethodPills ad-hoc do PDV.
type Segment<T extends string> = { label: string; value: T };

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  disabled,
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 6, opacity: disabled ? 0.5 : 1 }}>
      {segments.map((s) => {
        const sel = s.value === value;
        return (
          <Pressable
            key={s.value}
            onPress={() => onChange(s.value)}
            disabled={disabled}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={s.label}
            accessibilityState={{ selected: sel, disabled: !!disabled }}
            style={{
              flex: 1,
              minHeight: 48,
              borderRadius: 8,
              borderWidth: 1,
              alignItems: 'center',
              justifyContent: 'center',
              borderColor: sel ? t['--brand-primary'] : t['--border-default'],
              backgroundColor: sel ? t['--brand-primary'] : t['--surface-default'],
            }}
          >
            <Text
              variant="label"
              style={{ color: sel ? t['--brand-on-primary'] : t['--text-primary'] }}
            >
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
