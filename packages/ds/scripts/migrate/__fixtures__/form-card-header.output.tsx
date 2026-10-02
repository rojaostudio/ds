import { Card, CardHeader } from '@rojaostudio/ds/components';
import type { CardHeaderProps } from '@rojaostudio/ds/components';
import { Receipt } from 'lucide-react';

export type Header = CardHeaderProps;

export function Section({ more }: { more: () => void }) {
  return (
    <Card>
      <CardHeader icon={<Receipt size={18} />} title="Resumo" description="O que entrou no mês" />
      <CardHeader title="Pedidos" action={<button onClick={more}>Ver todos</button>} />
    </Card>
  );
}
