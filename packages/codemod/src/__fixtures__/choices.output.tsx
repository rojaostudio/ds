import { Checkbox, Radio, ChoiceCard } from '@rojaostudio/ds/components';

export function Choices({ some, all, set, pick }: { some: boolean; all: boolean; set: () => void; pick: () => void }) {
  return (
    <>
      <Checkbox hint="Leia antes" errorMessage="Obrigatório" onChange={set}>Aceito os termos</Checkbox>
      <Checkbox checked={some ? 'indeterminate' : all} onChange={set}>Todos</Checkbox>
      <Checkbox onChange={set} checked="indeterminate">Parcial</Checkbox>
      <Checkbox aria-label="Linha 1" />
      <Radio name="plano" value="mensal" hint="Cancele quando quiser">Mensal</Radio>
      <ChoiceCard description="Na loja" selected onSelect={pick}>Retirada</ChoiceCard>
    </>
  );
}
