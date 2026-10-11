'use client';

import { useState, type HTMLAttributes, type ReactNode } from 'react';
import { ImageOffIcon } from './internal/icons';

/** The proportion of the box, width:height. The height follows the width by aspect-ratio. */
export type MediaRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16';
/** cover (default) fills the box and crops; contain shows the whole image, with the background around it. */
export type MediaFit = 'cover' | 'contain';

interface MediaBaseProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The proportion of the box (default 1:1). */
  ratio?: MediaRatio;
  /** The image. Without it (and without children), or when it fails to load, the box shows the fallback. */
  src?: string | null;
  /** How the image fills the box (default cover). */
  fit?: MediaFit;
  /** Your own media element (next/image, a <picture>, a <video>) in place of `src`. It fills the box. */
  children?: ReactNode;
  /** What shows when there is no image. Defaults to the broken-image icon, centred. */
  fallback?: ReactNode;
  /**
   * Dimmed (Figma: `dimmed`): grey and faded (media/dimmed/opacity), for something switched off that is still there
   * and clickable, such as an inactive product in a list. Say it in words too ("Inativo"): colour is not enough.
   */
  dimmed?: boolean;
}

interface MediaWithAlt extends MediaBaseProps {
  /** The text alternative of the image. In the fallback, the box becomes role="img" with this name. */
  alt: string;
  decorative?: false;
}

interface MediaDecorative extends MediaBaseProps {
  /** Decorative media: alt="" on the image and the box hidden from screen readers. */
  decorative: true;
  alt?: never;
}

/** A Media needs either `alt` or `decorative`. */
export type MediaProps = MediaWithAlt | MediaDecorative;

const RATIO_CLASS: Record<MediaRatio, string> = {
  '1:1': '1-1',
  '4:3': '4-3',
  '3:4': '3-4',
  '16:9': '16-9',
  '9:16': '9-16',
};

/**
 * Media — a box for an image or a video in a fixed proportion. It takes 100% of its parent's width and the height
 * follows by aspect-ratio, so the image never distorts. Rounded in media/radius, with overflow hidden. Without an
 * image, or when it fails to load, it shows the fallback on media/background. Styles: media.css.
 */
export function Media({
  ratio = '1:1',
  src,
  alt,
  decorative,
  fit = 'cover',
  children,
  fallback,
  dimmed = false,
  className,
  ...rest
}: MediaProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const hasChildren = children != null && children !== false;
  const showImage = !hasChildren && !!src && failed !== src;
  const showFallback = !hasChildren && !showImage;
  // Decorative: hidden as a whole. In the fallback, the box itself carries the name.
  const semantics = decorative
    ? { 'aria-hidden': true as const }
    : showFallback
      ? { role: 'img' as const, 'aria-label': alt }
      : {};
  // A span (display: flex), so the box also fits where only phrasing content is allowed (a <label>, a <button>).
  return (
    <span
      {...semantics}
      {...rest}
      className={['rds-media', `rds-media--${RATIO_CLASS[ratio]}`, `rds-media--${fit}`, dimmed && 'rds-media--dimmed', className].filter(Boolean).join(' ')}
    >
      {hasChildren
        ? children
        : showImage
          ? <img src={src} alt={decorative ? '' : alt} onError={() => setFailed(src)} />
          : <span className="rds-media__fallback">{fallback ?? <ImageOffIcon />}</span>}
    </span>
  );
}
