import { Stepper, Button } from '@rojaostudio/ds/components';
import type { StepperStep, StepperProps } from '@rojaostudio/ds/components';
import { ImageCropDialog, type CropPreset } from '@rojaostudio/ds/components/image-crop-dialog';
import type { ImageCropDialogProps } from '@rojaostudio/ds/components/image-crop-dialog';

const STEPS: StepperStep[] = [{ key: 'cart', label: 'Carrinho' }];
const PRESETS: CropPreset[] = [{ id: 'square', label: '1:1', aspect: 1 }];

export function Checkout(props: Partial<StepperProps> & { crop: ImageCropDialogProps }) {
  return (
    <>
      <Stepper steps={STEPS} current="cart" />
      <ImageCropDialog {...props.crop} presets={PRESETS} />
      <Button>Ok</Button>
    </>
  );
}
