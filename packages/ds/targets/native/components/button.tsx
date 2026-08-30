import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
} from 'react-native';

import { useTheme } from './theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

// Recolore um ícone (lucide-react-native) pra herdar a cor do label do botão.
function tintIcon(icon: ReactNode, color: string): ReactNode {
  if (!isValidElement(icon)) return icon ?? null;
  const el = icon as ReactElement<{ color?: string; size?: number }>;
  return cloneElement(el, { color: el.props.color ?? color, size: el.props.size ?? 18 });
}

// Altura nativa: ≥48dp (Material/HIG) + hitSlop. Disabled = opacity 0.5 (sem line-through).
const HEIGHT: Record<ButtonSize, number> = { sm: 40, md: 48, lg: 56 };

type Props = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  fullWidth,
  leftIcon,
  rightIcon,
  ...rest
}: Props) {
  const t = useTheme();
  const isDisabled = disabled || loading;

  const skin = {
    primary: { bg: t['--brand-primary'], fg: t['--brand-on-primary'], border: undefined },
    secondary: { bg: t['--brand-secondary'], fg: t['--brand-on-secondary'], border: undefined },
    outline: { bg: t['--surface-default'], fg: t['--text-primary'], border: t['--border-default'] },
    ghost: { bg: 'transparent', fg: t['--text-primary'], border: undefined },
    danger: { bg: t['--danger'], fg: '#ffffff', border: undefined },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        {
          height: HEIGHT[size],
          backgroundColor: skin.bg,
          borderColor: skin.border,
          borderWidth: skin.border ? 1 : 0,
          opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={skin.fg} />
      ) : (
        <>
          {tintIcon(leftIcon, skin.fg)}
          <Text style={[styles.label, { color: skin.fg }]}>{label}</Text>
          {tintIcon(rightIcon, skin.fg)}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 20,
  },
  label: { fontSize: 16, fontWeight: '600' },
});
