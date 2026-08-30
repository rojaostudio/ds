import { ChevronDown } from 'lucide-react-native';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, LayoutAnimation, Platform, Pressable, StyleSheet, UIManager, View } from 'react-native';

import { Text } from './text';
import { useTheme } from './theme';

// Accordion — seções colapsáveis empilhadas. Native target do Accordion web.
// AccordionItem é auto-contido (controla seu próprio estado de aberto/fechado);
// o Accordion wrapper é opcional e só agrupa visualmente + coordena allowMultiple.

// Habilita LayoutAnimation no Android (no-op no iOS).
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Context (coordenação opcional do wrapper) ─────────────────────────────────

type AccordionContextValue = {
  // Registra que um item abriu; com allowMultiple=false fecha os demais.
  notifyOpen: (id: number) => void;
  register: (id: number, close: () => void) => () => void;
  allowMultiple: boolean;
};

const AccordionContext = createContext<AccordionContextValue | null>(null);

export type AccordionProps = {
  children: ReactNode;
  /** Permite vários itens abertos ao mesmo tempo. Default: false (single). */
  allowMultiple?: boolean;
};

export function Accordion({ children, allowMultiple = false }: AccordionProps) {
  const t = useTheme();
  const registry = useRef(new Map<number, () => void>());

  const register = useCallback((id: number, close: () => void) => {
    registry.current.set(id, close);
    return () => {
      registry.current.delete(id);
    };
  }, []);

  const notifyOpen = useCallback(
    (id: number) => {
      if (allowMultiple) return;
      registry.current.forEach((close, key) => {
        if (key !== id) close();
      });
    },
    [allowMultiple],
  );

  return (
    <AccordionContext.Provider value={{ notifyOpen, register, allowMultiple }}>
      <View
        style={[
          styles.group,
          { borderColor: t['--border-default'], backgroundColor: t['--surface-default'] },
        ]}
      >
        {children}
      </View>
    </AccordionContext.Provider>
  );
}

// ── AccordionItem ─────────────────────────────────────────────────────────────

let nextId = 0;

export type AccordionItemProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  disabled?: boolean;
};

export function AccordionItem({ title, children, defaultOpen = false, disabled = false }: AccordionItemProps) {
  const t = useTheme();
  const ctx = useContext(AccordionContext);
  const idRef = useRef(nextId++);
  const [open, setOpen] = useState(defaultOpen);
  const rotate = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  const close = useCallback(() => setOpen(false), []);

  // Registra no wrapper (se houver) para coordenação single/multiple.
  useEffect(() => {
    if (!ctx) return;
    return ctx.register(idRef.current, close);
  }, [ctx, close]);

  useEffect(() => {
    Animated.timing(rotate, {
      toValue: open ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [open, rotate]);

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.create(180, 'easeInEaseOut', 'opacity'));
    setOpen((prev) => {
      const next = !prev;
      if (next && ctx) ctx.notifyOpen(idRef.current);
      return next;
    });
  }, [ctx]);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={[styles.item, { borderBottomColor: t['--border-default'] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open, disabled }}
        accessibilityLabel={title}
        disabled={disabled}
        hitSlop={4}
        onPress={toggle}
        style={({ pressed }) => [
          styles.header,
          {
            backgroundColor: pressed && !disabled ? t['--surface-raised'] : 'transparent',
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Text variant="label" style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <ChevronDown size={20} color={t['--text-muted']} />
        </Animated.View>
      </Pressable>
      {open ? (
        <View style={styles.body}>
          {typeof children === 'string' ? (
            <Text variant="body-sm" color="secondary">
              {children}
            </Text>
          ) : (
            children
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  item: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  header: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { flex: 1 },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
