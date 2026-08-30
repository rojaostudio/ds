import { StyleSheet, View } from 'react-native';

import { Text } from './text';
import { useTheme } from './theme';

export type BadgeTone = 'neutral' | 'brand' | 'danger' | 'success' | 'warning' | 'info';

const BG: Record<BadgeTone, string> = {
  neutral: '--neutral-soft',
  brand: '--brand-secondary',
  danger: '--danger-soft',
  success: '--success-soft',
  warning: '--warning-soft',
  info: '--info-soft',
};
const FG: Record<BadgeTone, string> = {
  neutral: '--neutral-text',
  brand: '--brand-on-secondary',
  danger: '--danger-text',
  success: '--success-text',
  warning: '--warning-text',
  info: '--info-text',
};

// Cor sólida da bolinha (dot). Estado/destaque = --brand-primary, nunca secondary.
const DOT_BG: Record<BadgeTone, string> = {
  neutral: '--neutral',
  brand: '--brand-primary',
  danger: '--danger',
  success: '--success',
  warning: '--warning',
  info: '--info',
};

type CommonProps = {
  tone?: BadgeTone;
};

type LabelProps = CommonProps & {
  dot?: false;
  count?: undefined;
  children: string;
};

// Dot puro: bolinha sem texto (notification indicator).
type DotProps = CommonProps & {
  dot: true;
  count?: undefined;
  children?: undefined;
};

// Count: número com overflow ("max+"). Acima de `max` mostra "max+".
type CountProps = CommonProps & {
  dot?: false;
  count: number;
  /** Limite pra count overflow. default = 99. */
  max?: number;
  children?: undefined;
};

export type BadgeProps = LabelProps | DotProps | CountProps;

export function Badge(props: BadgeProps) {
  const t = useTheme();
  const tone = props.tone ?? 'neutral';

  // Dot puro (sem texto)
  if (props.dot) {
    return <View style={[styles.dot, { backgroundColor: t[DOT_BG[tone]] }]} accessibilityRole="image" />;
  }

  // Count badge (numérico, com overflow). Some quando <= 0.
  if (props.count !== undefined) {
    if (props.count <= 0) return null;
    const max = props.max ?? 99;
    const display = props.count > max ? `${max}+` : String(props.count);
    return (
      <View style={[styles.count, { backgroundColor: t['--brand-primary'] }]}>
        <Text variant="caption" style={{ color: t['--brand-on-primary'], fontWeight: '500' }}>
          {display}
        </Text>
      </View>
    );
  }

  // Label badge (default)
  return (
    <View style={[styles.badge, { backgroundColor: t[BG[tone]] }]}>
      <Text variant="caption" style={{ color: t[FG[tone]], fontWeight: '500' }}>
        {props.children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  dot: { alignSelf: 'flex-start', width: 10, height: 10, borderRadius: 999 },
  count: {
    alignSelf: 'flex-start',
    minWidth: 20,
    height: 20,
    borderRadius: 999,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
