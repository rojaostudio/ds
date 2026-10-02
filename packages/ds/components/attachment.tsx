'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { IconButton } from './icon-button';
import { Tooltip } from './tooltip';
import { AlertIcon, CircleCheckIcon, CloseIcon, FileTextIcon, ImageIcon, RotateCcwIcon } from './internal/icons';
import { Progress } from './progress';
import { Spinner } from './spinner';

export type AttachmentStatus = 'idle' | 'uploading' | 'processing' | 'error' | 'done';
export type AttachmentOrientation = 'horizontal' | 'vertical';

export interface AttachmentProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The file name (Figma: `title`). It also names the actions and the status said to screen readers. */
  title: string;
  /** Type and size, such as "PDF · 240 KB" (Figma: `description`). In error, say what went wrong here. */
  description?: ReactNode;
  /**
   * The upload's life cycle (Figma: `status`). idle: ready; uploading: the bar (`progress`); processing: a Spinner
   * in place of the icon; error: error border and text, and the retry action; done: a check in place of the icon.
   * Every change is said to screen readers ("Enviando…", "Enviado"), in a polite live region.
   */
  status?: AttachmentStatus;
  /** horizontal: a document, icon in a 40 box; vertical: an image, a 112 tall preview (Figma: `orientation`). */
  orientation?: AttachmentOrientation;
  /**
   * The file icon (Figma: `icon`). By default a document, or an image when vertical. Vertical, an `<img alt="">`
   * here fills the preview.
   */
  icon?: ReactNode;
  /** 0 to 100 while uploading. */
  progress?: number;
  /** Shows the × (Figma: `showAction`), named "Remover <title>". */
  onRemove?: () => void;
  /** In error, the action becomes "Enviar <title> de novo". */
  onRetry?: () => void;
}

const SAID: Record<AttachmentStatus, (title: string) => string> = {
  idle: () => '',
  uploading: (title) => `Enviando ${title}`,
  processing: (title) => `Processando ${title}`,
  error: (title) => `Não deu para enviar ${title}`,
  done: (title) => `${title} enviado`,
};

/**
 * Attachment — Figma [RDS] Chat/Attachment. A file in the conversation or in the send field: before, during and
 * after the upload. Styles: attachment.css.
 */
export function Attachment({
  title,
  description,
  status = 'idle',
  orientation = 'horizontal',
  icon,
  progress = 0,
  onRemove,
  onRetry,
  className,
  ...rest
}: AttachmentProps) {
  const busy = status === 'uploading' || status === 'processing';
  let media: ReactNode;
  // The media is decorative (aria-hidden): the live region below says the status once.
  if (status === 'processing') media = <Spinner size="sm" />;
  else if (status === 'error') media = <AlertIcon />;
  else if (status === 'done') media = <CircleCheckIcon />;
  else media = icon ?? (orientation === 'vertical' ? <ImageIcon /> : <FileTextIcon />);

  const action =
    status === 'error' && onRetry ? (
      <Tooltip text={`Enviar ${title} de novo`}>
        <IconButton icon={<RotateCcwIcon />} label={`Enviar ${title} de novo`} tone="neutral" variant="ghost" onClick={onRetry} />
      </Tooltip>
    ) : onRemove ? (
      <Tooltip text={`Remover ${title}`}>
        <IconButton icon={<CloseIcon />} label={`Remover ${title}`} tone="neutral" variant="ghost" onClick={onRemove} />
      </Tooltip>
    ) : null;

  const content = (
    <div className="rds-attachment__content">
      <span className="rds-attachment__title">{title}</span>
      {description && <span className="rds-attachment__description">{description}</span>}
      {status === 'uploading' && (
        <Progress size="sm" value={progress} label={`Enviando ${title}`} showLabel={false} showValue={false} />
      )}
    </div>
  );

  return (
    <div
      aria-busy={busy || undefined}
      {...rest}
      className={['rds-attachment', `rds-attachment--${orientation}`, `rds-attachment--${status}`, className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="rds-attachment__media" aria-hidden="true">
        {media}
      </div>
      {orientation === 'vertical' ? (
        <div className="rds-attachment__row">
          {content}
          {action}
        </div>
      ) : (
        <>
          {content}
          {action}
        </>
      )}
      <span className="rds-visually-hidden" role="status">
        {SAID[status](title)}
      </span>
    </div>
  );
}
