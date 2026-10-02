'use client';

import { useState, type HTMLAttributes, type ReactNode } from 'react';
import { ImageOffIcon } from './internal/icons';

export type MediaTileAspect = 'square' | 'video';

export interface MediaTileProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** The image (Figma: `media=image`). Without it, or when it fails to load, the tile shows the fallback. */
  src?: string | null;
  /** The image's text alternative. Empty when the label already says what it is. */
  alt?: string;
  /** Your own image element (next/image, a <picture>). Takes precedence over `src`. */
  image?: ReactNode;
  /** The name under the image, cut at two lines (Figma: `showLabel` + `label`). */
  label?: ReactNode;
  /** Makes the tile a link; only then it has the hover and focus outline (Figma: `state=hover`). */
  href?: string;
  /** What shows when the image is missing (Figma: `media=fallback`). Defaults to the image-off icon. */
  fallback?: ReactNode;
  /** square (1:1) or video (16:9) (Figma: `aspect`). */
  aspect?: MediaTileAspect;
}

/**
 * MediaTile — Figma [RDS] Content/MediaTile. A thumbnail of a product or image with an optional label, for lists
 * and grids. A link when it has `href`, otherwise a plain box. Styles: media-tile.css.
 */
export function MediaTile({ src, alt = '', image, label, href, fallback, aspect = 'square', className, ...rest }: MediaTileProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const showImage = !image && src && failed !== src;
  const classes = ['rds-media-tile', `rds-media-tile--${aspect}`, href && 'rds-media-tile--link', className].filter(Boolean).join(' ');
  const content = (
    <>
      <span className="rds-media-tile__media">
        {image ??
          (showImage ? (
            <img src={src} alt={alt} onError={() => setFailed(src)} />
          ) : (
            <span className="rds-media-tile__fallback" aria-hidden={fallback ? undefined : true}>
              {fallback ?? <ImageOffIcon />}
            </span>
          ))}
      </span>
      {label != null && label !== '' && <span className="rds-media-tile__label">{label}</span>}
    </>
  );
  return href ? (
    <a {...rest} href={href} className={classes}>
      {content}
    </a>
  ) : (
    <div {...rest} className={classes}>
      {content}
    </div>
  );
}
