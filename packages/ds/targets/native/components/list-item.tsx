import { ChevronRight } from 'lucide-react-native';
import type { ComponentType, ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from './text';
import { useTheme } from './theme';

type IconType = ComponentType<{ color?: string; size?: number }>;

// Molécula de linha de lista — usada em TODA lista CRUD (produtos, clientes,
// fornecedores, despesas…). leading (ícone) + título + subtítulo + trailing.
type Props = {
  title: string;
  subtitle?: string;
  icon?: IconType;
  // Generic leading slot (avatar, image, custom node). Takes precedence over `icon`.
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  disabled?: boolean;
};

export function ListItem({
  title,
  subtitle,
  icon: Icon,
  leading,
  trailing,
  onPress,
  showChevron,
  disabled,
}: Props) {
  const t = useTheme();
  const body = (
    <View
      style={{
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: t['--border-subtle'],
        backgroundColor: t['--surface-default'],
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {leading ? (
        leading
      ) : Icon ? (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: t['--surface-raised'],
          }}
        >
          <Icon color={t['--icon-default']} size={22} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text variant="label" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {showChevron && onPress ? (
        <View importantForAccessibility="no">
          <ChevronRight color={t['--text-muted']} size={20} />
        </View>
      ) : null}
    </View>
  );

  return onPress ? (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      hitSlop={8}
      android_ripple={{ color: t['--surface-raised'] }}
      style={({ pressed }) => [
        pressed && !disabled ? { backgroundColor: t['--surface-raised'], borderRadius: 12 } : null,
      ]}
    >
      {body}
    </Pressable>
  ) : (
    body
  );
}
