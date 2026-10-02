import type { LucideIcon } from 'lucide-react-native';

import { useTheme } from './theme';

// Icon do DS. O glifo vem do set lucide (o mesmo que o DS adota no web).
// Os glifos são re-exportados em '@rojaostudio/ds/native/icons'.
type Props = { icon: LucideIcon; size?: number; color?: string };

export function Icon({ icon: Glyph, size = 24, color }: Props) {
  const t = useTheme();
  return <Glyph size={size} color={color ?? t['--icon-default']} />;
}
