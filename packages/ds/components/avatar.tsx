'use client';

import { Children, createContext, useContext, useState, type HTMLAttributes, type ReactNode } from 'react';
import { BuildingIcon, UserIcon } from './internal/icons';

/** person is a circle; brand is a rounded square (a brand, a company, a campaign). */
export type AvatarType = 'person' | 'brand';
export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
/**
 * What the Avatar shows (Figma: `content`). It follows from the props: a photo (`src`), initials (a name) or an icon
 * (no name).
 */
export type AvatarContent = 'image' | 'fallback' | 'icon';
/** @deprecated Use AvatarContent (2.0.0-next: the Figma `variant` is `content`). */
export type AvatarVariant = AvatarContent;

export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** person is a circle; brand is a square with rounded corners, initials in bold on the brand's mark colour. */
  type?: AvatarType;
  /**
   * sm 24, md 32 (default), lg 40, xl 56 (Figma: `size`). Inside an AvatarGroup, the group's size. `'default'` is
   * deprecated (2.0.0-next): it is `'md'`.
   */
  size?: AvatarSize | 'default';
  /** The photo (Figma: `content=image`). If it fails to load, the initials (or the icon) show instead. */
  src?: string;
  /**
   * The full name: the photo's alt, the initials' aria-label and the source of the initials. Leave it out only for an
   * avatar without a name (a visitor): it is then decorative and hidden from screen readers.
   */
  name?: string;
  /** The initials (Figma: `fallbackText`). By default two letters from `name`, one on a brand. */
  fallbackText?: string;
  /** The icon when there is no name (Figma: `content=icon` + `icon`). By default a person, or a building on a brand. */
  icon?: ReactNode;
  /** The presence dot (Figma: `showBadge`). The colour is not the only sign: `badgeLabel` goes into the accessible name. */
  showBadge?: boolean;
  /** What the dot means, said after the name. */
  badgeLabel?: string;
}

const GroupSize = createContext<AvatarSize | undefined>(undefined);

const sizeOf = <S extends string>(size: S | 'default'): S | 'md' => (size === 'default' ? 'md' : size);

/** Two letters: first and last name, or the first two letters of a single word. "?" for an empty name. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/**
 * Avatar — Figma [RDS] Content/Avatar. A person, or a brand, in miniature: photo, initials or icon. Not
 * interactive. The Figma `content` follows from the props: `src` → image, a name → fallback, neither → icon.
 * Styles: avatar.css.
 */
export function Avatar({
  type = 'person',
  size,
  src,
  name,
  fallbackText,
  icon,
  showBadge,
  badgeLabel = 'online',
  className,
  ...rest
}: AvatarProps) {
  const groupSize = useContext(GroupSize);
  const finalSize = sizeOf(size ?? groupSize ?? 'md');
  const [failed, setFailed] = useState<string | null>(null);
  const trimmed = name?.trim() ?? '';
  const letters = fallbackText ?? (trimmed ? (type === 'brand' ? trimmed[0]!.toUpperCase() : initials(trimmed)) : '');
  const content: AvatarContent = src && failed !== src ? 'image' : letters ? 'fallback' : 'icon';
  const label = trimmed ? (showBadge ? `${trimmed}, ${badgeLabel}` : trimmed) : undefined;
  // The photo carries the name as alt; initials and icon get role="img" with the name, or are hidden without one.
  const semantics = content === 'image' ? {} : label ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': true };

  return (
    <span
      {...semantics}
      {...rest}
      className={['rds-avatar', `rds-avatar--${type}`, `rds-avatar--${finalSize}`, `rds-avatar--${content}`, className]
        .filter(Boolean)
        .join(' ')}
    >
      {content === 'image' ? (
        <img className="rds-avatar__image" src={src} alt={label ?? ''} onError={() => setFailed(src ?? null)} />
      ) : (
        <span className="rds-avatar__fallback" aria-hidden="true">
          {content === 'fallback' ? letters : (icon ?? (type === 'brand' ? <BuildingIcon /> : <UserIcon />))}
        </span>
      )}
      {showBadge && <span className="rds-avatar__badge" aria-hidden="true" />}
    </span>
  );
}

export type AvatarGroupSize = Exclude<AvatarSize, 'xl'>;

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Who the group is ("Equipe do projeto"). Required: it names the group for screen readers. */
  'aria-label': string;
  /** The size of every Avatar inside (Figma: sm, md, lg). `'default'` is deprecated (2.0.0-next): it is `'md'`. */
  size?: AvatarGroupSize | 'default';
  /** Show only the first `max` and a "+N" with the rest. 3 or 4 is a good limit. */
  max?: number;
  /** The Avatars. */
  children: ReactNode;
}

/** AvatarGroup — Figma [RDS] Content/AvatarGroup. Overlapping avatars, each with a ring that separates it. */
export function AvatarGroup({ size: sizeProp = 'md', max, className, children, ...rest }: AvatarGroupProps) {
  const size = sizeOf(sizeProp);
  const items = Children.toArray(children);
  const shown = max && items.length > max ? items.slice(0, max) : items;
  const hidden = items.length - shown.length;
  return (
    <GroupSize.Provider value={size}>
      <div role="group" {...rest} className={['rds-avatar-group', `rds-avatar-group--${size}`, className].filter(Boolean).join(' ')}>
        {shown}
        {hidden > 0 && <Avatar fallbackText={`+${hidden}`} name={`mais ${hidden} ${hidden === 1 ? 'pessoa' : 'pessoas'}`} />}
      </div>
    </GroupSize.Provider>
  );
}
