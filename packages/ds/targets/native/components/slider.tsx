import { useRef, useState } from 'react';
import {
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';

import { Text } from './text';
import { useTheme } from './theme';

// Native target do Slider web (input range single). Self-contained: trilho com
// parte preenchida (brand-primary) + thumb arrastável via PanResponder. Sem libs
// externas (nada de @react-native-community/slider).
type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Mostra o valor atual à direita do trilho. */
  showValue?: boolean;
  /** Formata o valor exibido (ex: `v => `${v}%``). */
  formatValue?: (value: number) => string;
  disabled?: boolean;
  accessibilityLabel?: string;
};

const TRACK_HEIGHT = 6;
const THUMB_SIZE = 24; // ≥24dp; hitSlop amplia o alvo de toque para ≥44dp.

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function snap(raw: number, min: number, max: number, step: number): number {
  const stepped = Math.round((raw - min) / step) * step + min;
  return clamp(stepped, min, max);
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  showValue = false,
  formatValue,
  disabled = false,
  accessibilityLabel,
}: Props) {
  const t = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);

  // Refs para o PanResponder ler valores atuais sem recriar os callbacks.
  const widthRef = useRef(0);
  const valueRef = useRef(value);
  valueRef.current = value;

  const fmt = formatValue ?? ((v: number) => String(v));
  const range = max - min || 1;
  const pct = clamp((value - min) / range, 0, 1);

  function commitFromX(x: number) {
    const w = widthRef.current;
    if (w <= 0) return;
    const ratio = clamp(x / w, 0, 1);
    const next = snap(min + ratio * range, min, max, step);
    if (next !== valueRef.current) onChange(next);
  }

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (e: GestureResponderEvent) => {
        commitFromX(e.nativeEvent.locationX);
      },
      onPanResponderMove: (e: GestureResponderEvent) => {
        commitFromX(e.nativeEvent.locationX);
      },
    }),
  ).current;

  function onLayout(e: LayoutChangeEvent) {
    const w = e.nativeEvent.layout.width;
    widthRef.current = w;
    setTrackWidth(w);
  }

  function onAccessibilityAction(e: AccessibilityActionEvent) {
    if (disabled) return;
    const name = e.nativeEvent.actionName;
    if (name === 'increment') onChange(snap(value + step, min, max, step));
    else if (name === 'decrement') onChange(snap(value - step, min, max, step));
  }

  const thumbLeft = Math.max(0, pct * trackWidth - THUMB_SIZE / 2);

  return (
    <View style={styles.row}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        accessibilityValue={{ min, max, now: value }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={onAccessibilityAction}
        onLayout={onLayout}
        hitSlop={{ top: 12, bottom: 12, left: 4, right: 4 }}
        style={[styles.trackArea, { opacity: disabled ? 0.5 : 1 }]}
        {...responder.panHandlers}
      >
        {/* Trilho inativo */}
        <View
          pointerEvents="none"
          style={[styles.track, { backgroundColor: t['--border-strong'] }]}
        />
        {/* Parte preenchida */}
        <View
          pointerEvents="none"
          style={[
            styles.fill,
            { width: pct * trackWidth, backgroundColor: t['--brand-primary'] },
          ]}
        />
        {/* Thumb */}
        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              left: thumbLeft,
              backgroundColor: t['--brand-primary'],
              borderColor: t['--surface-default'],
            },
          ]}
        />
      </View>
      {showValue && (
        <Text variant="label" style={[styles.value, { color: t['--text-primary'] }]}>
          {fmt(value)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trackArea: {
    flex: 1,
    height: THUMB_SIZE,
    justifyContent: 'center',
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
  },
  fill: {
    position: 'absolute',
    left: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
  },
  value: {
    minWidth: 40,
    textAlign: 'right',
  },
});
