import { Select } from '@rojaostudio/ds/components';
import { RadioGroup } from '@rojaostudio/ds/components/radio';

const PLANS = [
  { value: 'm', label: 'Mensal' },
  { value: 'a', label: 'Anual' },
];

export function Plans({ plan, setPlan }: { plan: string; setPlan: (v: string) => void }) {
  return (
    <>
      <Select label="Plano" helper="Pode trocar depois" options={PLANS} value={plan} onChange={(e) => setPlan(e.target.value)} />
      <RadioGroup name="plano" legend="Plano" value={plan} onChange={setPlan} options={PLANS} />
    </>
  );
}
