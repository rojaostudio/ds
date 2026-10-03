import { ChoicePreviewCard, CurrencyInput, SelectableCard, ToggleCard } from '@rojaostudio/ds/components';
import type { ToggleCardProps } from '@rojaostudio/ds/components';
import { ImageUpload } from '@rojaostudio/ds/components/image-upload';

export function Settings({ on, set, logo }: { on: boolean; set: (v: boolean) => void; logo: string }) {
  return (
    <div>
      <ToggleCard label="Horário" summary="Seg a sex" checked={on} onCheckedChange={set} layout="compact" />
      <CurrencyInput name="price" currency="BRL" />
      <SelectableCard onClick={() => set(true)}>
        Mensal
      </SelectableCard>
      <ChoicePreviewCard selected={on} onSelect={() => set(true)} preview={<img src={logo} alt="" />} label="Clássico" />
      <ImageUpload name="logo" value={logo} onChange={() => {}} onUpload={async () => logo} />
    </div>
  );
}

export type Props = ToggleCardProps;
