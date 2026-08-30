import type { ReactNode } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './text';
import { useTheme } from './theme';

export type AlertVariant = 'success' | 'danger' | 'warning' | 'info';

type IconComponent = typeof Info;

// Por variant: tokens de fundo (-soft), borda (-border) e texto/ícone (-text).
// Fallbacks defensivos: o tema light atual não emite --warning* — caímos em
// tokens neutros pra não renderizar `undefined` como cor.
const VARIANTS: Record<
  AlertVariant,
  { soft: string; border: string; text: string; icon: IconComponent }
> = {
  success: { soft: '--success-soft', border: '--success-border', text: '--success-text', icon: CheckCircle },
  danger: { soft: '--danger-soft', border: '--danger-border', text: '--danger-text', icon: AlertCircle },
  warning: { soft: '--warning-soft', border: '--warning-border', text: '--warning-text', icon: AlertTriangle },
  info: { soft: '--info-soft', border: '--info-border', text: '--info-text', icon: Info },
};

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children?: ReactNode;
  /** Botão close (X). Quando presente, renderiza o alvo de toque. */
  onClose?: () => void;
  /** Esconde o ícone leading. default = false. */
  hideIcon?: boolean;
}

export function Alert({ variant = 'info', title, children, onClose, hideIcon = false }: AlertProps) {
  const t = useTheme();
  const spec = VARIANTS[variant];

  const bg = t[spec.soft] ?? t['--surface-raised'];
  const border = t[spec.border] ?? t['--border-default'];
  const fg = t[spec.text] ?? t['--text-primary'];
  const Icon = spec.icon;

  return (
    <View
      accessibilityRole={variant === 'danger' ? 'alert' : 'summary'}
      style={[styles.container, { backgroundColor: bg, borderColor: border }]}
    >
      {!hideIcon && <Icon size={18} color={fg} style={styles.icon} />}
      <View style={styles.body}>
        {title != null && (
          <Text variant="label" style={{ color: fg }}>
            {title}
          </Text>
        )}
        {children != null &&
          (typeof children === 'string' ? (
            <Text variant="body-sm" style={[{ color: fg }, title != null && styles.childrenSpacing]}>
              {children}
            </Text>
          ) : (
            <View style={title != null ? styles.childrenSpacing : undefined}>{children}</View>
          ))}
      </View>
      {onClose != null && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          hitSlop={12}
          onPress={onClose}
          style={({ pressed }) => [styles.close, { opacity: pressed ? 0.6 : 1 }]}
        >
          <X size={16} color={fg} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  icon: { marginTop: 1 },
  body: { flex: 1, minWidth: 0 },
  childrenSpacing: { marginTop: 2 },
  close: { padding: 2 },
});
