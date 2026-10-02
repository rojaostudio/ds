import { ActivityIndicator, View } from 'react-native';

import { useTheme } from './theme';

export function Spinner({ size = 'large' }: { size?: 'small' | 'large' }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size={size} color={t['--brand-primary']} />
    </View>
  );
}
