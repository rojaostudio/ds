import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type DimensionValue } from 'react-native';

import { useTheme } from './theme';

// Skeleton do DS — RN puro. Bloco de carregamento com pulse animado (Animated loop
// de opacity). Cor base = --surface-raised. Sem biblioteca de terceiro.
type Props = {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  circle?: boolean;
};

export function Skeleton({ width = '100%', height = 16, radius = 8, circle = false }: Props) {
  const t = useTheme();
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const size = circle ? (typeof height === 'number' ? height : 40) : undefined;

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: circle ? size : width,
        height: circle ? size : height,
        borderRadius: circle ? (size ?? 40) / 2 : radius,
        backgroundColor: t['--surface-raised'],
        opacity: pulse,
      }}
    />
  );
}

// Helper: N linhas de skeleton stackadas (útil pra simular bloco de texto).
// A última linha sai menor pra parecer texto real.
type SkeletonTextProps = {
  lines?: number;
  gap?: number;
  lineHeight?: number;
};

export function SkeletonText({ lines = 3, gap = 8, lineHeight = 12 }: SkeletonTextProps) {
  return (
    <View style={[styles.stack, { gap }]}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={lineHeight}
          width={i === lines - 1 ? '70%' : '100%'}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    flexDirection: 'column',
  },
});
