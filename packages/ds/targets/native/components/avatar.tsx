import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { useTheme } from './theme';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'active' | 'inactive' | 'pending' | 'error';

export interface AvatarProps {
  /** Nome completo — gera iniciais (até 2 letras) quando não há `src`. */
  name?: string;
  src?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  /** Cor de fundo. default = brand. */
  variant?: 'brand' | 'neutral';
}

// Diâmetro do círculo + tamanho da fonte das iniciais por size.
const DIMENSION: Record<AvatarSize, { box: number; font: number }> = {
  xs: { box: 24, font: 10 },
  sm: { box: 32, font: 12 },
  md: { box: 40, font: 14 },
  lg: { box: 48, font: 16 },
  xl: { box: 64, font: 20 },
};

const DOT_SIZE: Record<AvatarSize, number> = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
};

// Mapa de status → token. pending usa --warning (com fallback ao accent, que existe
// em ambos os schemes), os demais existem em light e dark.
const STATUS_TOKEN: Record<AvatarStatus, string> = {
  active: '--success',
  inactive: '--text-muted',
  pending: '--warning',
  error: '--danger',
};

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  // Nome de uma palavra só: usa as duas primeiras letras — avatar sempre com 2 chars.
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function Avatar({ name, src, size = 'md', status, variant = 'brand' }: AvatarProps) {
  const t = useTheme();
  const { box, font } = DIMENSION[size];
  const label = name ?? 'Avatar';
  const showImage = !!src;

  const bg = variant === 'brand' ? t['--brand-primary'] : t['--surface-raised'];
  const fg = variant === 'brand' ? t['--brand-on-primary'] : t['--text-muted'];

  return (
    <View style={styles.wrap} accessibilityRole="image" accessibilityLabel={label}>
      <View
        style={[
          styles.circle,
          { width: box, height: box, borderRadius: box / 2, backgroundColor: showImage ? undefined : bg },
        ]}
      >
        {showImage ? (
          <Image source={{ uri: src }} style={{ width: box, height: box }} resizeMode="cover" />
        ) : (
          <Text style={{ color: fg, fontSize: font, fontWeight: '600' }} numberOfLines={1}>
            {initials(name ?? '?')}
          </Text>
        )}
      </View>
      {status ? (
        <View
          accessibilityLabel={`status: ${status}`}
          style={[
            styles.dot,
            {
              width: DOT_SIZE[size],
              height: DOT_SIZE[size],
              borderRadius: DOT_SIZE[size] / 2,
              backgroundColor: t[STATUS_TOKEN[status]] ?? t['--brand-accent'] ?? t['--icon-default'],
              borderColor: t['--surface-default'],
            },
          ]}
        />
      ) : null}
    </View>
  );
}

// ── AvatarGroup ─────────────────────────────────────────────────────────────

export interface AvatarGroupProps {
  /** Máximo de avatares visíveis; o resto vira `+N`. default = 3. */
  max?: number;
  size?: AvatarSize;
  children: ReactNode;
}

export function AvatarGroup({ max = 3, size = 'md', children }: AvatarGroupProps) {
  const items = Children.toArray(children).filter(isValidElement) as ReactElement<AvatarProps>[];
  const visible = items.slice(0, max);
  const overflow = items.length - visible.length;
  // Overlap negativo proporcional ao tamanho do avatar.
  const overlap = -Math.round(DIMENSION[size].box * 0.3);

  return (
    <View style={styles.group} accessibilityRole="none">
      {visible.map((child, idx) => (
        <View key={idx} style={idx === 0 ? undefined : { marginLeft: overlap }}>
          <Avatar {...child.props} size={child.props.size ?? size} />
        </View>
      ))}
      {overflow > 0 ? (
        <View style={{ marginLeft: overlap }}>
          <Avatar name={`+${overflow}`} variant="neutral" size={size} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', alignSelf: 'flex-start' },
  circle: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  dot: { position: 'absolute', bottom: 0, right: 0, borderWidth: 2 },
  group: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
});
