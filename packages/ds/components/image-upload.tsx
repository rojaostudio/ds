'use client';

import { useRef, useState } from 'react';
import { FileInput } from './file-input';
import { ImageCropModal, type CropPreset } from './image-crop-modal';

/**
 * @deprecated Use `<FileInput variant="tile">` (Figma [RDS] Forms/FileInput): the image's square with the preview
 * and the swap and remove buttons. ImageUpload is now a thin wrapper over it that keeps most of the 1.x API compiling and
 * keeps the upload (`onUpload`) and the crop (`crop`). It is always the tile (`variant`, `aspect` and the preview
 * class names left in 2.0): an image asks for a preview.
 */

export interface ImageUploadLabels {
  /** The empty tile's text (FileInput's `tileText`). */
  select: string;
  /** The swap button's name. */
  change: string;
  /** The remove button's name. */
  remove: string;
  /** The tile's text while uploading. */
  uploading: string;
  /** @deprecated Not shown: the tile has no title. */
  dropTitle: string;
  /** @deprecated Not shown: say the formats in `hint`. */
  dropHint: string;
  /** The field's name when there is no `label`. */
  aria: string;
  /** The error message when the upload fails without one. */
  error: string;
}

const DEFAULT_LABELS: ImageUploadLabels = {
  select: 'Selecionar imagem',
  change: 'Trocar imagem',
  remove: 'Remover imagem',
  uploading: 'Enviando…',
  dropTitle: 'Arraste e solte uma imagem aqui',
  dropHint: 'ou clique para selecionar do seu computador',
  aria: 'Área de upload de imagem',
  error: 'Erro ao fazer upload',
};

/** When given, the chosen image goes through the ImageCropModal before the upload. */
export interface ImageUploadCrop {
  presets?: CropPreset[];
  minAspect?: number;
  maxAspect?: number;
  maxSizeBytes?: number;
  title?: string;
  confirmLabel?: string;
}

export interface ImageUploadProps {
  /** The form field name: a hidden input carries the image's URL. */
  name: string;
  /** The image's URL, '' for none. */
  value: string;
  onChange: (url: string) => void;
  /** Sends the file and resolves to its URL. A rejection shows its message as the error. */
  onUpload: (file: File) => Promise<string>;
  label?: string;
  hint?: string;
  accept?: string;
  className?: string;
  crop?: ImageUploadCrop;
  labels?: Partial<ImageUploadLabels>;
}

/** @deprecated Use `<FileInput variant="tile">`, with the upload in its `onFiles` and the URL in `preview`. */
export function ImageUpload({
  name,
  value,
  onChange,
  onUpload,
  label,
  hint,
  accept = 'image/jpeg,image/png,image/webp',
  className,
  crop,
  labels,
}: ImageUploadProps) {
  const L = { ...DEFAULT_LABELS, ...labels };
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The file waiting for the crop (only with `crop`): the modal opens before the upload starts.
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const reset = () => {
    if (input.current) input.current.value = '';
  };

  async function upload(file: File) {
    setError(null);
    setUploading(true);
    try {
      onChange(await onUpload(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : L.error);
    } finally {
      setUploading(false);
      reset();
    }
  }

  async function choose(files: FileList) {
    const file = files[0];
    if (!file) return;
    if (crop) {
      setError(null);
      setPendingFile(file);
      return;
    }
    await upload(file);
  }

  return (
    <>
      <FileInput
        ref={input}
        variant="tile"
        label={label}
        aria-label={label ? undefined : L.aria}
        hint={hint}
        errorMessage={error ?? undefined}
        accept={accept}
        preview={value}
        tileText={uploading ? L.uploading : L.select}
        replaceLabel={L.change}
        clearLabel={L.remove}
        disabled={uploading}
        className={className}
        onFiles={(files) => void choose(files)}
        onClear={() => onChange('')}
      />
      <input type="hidden" name={name} value={value} />
      {crop && (
        <ImageCropModal
          open={!!pendingFile}
          file={pendingFile}
          onCancel={() => {
            setPendingFile(null);
            reset();
          }}
          onConfirm={async (blob: Blob) => {
            const base = pendingFile;
            setPendingFile(null);
            const fileName = (base?.name ?? 'image').replace(/\.[^./\\]+$/, '') + '.jpg';
            await upload(new File([blob], fileName, { type: blob.type || 'image/jpeg' }));
          }}
          presets={crop.presets}
          minAspect={crop.minAspect}
          maxAspect={crop.maxAspect}
          maxSizeBytes={crop.maxSizeBytes}
          title={crop.title}
          confirmLabel={crop.confirmLabel}
        />
      )}
    </>
  );
}
