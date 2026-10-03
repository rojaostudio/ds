---
"@rojaostudio/ds": minor
---

Renomes da 2.0, como no Figma [RDS]: **`FloatingStepper` → `Stepper`** e **`ImageCropModal` → `ImageCropDialog`**. As props não mudam.

- `Stepper`, `StepperProps` e `StepperStep` vêm do barril e de `@rojaostudio/ds/components/stepper`. `ImageCropDialog` e `ImageCropDialogProps` vêm de `@rojaostudio/ds/components/image-crop-dialog` (fora do barril, como antes: dependem do peer opcional `react-image-crop`); `CropPreset` também.
- Os nomes antigos continuam funcionando como alias `@deprecated`: `FloatingStepper` (barril e `.../components/floating-stepper`) e `ImageCropModal` (`.../components/image-crop-modal`). O codemod troca os imports, os componentes e os tipos.

**Breaking (para quem estiliza por classe ou token):**

- A classe `rds-floating-stepper` (e `rds-floating-stepper__divider`) virou `rds-stepper` (e `rds-stepper__divider`). O alias deprecated renderiza a classe nova.
- Os tokens `--image-crop-modal-*` (coleção Overlays) viraram `--image-crop-dialog-*`: `shade`, `selection`, `handle` e `stage-background`. As classes do recorte (`rds-image-crop__*`) não mudam.
