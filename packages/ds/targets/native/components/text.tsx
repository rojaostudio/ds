import { Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { fonts } from '../fonts';
import { useTheme } from './theme';

export type TextVariant = 'heading' | 'title' | 'label' | 'body' | 'body-sm' | 'caption';
export type TextColor = 'primary' | 'secondary' | 'muted' | 'inverse' | 'danger' | 'brand';

// heading/title usam a fonte display (Bricolage). fontWeight fica como fallback
// caso o app não tenha registrado a fonte (degrada pro peso do sistema).
const VARIANT: Record<TextVariant, TextStyle> = {
  heading: { fontSize: 24, lineHeight: 30, fontWeight: '700', fontFamily: fonts.display.bold },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '600', fontFamily: fonts.display.semibold },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  'body-sm': { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
};

const COLOR_TOKEN: Record<TextColor, string> = {
  primary: '--text-primary',
  secondary: '--text-secondary',
  muted: '--text-muted',
  inverse: '--text-inverse',
  danger: '--danger-text',
  brand: '--brand-primary',
};

type Props = TextProps & { variant?: TextVariant; color?: TextColor };

export function Text({ variant = 'body', color = 'primary', style, ...rest }: Props) {
  const t = useTheme();
  return <RNText style={[VARIANT[variant], { color: t[COLOR_TOKEN[color]] }, style]} {...rest} />;
}
