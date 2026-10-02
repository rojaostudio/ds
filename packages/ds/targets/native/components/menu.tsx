import type { ComponentType, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Sheet } from './sheet';
import { Text } from './text';
import { useTheme } from './theme';

type IconType = ComponentType<{ color?: string; size?: number }>;

// Menu de ações no RN = action sheet vindo de baixo (reusa o Sheet do DS).
// No mobile não há popover ancorado; ações longas em lista usam folha inferior.
export type MenuItem = {
  label: string;
  icon?: IconType;
  destructive?: boolean;
  onPress: () => void;
  disabled?: boolean;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  // Lista declarativa de ações OU children custom (MenuItem soltos).
  items?: MenuItem[];
  children?: ReactNode;
};

export function Menu({ visible, onClose, items, children }: Props) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View accessibilityRole="menu" style={styles.list}>
        {items
          ? items.map((item, i) => (
              <MenuItem
                key={`${item.label}-${i}`}
                {...item}
                onPress={() => {
                  onClose();
                  item.onPress();
                }}
              />
            ))
          : children}
      </View>
    </Sheet>
  );
}

export function MenuItem({ label, icon: Icon, destructive, onPress, disabled }: MenuItem) {
  const t = useTheme();
  const fg = destructive ? t['--danger-text'] : t['--text-primary'];

  return (
    <Pressable
      accessibilityRole="menuitem"
      accessibilityState={{ disabled: !!disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      hitSlop={8}
      android_ripple={{ color: t['--surface-raised'] }}
      style={({ pressed }) => [
        styles.item,
        {
          backgroundColor:
            pressed && !disabled ? t['--surface-raised'] : t['--surface-default'],
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {Icon ? (
        <View style={styles.icon} importantForAccessibility="no">
          <Icon color={fg} size={22} />
        </View>
      ) : null}
      <Text variant="label" numberOfLines={1} style={{ flex: 1, color: fg }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 12,
    paddingTop: 4,
    gap: 2,
  },
  item: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  icon: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
