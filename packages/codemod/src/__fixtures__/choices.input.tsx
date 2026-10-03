import { Checkbox, Radio, ChoiceCard } from '@rojaostudio/ds/components';

export function Choices({ some, all, set, pick }: { some: boolean; all: boolean; set: () => void; pick: () => void }) {
  return (
    <>
      <Checkbox label="Aceito os termos" description="Leia antes" error="Obrigatório" size="sm" onChange={set} />
      <Checkbox label="Todos" checked={all} indeterminate={some} onChange={set} />
      <Checkbox label="Parcial" indeterminate onChange={set} />
      <Checkbox aria-label="Linha 1" />
      <Radio name="plano" value="mensal" label="Mensal" description="Cancele quando quiser" />
      <ChoiceCard label="Retirada" description="Na loja" selected onClick={pick} />
    </>
  );
}
