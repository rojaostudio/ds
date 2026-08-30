import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from './text';
import { useTheme } from './theme';

export interface DangerZoneProps {
  title?: string;
  description?: string;
  children: ReactNode;
  style?: ViewStyle;
}

// Espelha components/danger-zone.tsx (web): cartão de ações destrutivas com
// fundo/borda danger e título/descrição. Usado em ~5 telas (clientes, conta).
export function DangerZone({ title, description, children, style }: DangerZoneProps) {
  const t = useTheme();
  return (
    <View
      style={[
        styles.box,
        { backgroundColor: t['--danger-soft'], borderColor: t['--danger-border'] },
        style,
      ]}
    >
      {(title || description) && (
        <View style={styles.header}>
          {title ? (
            <Text variant="label" color="danger">
              {title}
            </Text>
          ) : null}
          {description ? (
            <Text variant="caption" color="danger" style={styles.description}>
              {description}
            </Text>
          ) : null}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 12, borderWidth: 1, padding: 20 },
  header: { marginBottom: 16 },
  description: { opacity: 0.75, marginTop: 2 },
});
