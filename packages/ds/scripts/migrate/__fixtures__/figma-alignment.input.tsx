import { ChoicePreviewCard, CurrencyInput, SelectableCard, ToggleCardCompact } from '@rojaostudio/ds/components';
import type { ToggleCardCompactProps } from '@rojaostudio/ds/components';
import { ImageUpload } from '@rojaostudio/ds/components/image-upload';

export function Settings({ on, set, logo }: { on: boolean; set: (v: boolean) => void; logo: string }) {
  return (
    <div>
      <ToggleCardCompact label="Horário" summary="Seg a sex" checked={on} onCheckedChange={set} />
      <CurrencyInput name="price" currency="BRL" size="lg" />
      <SelectableCard as="button" indicator="chevron" onClick={() => set(true)}>
        Mensal
      </SelectableCard>
      <ChoicePreviewCard selected={on} onSelect={() => set(true)} preview={<img src={logo} alt="" />} label="Clássico" previewAspect="square" locked={false} />
      <ImageUpload name="logo" value={logo} onChange={() => {}} onUpload={async () => logo} aspect="logo" variant="dropzone" previewClassName="rounded" />
    </div>
  );
}

export type Props = ToggleCardCompactProps;
