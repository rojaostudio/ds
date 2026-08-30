import { useEffect, useRef, useState } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react-native';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from './text';
import { useTheme } from './theme';

/**
 * Toaster (RN) — host único + API imperativa via store-em-módulo.
 *
 * Uso:
 *   // monte uma vez, no topo da árvore (dentro do DSThemeProvider):
 *   <Toaster />
 *   // dispare de qualquer lugar:
 *   toast.success('Salvo');
 *   toast.error('Falhou'); toast.warning('...'); toast.info('...');
 *
 * Comportamento: um por vez (novo substitui o anterior), auto-dismiss por
 * timeout, animação de entrada/saída (fade + slide) via Animated.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top' | 'bottom';

export interface ToastOptions {
  /** ms até auto-dismiss. Omitido → fallback do Material (2750, LENGTH_LONG). <=0 mantém persistente. */
  duration?: number;
}

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
}

// ── Store-em-módulo (emitter) ────────────────────────────────────────────────

type Listener = (toast: ToastItem) => void;

const listeners = new Set<Listener>();
let counter = 0;

function show(message: string, variant: ToastVariant, options: ToastOptions = {}): number {
  counter += 1;
  const item: ToastItem = {
    id: counter,
    message,
    variant,
    duration: options.duration ?? 2750, // Material LENGTH_LONG (mobile: default único, sem hover-to-pause)
  };
  for (const l of listeners) l(item);
  return item.id;
}

// ── API pública ──────────────────────────────────────────────────────────────

export interface ToastFn {
  success: (message: string, options?: ToastOptions) => number;
  error: (message: string, options?: ToastOptions) => number;
  warning: (message: string, options?: ToastOptions) => number;
  info: (message: string, options?: ToastOptions) => number;
}

export const toast: ToastFn = {
  success: (m, o) => show(m, 'success', o),
  error: (m, o) => show(m, 'error', o),
  warning: (m, o) => show(m, 'warning', o),
  info: (m, o) => show(m, 'info', o),
};

// ── Visual por variant ───────────────────────────────────────────────────────

type IconComponent = typeof Info;

const VARIANT: Record<
  ToastVariant,
  { soft: string; border: string; text: string; icon: IconComponent }
> = {
  success: { soft: '--success-soft', border: '--success-border', text: '--success-text', icon: CheckCircle },
  error: { soft: '--danger-soft', border: '--danger-border', text: '--danger-text', icon: AlertCircle },
  warning: { soft: '--warning-soft', border: '--warning-border', text: '--warning-text', icon: AlertTriangle },
  info: { soft: '--info-soft', border: '--info-border', text: '--info-text', icon: Info },
};

// ── Host ─────────────────────────────────────────────────────────────────────

export interface ToasterProps {
  /** Posição na tela. default = 'bottom'. */
  position?: ToastPosition;
}

const ENTER_MS = 200;
const EXIT_MS = 150;

export function Toaster({ position = 'bottom' }: ToasterProps = {}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState<ToastItem | null>(null);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Mantém handlers estáveis sem recriar o listener a cada toast.
  const currentRef = useRef<ToastItem | null>(null);
  currentRef.current = current;

  const isTop = position === 'top';
  const offscreen = isTop ? -16 : 16;

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    const animateIn = (item: ToastItem) => {
      opacity.setValue(0);
      translateY.setValue(offscreen);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: ENTER_MS, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: ENTER_MS, useNativeDriver: true }),
      ]).start();

      clearTimer();
      if (item.duration > 0) {
        timerRef.current = setTimeout(() => animateOut(item.id), item.duration);
      }
    };

    const animateOut = (id: number) => {
      clearTimer();
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: EXIT_MS, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: offscreen, duration: EXIT_MS, useNativeDriver: true }),
      ]).start(() => {
        setCurrent((prev) => (prev && prev.id === id ? null : prev));
      });
    };

    const listener: Listener = (item) => {
      // M3: um por vez — o novo substitui o atual.
      setCurrent(item);
      animateIn(item);
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      clearTimer();
    };
    // offscreen depende só de `position` (estável o suficiente); opacity/translateY são refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offscreen]);

  if (!current) return null;

  const spec = VARIANT[current.variant];
  const bg = t[spec.soft] ?? t['--surface-raised'];
  const border = t[spec.border] ?? t['--border-default'];
  const fg = t[spec.text] ?? t['--text-primary'];
  const Icon = spec.icon;
  const isError = current.variant === 'error';

  // Respeita notch/home indicator; soma respiro fixo quando não há inset.
  const edgePadding = isTop
    ? { paddingTop: (insets.top > 0 ? insets.top : 0) + 12 }
    : { paddingBottom: (insets.bottom > 0 ? insets.bottom : 0) + 12 };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.overlay, isTop ? styles.overlayTop : styles.overlayBottom, edgePadding]}
    >
      <Animated.View
        accessibilityLiveRegion={isError ? 'assertive' : 'polite'}
        accessibilityRole={isError ? 'alert' : 'summary'}
        style={[
          styles.toast,
          {
            backgroundColor: bg,
            borderColor: border,
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <Icon size={18} color={fg} style={styles.icon} />
        <Text variant="label" style={[styles.message, { color: fg }]} numberOfLines={3}>
          {current.message}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  overlayTop: { top: 0 },
  overlayBottom: { bottom: 0 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    maxWidth: 560,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  icon: { marginTop: 0 },
  message: { flex: 1, minWidth: 0 },
});
