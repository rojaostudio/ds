import { Lock } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Button } from './button';
import { Text } from './text';
import { useTheme } from './theme';

// PaywallBanner — gate de feature/plano (upsell). Native target do PaywallBanner web.
// Aponta pra um upgrade: ícone Lock em destaque (brand) + título + descrição + CTA.

export type PaywallBannerProps = {
  title: string;
  description?: string;
  ctaLabel?: string;
  onPress: () => void;
};

export function PaywallBanner({ title, description, ctaLabel = 'Ver planos', onPress }: PaywallBannerProps) {
  const t = useTheme();

  return (
    <View
      accessibilityRole="summary"
      style={[
        styles.container,
        { backgroundColor: t['--surface-raised'], borderColor: t['--border-default'] },
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: t['--brand-primary'] }]}>
          <Lock size={20} color={t['--brand-on-primary']} />
        </View>
        <View style={styles.copy}>
          <Text variant="label" numberOfLines={2}>
            {title}
          </Text>
          {description ? (
            <Text variant="caption" color="secondary" style={styles.desc}>
              {description}
            </Text>
          ) : null}
        </View>
      </View>
      <Button label={ctaLabel} variant="primary" fullWidth onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  desc: { marginTop: 2 },
});
