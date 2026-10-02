import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { type ReactNode } from 'react';

import { useTheme } from './theme';

export type IconButtonVariant = 'filled' | 'outline' | 'ghost';
export type IconButtonColor = 'primary' | 'neutral' | 'danger';
export type IconButtonSize = 'sm' | 'md' | 'lg';

// Alvo de toque ≥44dp (HIG). hitSlop complementa quando o box visual é menor.
const BOX: Record<IconButtonSize, number> = { sm: 36, md: 44, lg: 52 };

type Props = Omit<PressableProps, 'children' | 'style'> & {
  icon: ReactNode;
  accessibilityLabel: string;
  variant?: IconButtonVariant;
  color?: IconButtonColor;
  size?: IconButtonSize;
  loading?: boolean;
};

export function IconButton({
  icon,
  accessibilityLabel,
  variant = 'ghost',
  color = 'neutral',
  size = 'md',
  loading = false,
  disabled,
  ...rest
}: Props) {
  const t = useTheme();
  const isDisabled = disabled || loading;

  // Cor "de tinta" do botão por intent. Estado ativo/destaque = brand-primary.
  const ink = {
    primary: t['--brand-primary'],
    neutral: t['--icon-default'],
    danger: t['--danger'],
  }[color];
  const onInk = {
    primary: t['--brand-on-primary'],
    neutral: t['--text-primary'],
    danger: t['--brand-on-primary'],
  }[color];

  const skin: { bg: string; border?: string; fg: string } = {
    filled: { bg: ink, fg: onInk },
    outline: { bg: t['--surface-default'], border: ink, fg: ink },
    ghost: { bg: 'transparent', fg: ink },
  }[variant];

  const box = BOX[size];
  const hit = Math.max(0, Math.round((44 - box) / 2)) + 4;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      hitSlop={hit}
      style={({ pressed }): ViewStyle => ({
        ...styles.base,
        width: box,
        height: box,
        backgroundColor: skin.bg,
        borderColor: skin.border,
        borderWidth: skin.border ? 1 : 0,
        opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1,
      })}
      {...rest}
    >
      {loading ? <ActivityIndicator color={skin.fg} /> : <View>{icon}</View>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
});
