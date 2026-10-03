import { FloatingStepper, Button } from '@rojaostudio/ds/components';
import type { FloatingStepperStep, FloatingStepperProps } from '@rojaostudio/ds/components';
import { ImageCropModal, type CropPreset } from '@rojaostudio/ds/components/image-crop-modal';
import type { ImageCropModalProps } from '@rojaostudio/ds/components/image-crop-modal';

const STEPS: FloatingStepperStep[] = [{ key: 'cart', label: 'Carrinho' }];
const PRESETS: CropPreset[] = [{ id: 'square', label: '1:1', aspect: 1 }];

export function Checkout(props: Partial<FloatingStepperProps> & { crop: ImageCropModalProps }) {
  return (
    <>
      <FloatingStepper steps={STEPS} current="cart" />
      <ImageCropModal {...props.crop} presets={PRESETS} />
      <Button>Ok</Button>
    </>
  );
}
