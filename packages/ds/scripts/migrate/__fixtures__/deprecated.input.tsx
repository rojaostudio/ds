import { Dropzone, IconButton, PageShell, SectionHeader, Tooltip } from '@rojaostudio/ds/components';
import { Plus } from 'lucide-react';

export function Page({ add, upload }: { add: () => void; upload: (files: File[]) => void }) {
  return (
    <PageShell>
      <PageShell.Header title="Produtos" />
      <PageShell.Body>
        <SectionHeader title="Fotos" />
        <Dropzone onFiles={upload} />
        <IconButton icon={<Plus />} label="Novo produto" tone="neutral" onClick={add} />
        <Tooltip text="Novo produto">
          <IconButton icon={<Plus />} label="Novo produto" tone="neutral" onClick={add} />
        </Tooltip>
      </PageShell.Body>
    </PageShell>
  );
}
