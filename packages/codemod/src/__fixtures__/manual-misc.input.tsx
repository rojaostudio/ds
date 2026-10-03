import { useState } from 'react';
import {
  PageTabs,
  DatePicker,
  ContextMenu,
  MenuItem,
  ToggleGroup,
  Badge,
  Modal,
  Tooltip,
  EmptyState,
} from '@rojaostudio/ds/components';

export function Misc({ remove }: { remove: () => void }) {
  const [date, setDate] = useState<Date | null>(null);
  const [view, setView] = useState<string | null>('list');
  const [open, setOpen] = useState(false);
  return (
    <>
      <PageTabs tabs={[{ href: '/a', label: 'A' }, { href: '/b', label: 'B' }]} />
      <DatePicker label="Entrega" value={date} onChange={setDate} />
      <ContextMenu menu={<MenuItem onClick={remove}>Excluir</MenuItem>}>
        <div>Linha</div>
      </ContextMenu>
      <ToggleGroup value={view} onChange={setView} options={[{ value: 'list', label: 'Lista' }]} />
      <Badge variant="dot" />
      <Modal open={open} onClose={() => setOpen(false)} title="Com ação no topo" headerAction={<a href="/ajuda">Ajuda</a>} />
      <Modal open={open} onClose={() => setOpen(false)} title="Sem nada especial" />
      <Tooltip content="Ajuda">
        <span>?</span>
      </Tooltip>
      <EmptyState title="Vazio">
        <p>Extra</p>
      </EmptyState>
    </>
  );
}
