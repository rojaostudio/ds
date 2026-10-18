import { useId, type CSSProperties, type SVGProps } from 'react';
import { SOCIAL_LOGOS } from './internal/social-logos';

export type SocialLogoName = keyof typeof SOCIAL_LOGOS;

/** Every logo SocialLogo draws, in alphabetical order. */
export const socialLogoNames = Object.keys(SOCIAL_LOGOS).sort() as SocialLogoName[];

/** brand: the brand's own colours. mono: one colour, the text colour around it (or the ink of `tone`). */
export type SocialLogoColor = 'brand' | 'mono';
/** The ground the logo sits on: light (black ink) or dark (white ink). */
export type SocialLogoTone = 'light' | 'dark';

export interface SocialLogoProps extends Omit<SVGProps<SVGSVGElement>, 'name' | 'color' | 'children'> {
  /** Which logo (Figma: the set `social/<name>`). */
  name: SocialLogoName;
  /** Figma: `color`. Default brand. */
  color?: SocialLogoColor;
  /**
   * Figma: `tone`. Leave it out and the logo follows the theme of its container: the black parts of a brand logo are the
   * ink (`--social-ink`, black in light, white in dark and on the brand plate) and mono is the text colour. Pass it
   * only when the ground is fixed regardless of the theme (a photo, a dark band in a light page).
   */
  tone?: SocialLogoTone;
  /** Width and height in px, the logo inside the 48 frame of the Figma scaled down. Default 24 (16, 20 and 24 are the sizes in use). */
  size?: number;
}

const INK: Record<SocialLogoTone, string> = { light: '#000', dark: '#fff' };

/**
 * SocialLogo, Figma [RDS] Icons, page social: the set `social/<name>` (variants `tone` light | dark × `color` brand | mono,
 * a 48 frame with the mark drawn in it). Logos of networks and services, for profile links (the Footer's `social`
 * slot takes the 24 mono), integration lists (20, in the place of the Tile) and the header of an integration card.
 *
 * brand keeps the brand's colours, raw in both tones; the parts the brand draws in black (GitHub, X, Apple, Threads,
 * Vercel…) are the ink, so they turn white on a dark ground. mono draws the whole mark in one colour: `currentColor`,
 * so it takes the colour of the link around it, or the ink of `tone` when one is given.
 *
 * Decorative by default (aria-hidden), since it sits next to the service's name or inside a named link. When the logo
 * is the only name, give it `aria-label` (role="img" comes with it). The marks belong to their owners; they are here
 * to point at the service, not to brand the page (see THIRD_PARTY_NOTICES.md).
 */
export function SocialLogo({ name, color = 'brand', tone, size = 24, style, ...props }: SocialLogoProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const art: { brand: string; mono?: string } = SOCIAL_LOGOS[name];
  let markup = color === 'mono' ? (art.mono ?? art.brand.replace(/ fill="[^"]*"/g, '')) : art.brand;
  if (markup.includes('ID-')) markup = markup.replace(/ID-/g, `${uid}-`);
  const ink = tone ? INK[tone] : color === 'brand' ? 'var(--social-ink, #000)' : undefined;
  const named = props['aria-label'] != null || props['aria-labelledby'] != null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill={color === 'mono' ? 'currentColor' : 'none'}
      xmlns="http://www.w3.org/2000/svg"
      focusable="false"
      {...(named ? { role: 'img' } : { 'aria-hidden': true })}
      {...props}
      style={ink ? ({ color: ink, ...style } as CSSProperties) : style}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
