import { View } from 'react-native';

import { Button } from './button';
import { Text } from './text';

// CTA centralizado dentro do empty state (padrão do DS).
type Props = {
  title: string;
  description?: string;
  cta?: { label: string; onPress: () => void };
};

export function EmptyState({ title, description, cta }: Props) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
      <Text variant="title" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      {description ? (
        <Text variant="body-sm" color="muted" style={{ textAlign: 'center' }}>
          {description}
        </Text>
      ) : null}
      {cta ? <Button label={cta.label} onPress={cta.onPress} fullWidth /> : null}
    </View>
  );
}
