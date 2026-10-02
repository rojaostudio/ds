import * as RadixSwitch from '@radix-ui/react-switch';
import { Switch } from './local-switch';
import { Toggle } from '@rojaostudio/ds/components';

export function Prefs({ on, set }: { on: boolean; set: (v: boolean) => void }) {
  return (
    <>
      <Switch />
      <RadixSwitch.Root />
      <Toggle checked={on} onChange={(e) => set(e.target.checked)} label="Ativo" />
    </>
  );
}
