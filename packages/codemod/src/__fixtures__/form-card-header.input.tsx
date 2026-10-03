import { Card, FormCardHeader } from '@rojaostudio/ds/components';
import type { FormCardHeaderProps } from '@rojaostudio/ds/components';
import { Receipt } from 'lucide-react';

export type Header = FormCardHeaderProps;

export function Section({ more }: { more: () => void }) {
  return (
    <Card>
      <FormCardHeader icon={<Receipt size={18} />} title="Resumo" subtitle="O que entrou no mês" />
      <FormCardHeader title="Pedidos" action={<button onClick={more}>Ver todos</button>} />
    </Card>
  );
}
