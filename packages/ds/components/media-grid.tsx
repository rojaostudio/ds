'use client';

import { useRef, useState, type CSSProperties, type ChangeEvent } from 'react';
import { Badge } from './badge';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from './dropdown-menu';
import { FileInput } from './file-input';
import { IconButton } from './icon-button';
import { Media } from './media';
import { Progress } from './progress';
import { announce } from './internal/announce';
import { FieldShell, useFieldIds, warnIfUnlabelled, type FieldTextProps } from './internal/field';
import { ImagePlusIcon, MoreVerticalIcon, RotateCcwIcon, TriangleAlertIcon } from './internal/icons';
import { useReorder } from './internal/use-reorder';

/** One photo of the grid. `id` is the key and what onReorder gives back; the order of `items` is the order shown. */
export interface MediaGridItem {
  id: string;
  /** The image (an uploaded URL or a local preview). Without it the tile shows the fallback. */
  src?: string | null;
  /** The text alternative. Without it the photo is named "Foto N". */
  alt?: string;
  /** ready (default), uploading (the bar, no menu) or error (the message and "Tentar de novo"). */
  status?: 'ready' | 'uploading' | 'error';
  /** 0 to 100 while uploading. */
  progress?: number;
}

export interface MediaGridProps extends Omit<FieldTextProps, 'labelPosition'> {
  /** The photos, in order. The first is the cover. */
  items: MediaGridItem[];
  /**
   * Called with the ids in the new order: after a drag, a keyboard move, "Mover para a esquerda/direita" and "Definir
   * como capa" (the cover is always the first, so choosing one is a move to the front). One event for every order.
   */
  onReorder?: (ids: string[]) => void;
  /** Called with the chosen or dropped images, already cut to what fits under `max`. */
  onAdd?: (files: File[]) => void;
  onRemove?: (id: string) => void;
  /** Shows "Editar" in each photo's menu; open the ImageCropDialog from it. */
  onEdit?: (id: string) => void;
  /** Called by "Tentar de novo" on a photo in error. */
  onRetry?: (id: string) => void;
  /** The most photos. At it the add tile goes; past it the extra files are left out and the message says so. */
  max?: number;
  /** The message when files are left out, with the room there was. By default "Cabem mais N fotos.". */
  maxMessage?: (room: number) => string;
  /** The cover's seal (Figma: `cover` Badge label). By default "Capa". */
  coverLabel?: string;
  /** The add tile's text (Figma: `addLabel`). By default "Adicionar". */
  addLabel?: string;
  /** The empty dropzone's title. */
  dropTitle?: string;
  /** The file types. By default image/*. */
  accept?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
}

const defaultMaxMessage = (room: number) =>
  room > 0 ? `Cabem mais ${room} ${room === 1 ? 'foto' : 'fotos'}.` : 'Não cabem mais fotos.';

/**
 * MediaGrid — Figma [RDS] Content/MediaGrid. The photos of a record (a product's), in square tiles that wrap: the
 * first is the cover and wears its seal, the last tile adds more. Drag a whole tile to move it (mouse at once, touch
 * after a still press), or focus it and use Space and the arrows; each photo's "⋯" moves it too (for whom does not
 * drag, WCAG 2.5.7), sets it as the cover, edits and removes it. Uploading and error show on the tile. Empty, it is a
 * FileInput dropzone. Styles: media-grid.css.
 */
export function MediaGrid({
  items,
  onReorder,
  onAdd,
  onRemove,
  onEdit,
  onRetry,
  max,
  maxMessage = defaultMaxMessage,
  coverLabel = 'Capa',
  addLabel = 'Adicionar',
  dropTitle = 'Arraste as fotos ou clique para escolher',
  accept = 'image/*',
  label,
  hint,
  error,
  errorMessage,
  required,
  disabled,
  id,
  className,
  style,
  'aria-label': ariaLabel,
}: MediaGridProps) {
  warnIfUnlabelled('MediaGrid', label, ariaLabel, undefined);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const shownError = errorMessage ?? limitMessage ?? undefined;
  const { controlId, hintId, errorId, invalid, describedBy } = useFieldIds(id, hint, error, shownError);
  const ids = items.map((item) => item.id);
  const tiles = useRef(new Map<string, HTMLElement>());
  const full = max !== undefined && items.length >= max;
  const reorder = useReorder({ items: ids, enabled: Boolean(onReorder) && !disabled, onCommit: (next) => onReorder?.(next) });

  const nameOf = (item: MediaGridItem) => item.alt || `Foto ${items.indexOf(item) + 1}`;

  function add(list: FileList | File[] | null) {
    const files = Array.from(list ?? []);
    if (!files.length) return;
    const room = max === undefined ? files.length : Math.max(0, max - items.length);
    if (files.length > room) {
      const message = maxMessage(room);
      setLimitMessage(message);
      announce(message);
    } else {
      setLimitMessage(null);
    }
    if (room > 0) onAdd?.(files.slice(0, room));
  }

  function move(item: MediaGridItem, to: number) {
    const next = ids.filter((value) => value !== item.id);
    next.splice(to, 0, item.id);
    onReorder?.(next);
    announce(to === 0 ? `${nameOf(item)} agora é a capa` : `${nameOf(item)}, posição ${to + 1} de ${ids.length}`);
    requestAnimationFrame(() => tiles.current.get(item.id)?.focus());
  }

  function remove(item: MediaGridItem) {
    const index = ids.indexOf(item.id);
    onRemove?.(item.id);
    const next = items[index + 1] ?? items[index - 1];
    if (index === 0 && items[1]) announce(`${nameOf(item)} removida. ${nameOf(items[1])} agora é a capa`);
    else announce(`${nameOf(item)} removida`);
    requestAnimationFrame(() => (next ? tiles.current.get(next.id) : null)?.focus());
  }

  if (items.length === 0) {
    return (
      <FileInput
        layout="dropzone"
        label={label}
        hint={hint}
        error={error}
        errorMessage={shownError}
        required={required}
        disabled={disabled}
        id={id}
        className={['rds-media-grid', className].filter(Boolean).join(' ')}
        style={style}
        aria-label={ariaLabel}
        accept={accept}
        multiple={max === undefined || max > 1}
        dropTitle={dropTitle}
        onFiles={(files) => add(files)}
      />
    );
  }

  const byId = new Map(items.map((item) => [item.id, item]));
  const movable = Boolean(onReorder) && !disabled;

  return (
    <FieldShell
      kind="rds-media-grid"
      controlId={controlId}
      hintId={hintId}
      errorId={errorId}
      label={label}
      hint={hint}
      errorMessage={shownError}
      invalid={invalid}
      required={required}
      disabled={disabled}
      boxClassName="rds-media-grid__box"
      className={className}
      style={style}
    >
      <ul ref={reorder.listRef} className="rds-media-grid__list" role="list" aria-label={typeof label === 'string' ? label : ariaLabel}>
        {reorder.order.map((itemId, index) => {
          const item = byId.get(itemId);
          if (!item) return null;
          const status = item.status ?? 'ready';
          const name = nameOf(item);
          const last = index === ids.length - 1;
          return (
            <li key={item.id} data-reorder-item={item.id} className="rds-media-grid__item">
              <div
                ref={(node) => {
                  if (node) tiles.current.set(item.id, node);
                  else tiles.current.delete(item.id);
                }}
                className={[
                  'rds-media-grid__tile',
                  movable && 'rds-media-grid__tile--movable',
                  reorder.held === item.id && 'rds-media-grid__tile--dragging',
                  status !== 'ready' && `rds-media-grid__tile--${status}`,
                ]
                  .filter(Boolean)
                  .join(' ')}
                role="img"
                aria-label={index === 0 ? `${name}, ${coverLabel.toLowerCase()}` : name}
                aria-roledescription={movable ? 'foto reordenável' : undefined}
                tabIndex={movable ? 0 : undefined}
                onPointerDown={(event) => reorder.onPointerDown(event, item.id)}
                onKeyDown={(event) => reorder.onKeyDown(event, item.id)}
              >
                <Media decorative className="rds-media-grid__media" src={item.src} />
                {index === 0 && (
                  <Badge className="rds-media-grid__cover" aria-hidden="true">
                    {coverLabel}
                  </Badge>
                )}
              </div>
              {status === 'ready' && !disabled && (
                <span className="rds-media-grid__menu">
                  <DropdownMenu
                    align="end"
                    trigger={<IconButton icon={<MoreVerticalIcon />} label={`Ações de ${name}`} variant="ghost" size="sm" />}
                  >
                    {onReorder && index > 0 && <DropdownMenuItem onSelect={() => move(item, 0)}>Definir como capa</DropdownMenuItem>}
                    {onReorder && index > 0 && (
                      <DropdownMenuItem onSelect={() => move(item, index - 1)}>Mover para a esquerda</DropdownMenuItem>
                    )}
                    {onReorder && !last && (
                      <DropdownMenuItem onSelect={() => move(item, index + 1)}>Mover para a direita</DropdownMenuItem>
                    )}
                    {onEdit && <DropdownMenuItem onSelect={() => onEdit(item.id)}>Editar</DropdownMenuItem>}
                    {onRemove && (
                      <>
                        {(onReorder || onEdit) && <DropdownMenuSeparator />}
                        <DropdownMenuItem tone="danger" onSelect={() => remove(item)}>
                          Remover
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenu>
                </span>
              )}
              {status === 'uploading' && (
                <span className="rds-media-grid__status">
                  <Progress value={item.progress ?? 0} label={`Enviando ${name}`} showLabel={false} size="sm" />
                </span>
              )}
              {status === 'error' && (
                <span className="rds-media-grid__status rds-media-grid__status--error">
                  <span className="rds-media-grid__status-icon" aria-hidden="true">
                    <TriangleAlertIcon />
                  </span>
                  <span className="rds-media-grid__status-text">Falhou</span>
                  {onRetry && (
                    <IconButton
                      icon={<RotateCcwIcon />}
                      label={`Tentar de novo: ${name}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => onRetry(item.id)}
                    />
                  )}
                </span>
              )}
            </li>
          );
        })}
        {!full && !disabled && (
          <li className="rds-media-grid__item rds-media-grid__add-item">
            <span className="rds-media-grid__add">
              <span className="rds-media-grid__add-icon" aria-hidden="true">
                <ImagePlusIcon />
              </span>
              <span className="rds-media-grid__add-text" aria-hidden="true">
                {addLabel}
              </span>
              <input
                id={controlId}
                className="rds-media-grid__input"
                type="file"
                accept={accept}
                multiple={max === undefined || max - items.length > 1}
                aria-label={typeof label === 'string' ? `${addLabel}: ${label}` : addLabel}
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  add(event.target.files);
                  event.target.value = '';
                }}
              />
            </span>
          </li>
        )}
      </ul>
    </FieldShell>
  );
}
