import { Toggle } from '@rojaostudio/ds/components/toggle';
import type { ToggleProps } from '@rojaostudio/ds/components/toggle';

export function Settings({ on, set }: { on: boolean; set: (v: boolean) => void }) {
  return (
    <div>
      <Toggle checked={on} onChange={(e) => set(e.target.checked)} label="Notificações" description="Por e-mail" size="sm" />
      <Toggle checked={on} onChange={(e) => set(e.target.checked)} label={`Ativo: ${on}`} labelPosition="right" />
      <Toggle checked={on} onChange={(e) => set(e.target.checked)} aria-label="Ativo" />
    </div>
  );
}

export type Props = ToggleProps;
