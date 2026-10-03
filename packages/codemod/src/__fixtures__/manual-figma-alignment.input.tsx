import { ChoicePreviewCard, SelectableCard } from '@rojaostudio/ds/components';
import { ImageUpload, type ImageUploadAspect } from '@rojaostudio/ds/components/image-upload';

export function Plans({ go }: { go: (href: string) => void; aspect: ImageUploadAspect }) {
  return (
    <div>
      <SelectableCard as="a" href="/plano" ribbon="Popular" onClick={() => go('/plano')}>
        Anual
      </SelectableCard>
      <ChoicePreviewCard selected={false} onSelect={() => {}} preview={null} label="Pro" locked badge="Pro" />
      <ImageUpload name="logo" value="" onChange={() => {}} onUpload={async () => ''} />
    </div>
  );
}
