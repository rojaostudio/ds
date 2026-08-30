import type { ReactNode } from 'react';
import { ImageOff } from 'lucide-react';

/**
 * MediaTile — miniatura de mídia (produto, imagem) com fallback e label opcional.
 * Substitui o `<div className="rounded-xl border overflow-hidden">` + `<img>`/fallback
 * reimplementado em listas/grids. Agnóstico de framework: usa `<img>` nativo
 * (o consumidor que quiser next/image passa via `image` slot).
 */
export interface MediaTileProps {
  src?: string | null;
  alt?: string;
  /** Conteúdo de imagem custom (ex: next/image). Tem precedência sobre `src`. */
  image?: ReactNode;
  label?: ReactNode;
  /** Se passado, o tile vira um link de navegação. */
  href?: string;
  fallback?: ReactNode;
  aspect?: 'square' | 'video';
  className?: string;
}

const ASPECT: Record<NonNullable<MediaTileProps['aspect']>, string> = {
  square: 'aspect-square',
  video: 'aspect-video',
};

export function MediaTile({ src, alt = '', image, label, href, fallback, aspect = 'square', className = '' }: MediaTileProps) {
  const Wrapper = href ? 'a' : 'div';
  return (
    <Wrapper
      href={href}
      className={[
        'group flex flex-col rounded-(--radius-card) overflow-hidden border border-stroke-default bg-surface-default transition-all',
        href ? 'hover:shadow-md hover:ring-2 hover:ring-stroke-focus cursor-pointer' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      <div className={`relative w-full ${ASPECT[aspect]} bg-surface-raised overflow-hidden`}>
        {image ? (
          image
        ) : src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-fg-disabled">
            {fallback ?? <ImageOff className="size-5" strokeWidth={1.5} />}
          </div>
        )}
      </div>
      {label != null && (
        <div className="p-1.5">
          <p className="text-[11px] font-medium text-fg-primary line-clamp-2 leading-snug">{label}</p>
        </div>
      )}
    </Wrapper>
  );
}
