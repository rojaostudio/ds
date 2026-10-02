import { StyleSheet, View } from 'react-native';

import { useTheme } from './theme';

// Native target do Divider web. Linha fina (hairline) em --border-default.
// vertical = separador vertical (self-stretch). spacing = margem ao redor.
type Props = {
  vertical?: boolean;
  spacing?: number;
};

export function Divider({ vertical, spacing }: Props) {
  const t = useTheme();
  const hairline = StyleSheet.hairlineWidth;

  if (vertical) {
    return (
      <View
        accessibilityRole="none"
        style={{
          alignSelf: 'stretch',
          width: hairline,
          backgroundColor: t['--border-default'],
          marginHorizontal: spacing ?? 0,
        }}
      />
    );
  }

  return (
    <View
      accessibilityRole="none"
      style={{
        alignSelf: 'stretch',
        height: hairline,
        backgroundColor: t['--border-default'],
        marginVertical: spacing ?? 0,
      }}
    />
  );
}
