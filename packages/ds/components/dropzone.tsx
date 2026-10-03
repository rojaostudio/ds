'use client';

import type { ReactNode } from 'react';
import { FileInput } from './file-input';

/**
 * @deprecated Use `<FileInput layout="dropzone">` (Figma [RDS] Forms/FileInput), which has the label, the hint, the
 * error and the chosen file's row. Kept as a thin wrapper so 1.x code keeps compiling.
 */
export interface DropzoneProps {
  onFiles: (files: FileList) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  /** The call inside the area (FileInput's `dropTitle`). */
  children: ReactNode;
  /** The area's name for screen readers: a Dropzone has no visible label. */
  'aria-label'?: string;
}

/**
 * @deprecated Use `<FileInput layout="dropzone">`. A drop target only: it hands the files over and stays empty,
 * ready for the next ones, as the 1.x Dropzone did.
 */
export function Dropzone({
  onFiles,
  accept,
  multiple = false,
  disabled = false,
  className,
  children,
  'aria-label': ariaLabel = 'Enviar arquivo',
}: DropzoneProps) {
  return (
    <FileInput
      layout="dropzone"
      aria-label={ariaLabel}
      dropTitle={children}
      fileName=""
      accept={accept}
      multiple={multiple}
      disabled={disabled}
      className={className}
      onFiles={(files) => {
        // A copy: the input's own list empties when it is reset below.
        const copy = new DataTransfer();
        for (const file of Array.from(files)) copy.items.add(file);
        onFiles(copy.files);
      }}
      onChange={(event) => {
        // Empty again, so choosing the same file twice still fires.
        queueMicrotask(() => {
          event.target.value = '';
        });
      }}
    />
  );
}
