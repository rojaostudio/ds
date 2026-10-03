'use client';

/**
 * image-crop-modal — the 1.x and 2.0-next name of the ImageCropDialog, kept so
 * `@rojaostudio/ds/components/image-crop-modal` and `ImageCropModal` still work in 2.0. The codemod
 * (`npx @rojaostudio/ds-codemod`) renames both. Like the dialog, it needs the optional peer `react-image-crop`.
 */
import { ImageCropDialog } from './image-crop-dialog';
import type { ImageCropDialogProps } from './image-crop-dialog';

export type { CropPreset } from './image-crop-dialog';

/** @deprecated Renamed to `ImageCropDialog` (`@rojaostudio/ds/components/image-crop-dialog`) in 2.0. Same props. */
export const ImageCropModal = ImageCropDialog;
/** @deprecated Renamed to `ImageCropDialogProps` in 2.0. */
export type ImageCropModalProps = ImageCropDialogProps;
