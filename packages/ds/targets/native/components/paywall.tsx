import {
  Lock, Package, Send, HandCoins, Store, BarChart3, CreditCard,
  type LucideIcon,
} from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Button } from './button';
import { Text } from './text';
import { useTheme } from './theme';

// Paywall nativo (#372) — par RN do componente web. Apresentação pura: o app
// injeta ícone/copy/plano. Navegação só via `onCta` (sem deep-link aqui).

export type PaywallReason = 'feature' | 'limit';
export type PaywallIcon =
  | 'lock' | 'catalog' | 'channels' | 'commercial' | 'operation' | 'intelligence' | 'billing';

const ICONS: Record<PaywallIcon, LucideIcon> = {
  lock: Lock,
  catalog: Package,
  channels: Send,
  commercial: HandCoins,
  operation: Store,
  intelligence: BarChart3,
  billing: CreditCard,
};

export type PaywallContentProps = {
  icon?: PaywallIcon;
  title: string;
  description?: string;
  reason?: PaywallReason;
  planLabel?: string;
  ctaLabel?: string;
  onCta: () => void;
};

function planLineText(reason: PaywallReason, planLabel?: string): string {
  if (reason === 'limit') return 'Limite atingido';
  return planLabel ? `Disponível no ${planLabel}` : 'Faça upgrade';
}

/** Visual puro do paywall — o app envolve num Sheet/overlay (gate de ação) ou
 *  num container de tela cheia (gate de seção). */
export function PaywallContent({
  icon = 'lock',
  title,
  description,
  reason = 'feature',
  planLabel,
  ctaLabel = 'Ver planos',
  onCta,
}: PaywallContentProps) {
  const t = useTheme();
  const Icon = ICONS[icon] ?? Lock;

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Icon size={52} strokeWidth={1.25} color={t['--text-secondary']} />
        <View style={[styles.lockBadge, { backgroundColor: t['--brand-primary'] }]}>
          <Lock size={12} strokeWidth={2.5} color={t['--brand-on-primary']} />
        </View>
      </View>

      <View style={[styles.pill, { backgroundColor: t['--surface-raised'] }]}>
        <Text variant="caption" color="secondary">{planLineText(reason, planLabel)}</Text>
      </View>

      <Text variant="title" style={styles.title}>{title}</Text>
      {description ? (
        <Text variant="body-sm" color="muted" style={styles.desc}>{description}</Text>
      ) : null}

      <Button label={ctaLabel} variant="primary" fullWidth onPress={onCta} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 8, gap: 12, width: '100%' },
  iconWrap: { position: 'relative', marginBottom: 4 },
  lockBadge: {
    position: 'absolute', bottom: -4, right: -4,
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  title: { textAlign: 'center' },
  desc: { textAlign: 'center', maxWidth: 320 },
});
