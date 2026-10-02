'use client';

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type DragEvent,
  type ReactNode,
} from 'react';
import { FieldAction, FieldShell, hasContent, useFieldIds, warnIfUnlabelled, type FieldTextProps } from './internal/field';
import { CloseIcon, ImagePlusIcon, PaperclipIcon, UploadIcon } from './internal/icons';

export type FileInputVariant = 'field' | 'dropzone' | 'tile';

export interface FileInputProps
  extends Omit<FieldTextProps, 'labelPosition'>,
    Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'prefix' | 'value' | 'defaultValue' | 'size'> {
  /**
   * The shape (Figma: `variant`). field (default): the Input's box, for a dense form. dropzone: a dashed area to drop
   * the file on, when the file is what the screen is about (a receipt, a spreadsheet). tile: a 112 square with the image's
   * preview, for a photo or a logo.
   */
  variant?: FileInputVariant;
  /** Controlled: the name shown (Figma: `fileName`). By default, the chosen file's name. */
  fileName?: string;
  /** Controlled: the size beside the name in the dropzone (Figma: `fileSize`). By default, the chosen file's, as "1,2 MB". */
  fileSize?: string;
  /**
   * tile: the image shown (a URL). Passing it controls the preview, '' for none; by default, the chosen image. Use it
   * for an image that is already saved.
   */
  preview?: string;
  /** tile: the preview's alternative text. By default "Prévia de <label>". */
  previewAlt?: string;
  /** dropzone: the call in the empty area (Figma: `dropTitle`). */
  dropTitle?: ReactNode;
  /** tile: the text of the empty tile (Figma: `tileText`), such as "Enviar logo". */
  tileText?: ReactNode;
  /** The × that takes the file out (Figma: `showClear`). On by default: the person must be able to change the file. */
  clearable?: boolean;
  /** Called after the × takes the file out. */
  onClear?: () => void;
  /** Called with the files chosen or dropped (after `onChange`, which also fires). */
  onFiles?: (files: FileList) => void;
  /** The ×'s accessible name. By default "Remover arquivo" ("Remover imagem" in the tile). */
  clearLabel?: string;
  /** tile: the name of the button that swaps the image. */
  replaceLabel?: string;
  /** field: the text of the box that opens the file chooser. */
  chooseLabel?: string;
  /** field: what the box says before a file is chosen. */
  emptyLabel?: string;
}

type Chosen = { name: string; size: number; url?: string };

/** "1,2 MB", "830 KB", "512 B": the size the way a person reads it. */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = unit === 0 || value >= 100 ? 0 : 1;
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: digits })} ${units[unit]}`;
}

/**
 * FileInput — Figma [RDS] Forms/FileInput. A file field in three shapes (`variant`): field, the Input's box with the
 * clip, "Escolher arquivo" and the name; dropzone, a dashed area that takes a dragged file; tile, a square with the
 * image's preview and the buttons to swap or remove it. In every shape the native <input type="file"> does the work:
 * it lies transparent over the box, so a click, Enter or Space open the system's chooser, the label names it,
 * `required` and the form get the file. A file dropped on the box goes into that same input. Say the formats and the
 * size in the hint and check them in code (a failure is the errorMessage). Styles: file-input.css and
 * internal/field.css.
 */
export function FileInput({
  variant = 'field',
  label,
  hint,
  error,
  errorMessage,
  required,
  fileName,
  fileSize,
  preview,
  previewAlt,
  dropTitle = 'Arraste o arquivo ou clique para escolher',
  tileText = 'Enviar imagem',
  clearable = true,
  onClear,
  onFiles,
  clearLabel,
  replaceLabel = 'Trocar imagem',
  chooseLabel = 'Escolher arquivo',
  emptyLabel = 'Nenhum arquivo',
  id,
  disabled,
  className,
  style,
  onChange,
  ref,
  ...input
}: FileInputProps) {
  warnIfUnlabelled('FileInput', label, input['aria-label'], input['aria-labelledby']);
  // The dropzone keeps its hint inside the area, also in error: the hint is not the shell's.
  const inside = variant === 'dropzone';
  const ids = useFieldIds(id, inside ? undefined : hint, error, errorMessage);
  const { controlId, errorId, invalid } = ids;
  const own = useRef<HTMLInputElement | null>(null);
  const [chosen, setChosen] = useState<Chosen | null>(null);
  const [dragging, setDragging] = useState(false);

  // The preview URL of a chosen image lives as long as the choice.
  useEffect(() => () => revoke(chosen), [chosen]);

  const shownName = fileName ?? chosen?.name ?? '';
  const shownSize = fileSize ?? (fileName === undefined && chosen ? formatFileSize(chosen.size) : undefined);
  const shownPreview = preview ?? chosen?.url ?? '';
  const filled = variant === 'tile' ? Boolean(shownPreview) : Boolean(shownName);
  const showClear = clearable && filled && !disabled;
  const insideHintId = inside && hasContent(hint) && !filled ? `${controlId}-hint` : undefined;
  const describedBy = [inside ? insideHintId : ids.hintId, errorId, input['aria-describedby']].filter(Boolean).join(' ') || undefined;
  const removeName = clearLabel ?? (variant === 'tile' ? 'Remover imagem' : 'Remover arquivo');

  function change(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files?.length) {
      setChosen(null);
    } else {
      const size = Array.from(files).reduce((sum, file) => sum + file.size, 0);
      const first = files[0];
      const url =
        variant === 'tile' && first.type.startsWith('image/') && typeof URL.createObjectURL === 'function'
          ? URL.createObjectURL(first)
          : undefined;
      setChosen({ name: files.length === 1 ? first.name : `${files.length} arquivos`, size, url });
    }
    onChange?.(event);
    if (files?.length) onFiles?.(files);
  }

  function setRef(node: HTMLInputElement | null) {
    own.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  }

  function clear() {
    if (own.current) own.current.value = '';
    setChosen(null);
    onClear?.();
    // Back to the chooser (in the tile, the input that covers the empty tile again).
    own.current?.focus();
  }

  /** A dropped file goes into the native input, so the form, `required` and onChange see it as a chosen one. */
  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const target = own.current;
    const files = event.dataTransfer?.files;
    if (disabled || !target || !files?.length) return;
    if (input.multiple || files.length === 1) {
      target.files = files;
    } else {
      const one = new DataTransfer();
      one.items.add(files[0]);
      target.files = one.files;
    }
    target.dispatchEvent(new Event('change', { bubbles: true }));
  }

  const boxProps = {
    onDragEnter: (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!disabled) setDragging(true);
    },
    onDragOver: (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = disabled ? 'none' : 'copy';
    },
    onDragLeave: (event: DragEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
    },
    onDrop: drop,
  };

  // Filled, the tile is the preview: the input leaves the surface (the swap button opens it), but stays labelled.
  const covered = !(variant === 'tile' && filled);

  const control = (
    <input
      {...input}
      ref={setRef}
      id={controlId}
      type="file"
      accept={input.accept ?? (variant === 'tile' ? 'image/*' : undefined)}
      className={['rds-field__control', 'rds-file-input__control', !covered && 'rds-file-input__control--off']
        .filter(Boolean)
        .join(' ')}
      tabIndex={covered ? input.tabIndex : -1}
      required={required}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      onChange={change}
    />
  );

  const clearButton = showClear && <FieldAction label={removeName} icon={<CloseIcon />} onClick={clear} />;

  let face: ReactNode;
  if (variant === 'dropzone') {
    face = filled ? (
      <span className="rds-file-input__file">
        <span className="rds-file-input__circle" aria-hidden="true">
          <PaperclipIcon />
        </span>
        <span className="rds-file-input__file-texts" aria-hidden="true">
          <span className="rds-file-input__file-name">{shownName}</span>
          {shownSize && <span className="rds-file-input__caption">{shownSize}</span>}
        </span>
        {clearButton}
      </span>
    ) : (
      <>
        <span className="rds-file-input__circle" aria-hidden="true">
          <UploadIcon />
        </span>
        <span className="rds-file-input__texts">
          <span className="rds-file-input__title" aria-hidden="true">
            {dropTitle}
          </span>
          {hasContent(hint) && (
            <span id={insideHintId} className="rds-file-input__caption">
              {hint}
            </span>
          )}
        </span>
      </>
    );
  } else if (variant === 'tile') {
    face = filled ? (
      <img className="rds-file-input__preview" src={shownPreview} alt={previewAlt ?? (typeof label === 'string' ? `Prévia de ${label}` : 'Prévia')} />
    ) : (
      <>
        <span className="rds-file-input__tile-icon" aria-hidden="true">
          <ImagePlusIcon />
        </span>
        <span className="rds-file-input__tile-text" aria-hidden="true">
          {tileText}
        </span>
      </>
    );
  } else {
    // The visible face of the box, hidden from assistive tech: the field's name stays the label above, and the
    // chosen file is read from the native input itself.
    face = (
      <>
        <span className="rds-field__icon" aria-hidden="true">
          <PaperclipIcon />
        </span>
        <span className="rds-file-input__face" aria-hidden="true">
          <span className="rds-file-input__choose">{chooseLabel}</span>
          <span className={['rds-file-input__name', !shownName && 'rds-file-input__name--empty'].filter(Boolean).join(' ')}>
            {shownName || emptyLabel}
          </span>
        </span>
      </>
    );
  }

  const boxClassName = [
    variant === 'field' && showClear && 'rds-field__box--action',
    variant === 'dropzone' && 'rds-file-input__area',
    variant === 'tile' && 'rds-file-input__area rds-file-input__tile',
    variant !== 'field' && filled && 'rds-file-input__area--filled',
    variant !== 'field' && dragging && 'rds-file-input__area--dragging',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <FieldShell
      kind={`rds-file-input rds-file-input--${variant}`}
      controlId={controlId}
      hintId={inside ? undefined : ids.hintId}
      errorId={errorId}
      label={label}
      hint={inside ? undefined : hint}
      errorMessage={errorMessage}
      invalid={invalid}
      required={required}
      disabled={disabled}
      boxClassName={boxClassName || undefined}
      boxProps={variant === 'field' ? undefined : boxProps}
      className={className}
      style={style}
    >
      {face}
      {control}
      {variant === 'tile'
        ? filled &&
          !disabled && (
            <span className="rds-file-input__actions">
              <FieldAction label={replaceLabel} icon={<UploadIcon />} onClick={() => own.current?.click()} />
              {clearButton}
            </span>
          )
        : variant === 'field' && clearButton}
    </FieldShell>
  );
}

function revoke(chosen: Chosen | null) {
  if (chosen?.url && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(chosen.url);
}
