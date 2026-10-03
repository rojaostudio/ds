import { Switch } from '@rojaostudio/ds/components/switch';
import type { SwitchProps } from '@rojaostudio/ds/components/switch';

export function Settings({ on, set }: { on: boolean; set: (v: boolean) => void }) {
  return (
    <div>
      <Switch checked={on} onChange={(e) => set(e.target.checked)} hint="Por e-mail">Notificações</Switch>
      <Switch checked={on} onChange={(e) => set(e.target.checked)}>{`Ativo: ${on}`}</Switch>
      <Switch checked={on} onChange={(e) => set(e.target.checked)} aria-label="Ativo" />
    </div>
  );
}

export type Props = SwitchProps;
