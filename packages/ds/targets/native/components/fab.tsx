import { Plus } from 'lucide-react-native';
import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from './theme';

// FAB — botão de ação flutuante. Native target do FAB web.
// Circular (canto inferior direito), fundo brand-primary (estado de destaque),
// ícone/label on-primary. `extended` mostra um label ao lado do glifo (pill).

type IconType = ReactElement<{ color?: string; size?: number }>;

// Recolore o ícone passado pra herdar a cor on-primary (igual ao Button).
function tintIcon(icon: ReactNode, color: string, size: number): ReactNode {
  if (!isValidElement(icon)) return icon ?? null;
  const el = icon as IconType;
  return cloneElement(el, { color: el.props.color ?? color, size: el.props.size ?? size });
}

export type FABProps = {
  /** Glifo lucide-react-native. Default: Plus. */
  icon?: ReactNode;
  onPress: () => void;
  /** Obrigatório para screen readers (o FAB é só ícone no modo padrão). */
  accessibilityLabel: string;
  /** Mostra um label ao lado do ícone (pill estendida). */
  extended?: boolean;
  label?: string;
  disabled?: boolean;
};

export function FAB({
  icon,
  onPress,
  accessibilityLabel,
  extended = false,
  label,
  disabled = false,
}: FABProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const fg = t['--brand-on-primary'];
  const glyph = tintIcon(icon ?? <Plus />, fg, 24);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.anchor,
        { right: 16, bottom: (insets.bottom > 0 ? insets.bottom : 16) + 16 },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        disabled={disabled}
        hitSlop={8}
        onPress={onPress}
        style={({ pressed }) => [
          styles.base,
          extended ? styles.extended : styles.circle,
          {
            backgroundColor: t['--brand-primary'],
            opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          },
        ]}
      >
        {glyph}
        {extended && label ? (
          <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
            {label}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}

// ── FABProvider / useFAB ──────────────────────────────────────────────────────
// Contexto simples: a tela registra a config do FAB e um host (FABHost) renderiza.

type FABContextValue = {
  config: FABProps | null;
  setFAB: (config: FABProps | null) => void;
};

const FABContext = createContext<FABContextValue>({
  config: null,
  setFAB: () => {},
});

export function FABProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<FABProps | null>(null);
  const setFAB = useCallback((next: FABProps | null) => setConfig(next), []);
  return (
    <FABContext.Provider value={{ config, setFAB }}>
      {children}
      {config ? <FAB {...config} /> : null}
    </FABContext.Provider>
  );
}

export function useFAB(): FABContextValue {
  return useContext(FABContext);
}

// Sombra: hardcode permitido (sombra não é token de cor de marca).
const SHADOW =
  Platform.OS === 'android'
    ? { elevation: 6 }
    : {
        shadowColor: '#000000',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      };

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    alignItems: 'flex-end',
  },
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOW,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  extended: {
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 20,
  },
  label: { fontSize: 16, fontWeight: '600' },
});
